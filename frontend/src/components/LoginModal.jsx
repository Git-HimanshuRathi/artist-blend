import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, Music } from "lucide-react";
import { authenticateSpotify } from "@/lib/api";

const LoginModal = ({ isOpen, onClose, action = "access this feature" }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await authenticateSpotify();
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full gradient-primary">
            <Music className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center">Login Required</DialogTitle>
          <DialogDescription className="text-center">
            Please log in with Spotify to {action}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            Connect your Spotify account to create playlists, save your favorites, and enjoy the full ArtistBlend experience.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full sm:w-auto glow-effect"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login with Spotify
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
