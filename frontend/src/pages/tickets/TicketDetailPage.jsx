import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketService, commentService, timelineService } from '../../services/ticketService';
import { userService } from '../../services/api';
import { categoryLabels, statusLabels } from '../../mock/tickets';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import TicketProgressBar from '../../components/tickets/TicketProgressBar';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import ConversationThread from '../../components/tickets/ConversationThread';
import ActivityTimeline from '../../components/tickets/ActivityTimeline';
import ResolutionConfirmPanel from '../../components/tickets/ResolutionConfirmPanel';
import DisputeModal from '../../components/tickets/DisputeModal';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';

const STATUS_OPTIONS = {
  OPEN: ['IN_PROGRESS', 'ON_HOLD', 'REJECTED'],
  IN_PROGRESS: ['WAITING_USER_CONFIRMATION', 'ON_HOLD', 'REJECTED'],
  ON_HOLD: ['IN_PROGRESS'],
  WAITING_USER_CONFIRMATION: [],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: [],
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const currentUser = user || JSON.parse(localStorage.getItem('smartcampus_user') || '{}');
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTech = currentUser?.role === 'TECHNICIAN';

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [activeSection, setActiveSection] = useState('conversation');
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    loadAll();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'timeline') {
      setActiveSection('timeline');
      return;
    }
    if (tab === 'conversation' || tab === 'chat') {
      setActiveSection('conversation');
    }
  }, [location.search]);

  async function loadAll() {
    setLoading(true);
    try {
      const [t, c, tl, techs] = await Promise.all([
        ticketService.getById(id),
        commentService.getComments(id),
        timelineService.getTimeline(id),
        userService.getTechnicians(),
      ]);
      setTicket(t);
      setComments(c);
      setTimeline(tl);
      setTechnicians(techs);
    } catch { toast.error('Failed to load ticket data'); }
    setLoading(false);
  }

  const userIsCreator = ticket && currentUser?.id === ticket.createdBy;

  async function handleSendComment(message) {
    setSending(true);
    try {
      await commentService.addComment(id, message);
      const c = await commentService.getComments(id);
      setComments(c);
    } catch { toast.error('Failed to send comment'); }
    setSending(false);
  }

  async function handleEditComment(commentId, newMessage) {
    try {
      await commentService.editComment(id, commentId, newMessage);
      const c = await commentService.getComments(id);
      setComments(c);
      toast.success('Comment updated');
    } catch { toast.error('Failed to edit comment'); }
  }

  async function handleDeleteComment(commentId) {
    try {
      await commentService.deleteComment(id, commentId);
      const c = await commentService.getComments(id);
      setComments(c);
      toast.info('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  }

  async function handleStatusChange(newStatus) {
    setActionLoading(true);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'REJECTED' || newStatus === 'ON_HOLD') payload.reason = statusReason;
      if (newStatus === 'WAITING_USER_CONFIRMATION') payload.resolutionNote = resolutionNote;
      await ticketService.updateStatus(id, payload);
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      setShowStatusModal(null);
      setStatusReason('');
      setResolutionNote('');
      await loadAll();
    } catch (e) { toast.error('Failed to update status'); }
    setActionLoading(false);
  }

  async function handleAssign(techId) {
    setActionLoading(true);
    try {
      await ticketService.assign(id, techId);
      toast.success('Technician assigned');
      await loadAll();
    } catch { toast.error('Failed to assign'); }
    setActionLoading(false);
  }

  async function handleConfirm() {
    setActionLoading(true);
    try {
      await ticketService.confirm(id);
      toast.success('Resolution confirmed! Ticket closed.');
      await loadAll();
    } catch { toast.error('Failed to confirm'); }
    setActionLoading(false);
  }

  async function handleDispute(note) {
    setActionLoading(true);
    try {
      await ticketService.dispute(id, note);
      toast.warning('Dispute submitted. Ticket reopened.');
      setShowDispute(false);
      await loadAll();
    } catch { toast.error('Failed to submit dispute'); }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="spinner-overlay" style={{ position: 'relative', minHeight: 400 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="animate-in glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <h2>Ticket not found</h2>
        <button className="btn-primary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Go Back</button>
      </div>
    );
  }

  const nextStatuses = STATUS_OPTIONS[ticket.status] || [];

  return (
    <div className="animate-in">
      <ToastContainer />
      <DisputeModal open={showDispute} onClose={() => setShowDispute(false)} onSubmit={handleDispute} loading={actionLoading} />

      {/* Back + Ticket ID header */}
      <div className="ticket-detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="ticket-detail-id-row">
          <span className="ticket-detail-id">{ticket.ticketId}</span>
          <TicketPriorityBadge priority={ticket.priority} />
          <TicketStatusBadge status={ticket.status} />
          {ticket.reopenCount > 0 && (
            <span className="reopen-badge">🔁 Reopened ×{ticket.reopenCount}</span>
          )}
        </div>
      </div>

      {/* Resolution confirm panel */}
      {userIsCreator && (
        <ResolutionConfirmPanel
          ticket={ticket}
          onConfirm={handleConfirm}
          onDispute={() => setShowDispute(true)}
          loading={actionLoading}
        />
      )}

      {/* Two-column layout */}
      <div className="ticket-detail-grid">
        {/* LEFT: Main content */}
        <div className="ticket-detail-left">
          <h2 className="ticket-detail-title">{ticket.title}</h2>

          <TicketProgressBar status={ticket.status} />

          <div className="glass-card ticket-detail-section">
            <h4>Description</h4>
            <p className="ticket-detail-description">{ticket.description}</p>
          </div>

          {/* Section Tabs */}
          <div className="ticket-section-tabs">
            <button className={`section-tab ${activeSection === 'conversation' ? 'section-tab-active' : ''}`}
              onClick={() => setActiveSection('conversation')}>
              💬 Conversation ({comments.length})
            </button>
            <button className={`section-tab ${activeSection === 'timeline' ? 'section-tab-active' : ''}`}
              onClick={() => setActiveSection('timeline')}>
              📋 Activity ({timeline.length})
            </button>
          </div>

          {activeSection === 'conversation' ? (
            <div className="glass-card ticket-detail-section">
              <ConversationThread
                comments={comments}
                currentUserId={currentUser?.id}
                onSend={handleSendComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                sending={sending}
              />
            </div>
          ) : (
            <div className="glass-card ticket-detail-section">
              <ActivityTimeline events={timeline} />
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar */}
        <div className="ticket-detail-right">
          {/* SLA Countdown */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <div className="glass-card ticket-sidebar-card">
              <h4>SLA Status</h4>
              <SlaCountdown
                slaDeadline={ticket.slaDeadline}
                slaStatus={ticket.slaStatus}
                totalPausedDuration={ticket.totalPausedDuration}
              />
            </div>
          )}

          {/* Ticket Info */}
          <div className="glass-card ticket-sidebar-card">
            <h4>Ticket Info</h4>
            <div className="ticket-info-list">
              <div className="ticket-info-row">
                <span className="info-label">Category</span>
                <span className="info-value">{categoryLabels[ticket.category] || ticket.category}</span>
              </div>
              <div className="ticket-info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{ticket.location}</span>
              </div>
              <div className="ticket-info-row">
                <span className="info-label">Created by</span>
                <span className="info-value">{ticket.createdByName}</span>
              </div>
              <div className="ticket-info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              {ticket.assignedTechnicianName && (
                <div className="ticket-info-row">
                  <span className="info-label">Assigned to</span>
                  <span className="info-value">🔧 {ticket.assignedTechnicianName}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="ticket-info-row">
                  <span className="info-label">Resolved</span>
                  <span className="info-value">{new Date(ticket.resolvedAt).toLocaleString()}</span>
                </div>
              )}
              {ticket.closedAt && (
                <div className="ticket-info-row">
                  <span className="info-label">Closed</span>
                  <span className="info-value">{new Date(ticket.closedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {ticket.tags?.length > 0 && (
            <div className="glass-card ticket-sidebar-card">
              <h4>Tags</h4>
              <div className="ticket-tags">
                {ticket.tags.map((tag, i) => (
                  <span key={i} className="ticket-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {ticket.rejectionReason && (
            <div className="glass-card ticket-sidebar-card sidebar-card-rejected">
              <h4>❌ Rejection Reason</h4>
              <p>{ticket.rejectionReason}</p>
            </div>
          )}

          {/* On Hold reason */}
          {ticket.onHoldReason && ticket.status === 'ON_HOLD' && (
            <div className="glass-card ticket-sidebar-card sidebar-card-hold">
              <h4>⏸ On Hold Reason</h4>
              <p>{ticket.onHoldReason}</p>
            </div>
          )}

          {/* Dispute note */}
          {ticket.disputeNote && (
            <div className="glass-card ticket-sidebar-card sidebar-card-dispute">
              <h4>⚠ Last Dispute Note</h4>
              <p>{ticket.disputeNote}</p>
            </div>
          )}

          {/* Admin Actions */}
          {(isAdmin || isTech) && nextStatuses.length > 0 && (
            <div className="glass-card ticket-sidebar-card">
              <h4>Actions</h4>
              <div className="ticket-action-buttons">
                {nextStatuses.map(s => (
                  <button
                    key={s}
                    className={`ticket-action-btn action-${s.toLowerCase().replace(/_/g, '-')}`}
                    onClick={() => {
                      if (s === 'REJECTED' || s === 'ON_HOLD' || s === 'WAITING_USER_CONFIRMATION') {
                        setShowStatusModal(s);
                      } else {
                        handleStatusChange(s);
                      }
                    }}
                    disabled={actionLoading}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assign Technician (Admin) */}
          {isAdmin && !ticket.assignedTechnician && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <div className="glass-card ticket-sidebar-card">
              <h4>Assign Technician</h4>
              <div className="tech-assign-list">
                {technicians.filter(t => t.active !== false).map(tech => (
                  <button key={tech.id} className="tech-assign-btn" onClick={() => handleAssign(tech.id)}
                    disabled={actionLoading}>
                    <div>
                      <strong>{tech.name}</strong>
                      <span className="tech-spec">{tech.specialization || 'Support Technician'}</span>
                    </div>
                    <span className="tech-workload">{tech.assignedTickets || 0} tickets</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status change modal (for REJECTED/ON_HOLD/WAITING) */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(null)}>
          <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="dispute-modal-header">
              <h3>
                {showStatusModal === 'REJECTED' ? '❌ Reject Ticket' :
                 showStatusModal === 'ON_HOLD' ? '⏸ Put On Hold' :
                 '✅ Mark as Resolved'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowStatusModal(null)}>×</button>
            </div>
            <div className="dispute-modal-body">
              {(showStatusModal === 'REJECTED' || showStatusModal === 'ON_HOLD') && (
                <div className="form-group">
                  <label>{showStatusModal === 'REJECTED' ? 'Rejection Reason *' : 'On Hold Reason *'}</label>
                  <textarea className="dispute-textarea" rows={3} value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder={showStatusModal === 'REJECTED' ? 'Why is this ticket being rejected?' : 'Why is this being put on hold?'} />
                </div>
              )}
              {showStatusModal === 'WAITING_USER_CONFIRMATION' && (
                <div className="form-group">
                  <label>Resolution Note</label>
                  <textarea className="dispute-textarea" rows={3} value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe what was done to resolve this issue..." />
                </div>
              )}
            </div>
            <div className="dispute-modal-footer">
              <button className="btn-secondary" onClick={() => setShowStatusModal(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={() => handleStatusChange(showStatusModal)}
                disabled={actionLoading || ((showStatusModal === 'REJECTED' || showStatusModal === 'ON_HOLD') && !statusReason.trim())}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
