import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, commentService, timelineService } from '../../services/ticketService';
import { userService } from '../../services/api';
import { categoryLabels, statusLabels } from '../../mock/tickets';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import TicketProgressBar from '../../components/tickets/TicketProgressBar';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import ActivityTimeline from '../../components/tickets/ActivityTimeline';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';

/* ── State machine: what actions admin can take per status ── */
const ADMIN_ACTIONS = {
  OPEN:                       ['ASSIGN', 'REJECT'],
  IN_PROGRESS:                ['RESOLVE', 'HOLD', 'REJECT'],
  ON_HOLD:                    ['RESUME'],
  WAITING_USER_CONFIRMATION:  ['CLOSE'],
  RESOLVED:                   ['CLOSE'],
  CLOSED:                     [],
  REJECTED:                   [],
};

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket]           = useState(null);
  const [comments, setComments]       = useState([]);
  const [timeline, setTimeline]       = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* action modals */
  const [showAssign, setShowAssign]         = useState(false);
  const [showResolve, setShowResolve]       = useState(false);
  const [showReject, setShowReject]         = useState(false);
  const [showHold, setShowHold]             = useState(false);

  /* form state */
  const [selectedTech, setSelectedTech]     = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [rejectReason, setRejectReason]     = useState('');
  const [holdReason, setHoldReason]         = useState('');

  /* chat */
  const [chatMsg, setChatMsg]           = useState('');
  const [activeTab, setActiveTab]       = useState('chat');
  const messagesEndRef                  = useRef(null);

  useEffect(() => { loadAll(); }, [id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments.length]);

  async function loadAll() {
    setLoading(true);
    try {
      const techs = await userService.getTechnicians();
      setTechnicians(techs);

      const [t, c, tl] = await Promise.all([
        ticketService.getById(id),
        commentService.getComments(id),
        timelineService.getTimeline(id),
      ]);
      setTicket(t);
      setComments(c);
      setTimeline(tl);
    } catch { toast.error('Failed to load ticket'); }
    setLoading(false);
  }

  /* ── Actions ── */
  async function handleAssign() {
    if (!selectedTech) { toast.warning('Please select a technician'); return; }
    setActionLoading(true);
    try {
      await ticketService.assign(id, selectedTech);
      const tech = technicians.find(t => t.id === selectedTech);
      toast.success(`Assigned to ${tech?.name}`);
      setShowAssign(false);
      setSelectedTech('');
      await loadAll();
    } catch { toast.error('Assignment failed'); }
    setActionLoading(false);
  }

  async function handleResolve() {
    setActionLoading(true);
    try {
      await ticketService.updateStatus(id, {
        status: 'WAITING_USER_CONFIRMATION',
        resolutionNote: resolutionNote.trim() || 'Issue has been resolved.',
      });
      toast.success('Ticket sent for user confirmation');
      setShowResolve(false);
      setResolutionNote('');
      await loadAll();
    } catch { toast.error('Failed to resolve'); }
    setActionLoading(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.warning('Rejection reason is required'); return; }
    setActionLoading(true);
    try {
      await ticketService.updateStatus(id, { status: 'REJECTED', reason: rejectReason.trim() });
      toast.info('Ticket rejected');
      setShowReject(false);
      setRejectReason('');
      await loadAll();
    } catch { toast.error('Failed to reject'); }
    setActionLoading(false);
  }

  async function handleHold() {
    if (!holdReason.trim()) { toast.warning('On-hold reason is required'); return; }
    setActionLoading(true);
    try {
      await ticketService.updateStatus(id, { status: 'ON_HOLD', reason: holdReason.trim() });
      toast.info('Ticket put on hold — SLA paused');
      setShowHold(false);
      setHoldReason('');
      await loadAll();
    } catch { toast.error('Failed to hold'); }
    setActionLoading(false);
  }

  async function handleResume() {
    setActionLoading(true);
    try {
      await ticketService.updateStatus(id, { status: 'IN_PROGRESS' });
      toast.success('Ticket resumed');
      await loadAll();
    } catch { toast.error('Failed to resume'); }
    setActionLoading(false);
  }

  async function handleClose() {
    setActionLoading(true);
    try {
      await ticketService.updateStatus(id, { status: 'CLOSED' });
      toast.success('Ticket closed');
      await loadAll();
    } catch { toast.error('Failed to close'); }
    setActionLoading(false);
  }

  async function handleSendMessage() {
    if (!chatMsg.trim()) return;
    setSending(true);
    try {
      await commentService.addComment(id, chatMsg.trim());
      setChatMsg('');
      const c = await commentService.getComments(id);
      setComments(c);
    } catch { toast.error('Failed to send'); }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  /* ── Helpers ── */
  const roleStyle = {
    USER:       { color: '#818CF8', bg: 'rgba(129,140,248,0.15)' },
    ADMIN:      { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
    TECHNICIAN: { color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    SYSTEM:     { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  };

  function formatMsgTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = Date.now() - d;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
  }

  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="animate-in glass-card" style={{ padding:40, textAlign:'center' }}>
        <h2>Ticket not found</h2>
        <button className="btn-primary" onClick={() => navigate('/admin/tickets')} style={{ marginTop:16 }}>← Back to tickets</button>
      </div>
    );
  }

  const availableActions = ADMIN_ACTIONS[ticket.status] || [];
  const unassigned = !ticket.assignedTechnician;

  return (
    <div className="animate-in">
      <ToastContainer />

      {/* ── Header ── */}
      <div className="atd-header">
        <button className="btn-back" onClick={() => navigate('/admin/tickets')}>← Manage Tickets</button>
        <div className="atd-header-main">
          <div className="atd-id-row">
            <span className="ticket-detail-id">{ticket.ticketId}</span>
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketStatusBadge status={ticket.status} />
            {ticket.reopenCount > 0 && (
              <span className="reopen-badge">🔁 Reopened ×{ticket.reopenCount}</span>
            )}
            {!ticket.viewedByAdmin && (
              <span className="new-badge">🆕 New</span>
            )}
          </div>
          <h2 className="atd-title">{ticket.title}</h2>
          <div className="atd-meta-row">
            <span>📍 {ticket.location}</span>
            <span>📂 {categoryLabels[ticket.category]}</span>
            <span>👤 {ticket.createdByName}</span>
            <span>🕐 {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="glass-card atd-section">
        <TicketProgressBar status={ticket.status} />
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="atd-grid">

        {/* LEFT — Chat + Timeline */}
        <div className="atd-left">

          {/* Tab switcher */}
          <div className="ticket-section-tabs" style={{ marginBottom:12 }}>
            <button className={`section-tab ${activeTab==='chat' ? 'section-tab-active' : ''}`}
              onClick={() => setActiveTab('chat')}>
              💬 Conversation ({comments.length})
            </button>
            <button className={`section-tab ${activeTab==='timeline' ? 'section-tab-active' : ''}`}
              onClick={() => setActiveTab('timeline')}>
              📋 Activity Log ({timeline.length})
            </button>
          </div>

          {activeTab === 'chat' ? (
            <div className="glass-card atd-section atd-chat-box">
              {/* Messages */}
              <div className="atd-messages">
                {comments.length === 0 && (
                  <div className="atd-empty-chat">💬 No messages yet. Start the conversation below.</div>
                )}
                {comments.map(c => {
                  if (c.messageType === 'SYSTEM') return (
                    <div key={c.id} className="msg-system">
                      <div className="msg-system-line" />
                      <span className="msg-system-text">{c.message}</span>
                      <div className="msg-system-line" />
                    </div>
                  );
                  if (c.messageType === 'RESOLUTION_NOTE') return (
                    <div key={c.id} className="msg-resolution">
                      <div className="msg-resolution-label">✓ Resolution Note</div>
                      <div className="msg-resolution-sender">{c.senderName} · {formatMsgTime(c.timestamp)}</div>
                      <div className="msg-resolution-text">{c.message}</div>
                    </div>
                  );
                  if (c.messageType === 'DISPUTE_NOTE') return (
                    <div key={c.id} className="msg-dispute">
                      <div className="msg-dispute-label">⚠ User Disputed Resolution</div>
                      <div className="msg-dispute-sender">{c.senderName} · {formatMsgTime(c.timestamp)}</div>
                      <div className="msg-dispute-text">{c.message}</div>
                    </div>
                  );

                  const isAdmin = c.senderRole === 'ADMIN';
                  const rs = roleStyle[c.senderRole] || roleStyle.USER;

                  return (
                    <div key={c.id} className={`atd-bubble-wrap ${isAdmin ? 'atd-bubble-right' : 'atd-bubble-left'}`}>
                      {!isAdmin && (
                        <div className="atd-bubble-meta">
                          <strong style={{ color: rs.color }}>{c.senderName}</strong>
                          <span className="msg-role-badge" style={{ color: rs.color, background: rs.bg }}>
                            {c.senderRole}
                          </span>
                        </div>
                      )}
                      <div className={`atd-bubble ${isAdmin ? 'atd-bubble-admin' : 'atd-bubble-user'}`}>
                        {c.isDeleted
                          ? <em style={{ opacity:0.5 }}>{c.message}</em>
                          : c.message}
                        <span className="atd-bubble-time">{formatMsgTime(c.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="atd-chat-input-row">
                <textarea
                  className="thread-input"
                  placeholder="Reply to student or technician... (Enter to send)"
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button className="thread-send-btn" onClick={handleSendMessage} disabled={!chatMsg.trim() || sending}>
                  {sending ? '…' : '➤'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card atd-section">
              <ActivityTimeline events={timeline} />
            </div>
          )}

          {/* Description */}
          <div className="glass-card atd-section">
            <h4 className="atd-section-label">Issue Description</h4>
            <p className="ticket-detail-description">{ticket.description}</p>
            {ticket.tags?.length > 0 && (
              <div className="ticket-tags" style={{ marginTop:12 }}>
                {ticket.tags.map((t,i) => <span key={i} className="ticket-tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Actions sidebar */}
        <div className="atd-right">

          {/* SLA */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <div className="glass-card atd-sidebar-card">
              <h4 className="atd-section-label">⏱ SLA Status</h4>
              <SlaCountdown
                slaDeadline={ticket.slaDeadline}
                slaStatus={ticket.slaStatus}
                totalPausedDuration={ticket.totalPausedDuration}
              />
            </div>
          )}

          {/* Admin Quick Actions */}
          {availableActions.length > 0 && (
            <div className="glass-card atd-sidebar-card">
              <h4 className="atd-section-label">Admin Actions</h4>
              <div className="atd-action-list">
                {availableActions.includes('ASSIGN') && (
                  <button className="atd-action-btn atd-action-assign" onClick={() => setShowAssign(true)}>
                    🔧 {unassigned ? 'Assign Technician' : 'Reassign Technician'}
                  </button>
                )}
                {availableActions.includes('RESOLVE') && (
                  <button className="atd-action-btn atd-action-resolve" onClick={() => setShowResolve(true)}>
                    ✅ Mark as Resolved
                  </button>
                )}
                {availableActions.includes('HOLD') && (
                  <button className="atd-action-btn atd-action-hold" onClick={() => setShowHold(true)}>
                    ⏸ Put On Hold
                  </button>
                )}
                {availableActions.includes('RESUME') && (
                  <button className="atd-action-btn atd-action-resume" onClick={handleResume} disabled={actionLoading}>
                    ▶ Resume Ticket
                  </button>
                )}
                {availableActions.includes('CLOSE') && (
                  <button className="atd-action-btn atd-action-close" onClick={handleClose} disabled={actionLoading}>
                    ✓ Close Ticket
                  </button>
                )}
                {availableActions.includes('REJECT') && (
                  <button className="atd-action-btn atd-action-reject" onClick={() => setShowReject(true)}>
                    ✗ Reject Ticket
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Assigned Technician */}
          <div className="glass-card atd-sidebar-card">
            <h4 className="atd-section-label">Assigned Technician</h4>
            {ticket.assignedTechnicianName ? (
              <div className="atd-tech-info">
                <div className="atd-tech-avatar">
                  {ticket.assignedTechnicianName.charAt(0)}
                </div>
                <div>
                  <div className="atd-tech-name">{ticket.assignedTechnicianName}</div>
                  <div className="atd-tech-role">Technician</div>
                </div>
              </div>
            ) : (
              <div style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>
                No technician assigned yet
              </div>
            )}
          </div>

          {/* Ticket Info */}
          <div className="glass-card atd-sidebar-card">
            <h4 className="atd-section-label">Ticket Info</h4>
            <div className="ticket-info-list">
              {[
                { label: 'Submitted By', value: ticket.createdByName },
                { label: 'Category',     value: categoryLabels[ticket.category] },
                { label: 'Location',     value: ticket.location },
                { label: 'Created',      value: new Date(ticket.createdAt).toLocaleString() },
                ticket.resolvedAt && { label: 'Resolved',    value: new Date(ticket.resolvedAt).toLocaleString() },
                ticket.closedAt   && { label: 'Closed',      value: new Date(ticket.closedAt).toLocaleString() },
              ].filter(Boolean).map((row, i) => (
                <div key={i} className="ticket-info-row">
                  <span className="info-label">{row.label}</span>
                  <span className="info-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special notes */}
          {ticket.onHoldReason && ticket.status === 'ON_HOLD' && (
            <div className="glass-card atd-sidebar-card sidebar-card-hold">
              <h4 className="atd-section-label">⏸ On Hold Reason</h4>
              <p style={{ fontSize:'0.85rem', color:'var(--text)' }}>{ticket.onHoldReason}</p>
            </div>
          )}
          {ticket.rejectionReason && (
            <div className="glass-card atd-sidebar-card sidebar-card-rejected">
              <h4 className="atd-section-label">❌ Rejection Reason</h4>
              <p style={{ fontSize:'0.85rem', color:'var(--text)' }}>{ticket.rejectionReason}</p>
            </div>
          )}
          {ticket.resolutionNote && (
            <div className="glass-card atd-sidebar-card" style={{ borderLeft:'3px solid #10B981' }}>
              <h4 className="atd-section-label">✅ Resolution Note</h4>
              <p style={{ fontSize:'0.85rem', color:'var(--text)' }}>{ticket.resolutionNote}</p>
            </div>
          )}
          {ticket.disputeNote && (
            <div className="glass-card atd-sidebar-card sidebar-card-dispute">
              <h4 className="atd-section-label">⚠ Dispute Note</h4>
              <p style={{ fontSize:'0.85rem', color:'var(--text)' }}>{ticket.disputeNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ ACTION MODALS ════════════════ */}

      {/* Assign Modal */}
      {showAssign && (
        <div className="modal-overlay" onClick={() => setShowAssign(false)}>
          <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="dispute-modal-header">
              <h3>🔧 Assign Technician</h3>
              <button className="modal-close-btn" onClick={() => setShowAssign(false)}>×</button>
            </div>
            <div className="dispute-modal-body">
              <div className="atd-tech-grid">
                {technicians.filter(t => t.active).map(tech => (
                  <div
                    key={tech.id}
                    className={`atd-tech-card ${selectedTech === tech.id ? 'atd-tech-selected' : ''}`}
                    onClick={() => setSelectedTech(tech.id)}
                  >
                    <div className="atd-tech-avatar-sm">{tech.name.charAt(0)}</div>
                    <div className="atd-tech-card-info">
                      <strong>{tech.name}</strong>
                      <span>{tech.role}</span>
                      <span className="atd-workload">{tech.assignedTickets || 0} active tickets</span>
                    </div>
                    {selectedTech === tech.id && <span className="atd-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="dispute-modal-footer">
              <button className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAssign} disabled={!selectedTech || actionLoading}>
                {actionLoading ? 'Assigning…' : '✓ Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && (
        <div className="modal-overlay" onClick={() => setShowResolve(false)}>
          <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="dispute-modal-header">
              <h3>✅ Mark as Resolved</h3>
              <button className="modal-close-btn" onClick={() => setShowResolve(false)}>×</button>
            </div>
            <div className="dispute-modal-body">
              <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:12 }}>
                Describe what was done. The student will receive this note and must confirm or dispute.
              </p>
              <div className="form-group">
                <label>Resolution Note *</label>
                <textarea
                  className="dispute-textarea" rows={4}
                  placeholder="What was done to fix the issue?"
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
            <div className="dispute-modal-footer">
              <button className="btn-secondary" onClick={() => setShowResolve(false)}>Cancel</button>
              <button className="atd-action-btn atd-action-resolve" onClick={handleResolve}
                disabled={actionLoading} style={{ padding:'10px 20px' }}>
                {actionLoading ? 'Sending…' : '✅ Send for Confirmation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="modal-overlay" onClick={() => setShowReject(false)}>
          <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="dispute-modal-header">
              <h3>✗ Reject Ticket</h3>
              <button className="modal-close-btn" onClick={() => setShowReject(false)}>×</button>
            </div>
            <div className="dispute-modal-body">
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  className="dispute-textarea" rows={3}
                  placeholder="Why is this ticket being rejected?"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="dispute-modal-footer">
              <button className="btn-secondary" onClick={() => setShowReject(false)}>Cancel</button>
              <button className="atd-action-btn atd-action-reject" onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading} style={{ padding:'10px 20px' }}>
                {actionLoading ? 'Rejecting…' : '✗ Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On Hold Modal */}
      {showHold && (
        <div className="modal-overlay" onClick={() => setShowHold(false)}>
          <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
            <div className="dispute-modal-header">
              <h3>⏸ Put On Hold</h3>
              <button className="modal-close-btn" onClick={() => setShowHold(false)}>×</button>
            </div>
            <div className="dispute-modal-body">
              <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:12 }}>
                SLA timer will be paused while the ticket is on hold.
              </p>
              <div className="form-group">
                <label>On Hold Reason *</label>
                <textarea
                  className="dispute-textarea" rows={3}
                  placeholder="Why is this ticket being put on hold? (e.g. waiting for parts)"
                  value={holdReason}
                  onChange={e => setHoldReason(e.target.value)}
                />
              </div>
            </div>
            <div className="dispute-modal-footer">
              <button className="btn-secondary" onClick={() => setShowHold(false)}>Cancel</button>
              <button className="atd-action-btn atd-action-hold" onClick={handleHold}
                disabled={!holdReason.trim() || actionLoading} style={{ padding:'10px 20px' }}>
                {actionLoading ? 'Holding…' : '⏸ Confirm Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
