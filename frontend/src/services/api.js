/**
 * Service Layer — API with persistent mock fallback.
 * Real backend first; falls back to localStorage mock when API unavailable.
 */
import { api } from '../context/AuthContext';
import { mockBookings as initialMockBookings } from '../mock/bookings';
import { mockResources } from '../mock/resources';
import { mockTickets } from '../mock/tickets';
import { mockUsers, mockTechnicians } from '../mock/users';
import { mockNotifications } from '../mock/notifications';

const MOCK_BOOKINGS_KEY = 'smartcampus_mock_bookings';

function cloneBookings(rows) {
  return (Array.isArray(rows) ? rows : []).map(b => ({ ...b }));
}

function readMock() {
  try {
    const raw = localStorage.getItem(MOCK_BOOKINGS_KEY);
    if (!raw) return cloneBookings(initialMockBookings);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? cloneBookings(parsed) : cloneBookings(initialMockBookings);
  } catch { return cloneBookings(initialMockBookings); }
}

function saveMock() {
  try { localStorage.setItem(MOCK_BOOKINGS_KEY, JSON.stringify(mockBookings)); }
  catch { /* ignore */ }
}

let mockBookings = readMock();

function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.message
      || error?.response?.data?.error
      || error?.message
      || fallback;
}

function toMins(t) {
  if (!t || typeof t !== 'string') return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function hasOverlap(sA, eA, sB, eB) {
  return toMins(sA) < toMins(eB) && toMins(eA) > toMins(sB);
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('smartcampus_user') || 'null'); }
  catch { return null; }
}

// ── Resource Service ─────────────────────────────────────────────
export const resourceService = {
  getAll: async (filters) => {
    try { return (await api.get('/api/resources', { params: filters || {} })).data; }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to load resources')); }
  },
  getById: async (id) => {
    try { return (await api.get('/api/resources/' + id)).data; }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to load resource')); }
  },
  create: async (data) => {
    try { return (await api.post('/api/resources', data)).data; }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to create resource')); }
  },
  update: async (id, data) => {
    try { return (await api.put('/api/resources/' + id, data)).data; }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to update resource')); }
  },
  delete: async (id) => {
    try { await api.delete('/api/resources/' + id); }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to delete resource')); }
  },
  updateStatus: async (id, status) => {
    try { return (await api.patch('/api/resources/' + id + '/status', { status })).data; }
    catch (e) { throw new Error(getApiErrorMessage(e, 'Failed to update resource status')); }
  },
};

// ── Booking Service ──────────────────────────────────────────────
export const bookingService = {

  getAll: async (filters) => {
    const sf = filters || {};
    try {
      return (await api.get('/api/bookings', { params: sf })).data;
    } catch {
      const user = getStoredUser();
      let rows = [...mockBookings];
      if (user && user.role !== 'ADMIN') rows = rows.filter(b => b.userId === user.id);
      if (sf.status && sf.status !== 'ALL') rows = rows.filter(b => b.status === sf.status);
      return rows;
    }
  },

  getById: async (id) => {
    try { return (await api.get('/api/bookings/' + id)).data; }
    catch { return mockBookings.find(b => b.id === id) || null; }
  },

  getByUser: async (userId) => {
    try {
      const all = await bookingService.getAll();
      return all.filter(b => b.userId === userId);
    } catch { return mockBookings.filter(b => b.userId === userId); }
  },

  // Lookup by QR code string (admin scanner)
  getByQrCode: async (qrCode) => {
    try {
      return (await api.get('/api/bookings/qr/' + qrCode)).data;
    } catch (e) {
      // Mock fallback
      const found = mockBookings.find(b => b.qrCode === qrCode);
      if (found) return found;
      throw new Error(getApiErrorMessage(e, 'QR code not found'));
    }
  },

  create: async (data) => {
    try {
      return (await api.post('/api/bookings', data)).data;
    } catch (error) {
      const facilityId = data.facilityId || data.resourceId;
      const conflicts  = await bookingService.getFacilityConflicts(facilityId, data.date);
      const overlapping = conflicts.filter(b => hasOverlap(data.startTime, data.endTime, b.startTime, b.endTime));
      if (overlapping.length > 0) {
        throw new Error(getApiErrorMessage(error, 'Requested time slot conflicts with an existing booking'));
      }
      const user      = getStoredUser() || {};
      const resource  = mockResources.find(r => r.id === facilityId);
      const attendees = Number(data.attendees != null ? data.attendees : data.expectedAttendees);
      const now       = new Date().toISOString();
      const nb = {
        id: 'b' + Date.now(),
        facilityId, facilityName: resource ? resource.name : facilityId,
        resourceId: facilityId, resourceName: resource ? resource.name : facilityId,
        userId: user.id || 'u-local', userName: user.name || 'Local User',
        date: data.date, startTime: data.startTime, endTime: data.endTime,
        purpose: data.purpose, expectedAttendees: attendees,
        status: 'PENDING', adminNotes: null, qrCode: null,
        checkedIn: false, checkedInAt: null, autoCancelled: false,
        createdAt: now, updatedAt: now,
      };
      mockBookings.push(nb);
      saveMock();
      return nb;
    }
  },

  update: async (id, data) => {
    try { return (await api.put('/api/bookings/' + id, data)).data; }
    catch (error) {
      const b = mockBookings.find(b => b.id === id);
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'PENDING') throw new Error('Only pending bookings can be updated');
      const facilityId  = data.facilityId || b.facilityId || b.resourceId;
      const conflicts   = await bookingService.getFacilityConflicts(facilityId, data.date);
      const overlapping = conflicts.filter(c => c.id !== id && hasOverlap(data.startTime, data.endTime, c.startTime, c.endTime));
      if (overlapping.length > 0) throw new Error(getApiErrorMessage(error, 'Requested time slot conflicts with an existing booking'));
      const resource    = mockResources.find(r => r.id === facilityId);
      const attendees   = Number(data.attendees != null ? data.attendees : data.expectedAttendees);
      b.facilityId = facilityId; b.facilityName = resource ? resource.name : facilityId;
      b.resourceId = facilityId; b.resourceName = resource ? resource.name : facilityId;
      b.date = data.date; b.startTime = data.startTime; b.endTime = data.endTime;
      b.purpose = data.purpose; b.expectedAttendees = attendees;
      b.updatedAt = new Date().toISOString();
      saveMock(); return b;
    }
  },

  approve: async (id, adminNotes) => {
    try { return (await api.patch('/api/bookings/' + id + '/approve', { adminNotes: adminNotes || '' })).data; }
    catch {
      const b = mockBookings.find(b => b.id === id);
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'PENDING') throw new Error('Booking can only be approved while pending');
      b.status = 'APPROVED'; b.adminNotes = adminNotes || null;
      b.qrCode = b.qrCode || ('QR-' + id.substring(0, 8).toUpperCase() + '-' + new Date().getFullYear());
      b.updatedAt = new Date().toISOString();
      saveMock(); return b;
    }
  },

  reject: async (id, reason) => {
    try { return (await api.patch('/api/bookings/' + id + '/reject', { adminNotes: reason })).data; }
    catch {
      const b = mockBookings.find(b => b.id === id);
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'PENDING') throw new Error('Booking can only be rejected while pending');
      if (!String(reason || '').trim()) throw new Error('Rejection reason is required');
      b.status = 'REJECTED'; b.adminNotes = String(reason).trim();
      b.updatedAt = new Date().toISOString();
      saveMock(); return b;
    }
  },

  cancel: async (id) => {
    try { return (await api.patch('/api/bookings/' + id + '/cancel')).data; }
    catch {
      const b = mockBookings.find(b => b.id === id);
      if (!b) throw new Error('Booking not found');
      if (b.status === 'CANCELLED' || b.status === 'REJECTED')
        throw new Error('Booking is already ' + b.status.toLowerCase());
      b.status = 'CANCELLED'; b.updatedAt = new Date().toISOString();
      saveMock(); return b;
    }
  },

  // User self-checkin (shows QR + confirm button)
  checkin: async (id, qrCode) => {
    try {
      return (await api.post('/api/bookings/' + id + '/checkin', { qrCode })).data;
    } catch (error) {
      // Mock fallback
      const b = mockBookings.find(b => b.id === id);
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'APPROVED') throw new Error('Only APPROVED bookings can be checked in. Current status: ' + b.status);
      if (b.qrCode && qrCode && b.qrCode !== qrCode) throw new Error('Invalid QR code');
      if (b.checkedIn) throw new Error('Already checked in');
      const now = new Date().toISOString();
      b.checkedIn = true; b.checkedInAt = now; b.updatedAt = now;
      saveMock();
      return { message: 'Check-in successful!', bookingId: id, checkedInAt: now, facility: b.facilityId };
    }
  },

  // Admin check-in by booking ID (after QR lookup)
  checkIn: async (id) => {
    try { return (await api.patch('/api/bookings/' + id + '/checkin')).data; }
    catch (error) { throw new Error(getApiErrorMessage(error, 'Check-in failed')); }
  },

  // Polling: get check-in status + auto-cancel detection
  getCheckinStatus: async (id) => {
    try { return (await api.get('/api/bookings/' + id + '/checkin-status')).data; }
    catch {
      const b = mockBookings.find(b => b.id === id);
      if (!b) return null;
      const today   = new Date().toISOString().split('T')[0];
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      let autoCancelled = false;
      if (b.status === 'APPROVED' && !b.checkedIn && b.date && b.startTime) {
        const [h, m]     = b.startTime.split(':').map(Number);
        const deadlineMins = h * 60 + m + 30;
        if (b.date < today || (b.date === today && nowMins > deadlineMins)) {
          b.status = 'CANCELLED';
          b.adminNotes = 'Auto-cancelled: no check-in within 30 minutes of start time';
          b.autoCancelled = true; b.updatedAt = new Date().toISOString();
          saveMock(); autoCancelled = true;
        }
      }
      const [h, m]     = (b.startTime || '00:00').split(':').map(Number);
      const deadlineSecs = (h * 60 + m + 30) * 60;
      const nowSecs      = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds();
      const secondsUntilDeadline = b.date === today ? Math.max(0, deadlineSecs - nowSecs) : -1;
      return { bookingId: id, status: b.status, checkedIn: b.checkedIn || false,
               checkedInAt: b.checkedInAt || '', autoCancelled, secondsUntilDeadline };
    }
  },

  getFacilityConflicts: async (facilityId, date) => {
    try { return (await api.get('/api/bookings/facility/' + facilityId + '/conflicts', { params: { date } })).data; }
    catch {
      return mockBookings
        .filter(b => (b.facilityId || b.resourceId) === facilityId && b.date === date
                  && (b.status === 'PENDING' || b.status === 'APPROVED'))
        .sort((a, b) => toMins(a.startTime) - toMins(b.startTime));
    }
  },

  clearStoredBookings: async () => { mockBookings = cloneBookings(initialMockBookings); saveMock(); },

  updateStatus: async (id, status) => {
    if (status === 'APPROVED') return bookingService.approve(id, 'Approved by admin');
    if (status === 'REJECTED') return bookingService.reject(id, 'Rejected by admin');
    if (status === 'CANCELLED') return bookingService.cancel(id);
    throw new Error('Unsupported status transition: ' + status);
  },
};

// ── Ticket Service ────────────────────────────────────────────────
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
      const nt = { ...data, id: 't' + Date.now(), status: 'OPEN', assignedTo: null,
        assignedToName: null, createdAt: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 48 * 3600000).toISOString() };
      mockTickets.push(nt); return nt;
    }
  },
  updateStatus: async (id, status) => {
    try { return (await api.patch(`/api/tickets/${id}/status`, { status })).data; }
    catch { const t = mockTickets.find(t => t.id === id); if (t) t.status = status; return t; }
  },
  assign: async (id, techId, techName) => {
    try { return (await api.patch(`/api/tickets/${id}/assign`, { techId })).data; }
    catch { const t = mockTickets.find(t => t.id === id);
      if (t) { t.assignedTo = techId; t.assignedToName = techName; t.status = 'IN_PROGRESS'; } return t; }
  },
};

// ── Notification Service ──────────────────────────────────────────
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

// ── User Service ──────────────────────────────────────────────────
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