import { useState, useEffect } from "react";

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('authToken');
      const isSuccess = new URLSearchParams(window.location.search).get("auth") === "success";
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
      setIsLoading(false);
    };

    checkAuthState();
    
    // Listen for storage changes (in case auth state changes in another tab)
    const handleStorageChange = () => checkAuthState();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { isLoggedIn, isLoading };
};
