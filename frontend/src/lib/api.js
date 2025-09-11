import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      window.location.href = `${API_BASE_URL}/login`;
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export const generatePlaylist = async (artists) => {
  try {
    const response = await api.post('/api/playlist/generate', {
      artists: artists
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating playlist:', error);
    
    // For demo purposes, throw error to trigger mock data
    throw new Error('Backend not available - using mock data');
  }
};

export const savePlaylist = async (playlistData) => {
  try {
    const response = await api.post('/playlist/save', playlistData);
    return response.data;
  } catch (error) {
    console.error('Error saving playlist:', error);
    throw error;
  }
};

export const getUserPlaylists = async () => {
  try {
    const response = await api.get('/api/playlist/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    throw error;
  }
};

export const authenticateSpotify = async () => {
  try {
    // Redirect to the Go backend's login endpoint
    window.location.href = `${API_BASE_URL}/login`;
  } catch (error) {
    console.error('Error initiating Spotify auth:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/logout');
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

export default api;

export const searchArtists = async (query) => {
  try {
    const response = await api.get(`/api/search/artists`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
};

export const createSpotifyPlaylist = async ({ name, trackIds }) => {
  try {
    const response = await api.post('/api/playlist/create', {
      name,
      trackIds
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Spotify playlist:', error);
    throw error;
  }
};

// History (backend)
export const fetchHistory = async () => {
  const { data } = await api.get('/api/history');
  return data;
};

export const saveHistory = async ({ title, artists, tracks }) => {
  const { data } = await api.post('/api/history', { title, artists, tracks });
  return data;
};

export const deleteHistory = async (id) => {
  await api.delete(`/api/history/${id}`);
};
