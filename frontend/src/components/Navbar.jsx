import { Link, useLocation, useNavigate } from "react-router-dom";
import { Music, Home, History, List, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authenticateSpotify, logout } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication state
  useEffect(() => {
    const checkAuthState = async () => {
      const token = localStorage.getItem('authToken');
      const isSuccess = new URLSearchParams(location.search).get("auth") === "success";
      const hasSession = sessionStorage.getItem('spotifyAuth') === 'true';
      
      // Also check with backend if we have a session cookie
      let backendAuth = false;
      if (hasSession || isSuccess) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/auth/me`, {
            credentials: 'include'
          });
          backendAuth = response.ok;
        } catch (e) {
          // Ignore errors, just use other indicators
        }
      }
      
      // Consider logged in if we have any of these indicators
      setIsLoggedIn(!!token || isSuccess || hasSession || backendAuth);
    };

    checkAuthState();
    
    // Listen for storage changes (in case auth state changes in another tab)
    const handleStorageChange = () => checkAuthState();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.search]);

  // Detect login success via URL param and show toast
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("auth") === "success") {
      toast({ title: "Logged in", description: "Successfully logged in with Spotify" });
      setIsLoggedIn(true);
      // Set session storage to remember login state
      sessionStorage.setItem('spotifyAuth', 'true');
      
      // Check if we need to redirect to a specific page
      const redirectPath = localStorage.getItem('loginRedirectPath');
      if (redirectPath && redirectPath !== '/') {
        // Clear the redirect path and navigate to the stored path
        localStorage.removeItem('loginRedirectPath');
        navigate(redirectPath, { replace: true });
      } else {
        // Clean the URL and stay on current page
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, navigate, toast]);

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
            
            {/* Login/Logout Button - show on home page and playlist page */}
            {(location.pathname === "/" || location.pathname === "/playlist") && (
              isLoggedIn ? (
                <Button
                  variant="outline"
                  size="sm"
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
                    window.location.href = location.pathname;
                  }}
                  className="flex items-center space-x-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              ) : (
                <Button 
                  className="glow-effect flex items-center space-x-1" 
                  size="sm"
                  onClick={authenticateSpotify}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Log in</span>
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
