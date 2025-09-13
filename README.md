# ArtistBlend 🎵

A modern web application that allows users to create unique music playlists by blending multiple artists together. Built with Go backend and React frontend, ArtistBlend uses AI-powered algorithms to generate personalized playlists that combine the musical styles of your favorite artists.

## ✨ Features

- **Artist Blending**: Select 3+ artists to create unique playlist combinations
- **Spotify Integration**: Seamless login and playlist creation in Spotify
- **Smart Search**: Real-time artist search with suggestions
- **Playlist History**: Save and manage your created playlists
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Authentication Flow**: Secure Spotify OAuth integration with user-friendly login prompts
- **Artist Persistence**: Selected artists are preserved during login process

## 🏗️ Project Structure

```
artist-blend/
├── backend/                    # Go backend server
│   ├── config/                 # Configuration files
│   │   └── config.go          # App configuration
│   ├── handlers/              # HTTP request handlers
│   │   ├── auth.go           # Authentication endpoints
│   │   └── playlist.go       # Playlist generation endpoints
│   ├── models/               # Data models
│   │   └── user.go          # User model definitions
│   ├── main.go              # Main server entry point
│   ├── go.mod              # Go module dependencies
│   └── go.sum              # Go module checksums
│
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   └── ...
│   │   │   ├── LandingPage.jsx    # Home page component
│   │   │   ├── MainPage.jsx       # Main playlist creation page
│   │   │   ├── PlaylistForm.jsx   # Artist selection form
│   │   │   ├── TrackList.jsx      # Generated tracks display
│   │   │   ├── SelectedArtists.jsx # Selected artists display
│   │   │   ├── LoginModal.jsx     # Authentication modal
│   │   │   ├── Navbar.jsx         # Navigation component
│   │   │   └── HistoryPage.jsx    # Playlist history page
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAuth.js   # Authentication state hook
│   │   │   └── use-toast.js # Toast notifications hook
│   │   ├── lib/             # Utility libraries
│   │   │   ├── api.js       # API client functions
│   │   │   └── utils.js     # General utilities
│   │   ├── pages/           # Page components
│   │   │   ├── Index.jsx    # Index page
│   │   │   └── NotFound.jsx # 404 page
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # App entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Static assets
│   ├── dist/                # Built application
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.js       # Vite build configuration
│   └── tailwind.config.js   # Tailwind CSS configuration
│
└── README.md                # This file
```


**Made with ❤️ for music lovers everywhere**
