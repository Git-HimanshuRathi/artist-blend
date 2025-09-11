import { Link, useLocation, useNavigate } from "react-router-dom";
import { Music, Home, History, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticateSpotify, logout } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Detect login success via URL param and show toast
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("auth") === "success") {
      toast({ title: "Logged in", description: "Successfully logged in with Spotify" });
      // Clean the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  // Very simple login state: consider logged in if we have a user stored
  // In this minimal setup, we toggle state on auth success
  useEffect(() => {
    const isSuccess = new URLSearchParams(location.search).get("auth") === "success";
    if (isSuccess) {
      setIsLoggedIn(true);
    }
  }, [location.search]);

  const getNavItems = () => {
    if (location.pathname === "/") {
      return [{ path: "/", label: "Home", icon: Home }];
    } else if (location.pathname === "/playlist") {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/history", label: "History", icon: History },
      ];
    } else {
      return [
        { path: "/", label: "Home", icon: Home },
        { path: "/history", label: "History", icon: History },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="music-gradient-text">ArtistBlend</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    className={`transition-smooth ${
                      isActive ? "glow-effect" : ""
                    }`}
                  >
                    <Link to={item.path} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
            
            {/* Login/Logout Button - only show on home page */}
            {location.pathname === "/" && (
              isLoggedIn ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch (e) {}
                    // Clear all local state and storage
                    try {
                      const savedHistory = localStorage.getItem('playlistHistory');
                      localStorage.clear();
                      if (savedHistory) localStorage.setItem('playlistHistory', savedHistory);
                      sessionStorage.clear();
                    } catch (e) {}
                    setIsLoggedIn(false);
                    toast({ title: "Logged out", description: "You have been logged out" });
                    // Hard redirect to ensure clean session
                    window.location.href = "/";
                  }}
                >
                  Log out
                </Button>
              ) : (
                <Button className="glow-effect" onClick={authenticateSpotify}>
                  Log in
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
