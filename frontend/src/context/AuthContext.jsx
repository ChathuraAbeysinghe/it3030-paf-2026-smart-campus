import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8081';

// Axios with credentials (session cookies)
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Attempt to restore session on mount
  useEffect(() => {
    // Check localStorage first
    const stored = localStorage.getItem('smartcampus_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/api/user/me');
      setUser(data);
      localStorage.setItem('smartcampus_user', JSON.stringify(data));
    } catch {
      // Keep localStorage data if API fails (e.g., manual login)
      const stored = localStorage.getItem('smartcampus_user');
      if (!stored) setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  const loginManual = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('smartcampus_user', JSON.stringify(data));
    return data;
  };

  const register = async (name, itNumber, faculty, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, itNumber, faculty, email, password });
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
      localStorage.removeItem('smartcampus_user');
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      loginWithGoogle, loginManual, register,
      logout, fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
export { api };
