# ArtistBlend (JavaScript, Vite + React)us

A modern React app to generate and browse AI-blended music playlists from multiple artists. Converted from TypeScript to JavaScript for simpler builds and faster iteration.

## Tech Stack

- Vite (React + SWC)
- React 18
- JavaScript (ESM)
- React Router
- @tanstack/react-query
- Tailwind CSS
- shadcn-ui (Radix + Tailwind components)
- Sonner (notifications)
- Axios

## Getting Started

```sh
# Install deps
npm i

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Environment Variables

- `VITE_API_URL` (optional): Backend API base URL. Defaults to `http://localhost:3001/api`.

## Project Structure

```
artist-blend-magic/
├─ index.html                  # App entry (loads /src/main.jsx)
├─ vite.config.js              # Vite config with alias "@" → ./src
├─ tailwind.config.js          # Tailwind config (JS)
├─ postcss.config.js           # PostCSS/Tailwind pipeline
├─ eslint.config.js            # ESLint (JS project)
├─ public/                     # Static assets
├─ src/
│  ├─ main.jsx                 # React root bootstrap
│  ├─ App.jsx                  # App providers + routes
│  ├─ index.css                # Global styles
│  ├─ App.css                  # App-specific styles
│  ├─ assets/
│  │  └─ hero-music.jpg        # Landing hero image
│  ├─ components/
│  │  ├─ Navbar.jsx            # Top navigation bar
│  │  ├─ LandingPage.jsx       # Marketing/entry page
│  │  ├─ MainPage.jsx          # Playlist generation flow
│  │  ├─ HistoryPage.jsx       # Saved playlist history
│  │  ├─ PlaylistForm.jsx      # Artists input form
│  │  ├─ TrackList.jsx         # Tracks rendering + actions
│  │  └─ ui/                   # shadcn-ui primitives (JSX)
│  │     ├─ alert.jsx
│  │     ├─ button.jsx
│  │     ├─ card.jsx
│  │     ├─ input.jsx
│  │     ├─ label.jsx
│  │     ├─ toast.jsx
│  │     ├─ toaster.jsx
│  │     ├─ tooltip.jsx
│  │     └─ sonner.jsx
│  ├─ pages/
│  │  ├─ Index.jsx             # Placeholder example page
│  │  └─ NotFound.jsx          # 404 route
│  ├─ hooks/
│  │  ├─ use-mobile.jsx        # Media-query helper for mobile
│  │  └─ use-toast.js          # Global toast store/utilities
│  └─ lib/
│     ├─ api.js                # Axios instance + API calls
│     └─ utils.js              # Utility helpers (cn)
└─ dist/                       # Production build (after npm run build)
```

## Routing

- `/` → `LandingPage` (marketing, CTA to start creating)
- `/playlist` → `MainPage` (enter artists, generate playlist)
- `/history` → `HistoryPage` (view saved blends)
- `*` → `NotFound`

## Top-Level App Flow

- `src/main.jsx`
  - Mounts React at `#root` and renders `<App />`.
- `src/App.jsx`
  - Wraps the app with:
    - `QueryClientProvider` (React Query)
    - `TooltipProvider` (Radix Tooltip context)
    - `Toaster` (custom toast UI) and `Sonner` (notification system)
  - Declares routes and renders `Navbar` on all pages.

## Components (Feature-Level)

- `components/Navbar.jsx`
  - Responsive top bar with app brand and route-aware nav buttons (Home / History).
  - Uses `react-router-dom` for links and `@/components/ui/button` for styling.

- `components/LandingPage.jsx`
  - Marketing-style landing with hero background and feature cards.
  - CTA button routes to `/playlist`.

- `components/MainPage.jsx`
  - Core playlist generation page.
  - State:
    - `tracks`: currently generated tracks list
    - `isLoading`: API/loading flag
    - `currentArtists`: artists used for the last generation
  - Actions:
    - `handleGeneratePlaylist(artists)` calls `generatePlaylist` (from `lib/api.js`).
    - On success: stores playlist to localStorage history, shows success toast.
    - On error: falls back to a mock track list and shows a demo toast.
  - Renders:
    - `<PlaylistForm />` for input
    - A loading card
    - `<TrackList />` for results
    - An empty state when no tracks

- `components/HistoryPage.jsx`
  - Displays previously generated playlists from `localStorage` (`playlistHistory`).
  - Click a card to drill into a playlist and render `<TrackList />` for it.
  - Clear all history and delete individual playlists.

- `components/PlaylistForm.jsx`
  - Controlled text input for comma-separated artist names.
  - Validates at least 3 artists; shows `Alert` for errors.
  - Calls `onSubmit(artists)` when valid.

- `components/TrackList.jsx`
  - Renders a list of tracks with album art/index, title, artist, album, duration.
  - Action buttons (like, play, open on Spotify when `spotifyUrl` provided).
  - Footer buttons for bulk actions (Play All, Save, Open in Spotify placeholder).

## UI Primitives (shadcn-ui)

- `ui/button.jsx` — Styled button with variants (`default`, `outline`, `ghost`, etc.).
- `ui/card.jsx` — Card container with `CardHeader`, `CardTitle`, etc.
- `ui/input.jsx` — Styled input field.
- `ui/label.jsx` — Accessible label.
- `ui/alert.jsx` — Inline alert with variants; used for validation errors.
- `ui/toast.jsx` — Radix Toast primitives, themed.
- `ui/toaster.jsx` — Renders active toasts from `hooks/use-toast.js`.
- `ui/tooltip.jsx` — Radix tooltip wrappers.
- `ui/sonner.jsx` — Sonner Toaster configured with theme from `next-themes`.

## Hooks

- `hooks/use-toast.js`
  - Lightweight global toast store with `toast()` and `useToast()`.
  - Backed by an in-memory reducer; integrates with `ui/toaster.jsx`.

- `hooks/use-mobile.jsx`
  - Returns `true` if viewport is under the mobile breakpoint.
  - Uses `matchMedia` listener.

## API Layer

- `lib/api.js`
  - Axios instance with `baseURL` from `VITE_API_URL`.
  - Request interceptor adds `Authorization` header if `authToken` exists.
  - Response interceptor logs errors and redirects on 401.
  - Exposed functions:
    - `generatePlaylist(artists: string[])` → `{ tracks, metadata? }`
    - `savePlaylist(playlistData)` → `{ id, message }`
    - `getUserPlaylists()` → `PlaylistResponse[]`
    - `authenticateSpotify()` → `{ authUrl }`

- `lib/utils.js`
  - `cn(...inputs)` → className merge helper (clsx + tailwind-merge).

## Styling & Theming

- Tailwind configured for class-based dark mode.
- Extended color tokens map to CSS variables (set by your theme).
- Custom utilities for gradients, glows, shadows, and animations.

## Aliases

- `@` alias → `./src` (configured in `vite.config.js`).
  - Example: `import { Button } from "@/components/ui/button"`

## Data Persistence (Local)

- Recent playlists are stored in `localStorage` under the key `playlistHistory`.
- `HistoryPage` reads/writes this history and supports deletion.

## Error Handling

- API layer logs errors and throws on failure.
- `MainPage` falls back to mock data if the backend is unavailable.
- Toast notifications inform the user of success/failure states.

## Notes on the JS Migration

- All `.ts`/`.tsx` files were converted to `.js`/`.jsx`.
- Type annotations were removed; logic and behavior remain identical.
- ESLint and Tailwind configs were updated for JavaScript.

## License

MIT (c) Himanshu
