package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/Git-HimanshuRathi/artist-blend/backend/config"
	"github.com/Git-HimanshuRathi/artist-blend/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func getSpotifyRedirectURI() string {
	if v := os.Getenv("SPOTIFY_REDIRECT_URI"); v != "" {
		return v
	}
	return "http://127.0.0.1:8000/callback"
}

func getFrontendBaseURL() string {
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		return v
	}

	return "http://127.0.0.1:8080"
}

// AUTH

// Step 1: Login redirect
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("SPOTIFY_CLIENT_ID")
	if clientID == "" {
		http.Error(w, "Server misconfigured: missing SPOTIFY_CLIENT_ID", http.StatusInternalServerError)
		return
	}

	scopes := "user-read-email playlist-read-private playlist-modify-private playlist-modify-public"
	authURL := fmt.Sprintf(
		"https://accounts.spotify.com/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=%s&show_dialog=true",
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
	// Per Spotify API, use Basic auth header for token exchange
	tokenReq, _ := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))
	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	tokenReq.SetBasicAuth(clientID, clientSecret)
	resp, err := http.DefaultClient.Do(tokenReq)
	if err != nil {
		http.Error(w, "Failed to get token", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		http.Error(w, "Token endpoint returned non-200 status", http.StatusBadGateway)
		return
	}

	var tokenData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tokenData); err != nil {
		http.Error(w, "Failed to parse token response", http.StatusInternalServerError)
		return
	}

	accessToken, _ := tokenData["access_token"].(string)
	refreshToken, _ := tokenData["refresh_token"].(string)
	if accessToken == "" {
		http.Error(w, "Missing access token in response", http.StatusBadGateway)
		return
	}

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

	spotifyID, _ := profile["id"].(string)
	email, _ := profile["email"].(string)
	if spotifyID == "" {
		http.Error(w, "Failed to read Spotify user id", http.StatusBadGateway)
		return
	}

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

	// Set session cookie with spotify_id
	http.SetCookie(w, &http.Cookie{
		Name:     "ab_sid",
		Value:    spotifyID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   60 * 60 * 24 * 7, // 7 days
	})

	// Redirect back to frontend with success flag
	redirectTo := fmt.Sprintf("%s/?auth=success", getFrontendBaseURL())
	http.Redirect(w, r, redirectTo, http.StatusFound)
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "ab_sid",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"ok":true}`))
}

// MeHandler: simple auth check using cookie
func MeHandler(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("ab_sid")
	if err != nil || c.Value == "" {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"spotify_id": c.Value})
}

// Helper: App-only access token via Client Credentials for public data
func getAppAccessToken() (string, error) {
	clientID := os.Getenv("SPOTIFY_CLIENT_ID")
	clientSecret := os.Getenv("SPOTIFY_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", fmt.Errorf("missing Spotify credentials")
	}

	data := url.Values{}
	data.Set("grant_type", "client_credentials")

	req, _ := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("token endpoint status %d", resp.StatusCode)
	}

	var tokenData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tokenData); err != nil {
		return "", err
	}
	token, _ := tokenData["access_token"].(string)
	if token == "" {
		return "", fmt.Errorf("missing access_token in response")
	}
	return token, nil
}

// SearchArtistsHandler handles GET /api/search/artists?q=
func SearchArtistsHandler(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if strings.TrimSpace(q) == "" {
		http.Error(w, "query parameter 'q' is required", http.StatusBadRequest)
		return
	}

	token, err := getAppAccessToken()
	if err != nil {
		http.Error(w, "failed to acquire app token", http.StatusInternalServerError)
		return
	}

	// Call Spotify Search API
	searchURL := fmt.Sprintf("https://api.spotify.com/v1/search?type=artist&limit=10&q=%s", url.QueryEscape(q))
	req, _ := http.NewRequest("GET", searchURL, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "failed to call Spotify search", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		http.Error(w, "Spotify search error", http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if _, err := io.Copy(w, resp.Body); err != nil {
		http.Error(w, "failed to stream response", http.StatusInternalServerError)
		return
	}
}
