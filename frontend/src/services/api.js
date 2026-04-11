/**
 * Service Layer — API abstraction with mock data fallback.
 * Each service tries the real backend API first; if it fails, returns mock data.
 */
import { api } from '../context/AuthContext';
import { mockResources } from '../mock/resources';
import { mockBookings } from '../mock/bookings';
import { mockTickets } from '../mock/tickets';
import { mockUsers, mockTechnicians } from '../mock/users';
import { mockNotifications } from '../mock/notifications';

// ── Resource Service ──────────────────────────────────────
export const resourceService = {
  getAll: async (filters = {}) => {
    try {
      const { data } = await api.get('/api/resources', { params: filters });
      return data;
    } catch {
      let results = [...mockResources];
      if (filters.type && filters.type !== 'ALL') results = results.filter(r => r.type === filters.type);
      if (filters.search) results = results.filter(r => r.name.toLowerCase().includes(filters.search.toLowerCase()));
      return results;
    }
  },
  getById: async (id) => {
    try { return (await api.get(`/api/resources/${id}`)).data; }
    catch { return mockResources.find(r => r.id === id); }
  },
  create: async (data) => {
    try { return (await api.post('/api/resources', data)).data; }
    catch { const nr = { ...data, id: 'r' + Date.now() }; mockResources.push(nr); return nr; }
  },
  update: async (id, data) => {
    try { return (await api.put(`/api/resources/${id}`, data)).data; }
    catch { const i = mockResources.findIndex(r => r.id === id); if (i >= 0) mockResources[i] = { ...mockResources[i], ...data }; return mockResources[i]; }
  },
  delete: async (id) => {
    try { await api.delete(`/api/resources/${id}`); }
    catch { const i = mockResources.findIndex(r => r.id === id); if (i >= 0) mockResources.splice(i, 1); }
  },
};

// ── Booking Service ──────────────────────────────────────
export const bookingService = {
  getAll: async () => {
    try { return (await api.get('/api/bookings')).data; }
    catch { return [...mockBookings]; }
  },
  getByUser: async (userId) => {
    try { return (await api.get(`/api/bookings/user/${userId}`)).data; }
    catch { return mockBookings.filter(b => b.userId === userId); }
  },
  create: async (data) => {
    try { return (await api.post('/api/bookings', data)).data; }
    catch { const nb = { ...data, id: 'b' + Date.now(), status: 'PENDING', qrCode: null, createdAt: new Date().toISOString() }; mockBookings.push(nb); return nb; }
  },
  updateStatus: async (id, status) => {
    try { return (await api.patch(`/api/bookings/${id}/status`, { status })).data; }
    catch { const b = mockBookings.find(b => b.id === id); if (b) { b.status = status; if (status === 'APPROVED') b.qrCode = 'QR-' + id; } return b; }
  },
};

// ── Ticket Service ────────────────────────────────────────
export const ticketService = {
  getAll: async () => {
    try { return (await api.get('/api/tickets')).data; }
    catch { return [...mockTickets]; }
  },
  getByUser: async (userId) => {
    try { return (await api.get(`/api/tickets/user/${userId}`)).data; }
    catch { return mockTickets.filter(t => t.createdBy === userId); }
  },
  getAssigned: async (techId) => {
    try { return (await api.get(`/api/tickets/assigned/${techId}`)).data; }
    catch { return mockTickets.filter(t => t.assignedTo === techId); }
  },
  getUnassigned: async () => {
    try { return (await api.get('/api/tickets/unassigned')).data; }
    catch { return mockTickets.filter(t => !t.assignedTo && t.status !== 'CLOSED'); }
  },
  create: async (data) => {
    try { return (await api.post('/api/tickets', data)).data; }
    catch {
      const nt = { ...data, id: 't' + Date.now(), status: 'OPEN', assignedTo: null, assignedToName: null, createdAt: new Date().toISOString(), slaDeadline: new Date(Date.now() + 48 * 3600000).toISOString() };
      mockTickets.push(nt);
      return nt;
    }
  },
  updateStatus: async (id, status) => {
    try { return (await api.patch(`/api/tickets/${id}/status`, { status })).data; }
    catch { const t = mockTickets.find(t => t.id === id); if (t) t.status = status; return t; }
  },
  assign: async (id, techId, techName) => {
    try { return (await api.patch(`/api/tickets/${id}/assign`, { techId })).data; }
    catch { const t = mockTickets.find(t => t.id === id); if (t) { t.assignedTo = techId; t.assignedToName = techName; t.status = 'IN_PROGRESS'; } return t; }
  },
};

// ── Notification Service ─────────────────────────────────
export const notificationService = {
  getByRole: async (role) => {
    try { return (await api.get('/api/notifications', { params: { role } })).data; }
    catch { return mockNotifications.filter(n => n.role === role); }
  },
  markAsRead: async (id) => {
    try { await api.patch(`/api/notifications/${id}/read`); }
    catch { const n = mockNotifications.find(n => n.id === id); if (n) n.read = true; }
  },
};

// ── User Service ─────────────────────────────────────────
export const userService = {
  getAll: async () => {
    try { return (await api.get('/api/users')).data; }
    catch { return [...mockUsers, ...mockTechnicians]; }
  },
  getTechnicians: async () => {
    try { return (await api.get('/api/users/technicians')).data; }
    catch { return [...mockTechnicians]; }
  },
};
