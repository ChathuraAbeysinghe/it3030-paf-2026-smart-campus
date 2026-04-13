/**
 * Service Layer — API abstraction with persistent mock data fallback.
 * Mock bookings now persist to localStorage so data survives logout/login.
 */
import { api } from '../context/AuthContext';
import { mockBookings as initialMockBookings } from '../mock/bookings';
import { mockResources } from '../mock/resources';
import { mockTickets } from '../mock/tickets';
import { mockUsers, mockTechnicians } from '../mock/users';
import { mockNotifications } from '../mock/notifications';

// ── localStorage Persistence ──────────────────────────────
function loadStoredBookings() {
  try {
    const stored = localStorage.getItem('smartcampus_bookings');
    return stored ? JSON.parse(stored) : [...initialMockBookings];
  } catch {
    return [...initialMockBookings];
  }
}

function saveBookingsToStorage(bookings) {
  try {
    localStorage.setItem('smartcampus_bookings', JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings to localStorage:', e);
  }
}

// Initialize mockBookings from localStorage on app start
let mockBookings = loadStoredBookings();

// ────────────────────────────────────────────────────────

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

// Resource Service
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

// ── Booking Service with Persistent Storage ──────────────
export const bookingService = {
  getAll: async (filters) => {
    var safeFilters = filters || {};
    try {
      var rows = (await api.get('/api/bookings', { params: safeFilters })).data;
      return hydrateBookingsWithResourceNames(rows);
    } catch {
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
      var booking = mockBookings.find(function (b) { return b.id === id; }) || null;
      return hydrateSingleBookingWithResourceName(booking);
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
        createdAt: now,
        updatedAt: now,
      };
      mockBookings.push(nb);
      saveBookingsToStorage(mockBookings); // ← PERSIST TO STORAGE
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
      
      saveBookingsToStorage(mockBookings); // ← PERSIST TO STORAGE
      return hydrateSingleBookingWithResourceName(booking);
    }
  },

  approve: async (id, adminNotes) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/approve', { adminNotes: adminNotes || '' })).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Booking can only be approved while pending');
      booking.status = 'APPROVED';
      booking.adminNotes = adminNotes || null;
      booking.qrCode = booking.qrCode || ('QR-' + id);
      booking.updatedAt = new Date().toISOString();
      
      saveBookingsToStorage(mockBookings); // ← PERSIST TO STORAGE
      return hydrateSingleBookingWithResourceName(booking);
    }
  },

  reject: async (id, reason) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/reject', { adminNotes: reason })).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Booking can only be rejected while pending');
      if (!reason || !String(reason).trim()) throw new Error('Rejection reason is required');
      booking.status = 'REJECTED';
      booking.adminNotes = String(reason).trim();
      booking.updatedAt = new Date().toISOString();
      
      saveBookingsToStorage(mockBookings); // ← PERSIST TO STORAGE
      return hydrateSingleBookingWithResourceName(booking);
    }
  },

  cancel: async (id) => {
    try {
      var updated = (await api.patch('/api/bookings/' + id + '/cancel')).data;
      return hydrateSingleBookingWithResourceName(updated);
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status === 'CANCELLED' || booking.status === 'REJECTED') {
        throw new Error('Booking is already ' + booking.status.toLowerCase());
      }
      booking.status = 'CANCELLED';
      booking.updatedAt = new Date().toISOString();
      
      saveBookingsToStorage(mockBookings); // ← PERSIST TO STORAGE
      return hydrateSingleBookingWithResourceName(booking);
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

  // Helper to manually clear all stored bookings (for testing/reset)
  clearStoredBookings: async () => {
    mockBookings = [...initialMockBookings];
    saveBookingsToStorage(mockBookings);
  },

  // Backward compatible helper for older pages
  updateStatus: async (id, status) => {
    if (status === 'APPROVED') return bookingService.approve(id, 'Approved by admin');
    if (status === 'REJECTED') return bookingService.reject(id, 'Rejected by admin');
    if (status === 'CANCELLED') return bookingService.cancel(id);
    throw new Error('Unsupported status transition: ' + status);
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

/**
 * Service Layer — API abstraction with mock data fallback.
 * Each service tries the real backend API first; if it fails, returns mock data.
 */
/*
import { api } from '../context/AuthContext';
import { mockBookings } from '../mock/bookings';
import { mockResources } from '../mock/resources';
import { mockTickets } from '../mock/tickets';
import { mockUsers, mockTechnicians } from '../mock/users';
import { mockNotifications } from '../mock/notifications';

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

// Resource Service
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
  }
};
// ── Booking Service ──────────────────────────────────────
export const bookingService = {
  getAll: async (filters) => {
    var safeFilters = filters || {};
    try {
      return (await api.get('/api/bookings', { params: safeFilters })).data;
    } catch {
      var currentUser = getStoredUser();
      var rows = [...mockBookings];

      if (currentUser && currentUser.role !== 'ADMIN') {
        rows = rows.filter(function (b) { return b.userId === currentUser.id; });
      }
      if (safeFilters.status && safeFilters.status !== 'ALL') {
        rows = rows.filter(function (b) { return b.status === safeFilters.status; });
      }
      return rows;
    }
  },

  getById: async (id) => {
    try {
      return (await api.get('/api/bookings/' + id)).data;
    } catch {
      return mockBookings.find(function (b) { return b.id === id; }) || null;
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
      return (await api.post('/api/bookings', data)).data;
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
        createdAt: now,
        updatedAt: now,
      };
      mockBookings.push(nb);
      return nb;
    }
  },

  update: async (id, data) => {
    try {
      return (await api.put('/api/bookings/' + id, data)).data;
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
      return booking;
    }
  },

  approve: async (id, adminNotes) => {
    try {
      return (await api.patch('/api/bookings/' + id + '/approve', { adminNotes: adminNotes || '' })).data;
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Booking can only be approved while pending');
      booking.status = 'APPROVED';
      booking.adminNotes = adminNotes || null;
      booking.qrCode = booking.qrCode || ('QR-' + id);
      booking.updatedAt = new Date().toISOString();
      return booking;
    }
  },

  reject: async (id, reason) => {
    try {
      return (await api.patch('/api/bookings/' + id + '/reject', { adminNotes: reason })).data;
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'PENDING') throw new Error('Booking can only be rejected while pending');
      if (!reason || !String(reason).trim()) throw new Error('Rejection reason is required');
      booking.status = 'REJECTED';
      booking.adminNotes = String(reason).trim();
      booking.updatedAt = new Date().toISOString();
      return booking;
    }
  },

  cancel: async (id) => {
    try {
      return (await api.patch('/api/bookings/' + id + '/cancel')).data;
    } catch {
      var booking = mockBookings.find(function (b) { return b.id === id; });
      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'APPROVED') throw new Error('Only approved bookings can be cancelled');
      booking.status = 'CANCELLED';
      booking.updatedAt = new Date().toISOString();
      return booking;
    }
  },

  getFacilityConflicts: async (facilityId, date) => {
    try {
      return (await api.get('/api/bookings/facility/' + facilityId + '/conflicts', { params: { date: date } })).data;
    } catch {
      return mockBookings
        .filter(function (b) {
          var currentFacility = b.facilityId || b.resourceId;
          return currentFacility === facilityId
            && b.date === date
            && (b.status === 'PENDING' || b.status === 'APPROVED');
        })
        .sort(function (a, b) { return toMinutes(a.startTime) - toMinutes(b.startTime); });
    }
  },

  // Backward compatible helper for older pages
  updateStatus: async (id, status) => {
    if (status === 'APPROVED') return bookingService.approve(id, 'Approved by admin');
    if (status === 'REJECTED') return bookingService.reject(id, 'Rejected by admin');
    if (status === 'CANCELLED') return bookingService.cancel(id);
    throw new Error('Unsupported status transition: ' + status);
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
*/