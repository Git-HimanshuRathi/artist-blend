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


