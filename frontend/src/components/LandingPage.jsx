import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Sparkles, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";

const LandingPage = () => {
  const features = [
    {
      icon: Users,
      title: "Blend Artists",
      description: "Combine multiple artists to create unique playlists"
    },
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Smart algorithm finds perfect track combinations"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Generate playlists in seconds with one click"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 music-gradient-text">
              ArtistBlend
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create amazing playlists by blending your favorite artists together. 
              Discover new music combinations and perfect your sound.
            </p>
            
            <div className="flex justify-center mb-12">
              <Button 
                asChild
                size="lg" 
                className="glow-effect transition-bounce hover:scale-105 text-lg px-8 py-6"
              >
                <Link to="/playlist">
                  <Music className="w-5 h-5 mr-2" />
                  Start Creating
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 card-shadow hover:glow-effect transition-smooth bg-card/50 backdrop-blur-sm">
                    <div className="gradient-primary w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-muted-foreground">made with love by Himanshu 😉</p>
      </footer>
    </div>
  );
};

export default LandingPage;
