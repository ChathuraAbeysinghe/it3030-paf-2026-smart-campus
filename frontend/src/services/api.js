import { api } from '../context/AuthContext';
import { mockBookings as initialMockBookings } from '../mock/bookings';
import { mockResources } from '../mock/resources';
import { mockTickets } from '../mock/tickets';
import { mockUsers, mockTechnicians } from '../mock/users';
import { mockNotifications } from '../mock/notifications';
 
const MOCK_BOOKINGS_STORAGE_KEY = 'smartcampus_mock_bookings';

function cloneBookings(rows) {
  return (Array.isArray(rows) ? rows : []).map(function (booking) { return ({ ...booking }); });
}

function readPersistedMockBookings() {
  if (typeof localStorage === 'undefined') {
    return cloneBookings(initialMockBookings);
  }

  try {
    var raw = localStorage.getItem(MOCK_BOOKINGS_STORAGE_KEY);
    if (!raw) return cloneBookings(initialMockBookings);

    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneBookings(initialMockBookings);

    return cloneBookings(parsed);
  } catch {
    return cloneBookings(initialMockBookings);
  }
}

function persistMockBookings() {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(MOCK_BOOKINGS_STORAGE_KEY, JSON.stringify(mockBookings));
  } catch {
    // Ignore storage failures and keep the in-memory fallback working.
  }
}

// ── Mock bookings fallback with browser persistence ───────────────
let mockBookings = readPersistedMockBookings();
 
// ── Shared helpers ───────────────────────────────────────────────
 
function getApiErrorMessage(error, fallbackMessage) {
  if (error && error.response && error.response.data && error.response.data.error) {
    return error.response.data.error;
  }
  return fallbackMessage;
}
 
function toMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') return 0;
  var parts = timeValue.split(':');
  var hours = Number(parts[0] || 0);
  var minutes = Number(parts[1] || 0);
  return hours * 60 + minutes;
}
 
function hasOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}
 
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('smartcampus_user') || 'null');
  } catch {
    return null;
  }
}
 
function shouldHydrateBookingName(booking) {
  if (!booking) return false;
  var id = booking.facilityId || booking.resourceId;
  if (!id) return false;
  var current = booking.facilityName || booking.resourceName;
  return !current || current === id;
}
 
async function getResourceNameMap() {
  var resources = [];
  try {
    resources = (await api.get('/api/resources')).data || [];
  } catch {
    resources = mockResources;
  }
 
  return resources.reduce(function (acc, resource) {
    if (resource && resource.id && resource.name) {
      acc[resource.id] = resource.name;
    }
    return acc;
  }, {});
}
 
async function hydrateBookingsWithResourceNames(rows) {
  var bookings = Array.isArray(rows) ? rows : [];
  if (bookings.length === 0) return bookings;
 
  var needsHydration = bookings.some(shouldHydrateBookingName);
  if (!needsHydration) return bookings;
 
  var nameMap = await getResourceNameMap();
 
  return bookings.map(function (booking) {
    if (!booking) return booking;
 
    var id = booking.facilityId || booking.resourceId;
    if (!id) return booking;
 
    var resolvedName = nameMap[id];
    if (!resolvedName) return booking;
 
    var next = { ...booking };
    if (!next.facilityName || next.facilityName === id) {
      next.facilityName = resolvedName;
    }
    if (!next.resourceName || next.resourceName === id) {
      next.resourceName = resolvedName;
    }
    if (!next.resourceId && next.facilityId) {
      next.resourceId = next.facilityId;
    }
 
    return next;
  });
}
 
async function hydrateSingleBookingWithResourceName(booking) {
  if (!booking) return booking;
  var rows = await hydrateBookingsWithResourceNames([booking]);
  return rows[0] || booking;
}
 
// ── Resource Service ─────────────────────────────────
export const resourceService = {
  getAll: async function (filters) {
    var safeFilters = filters || {};
    try {
      var response = await api.get('/api/resources', { params: safeFilters });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load resources'));
    }
  },
 
  getById: async function (id) {
    try {
      var response = await api.get('/api/resources/' + id);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to load resource'));
    }
  },
 
  create: async function (data) {
    try {
      var response = await api.post('/api/resources', data);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create resource'));
    }
  },
 
  update: async function (id, data) {
    try {
      var response = await api.put('/api/resources/' + id, data);
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update resource'));
    }
  },
 
  delete: async function (id) {
    try {
      await api.delete('/api/resources/' + id);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete resource'));
    }
  },
 
  updateStatus: async function (id, status) {
    try {
      var response = await api.patch('/api/resources/' + id + '/status', { status: status });
      return response.data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update resource status'));
    }
  }
};
 
// ── Booking Service ────────────────────────────────────
export const bookingService = {
 
  getAll: async (filters) => {
    var safeFilters = filters || {};
    try {
      var rows = (await api.get('/api/bookings', { params: safeFilters })).data;
      return hydrateBookingsWithResourceNames(rows);
    } catch {
      // Browser-persisted fallback used when the API is unavailable.
      var currentUser = getStoredUser();
      let rows = [...mockBookings];
      if (currentUser && currentUser.role !== 'ADMIN') {
        rows = rows.filter(function (b) { return b.userId === currentUser.id; });
      }
      if (safeFilters.status && safeFilters.status !== 'ALL') {
        rows = rows.filter(function (b) { return b.status === safeFilters.status; });
      }
      return hydrateBookingsWithResourceNames(rows);
    }
  },
 
  getById: async (id) => {
    try {
      var booking = (await api.get('/api/bookings/' + id)).data;
      return hydrateSingleBookingWithResourceName(booking);
    } catch {
      var found = mockBookings.find(function (b) { return b.id === id; }) || null;
      return hydrateSingleBookingWithResourceName(found);
    }
  },
 
  getByUser: async (userId) => {
    try {
      var all = await bookingService.getAll();
      return all.filter(function (b) { return b.userId === userId; });
    } catch {
      return mockBookings.filter(function (b) { return b.userId === userId; });
    }
  },
 
  create: async (data) => {
    try {
      var created = (await api.post('/api/bookings', data)).data;
      return hydrateSingleBookingWithResourceName(created);
    } catch (error) {
      var facilityId = data.facilityId || data.resourceId;
      var conflicts = await bookingService.getFacilityConflicts(facilityId, data.date);
      var overlapping = conflicts.filter(function (b) {
        return hasOverlap(data.startTime, data.endTime, b.startTime, b.endTime);
      });
      if (overlapping.length > 0) {
        throw new Error(getApiErrorMessage(error, 'Requested time slot conflicts with an existing booking'));
      }
 
      var currentUser = getStoredUser() || {};
      var resource = mockResources.find(function (r) { return r.id === facilityId; });
      var attendees = Number(data.attendees != null ? data.attendees : data.expectedAttendees);
      var now = new Date().toISOString();
      var nb = {
        id: 'b' + Date.now(),
        facilityId: facilityId,
        facilityName: resource ? resource.name : facilityId,
        resourceId: facilityId,
        resourceName: resource ? resource.name : facilityId,
        userId: currentUser.id || 'u-local',
        userName: currentUser.name || 'Local User',
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        purpose: data.purpose,
        expectedAttendees: attendees,
        status: 'PENDING',
        adminNotes: null,
        qrCode: null,
        checkedIn: false,
        checkedInAt: null,
        createdAt: now,
        updatedAt: now,
      };
      mockBookings.push(nb);
      persistMockBookings();
      return hydrateSingleBookingWithResourceName(nb);
    }
  },
 
  update: async (id, data) => {
    try {
      var updated = (await api.put('/api/bookings/' + id, data)).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch (error) {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Only pending bookings can be updated');
 
      var facilityId = data.facilityId || booking.facilityId || booking.resourceId;
      var conflicts = await bookingService.getFacilityConflicts(facilityId, data.date);
      var overlapping = conflicts.filter(function (b) {
        return b.id !== id && hasOverlap(data.startTime, data.endTime, b.startTime, b.endTime);
      });
      if (overlapping.length > 0) {
        throw new Error(getApiErrorMessage(error, 'Requested time slot conflicts with an existing booking'));
      }
 
      var resource = mockResources.find(function (r) { return r.id === facilityId; });
      var attendees = Number(data.attendees != null ? data.attendees : data.expectedAttendees);
 
      booking.facilityId = facilityId;
      booking.facilityName = resource ? resource.name : facilityId;
      booking.resourceId = facilityId;
      booking.resourceName = resource ? resource.name : facilityId;
      booking.date = data.date;
      booking.startTime = data.startTime;
      booking.endTime = data.endTime;
      booking.purpose = data.purpose;
      booking.expectedAttendees = attendees;
      booking.updatedAt = new Date().toISOString();
 
      persistMockBookings();
      return hydrateSingleBookingWithResourceName(booking);
    }
  },
 
  approve: async (id, adminNotes) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/approve', { adminNotes: adminNotes || '' })).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var b = mockBookings.find(function (b) { return b.id === id; });
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'PENDING') throw new Error('Booking can only be approved while pending');
      b.status = 'APPROVED';
      b.adminNotes = adminNotes || null;
      b.qrCode = b.qrCode || ('QR-' + id.substring(0, 8).toUpperCase() + '-' + new Date().getFullYear());
      b.updatedAt = new Date().toISOString();
      persistMockBookings();
      return hydrateSingleBookingWithResourceName(b);
    }
  },
 
  reject: async (id, reason) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/reject', { adminNotes: reason })).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var b = mockBookings.find(function (b) { return b.id === id; });
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'PENDING') throw new Error('Booking can only be rejected while pending');
      if (!String(reason || '').trim()) throw new Error('Rejection reason is required');
      b.status = 'REJECTED';
      b.adminNotes = String(reason).trim();
      b.updatedAt = new Date().toISOString();
      persistMockBookings();
      return hydrateSingleBookingWithResourceName(b);
    }
  },
 
  cancel: async (id) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/cancel')).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var b = mockBookings.find(function (b) { return b.id === id; });
      if (!b) throw new Error('Booking not found');
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') {
        throw new Error('Booking is already ' + b.status.toLowerCase());
      }
      b.status = 'CANCELLED';
      b.updatedAt = new Date().toISOString();
      persistMockBookings();
      return hydrateSingleBookingWithResourceName(b);
    }
  },
 
  getFacilityConflicts: async (facilityId, date) => {
    try {
      var rows = (await api.get('/api/bookings/facility/' + facilityId + '/conflicts', { params: { date: date } })).data;
      return hydrateBookingsWithResourceNames(rows);
    } catch {
      var rows = mockBookings
        .filter(function (b) {
          var currentFacility = b.facilityId || b.resourceId;
          return currentFacility === facilityId
            && b.date === date
            && (b.status === 'PENDING' || b.status === 'APPROVED');
        })
        .sort(function (a, b) { return toMinutes(a.startTime) - toMinutes(b.startTime); });
 
      return hydrateBookingsWithResourceNames(rows);
    }
  },
 
  /**
   * QR Check-in: POST /api/bookings/{id}/checkin
   * Validates QR code and marks the booking as checked in.
   * Check-in window: startTime - 15min  →  startTime + 15min
   */
  checkin: async (id, qrCode) => {
    try {
      return (await api.post('/api/bookings/' + id + '/checkin', { qrCode: qrCode })).data;
    } catch (error) {
      // Mock fallback for offline development
      var b = mockBookings.find(function (b) { return b.id === id; });
      if (!b) throw new Error('Booking not found');
      if (b.status !== 'APPROVED') {
        throw new Error('Only APPROVED bookings can be checked in. Current status: ' + b.status);
      }
      if (b.qrCode && qrCode && b.qrCode !== qrCode) {
        throw new Error('Invalid QR code');
      }
      if (b.checkedIn) {
        throw new Error('Already checked in');
      }
 
      var now = new Date().toISOString();
      b.checkedIn = true;
      b.checkedInAt = now;
      b.updatedAt = now;
      persistMockBookings();
 
      return {
        message: 'Check-in successful! Enjoy your booking.',
        bookingId: id,
        checkedInAt: now,
        facility: b.facilityId,
      };
    }
  },
 
  /**
   * Get check-in status: GET /api/bookings/{id}/checkin-status
   * Also triggers auto-cancel on backend if window has expired.
   * Returns secondsUntilDeadline for the countdown timer.
   */
  getCheckinStatus: async (id) => {
    try {
      return (await api.get('/api/bookings/' + id + '/checkin-status')).data;
    } catch {
      var b = mockBookings.find(function (b) { return b.id === id; });
      if (!b) return null;
 
      // Mock auto-cancel logic (15-minute window)
      var autoCancelled = false;
      if (b.status === 'APPROVED' && !b.checkedIn && b.date && b.startTime) {
        var today = new Date().toISOString().split('T')[0];
        var nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        var timeParts = b.startTime.split(':').map(Number);
        var deadlineMins = timeParts[0] * 60 + timeParts[1] + 15;
 
        if (b.date < today || (b.date === today && nowMins > deadlineMins)) {
          b.status = 'CANCELLED';
          b.adminNotes = 'Auto-cancelled: no check-in within 15 minutes of start time';
          b.updatedAt = new Date().toISOString();
          persistMockBookings();
          autoCancelled = true;
        }
      }
 
      // Compute seconds until deadline
      var secondsUntilDeadline = -1;
      if (b.status === 'APPROVED' && !b.checkedIn && b.date && b.startTime) {
        var today2 = new Date().toISOString().split('T')[0];
        if (b.date === today2) {
          var nowSecs = new Date().getHours() * 3600 + new Date().getMinutes() * 60 + new Date().getSeconds();
          var p = b.startTime.split(':').map(Number);
          var deadlineSecs = p[0] * 3600 + p[1] * 60 + 15 * 60;
          secondsUntilDeadline = Math.max(0, deadlineSecs - nowSecs);
        }
      }
 
      return {
        bookingId:            id,
        status:               b.status,
        checkedIn:            b.checkedIn || false,
        checkedInAt:          b.checkedInAt || '',
        autoCancelled,
        secondsUntilDeadline,
      };
    }
  },
 
  // Backward-compatible helper for older pages
  updateStatus: async (id, status) => {
    if (status === 'APPROVED') return bookingService.approve(id, 'Approved by admin');
    if (status === 'REJECTED') return bookingService.reject(id, 'Rejected by admin');
    if (status === 'CANCELLED') return bookingService.cancel(id);
    throw new Error('Unsupported status transition: ' + status);
  },
};
 
// ── Ticket Service ───────────────────────────────────
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
 
// ── Notification Service ────────────────────────────
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
 
// ── User Service ─────────────────────────────────────
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