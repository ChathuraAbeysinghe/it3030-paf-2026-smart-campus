/**
 * Ticket Service — API abstraction with mock data fallback.
 * Comprehensive ticket lifecycle management.
 */
import { api } from '../context/AuthContext';
import { mockTickets, mockComments, mockTimeline } from '../mock/tickets';
import { mockTechnicians } from '../mock/users';

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('smartcampus_user') || 'null'); }
  catch { return null; }
}

// ── SLA helpers ──
function getSlaHours(priority) {
  const map = { CRITICAL: 2, HIGH: 4, MEDIUM: 12, LOW: 24 };
  return map[priority] || 24;
}

function computeSlaStatus(ticket) {
  if (ticket.status === 'ON_HOLD') return 'PAUSED';
  if (ticket.status === 'CLOSED' || ticket.status === 'REJECTED') return ticket.slaStatus || 'WITHIN_SLA';
  if (!ticket.slaDeadline) return 'WITHIN_SLA';
  const now = Date.now();
  const deadline = new Date(ticket.slaDeadline).getTime();
  const created = new Date(ticket.createdAt).getTime();
  const total = deadline - created;
  if (total <= 0) return 'BREACHED';
  const elapsed = (now - created) - (ticket.totalPausedDuration || 0) * 1000;
  if (elapsed >= total) return 'BREACHED';
  if (elapsed / total >= 0.75) return 'AT_RISK';
  return 'WITHIN_SLA';
}

// ── Ticket Service ──
export const ticketService = {
  getAll: async (filters) => {
    try { return (await api.get('/api/tickets', { params: filters })).data; }
    catch { return [...mockTickets].map(t => ({ ...t, slaStatus: computeSlaStatus(t) })); }
  },

  getMyTickets: async () => {
    try { return (await api.get('/api/tickets/my')).data; }
    catch {
      const user = getStoredUser();
      return mockTickets
        .filter(t => t.createdBy === (user?.id || 'u1'))
        .map(t => ({ ...t, slaStatus: computeSlaStatus(t) }));
    }
  },

  getById: async (id) => {
    try { return (await api.get(`/api/tickets/${id}`)).data; }
    catch {
      const t = mockTickets.find(t => t.id === id || t.ticketId === id);
      return t ? { ...t, slaStatus: computeSlaStatus(t) } : null;
    }
  },

  getAssigned: async (techId) => {
    try { return (await api.get('/api/tickets/assigned')).data; }
    catch {
      const user = getStoredUser();
      const tid = techId || user?.id;
      return mockTickets
        .filter(t => t.assignedTechnician === tid)
        .map(t => ({ ...t, slaStatus: computeSlaStatus(t) }));
    }
  },

  getUnassigned: async () => {
    try { return (await api.get('/api/tickets/unassigned')).data; }
    catch {
      return mockTickets
        .filter(t => !t.assignedTechnician && t.status !== 'CLOSED' && t.status !== 'REJECTED')
        .map(t => ({ ...t, slaStatus: computeSlaStatus(t) }));
    }
  },

  create: async (data) => {
    try { return (await api.post('/api/tickets', data)).data; }
    catch {
      const user = getStoredUser() || {};
      const now = new Date().toISOString();
      const count = mockTickets.length + 1;
      const slaDeadline = new Date(Date.now() + getSlaHours(data.priority) * 3600000).toISOString();
      const nt = {
        id: 't' + Date.now(),
        ticketId: `T-${String(count).padStart(3, '0')}`,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'MEDIUM',
        status: 'OPEN',
        location: data.location,
        resourceId: data.resourceId || null,
        createdBy: user.id || 'u1',
        createdByName: user.name || 'Current User',
        assignedTechnician: null,
        assignedTechnicianName: null,
        attachments: [],
        resolutionAttachments: [],
        slaDeadline,
        slaStatus: 'WITHIN_SLA',
        totalPausedDuration: 0,
        rejectionReason: null,
        onHoldReason: null,
        resolutionNote: null,
        disputeNote: null,
        userConfirmedAt: null,
        resolvedAt: null,
        closedAt: null,
        tags: data.tags || [],
        viewedByAdmin: false,
        reopenCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      mockTickets.unshift(nt);
      return nt;
    }
  },

  updateStatus: async (id, statusData) => {
    try { return (await api.put(`/api/tickets/${id}/status`, statusData)).data; }
    catch {
      const t = mockTickets.find(t => t.id === id);
      if (!t) return null;
      const oldStatus = t.status;
      t.status = statusData.status;
      t.updatedAt = new Date().toISOString();
      if (statusData.reason) {
        if (statusData.status === 'REJECTED') t.rejectionReason = statusData.reason;
        if (statusData.status === 'ON_HOLD') { t.onHoldReason = statusData.reason; t.slaStatus = 'PAUSED'; }
      }
      if (statusData.resolutionNote) t.resolutionNote = statusData.resolutionNote;
      if (statusData.status === 'WAITING_USER_CONFIRMATION') t.resolvedAt = new Date().toISOString();
      if (statusData.status === 'CLOSED') t.closedAt = new Date().toISOString();
      if (oldStatus === 'ON_HOLD' && statusData.status === 'IN_PROGRESS') t.slaStatus = computeSlaStatus(t);
      t.slaStatus = computeSlaStatus(t);
      return { ...t };
    }
  },

  assign: async (id, techId) => {
    try { return (await api.post(`/api/tickets/${id}/assign`, { technicianId: techId })).data; }
    catch {
      const t = mockTickets.find(t => t.id === id);
      if (!t) return null;
      const tech = mockTechnicians.find(tc => tc.id === techId);
      t.assignedTechnician = techId;
      t.assignedTechnicianName = tech?.name || techId;
      if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
      t.updatedAt = new Date().toISOString();
      return { ...t };
    }
  },

  confirm: async (id) => {
    try { return (await api.post(`/api/tickets/${id}/confirm`)).data; }
    catch {
      const t = mockTickets.find(t => t.id === id);
      if (!t) return null;
      t.status = 'CLOSED';
      t.userConfirmedAt = new Date().toISOString();
      t.closedAt = new Date().toISOString();
      t.updatedAt = new Date().toISOString();
      return { ...t };
    }
  },

  dispute: async (id, disputeNote) => {
    try { return (await api.post(`/api/tickets/${id}/dispute`, { disputeNote })).data; }
    catch {
      const t = mockTickets.find(t => t.id === id);
      if (!t) return null;
      t.status = 'IN_PROGRESS';
      t.disputeNote = disputeNote;
      t.reopenCount = (t.reopenCount || 0) + 1;
      t.resolvedAt = null;
      t.updatedAt = new Date().toISOString();
      return { ...t };
    }
  },

  getStats: async () => {
    try { return (await api.get('/api/tickets/stats')).data; }
    catch {
      const all = mockTickets;
      return {
        open: all.filter(t => t.status === 'OPEN').length,
        inProgress: all.filter(t => t.status === 'IN_PROGRESS').length,
        waitingConfirmation: all.filter(t => t.status === 'WAITING_USER_CONFIRMATION').length,
        onHold: all.filter(t => t.status === 'ON_HOLD').length,
        slaBreached: all.filter(t => computeSlaStatus(t) === 'BREACHED').length,
        resolvedToday: all.filter(t => t.resolvedAt && new Date(t.resolvedAt).toDateString() === new Date().toDateString()).length,
        closedTotal: all.filter(t => t.status === 'CLOSED').length,
        totalTickets: all.length,
      };
    }
  },

  getSlaBreached: async () => {
    try { return (await api.get('/api/tickets/sla-breached')).data; }
    catch { return mockTickets.filter(t => computeSlaStatus(t) === 'BREACHED'); }
  },
};

// ── Comment Service ──
export const commentService = {
  getComments: async (ticketId) => {
    try { return (await api.get(`/api/tickets/${ticketId}/comments`)).data; }
    catch { return mockComments[ticketId] || []; }
  },

  addComment: async (ticketId, message, messageType = 'TEXT') => {
    try { return (await api.post(`/api/tickets/${ticketId}/comments`, { message, messageType })).data; }
    catch {
      const user = getStoredUser() || {};
      const comment = {
        id: 'c' + Date.now(),
        ticketId,
        senderId: user.id || 'u1',
        senderName: user.name || 'Current User',
        senderRole: user.role || 'USER',
        message,
        messageType,
        isEdited: false,
        isDeleted: false,
        timestamp: new Date().toISOString(),
      };
      if (!mockComments[ticketId]) mockComments[ticketId] = [];
      mockComments[ticketId].push(comment);
      return comment;
    }
  },

  editComment: async (ticketId, commentId, message) => {
    try { return (await api.put(`/api/tickets/${ticketId}/comments/${commentId}`, { message })).data; }
    catch {
      const comments = mockComments[ticketId] || [];
      const c = comments.find(c => c.id === commentId);
      if (c) { c.message = message; c.isEdited = true; c.editedAt = new Date().toISOString(); }
      return c;
    }
  },

  deleteComment: async (ticketId, commentId) => {
    try { await api.delete(`/api/tickets/${ticketId}/comments/${commentId}`); }
    catch {
      const comments = mockComments[ticketId] || [];
      const c = comments.find(c => c.id === commentId);
      if (c) { c.isDeleted = true; c.message = '[This message has been deleted]'; }
    }
  },
};

// ── Timeline Service ──
export const timelineService = {
  getTimeline: async (ticketId) => {
    try { return (await api.get(`/api/tickets/${ticketId}/timeline`)).data; }
    catch { return mockTimeline[ticketId] || []; }
  },
};
