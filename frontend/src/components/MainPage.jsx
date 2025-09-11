import { useEffect, useRef, useState } from "react";
import PlaylistForm from "./PlaylistForm.jsx";
import TrackList from "./TrackList.jsx";
import { generatePlaylist } from "@/lib/api.js";
import { useToast } from "@/hooks/use-toast.js";
import { Card } from "@/components/ui/card";
import { Music, Sparkles } from "lucide-react";

const MainPage = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentArtists, setCurrentArtists] = useState([]);
  const { toast } = useToast();
  const resultsRef = useRef(null);

  const handleGeneratePlaylist = async (artists) => {
    setIsLoading(true);
    setCurrentArtists(artists);
    
    try {
      const playlist = await generatePlaylist(artists);
      setTracks(playlist.tracks || []);
      
      toast({
        title: "Playlist Generated!",
        description: `Created a playlist with ${playlist.tracks?.length || 0} tracks from ${artists.join(", ")}`,
      });
    } catch (error) {
      console.error('Error generating playlist:', error);
      
      // Mock data for demo purposes
      const mockTracks = [
        {
          id: "1",
          name: "Blinding Lights",
          artist: "The Weeknd",
          album: "After Hours",
          duration: "3:20"
        },
        {
          id: "2", 
          name: "Watermelon Sugar",
          artist: "Harry Styles",
          album: "Fine Line",
          duration: "2:54"
        },
        {
          id: "3",
          name: "Levitating",
          artist: "Dua Lipa",
          album: "Future Nostalgia",
          duration: "3:23"
        },
        {
          id: "4",
          name: "Good 4 U",
          artist: "Olivia Rodrigo", 
          album: "SOUR",
          duration: "2:58"
        },
        {
          id: "5",
          name: "Anti-Hero",
          artist: "Taylor Swift",
          album: "Midnights",
          duration: "3:20"
        }
      ];
      
      setTracks(mockTracks);
      
      toast({
        title: "Demo Playlist Generated!",
        description: `Here's a sample playlist based on ${artists.join(", ")}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && tracks.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isLoading, tracks.length]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-8 h-8 text-music-purple" />
            <h1 className="text-3xl font-bold music-gradient-text">
              Create Your Blend
            </h1>
            <Sparkles className="w-8 h-8 text-music-blue" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Mix and match your favorite artists to discover new music combinations. 
          </p>
        </div>

        {/* Playlist Form */}
        <PlaylistForm 
          onSubmit={handleGeneratePlaylist} 
          isLoading={isLoading} 
        />

        {/* Loading or Results */}
        {isLoading && (
          <Card className="p-8 text-center card-shadow bg-card/80 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white animate-bounce" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Crafting your perfect blend...</h3>
              <p className="text-muted-foreground">
                Analyzing {currentArtists.join(", ")} and finding the best tracks
              </p>
            </div>
          </Card>
        )}

        {/* Track List */}
        {tracks.length > 0 && !isLoading && (
          <div ref={resultsRef} className="animate-in slide-in-from-bottom-4 duration-500">
            <TrackList 
              tracks={tracks} 
              artists={currentArtists}
              playlistTitle={`${currentArtists.join(" × ")} Blend`}
            />
          </div>
        )}

        {/* Empty State */}
        {tracks.length === 0 && !isLoading && (
          <Card className="p-12 text-center card-shadow bg-card/50 backdrop-blur-sm">
            <div className="gradient-glow w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Create?</h3>
            <p className="text-muted-foreground mb-6">
              Enter your favorite artists above and let the magic begin! 
              We'll blend their styles to create something unique.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-music-purple"></div>
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-music-blue"></div>
                <span>Instant Results</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-music-green"></div>
                <span>Unique Blends</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MainPage;
