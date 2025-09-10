package handlers

import (
    "github.com/Git-HimanshuRathi/artist-blend/backend/config"
    "github.com/Git-HimanshuRathi/artist-blend/backend/models"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "os"
    "time"

    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// Read environment variables at request time to ensure they are available even if
// .env is loaded in main after package initialization.
func getSpotifyRedirectURI() string {
    if v := os.Getenv("SPOTIFY_REDIRECT_URI"); v != "" {
        return v
    }
    return "http://127.0.0.1:8000/callback"
}

// Step 1: Login redirect
func LoginHandler(w http.ResponseWriter, r *http.Request) {
    clientID := os.Getenv("SPOTIFY_CLIENT_ID")
    if clientID == "" {
        http.Error(w, "Server misconfigured: missing SPOTIFY_CLIENT_ID", http.StatusInternalServerError)
        return
    }

    scopes := "user-read-email playlist-read-private"
    authURL := fmt.Sprintf(
        "https://accounts.spotify.com/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=%s",
        clientID,
        url.QueryEscape(getSpotifyRedirectURI()),
        url.QueryEscape(scopes),
    )
    http.Redirect(w, r, authURL, http.StatusFound)
}

// Step 2: Handle callback and save user
func CallbackHandler(w http.ResponseWriter, r *http.Request) {
    clientID := os.Getenv("SPOTIFY_CLIENT_ID")
    clientSecret := os.Getenv("SPOTIFY_CLIENT_SECRET")
    if clientID == "" || clientSecret == "" {
        http.Error(w, "Server misconfigured: missing Spotify credentials", http.StatusInternalServerError)
        return
    }

    code := r.URL.Query().Get("code")
    if code == "" {
        http.Error(w, "No code in request", http.StatusBadRequest)
        return
    }

    // Exchange code for tokens
    data := url.Values{}
    data.Set("grant_type", "authorization_code")
    data.Set("code", code)
    data.Set("redirect_uri", getSpotifyRedirectURI())
    data.Set("client_id", clientID)
    data.Set("client_secret", clientSecret)

    resp, err := http.PostForm("https://accounts.spotify.com/api/token", data)
    if err != nil {
        http.Error(w, "Failed to get token", http.StatusInternalServerError)
        return
    }
    defer resp.Body.Close()

    var tokenData map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&tokenData); err != nil {
        http.Error(w, "Failed to parse token response", http.StatusInternalServerError)
        return
    }

    accessToken := tokenData["access_token"].(string)
    refreshToken := tokenData["refresh_token"].(string)

    // Fetch user profile
    req, _ := http.NewRequest("GET", "https://api.spotify.com/v1/me", nil)
    req.Header.Set("Authorization", "Bearer "+accessToken)
    userResp, err := http.DefaultClient.Do(req)
    if err != nil {
        http.Error(w, "Failed to fetch user profile", http.StatusInternalServerError)
        return
    }
    defer userResp.Body.Close()

    var profile map[string]interface{}
    if err := json.NewDecoder(userResp.Body).Decode(&profile); err != nil {
        http.Error(w, "Failed to decode user profile", http.StatusInternalServerError)
        return
    }

    spotifyID := profile["id"].(string)
    email := profile["email"].(string)

    // Save user in MongoDB
    collection := config.DB.Collection("users")
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    user := models.User{
        SpotifyID:    spotifyID,
        Email:        email,
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        CreatedAt:    time.Now(),
        UpdatedAt:    time.Now(),
    }

    filter := bson.M{"spotify_id": spotifyID}
    update := bson.M{"$set": user}
    opts := options.Update().SetUpsert(true)
    _, err = collection.UpdateOne(ctx, filter, update, opts)
    if err != nil {
        http.Error(w, "Failed to save user", http.StatusInternalServerError)
        return
    }

    fmt.Fprintf(w, "User %s logged in successfully!", email)
}