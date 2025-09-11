package handlers

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "sort"
    "strings"
    "context"
    "time"

    "github.com/Git-HimanshuRathi/artist-blend/backend/config"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo/options"
)

type generatePlaylistRequest struct {
    Artists []string `json:"artists"`
}

type simplifiedTrack struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Artist   string `json:"artist"`
    Album    string `json:"album"`
    Duration string `json:"duration"`
}

type generatePlaylistResponse struct {
    Tracks []simplifiedTrack `json:"tracks"`
}

// GeneratePlaylistHandler builds a recommended track list using Spotify seeds
func GeneratePlaylistHandler(w http.ResponseWriter, r *http.Request) {
    var req generatePlaylistRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }
    if len(req.Artists) == 0 {
        http.Error(w, "artists array is required", http.StatusBadRequest)
        return
    }

    token, err := getAppAccessToken()
    if err != nil {
        http.Error(w, "failed to acquire app token", http.StatusInternalServerError)
        return
    }

    // Resolve artist names to IDs (take up to 5)
    var seedIDs []string
    for _, name := range req.Artists {
        n := strings.TrimSpace(name)
        if n == "" {
            continue
        }
        if len(seedIDs) >= 5 {
            break
        }
        searchURL := fmt.Sprintf("https://api.spotify.com/v1/search?type=artist&limit=1&q=%s", url.QueryEscape(n))
        sreq, _ := http.NewRequest("GET", searchURL, nil)
        sreq.Header.Set("Authorization", "Bearer "+token)
        sresp, err := http.DefaultClient.Do(sreq)
        if err != nil {
            continue
        }
        func() {
            defer sresp.Body.Close()
            if sresp.StatusCode < 200 || sresp.StatusCode >= 300 {
                return
            }
            var payload map[string]any
            if err := json.NewDecoder(sresp.Body).Decode(&payload); err != nil {
                return
            }
            artists, _ := payload["artists"].(map[string]any)
            items, _ := artists["items"].([]any)
            if len(items) == 0 {
                return
            }
            first, _ := items[0].(map[string]any)
            id, _ := first["id"].(string)
            if id != "" {
                seedIDs = append(seedIDs, id)
            }
        }()
    }

    if len(seedIDs) == 0 {
        http.Error(w, "could not resolve any artist seeds", http.StatusBadRequest)
        return
    }

    // Fetch top tracks for each selected artist and combine
    // Limit total to 20 tracks, deduplicate by ID, and interleave artists
    type artistTracks struct {
        artistID string
        tracks   []simplifiedTrack
    }

    combined := make([]artistTracks, 0, len(seedIDs))
    seen := make(map[string]struct{})

    for _, artistID := range seedIDs {
        topURL := fmt.Sprintf("https://api.spotify.com/v1/artists/%s/top-tracks?market=US", url.PathEscape(artistID))
        treq, _ := http.NewRequest("GET", topURL, nil)
        treq.Header.Set("Authorization", "Bearer "+token)
        tresp, err := http.DefaultClient.Do(treq)
        if err != nil {
            continue
        }
        func() {
            defer tresp.Body.Close()
            if tresp.StatusCode < 200 || tresp.StatusCode >= 300 {
                return
            }
            var tp map[string]any
            if err := json.NewDecoder(tresp.Body).Decode(&tp); err != nil {
                return
            }
            titems, _ := tp["tracks"].([]any)
            bucket := artistTracks{artistID: artistID}
            for _, it := range titems {
                t, _ := it.(map[string]any)
                if t == nil {
                    continue
                }
                id, _ := t["id"].(string)
                if id == "" {
                    continue
                }
                if _, ok := seen[id]; ok {
                    continue
                }
                name, _ := t["name"].(string)
                durationMs, _ := t["duration_ms"].(float64)
                albumObj, _ := t["album"].(map[string]any)
                albumName, _ := albumObj["name"].(string)
                artistsArr, _ := t["artists"].([]any)
                primaryArtist := ""
                if len(artistsArr) > 0 {
                    a0, _ := artistsArr[0].(map[string]any)
                    primaryArtist, _ = a0["name"].(string)
                }
                totalMs := int(durationMs)
                mm := totalMs / 60000
                ss := (totalMs % 60000) / 1000
                duration := fmt.Sprintf("%d:%02d", mm, ss)
                bucket.tracks = append(bucket.tracks, simplifiedTrack{
                    ID:       id,
                    Name:     name,
                    Artist:   primaryArtist,
                    Album:    albumName,
                    Duration: duration,
                })
                seen[id] = struct{}{}
            }
            combined = append(combined, bucket)
        }()
    }

    // Interleave tracks to balance artists, then cap at 20
    var out []simplifiedTrack
    // Make a stable order by artistID to keep deterministic output across calls
    sort.SliceStable(combined, func(i, j int) bool { return combined[i].artistID < combined[j].artistID })
    picked := 0
    idx := 0
    for picked < 20 {
        advanced := false
        for i := 0; i < len(combined) && picked < 20; i++ {
            tracks := combined[i].tracks
            if idx < len(tracks) {
                out = append(out, tracks[idx])
                picked++
                advanced = true
            }
        }
        if !advanced {
            break
        }
        idx++
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(generatePlaylistResponse{Tracks: out})
}

type createPlaylistRequest struct {
    TrackIDs []string `json:"trackIds"`
    Name     string   `json:"name"`
}

type createPlaylistResponse struct {
    URL string `json:"url"`
}

// CreatePlaylistHandler creates a playlist in the authenticated user's Spotify account and adds tracks
func CreatePlaylistHandler(w http.ResponseWriter, r *http.Request) {
    var req createPlaylistRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }
    if len(req.TrackIDs) == 0 {
        http.Error(w, "trackIds is required", http.StatusBadRequest)
        return
    }

    // Fetch the most recently updated user (simplified auth model for dev)
    collection := config.DB.Collection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var userDoc bson.M
    findOpts := options.FindOne().SetSort(bson.D{{Key: "updated_at", Value: -1}})
    if err := collection.FindOne(ctx, bson.M{}, findOpts).Decode(&userDoc); err != nil {
        http.Error(w, "no authenticated user found", http.StatusUnauthorized)
        return
    }

    accessToken, _ := userDoc["access_token"].(string)
    spotifyUserID, _ := userDoc["spotify_id"].(string)
    if accessToken == "" || spotifyUserID == "" {
        http.Error(w, "invalid user credentials", http.StatusUnauthorized)
        return
    }

    playlistName := strings.TrimSpace(req.Name)
    if playlistName == "" {
        playlistName = "ArtistBlend Playlist"
    }

    // Create empty playlist
    body := map[string]any{
        "name":        playlistName,
        "description": "Created with ArtistBlend",
        "public":      false,
    }
    bodyBytes, _ := json.Marshal(body)
    createURL := fmt.Sprintf("https://api.spotify.com/v1/users/%s/playlists", url.PathEscape(spotifyUserID))
    creq, _ := http.NewRequest("POST", createURL, strings.NewReader(string(bodyBytes)))
    creq.Header.Set("Authorization", "Bearer "+accessToken)
    creq.Header.Set("Content-Type", "application/json")
    cresp, err := http.DefaultClient.Do(creq)
    if err != nil {
        http.Error(w, "failed to create playlist", http.StatusBadGateway)
        return
    }
    defer cresp.Body.Close()
    if cresp.StatusCode < 200 || cresp.StatusCode >= 300 {
        http.Error(w, "Spotify playlist create error", http.StatusBadGateway)
        return
    }
    var playlist map[string]any
    if err := json.NewDecoder(cresp.Body).Decode(&playlist); err != nil {
        http.Error(w, "failed to parse playlist response", http.StatusInternalServerError)
        return
    }
    playlistID, _ := playlist["id"].(string)
    external, _ := playlist["external_urls"].(map[string]any)
    externalURL, _ := external["spotify"].(string)
    if playlistID == "" {
        http.Error(w, "missing playlist id", http.StatusBadGateway)
        return
    }

    // Add tracks
    if len(req.TrackIDs) > 0 {
        uris := make([]string, 0, len(req.TrackIDs))
        for _, id := range req.TrackIDs {
            id = strings.TrimSpace(id)
            if id == "" {
                continue
            }
            uris = append(uris, "spotify:track:"+id)
        }
        addBody := map[string]any{"uris": uris}
        addBytes, _ := json.Marshal(addBody)
        addURL := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", url.PathEscape(playlistID))
        areq, _ := http.NewRequest("POST", addURL, strings.NewReader(string(addBytes)))
        areq.Header.Set("Authorization", "Bearer "+accessToken)
        areq.Header.Set("Content-Type", "application/json")
        aresp, err := http.DefaultClient.Do(areq)
        if err != nil {
            http.Error(w, "failed to add tracks", http.StatusBadGateway)
            return
        }
        defer aresp.Body.Close()
        if aresp.StatusCode < 200 || aresp.StatusCode >= 300 {
            http.Error(w, "Spotify add tracks error", http.StatusBadGateway)
            return
        }
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(createPlaylistResponse{URL: externalURL})
}

// History models
type historyEntry struct {
    ID        string           `bson:"_id,omitempty" json:"id"`
    SpotifyID string           `bson:"spotify_id" json:"spotifyId"`
    Title     string           `bson:"title" json:"title"`
    Artists   []string         `bson:"artists" json:"artists"`
    Tracks    []simplifiedTrack `bson:"tracks" json:"tracks"`
    CreatedAt time.Time        `bson:"created_at" json:"createdAt"`
}

func getUserIDFromCookie(r *http.Request) (string, bool) {
    c, err := r.Cookie("ab_sid")
    if err != nil || c.Value == "" {
        return "", false
    }
    return c.Value, true
}

// POST /api/history
func SaveHistoryHandler(w http.ResponseWriter, r *http.Request) {
    userID, ok := getUserIDFromCookie(r)
    if !ok {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }
    var body struct{
        Title string `json:"title"`
        Artists []string `json:"artists"`
        Tracks []simplifiedTrack `json:"tracks"`
    }
    if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
        http.Error(w, "invalid body", http.StatusBadRequest)
        return
    }
    entry := historyEntry{
        SpotifyID: userID,
        Title: strings.TrimSpace(body.Title),
        Artists: body.Artists,
        Tracks: body.Tracks,
        CreatedAt: time.Now(),
    }
    coll := config.DB.Collection("history")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    res, err := coll.InsertOne(ctx, entry)
    if err != nil {
        http.Error(w, "failed to save", http.StatusInternalServerError)
        return
    }
    entry.ID = fmt.Sprint(res.InsertedID)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(entry)
}

// GET /api/history
func ListHistoryHandler(w http.ResponseWriter, r *http.Request) {
    userID, ok := getUserIDFromCookie(r)
    if !ok {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }
    coll := config.DB.Collection("history")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    cur, err := coll.Find(ctx, bson.M{"spotify_id": userID}, options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}))
    if err != nil {
        http.Error(w, "query failed", http.StatusInternalServerError)
        return
    }
    defer cur.Close(ctx)
    var items []historyEntry
    for cur.Next(ctx) {
        var e historyEntry
        if err := cur.Decode(&e); err == nil {
            items = append(items, e)
        }
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(items)
}

// DELETE /api/history/:id
func DeleteHistoryHandler(w http.ResponseWriter, r *http.Request) {
    userID, ok := getUserIDFromCookie(r)
    if !ok {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }
    id := strings.TrimPrefix(r.URL.Path, "/api/history/")
    if id == "" {
        http.Error(w, "missing id", http.StatusBadRequest)
        return
    }
    coll := config.DB.Collection("history")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    _, err := coll.DeleteOne(ctx, bson.M{"_id": bson.M{"$eq": id}, "spotify_id": userID})
    if err != nil {
        http.Error(w, "failed to delete", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}


