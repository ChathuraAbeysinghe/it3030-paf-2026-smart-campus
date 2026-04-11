import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:8081';

// Axios with credentials (session cookies)
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ── Mock Staff Credentials (Admin & Technician bypass) ────────────────────
// These work even when the backend is not set up for these roles.
// Passwords are stored in localStorage so users can change them.
const DEFAULT_STAFF_CREDENTIALS = {
  'admin@sliit.lk':        { id: 'u5', name: 'Admin User', role: 'ADMIN',      defaultPassword: 'admin@123' },
  'superadmin@sliit.lk':   { id: 'u6', name: 'Super Admin', role: 'ADMIN',     defaultPassword: 'admin@123' },
  'sunil@sliit.lk':        { id: 'tech1', name: 'Sunil Rathnayake', role: 'TECHNICIAN', defaultPassword: 'tech@123' },
  'pradeep@sliit.lk':      { id: 'tech2', name: 'Pradeep Jayasinghe', role: 'TECHNICIAN', defaultPassword: 'tech@123' },
};

function getStaffPasswords() {
  try { return JSON.parse(localStorage.getItem('staff_passwords') || '{}'); } catch { return {}; }
}

function checkStaffCredential(email, password) {
  const template = DEFAULT_STAFF_CREDENTIALS[email.toLowerCase()];
  if (!template) return null;
  const overrides = getStaffPasswords();
  const expected  = overrides[email.toLowerCase()] ?? template.defaultPassword;
  if (password !== expected) return null;
  return { ...template, email: email.toLowerCase(), picture: null };
}

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
    // ── Check mock staff credentials first ──
    const staffUser = checkStaffCredential(email.trim(), password);
    if (staffUser) {
      setUser(staffUser);
      localStorage.setItem('smartcampus_user', JSON.stringify(staffUser));
      return staffUser;
    }
    // ── Otherwise hit the real backend API ──
    const { data } = await api.post('/api/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('smartcampus_user', JSON.stringify(data));
    return data;
  };

  const register = async (name, itNumber, faculty, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, itNumber, faculty, email, password });
    return data;
  };

  // ── Change Password ───────────────────────────────────────────────────────
  const changePassword = async (currentPassword, newPassword) => {
    const stored = localStorage.getItem('smartcampus_user');
    if (!stored) throw new Error('Not logged in');
    const currentUser = JSON.parse(stored);

    // If this is a staff (mock) account, update password locally
    const isStaff = !!DEFAULT_STAFF_CREDENTIALS[currentUser.email?.toLowerCase()];
    if (isStaff) {
      // Verify current password first
      const valid = checkStaffCredential(currentUser.email, currentPassword);
      if (!valid) throw new Error('Current password is incorrect');
      const overrides = getStaffPasswords();
      overrides[currentUser.email.toLowerCase()] = newPassword;
      localStorage.setItem('staff_passwords', JSON.stringify(overrides));
      return { success: true };
    }

    // For real users, call backend
    const { data } = await api.post('/api/auth/change-password', { currentPassword, newPassword });
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
      logout, fetchUser, changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
export { api };
