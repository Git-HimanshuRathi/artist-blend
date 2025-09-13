import { X, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SelectedArtists = ({ artists, onRemoveArtist }) => {
  if (artists.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 card-shadow bg-card/60 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Music className="w-4 h-4 text-music-purple" />
          <h3 className="font-semibold text-sm">Selected Artists</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {artists.length} selected
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {artists.map((artist, index) => (
          <div
            key={`${artist}-${index}`}
            className="flex items-center space-x-2 bg-gradient-primary text-white px-3 py-2 rounded-full text-sm font-medium group hover:scale-105 transition-smooth"
          >
            <span className="truncate max-w-[120px]">{artist}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-white/20 text-white opacity-70 hover:opacity-100 transition-smooth"
              onClick={() => onRemoveArtist(index)}
              aria-label={`Remove ${artist}`}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      
    </Card>
  );
};

export default SelectedArtists;

