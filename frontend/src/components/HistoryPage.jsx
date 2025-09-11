import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TrackList from "./TrackList.jsx";
import { History, Music, Calendar, Users, Trash2, Play } from "lucide-react";
import { fetchHistory, deleteHistory, authenticateSpotify } from "@/lib/api";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const backend = await fetchHistory();
        setHistory((Array.isArray(backend) ? backend : []).map((p) => ({
          id: p.id || p._id || String(Date.now()) + Math.random().toString(36).slice(2),
          tracks: Array.isArray(p.tracks) ? p.tracks : [],
          artists: Array.isArray(p.artists) ? p.artists : [],
          createdAt: p.createdAt || new Date().toISOString(),
          title: p.title || 'ArtistBlend Playlist',
        })));
        return;
      } catch {
        // If unauthorized, redirect to login
        authenticateSpotify();
        return;
      }
      // Fallback to local
      const savedHistory = localStorage.getItem('playlistHistory');
      if (!savedHistory) return;
      try {
        const parsed = JSON.parse(savedHistory);
        const normalized = Array.isArray(parsed)
          ? parsed
              .filter((p) => p && typeof p === 'object')
              .map((p) => {
                const id = p.id || String(Date.now()) + Math.random().toString(36).slice(2);
                const tracks = Array.isArray(p.tracks) ? p.tracks : [];
                let artists = Array.isArray(p.artists) ? p.artists : [];
                if (artists.length === 0 && typeof p.title === 'string' && p.title.includes(' × ')) {
                  artists = p.title.replace(/\s*Blend\s*$/i, '').split(' × ').map((s) => s.trim()).filter(Boolean);
                }
                const createdAt = p.createdAt || new Date().toISOString();
                const title = p.title || (artists.length ? `${artists.join(' × ')} Blend` : 'ArtistBlend Playlist');
                return { id, tracks, artists, createdAt, title };
              })
          : [];
        setHistory(normalized);
      } catch {
        localStorage.removeItem('playlistHistory');
        setHistory([]);
      }
    })()
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('playlistHistory');
    setHistory([]);
    setSelectedPlaylist(null);
  };

  const deletePlaylist = async (id) => {
    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Fallback to local removal
      const updated = history.filter(playlist => playlist.id !== id);
      setHistory(updated);
      localStorage.setItem('playlistHistory', JSON.stringify(updated));
    }
    if (selectedPlaylist?.id === id) setSelectedPlaylist(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedPlaylist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedPlaylist(null)}
              className="hover:bg-primary/20"
            >
              ← Back to History
            </Button>
            <div className="text-sm text-muted-foreground">
              Created {formatDate(selectedPlaylist.createdAt)}
            </div>
          </div>
          
          <TrackList 
            tracks={selectedPlaylist.tracks || []}
            artists={selectedPlaylist.artists || []}
            playlistTitle={`${(selectedPlaylist.artists || []).join(" × ")} Blend`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <History className="w-8 h-8 text-music-purple" />
            <h1 className="text-3xl font-bold music-gradient-text">
              Your Playlist History
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Revisit your previous music blends and discover your favorites again
          </p>
        </div>

        {/* History Controls */}
        {history.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">
              {history.length} playlist{history.length !== 1 ? 's' : ''} saved
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <Card className="p-12 text-center card-shadow bg-card/50 backdrop-blur-sm">
            <div className="gradient-glow w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Playlists Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start creating playlists to see your history here. 
              All your blends will be automatically saved.
            </p>
            <Button asChild className="glow-effect">
              <a href="/playlist">
                <Music className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </a>
            </Button>
          </Card>
        ) : (
          /* History Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {history.map((playlist) => (
              <Card 
                key={playlist.id}
                className="p-6 card-shadow hover:glow-effect transition-smooth bg-card/80 backdrop-blur-sm cursor-pointer group"
                onClick={() => setSelectedPlaylist(playlist)}
              >
                <div className="space-y-4">
                  {/* Playlist Header */}
                  <div className="flex items-start justify-between">
                    <div className="gradient-primary w-12 h-12 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaylist(playlist.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-smooth hover:bg-destructive/20 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Artists */}
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-smooth mb-2">
                      {(playlist.artists || []).length
                        ? `${(playlist.artists || []).join(" × ")} Blend`
                        : (playlist.title || 'ArtistBlend Playlist')}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{(playlist.artists || []).length} artists</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Music className="w-3 h-3" />
                        <span>{(playlist.tracks || []).length} tracks</span>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(playlist.createdAt)}</span>
                  </div>

                  {/* Preview Tracks */}
                  <div className="space-y-1">
                    {(playlist.tracks || []).slice(0, 3).map((track, index) => (
                      <div key={index} className="text-xs text-muted-foreground truncate">
                        {track.name} • {track.artist}
                      </div>
                    ))}
                    {(playlist.tracks || []).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{(playlist.tracks || []).length - 3} more tracks
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-smooth">
                    <Button size="sm" className="w-full">
                      <Play className="w-3 h-3 mr-2" />
                      View Playlist
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
