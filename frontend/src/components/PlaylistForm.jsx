import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Music, AlertCircle, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchArtists } from "@/lib/api";
import SelectedArtists from "./SelectedArtists";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "./LoginModal";
import { useToast } from "@/hooks/use-toast";

const PlaylistForm = ({ onSubmit, isLoading }) => {
  const [artistInput, setArtistInput] = useState("");
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  // Restore selected artists from localStorage after login
  useEffect(() => {
    if (isLoggedIn) {
      const savedArtists = localStorage.getItem('pendingArtists');
      if (savedArtists) {
        try {
          const artists = JSON.parse(savedArtists);
          if (Array.isArray(artists) && artists.length >= 3) {
            setSelectedArtists(artists);
            // Clear the saved artists after restoring
            localStorage.removeItem('pendingArtists');
            // Show toast notification
            toast({
              title: "Artists Restored!",
              description: `Your selected artists (${artists.join(", ")}) have been restored.`,
            });
          }
        } catch (error) {
          console.error('Error parsing saved artists:', error);
          localStorage.removeItem('pendingArtists');
        }
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let abort = false;
    let timerId;

    setSearchError("");

    // Only search when there is input of at least 2 characters
    if (artistInput.length >= 2 && !isLoading) {
      setIsSearching(true);
      timerId = setTimeout(async () => {
        try {
          const data = await searchArtists(artistInput);
          if (abort) return;
          const items = data?.artists?.items || [];
          setSuggestions(items);
          setSearchError(""); // Clear any previous errors
        } catch (e) {
          if (abort) return;
          console.error('Search error:', e);
          setSearchError("Search unavailable - you can still type artist names manually");
          setSuggestions([]);
        } finally {
          if (!abort) setIsSearching(false);
        }
      }, 300); // debounce
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }

    return () => {
      abort = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [artistInput, isLoading]);

  const addArtistToSelected = (artistName) => {
    setError("");
    // Check if artist is already selected
    if (selectedArtists.includes(artistName)) {
      setError("This artist is already selected");
      return;
    }
    
    // Add artist to selected list
    setSelectedArtists(prev => [...prev, artistName]);
    setArtistInput(""); // Clear the input
    setSuggestions([]); // Clear suggestions
  };

  const removeArtist = (index) => {
    setSelectedArtists(prev => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (selectedArtists.length < 3) {
      setError("Please select at least 3 artists");
      return;
    }

    if (!isLoggedIn) {
      // Save selected artists to localStorage before showing login modal
      localStorage.setItem('pendingArtists', JSON.stringify(selectedArtists));
      setShowLoginModal(true);
      return;
    }

    // Clear any saved artists from localStorage before submitting
    localStorage.removeItem('pendingArtists');
    onSubmit(selectedArtists);
  };

  const artistCount = selectedArtists.length;

  return (
    <Card className="p-6 card-shadow bg-card/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Create Your Playlist</h2>
          <p className="text-muted-foreground">
            Enter at least 3 artists to generate a blended playlist
          </p>
        </div>

        {/* Selected Artists Display */}
        <SelectedArtists 
          artists={selectedArtists} 
          onRemoveArtist={removeArtist} 
        />

        <div className="space-y-2">
          <Label htmlFor="artists" className="text-base font-medium">
            Search Artists
          </Label>
          <div className="relative">
            <Input
              id="artists"
              type="text"
              placeholder="Search for artists to add..."
              value={artistInput}
              onChange={(e) => setArtistInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && artistInput.trim() && !selectedArtists.includes(artistInput.trim())) {
                  e.preventDefault();
                  addArtistToSelected(artistInput.trim());
                }
              }}
              className="text-base py-3 pr-10"
              disabled={isLoading}
            />
            {artistInput && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => {
                  if (artistInput.trim() && !selectedArtists.includes(artistInput.trim())) {
                    addArtistToSelected(artistInput.trim());
                  }
                }}
                disabled={!artistInput.trim() || selectedArtists.includes(artistInput.trim())}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
          {/* Suggestions */}
          {(isSearching || suggestions.length > 0 || searchError) && (
            <div className="mt-2 border rounded-md bg-background">
              {isSearching && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
              )}
              {searchError && !isSearching && (
                <div className="px-3 py-2 text-sm text-red-500">{searchError}</div>
              )}
              {!isSearching && !searchError && suggestions.length > 0 && (
                <ul className="max-h-64 overflow-auto">
                  {suggestions.map((artist) => (
                    <li key={artist.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center space-x-3"
                        onClick={() => addArtistToSelected(artist.name)}
                      >
                        {artist.images && artist.images[2] && (
                          <img
                            src={artist.images[2].url}
                            alt={artist.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className="text-sm">
                          {artist.name}
                          {artist.followers?.total ? (
                            <span className="text-muted-foreground ml-2">
                              · {new Intl.NumberFormat().format(artist.followers.total)} followers
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">
              Click suggestions or use the + button to add artists
            </span>
            <span className={`font-medium ${
              artistCount >= 3 ? "text-music-green" : "text-muted-foreground"
            }`}>
              {artistCount}/3+ artists
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full glow-effect transition-bounce hover:scale-[1.02] text-base py-3"
          disabled={isLoading || artistCount < 3}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Playlist...
            </>
          ) : (
            <>
              <Music className="w-4 h-4 mr-2" />
              Generate Playlist
            </>
          )}
        </Button>

        {artistCount >= 3 && !isLoading && (
          <div className="text-center text-sm text-music-green">
            Ready to create your playlist! ✨
          </div>
        )}
      </form>
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action="create a playlist"
      />
    </Card>
  );
};

export default PlaylistForm;
