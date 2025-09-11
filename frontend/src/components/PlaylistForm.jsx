import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Music, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchArtists } from "@/lib/api";

const PlaylistForm = ({ onSubmit, isLoading }) => {
  const [artistInput, setArtistInput] = useState("");
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Derive the fragment after the last comma for live search
  const currentFragment = artistInput.split(",").slice(-1)[0].trim();

  useEffect(() => {
    let abort = false;
    let timerId;

    setSearchError("");

    // Only search when there is a fragment of at least 2 characters
    if (currentFragment.length >= 2 && !isLoading) {
      setIsSearching(true);
      timerId = setTimeout(async () => {
        try {
          const data = await searchArtists(currentFragment);
          if (abort) return;
          const items = data?.artists?.items || [];
          setSuggestions(items);
        } catch (e) {
          if (abort) return;
          setSearchError("Failed to fetch suggestions");
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
  }, [currentFragment, isLoading]);

  const addSuggestionToInput = (artistName) => {
    setError("");
    const parts = artistInput.split(",");
    if (parts.length === 0 || artistInput.trim() === "") {
      setArtistInput(artistName);
      return;
    }
    parts[parts.length - 1] = ` ${artistName}`; // keep a space before name for readability
    const next = parts
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .join(", ");
    setArtistInput(next);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const artists = artistInput
      .split(",")
      .map(artist => artist.trim())
      .filter(artist => artist.length > 0);

    if (artists.length < 3) {
      setError("Please enter at least 3 artists separated by commas");
      return;
    }

    onSubmit(artists);
  };

  const artistCount = artistInput
    .split(",")
    .map(artist => artist.trim())
    .filter(artist => artist.length > 0).length;

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

        <div className="space-y-2">
          <Label htmlFor="artists" className="text-base font-medium">
            Artist Names
          </Label>
          <Input
            id="artists"
            type="text"
            placeholder="e.g., Taylor Swift, Ed Sheeran, Billie Eilish"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            className="text-base py-3"
            disabled={isLoading}
          />
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
                        onClick={() => addSuggestionToInput(artist.name)}
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
              Separate artists with commas
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
    </Card>
  );
};

export default PlaylistForm;
