import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Play, Heart, ExternalLink } from "lucide-react";
import { createSpotifyPlaylist, saveHistory, authenticateSpotify } from "@/lib/api";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";

const TrackList = ({ tracks, playlistTitle, artists = [] }) => {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState("");
  const { isLoggedIn } = useAuth();
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No tracks to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {playlistTitle && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 music-gradient-text">
            {playlistTitle}
          </h2>
          <p className="text-muted-foreground">
            {tracks.length} tracks • Perfect blend
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {tracks.map((track, index) => (
          <Card 
            key={track.id || index} 
            className="p-4 card-shadow hover:glow-effect transition-smooth bg-card/80 backdrop-blur-sm group"
          >
            <div className="flex items-center space-x-4">
              {/* Track Number / Album Art */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold group-hover:scale-105 transition-smooth">
                {track.albumArt ? (
                  <img 
                    src={track.albumArt} 
                    alt={`${track.album} cover`}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-grow min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-smooth">
                  {track.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist}
                  {track.album && ` • ${track.album}`}
                </p>
              </div>

              {/* Duration */}
              {track.duration && (
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {track.duration}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {track.spotifyUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="opacity-0 group-hover:opacity-100 transition-smooth hover:bg-primary/20"
                  >
                    <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Playlist Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          size="lg"
          className="glow-effect flex-1"
          disabled={creating || tracks.length === 0}
          onClick={async () => {
            if (!isLoggedIn) {
              setLoginAction("play all songs");
              setShowLoginModal(true);
              return;
            }
            
            try {
              setCreateError("")
              setCreating(true)
              const trackIds = tracks
                .map((t) => t.id)
                .filter((id) => typeof id === "string" && id.length > 0)
              const { url } = await createSpotifyPlaylist({
                name: playlistTitle || "ArtistBlend Playlist",
                trackIds,
              })
              if (url) {
                window.open(url, "_blank", "noopener,noreferrer")
              }
            } catch (e) {
              setCreateError("Failed to create playlist in Spotify")
            } finally {
              setCreating(false)
            }
          }}
        >
          <Play className="w-4 h-4 mr-2" />
          {creating ? "Creating…" : "Play All"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => {
            (async () => {
              try {
                // Try backend first
                await saveHistory({
                  title: playlistTitle || "ArtistBlend Playlist",
                  artists,
                  tracks,
                })
                setSaved(true)
              } catch (e) {
                if (e?.response?.status === 401) {
                  authenticateSpotify();
                  return;
                }
                // Fallback to local storage
                try {
                  const history = JSON.parse(localStorage.getItem('playlistHistory') || '[]')
                  const entry = {
                    id: Date.now().toString(),
                    title: playlistTitle || "ArtistBlend Playlist",
                    artists,
                    tracks,
                    createdAt: new Date().toISOString(),
                  }
                  history.unshift(entry)
                  localStorage.setItem('playlistHistory', JSON.stringify(history.slice(0, 50)))
                  setSaved(true)
                } catch {}
              }
            })()
          }}
        >
          <Heart className="w-4 h-4 mr-2" fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save Playlist"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={creating || tracks.length === 0}
          onClick={async () => {
            if (!isLoggedIn) {
              setLoginAction("create a playlist");
              setShowLoginModal(true);
              return;
            }
            
            try {
              setCreateError("");
              setCreating(true);
              const trackIds = tracks
                .map((t) => t.id)
                .filter((id) => typeof id === "string" && id.length > 0);
              const { url } = await createSpotifyPlaylist({
                name: playlistTitle || "ArtistBlend Playlist",
                trackIds,
              });
              if (url) {
                window.open(url, "_blank", "noopener,noreferrer");
              }
            } catch (e) {
              setCreateError("Failed to create playlist in Spotify");
            } finally {
              setCreating(false);
            }
          }}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {creating ? "Creating…" : "Open in Spotify"}
        </Button>
      </div>
      {createError && (
        <div className="text-sm text-red-500">{createError}</div>
      )}
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginAction}
      />
    </div>
  );
};

export default TrackList;
