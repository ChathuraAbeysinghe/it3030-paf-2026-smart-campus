/**
 * notificationService.js
 * ─────────────────────────────────────────────────────────────────
 * Handles all notification operations.
 * Uses real API when available; falls back to mock data.
 * ─────────────────────────────────────────────────────────────────
 */
import { api } from '../context/AuthContext';
import { mockNotifications } from '../mock/notifications';

// ── In-memory working copy of mock data ──────────────────────────
let _mockStore = mockNotifications.map(n => ({ ...n }));

export const notificationService = {
  /**
   * Fetch notifications for a given role.
   * @param {string} role - 'USER' | 'ADMIN' | 'TECHNICIAN'
   */
  async getNotifications(role) {
    try {
      const { data } = await api.get('/api/notifications', { params: { role } });
      return data;
    } catch {
      // Fallback: filter mock store by role
      return _mockStore
        .filter(n => n.role === role)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
    } catch {
      const n = _mockStore.find(n => n.id === id);
      if (n) n.read = true;
    }
  },

  /**
   * Mark ALL notifications as read for a role.
   */
  async markAllAsRead(role) {
    try {
      await api.patch('/api/notifications/read-all', { role });
    } catch {
      _mockStore.filter(n => n.role === role).forEach(n => { n.read = true; });
    }
  },

  /**
   * Delete (clear) all notifications for a role.
   */
  async clearAll(role) {
    try {
      await api.delete('/api/notifications', { params: { role } });
    } catch {
      _mockStore = _mockStore.filter(n => n.role !== role);
    }
  },

  /**
   * Push a new notification into the mock store (for in-app triggering).
   * @param {object} notification - must include: type, message, role
   */
  pushMock(notification) {
    _mockStore.unshift({
      id: 'n' + Date.now(),
      read: false,
      createdAt: new Date().toISOString(),
      ...notification,
    });
  },
};
