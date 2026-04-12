/**
 * authService.js
 * ─────────────────────────────────────────────────────────────────
 * Centralised authentication service.
 * All auth API calls go here so AuthContext stays lean.
 * ─────────────────────────────────────────────────────────────────
 */
import { api } from '../context/AuthContext';

// ── Google OAuth ─────────────────────────────────────────────────
export const authService = {
  /**
   * Redirect browser to Google OAuth (backend handles the flow).
   */
  loginWithGoogle() {
    window.location.href = 'http://localhost:8081/oauth2/authorization/google';
  },

  /**
   * Fetch the currently authenticated user from the backend session.
   * Returns null if not authenticated.
   */
  async fetchMe() {
    try {
      const { data } = await api.get('/api/user/me');
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Email + password login.
   * @returns {object} user
   */
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },

  /**
   * Register a new student account.
   */
  async register(payload) {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  },

  /**
   * Sign out — clears session on backend.
   */
  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch { /* ignore */ }
  },

  /**
   * Change password — hits backend.
   */
  async changePassword(currentPassword, newPassword) {
    const { data } = await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  },

  // ── Helpers ───────────────────────────────────────────────────

  /**
   * Validate that an email is a @sliit.lk or @my.sliit.lk address.
   */
  isValidSliitEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@(my\.)?sliit\.lk$/i.test(email);
  },

  /**
   * Get the dashboard route for a given role.
   */
  getDashboardRoute(role) {
    const map = {
      ADMIN:      '/admin/dashboard',
      TECHNICIAN: '/technician/dashboard',
      USER:       '/dashboard',
    };
    return map[role] ?? '/dashboard';
  },
};
