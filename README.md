## ArtistBlend

ArtistBlend is a full‑stack app that blends your favorite artists and creates Spotify playlists. The backend is Go (Gin + MongoDB), and the frontend is a React app (Vite + Tailwind + shadcn/ui).

### Project Structure

- `backend/` — Go API server
  - `main.go` — Gin server bootstrap, CORS, routes
  - `config/config.go` — MongoDB connection and `.env` loading
  - `handlers/`
    - `auth.go` — Spotify OAuth (login, callback), cookie session, auth check, artist search proxy
    - `playlist.go` — Generate tracks (via artists’ top tracks), create Spotify playlist, and user history endpoints (Mongo)
  - `models/user.go` — Mongo user model used for upsert after login
  - `go.mod`, `go.sum` — Go dependencies
- `frontend/` — React app (Vite)
  - `src/lib/api.js` — Axios client, API methods (with credentials)
  - `src/components/*` — UI components and pages

### Backend: File‑by‑File

`backend/main.go`
- Initializes Gin in release mode.
- Connects MongoDB via `config.ConnectDB()`.
- Applies CORS with credentials for local dev origins (127.0.0.1/localhost, ports 5173/8080).
- Routes:
  - Auth: `GET /login`, `GET /callback`, `POST /logout`, `GET /api/auth/me`
  - Health: `GET /api/health`
  - Search: `GET /api/search/artists` (proxy to Spotify Search API using app token)
  - Playlist: `POST /api/playlist/generate` (build track list from artists’ top tracks), `POST /api/playlist/create` (create playlist for logged‑in user)
  - History: `GET /api/history`, `POST /api/history`, `DELETE /api/history/:id`

`backend/config/config.go`
- Loads `.env` (non‑fatal if missing) using `godotenv`.
- Reads `MONGODB_URI` (defaults to `mongodb://localhost:27017`).
- Connects/pings Mongo, sets global `config.DB` database handle (`artist_blend`).

`backend/handlers/auth.go`
- `getSpotifyRedirectURI()` — Uses `SPOTIFY_REDIRECT_URI` or defaults to `http://127.0.0.1:8000/callback` (Spotify allows HTTP for 127.0.0.1).
- `getFrontendBaseURL()` — Redirect target after login; uses `FRONTEND_URL` or defaults to `http://127.0.0.1:8080`.
- `LoginHandler` — Redirects to Spotify OAuth authorize with scopes: email, read playlists, modify playlists (public/private). Forces dialog each time.
- `CallbackHandler` — Exchanges code for tokens (Basic auth), fetches user profile, upserts user in Mongo, sets a cookie session `ab_sid` with the user’s `spotify_id`, then redirects to frontend `/?auth=success`.
- `LogoutHandler` — Clears `ab_sid` cookie.
- `MeHandler` — Returns 200 with `{ spotify_id }` if cookie present; else 401.
- `getAppAccessToken()` — Client Credentials flow to call public Spotify APIs (e.g., search).
- `SearchArtistsHandler` — Proxies `GET /api/search/artists?q=...` to Spotify and streams JSON response.

Environment variables used:
- `SPOTIFY_CLIENT_ID` (required)
- `SPOTIFY_CLIENT_SECRET` (required)
- `SPOTIFY_REDIRECT_URI` (optional; default `http://127.0.0.1:8000/callback`)
- `FRONTEND_URL` (optional; default `http://127.0.0.1:8080`)
- `MONGODB_URI` (optional; default `mongodb://localhost:27017`)

`backend/handlers/playlist.go`
- Data shapes: `simplifiedTrack` — `{ id, name, artist, album, duration }` used by the frontend.
- `GeneratePlaylistHandler` — Given artist names, resolves up to 5 artist IDs via search, fetches each artist’s top tracks (market=US), interleaves them, deduplicates by track ID, caps at 20, returns `{ tracks: simplifiedTrack[] }`.
- `CreatePlaylistHandler` — Uses latest logged‑in user (via Mongo) to create a private Spotify playlist, then adds provided track IDs; returns `{ url }` to open in Spotify.
- History API (Mongo):
  - `SaveHistoryHandler (POST /api/history)` — Saves `{ title, artists[], tracks[] }` for the current user (cookie `ab_sid`).
  - `ListHistoryHandler (GET /api/history)` — Lists the user’s saved entries sorted by `created_at` desc.
  - `DeleteHistoryHandler (DELETE /api/history/:id)` — Deletes an entry by `_id` for the current user.

Note: Cookie session is a simple, dev‑friendly approach. For production, add signing, HTTPS `Secure` cookie, and expiry/refresh.

`backend/models/user.go`
- `User` struct for Mongo persistence after Spotify login: `spotify_id`, `email`, `access_token`, `refresh_token`, timestamps. The app currently retrieves the most recent user for playlist creation; extend with per‑request auth if needed.

### Frontend: Key Pieces
- `src/lib/api.js` — Axios client with `withCredentials: true`. Interceptors redirect to `GET /login` on 401. Provides helpers: `authenticateSpotify`, `logout`, `searchArtists`, `createSpotifyPlaylist`, `fetchHistory`, `saveHistory`, `deleteHistory`.
- `src/components/Navbar.jsx` — Login/Logout button; shows toast on login success; preserves saved history on logout.
- `src/components/PlaylistForm.jsx` — Artist input with live Spotify search suggestions.
- `src/components/MainPage.jsx` — Orchestrates playlist generation; auto‑scrolls to results.
- `src/components/TrackList.jsx` — Displays tracks; Play All opens a created Spotify playlist; Save persists via backend with local fallback; heart fills when saved.
- `src/components/HistoryPage.jsx` — Fetches history from backend (redirects to login if unauthorized), falls back to local storage; supports delete.

### Running Locally

1) Backend
- Create `.env` in `backend/` or project root with at least:
  - `SPOTIFY_CLIENT_ID=...`
  - `SPOTIFY_CLIENT_SECRET=...`
  - `SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback`
  - `FRONTEND_URL=http://127.0.0.1:8080` (or your exact frontend origin)
  - `MONGODB_URI=mongodb://localhost:27017`
- Start MongoDB.
- Run:
  - `cd backend`
  - `go run .`

2) Frontend
- Ensure Vite dev server serves on your chosen origin (e.g., 8080).
- If needed, set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env.local`.
- Run:
  - `cd frontend`
  - `npm install`
  - `npm run dev`

3) Spotify App Config
- Add redirect URI: `http://127.0.0.1:8000/callback` in your Spotify App settings.
- Use the same host (127.0.0.1 vs localhost) in both backend redirect and frontend origin to ensure cookies are sent.

### API Summary (Backend)
- Auth
  - `GET /login` → Spotify OAuth start
  - `GET /callback` → Handles OAuth, sets cookie, redirects to frontend
  - `POST /logout` → Clears session cookie
  - `GET /api/auth/me` → 200 if logged in; 401 otherwise
- Search
  - `GET /api/search/artists?q=…`
- Playlist
  - `POST /api/playlist/generate` → `{ artists: string[] }` → `{ tracks: simplifiedTrack[] }`
  - `POST /api/playlist/create` → `{ name, trackIds }` → `{ url }`
- History
  - `GET /api/history` → `historyEntry[]`
  - `POST /api/history` → `{ title, artists, tracks }` → `historyEntry`
  - `DELETE /api/history/:id` → 204

### Notes and Next Steps
- Production hardening: use HTTPS with `Secure` cookies, sign/encrypt session, add refresh token handling for Spotify API, and enforce per‑request user lookups (not “most recent”).
- Pagination for history and more robust ID handling (use ObjectID).
- Add unit/integration tests.


