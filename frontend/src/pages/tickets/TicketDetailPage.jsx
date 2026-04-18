import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ticketService, commentService, timelineService } from '../../services/ticketService';
import { userService } from '../../services/api';
import { categoryLabels, statusLabels } from '../../mock/tickets';
import TicketProgressBar from '../../components/tickets/TicketProgressBar';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import ConversationThread from '../../components/tickets/ConversationThread';
import ActivityTimeline from '../../components/tickets/ActivityTimeline';
import ResolutionConfirmPanel from '../../components/tickets/ResolutionConfirmPanel';
import DisputeModal from '../../components/tickets/DisputeModal';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';
import { ArrowLeft, MessageCircle, Activity, Tag, X, FileText, RotateCcw, Wrench, AlertCircle, PauseCircle } from 'lucide-react';

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
        userService.getAssignableStaff(),
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
      toast.success('Staff assigned');
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
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>Go Back</button>
      </div>
    );
  }

  const nextStatuses = STATUS_OPTIONS[ticket.status] || [];

  return (
    <div className="font-['Inter'] bg-slate-50 min-h-screen p-6">
      <ToastContainer />
      <DisputeModal open={showDispute} onClose={() => setShowDispute(false)} onSubmit={handleDispute} loading={actionLoading} />

      {/* BREADCRUMB + HEADER */}
      <div className="mb-6">
        <button className="text-slate-500 text-sm flex items-center hover:text-slate-700 transition mb-4 cursor-pointer" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} className="mr-1" /> Back to tickets
        </button>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">{ticket.ticketId}</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {ticket.priority}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200' : ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' : ticket.status === 'WAITING_USER_CONFIRMATION' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {ticket.status === 'WAITING_USER_CONFIRMATION' ? 'WAITING' : ticket.status}
          </span>
          {ticket.reopenCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 inline-flex items-center gap-1">
              <RotateCcw size={12} /> Reopened x{ticket.reopenCount}
            </span>
          )}
        </div>
        <h1 className="font-bold text-2xl text-slate-900">{ticket.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Reported by {ticket.createdByName} · {new Date(ticket.createdAt).toLocaleString()}</p>
      </div>

      {/* PROGRESS BAR */}
      <TicketProgressBar status={ticket.status} />

      {/* Resolution confirm panel */}
      {userIsCreator && (
        <div className="mb-4">
          <ResolutionConfirmPanel
            ticket={ticket}
            onConfirm={handleConfirm}
            onDispute={() => setShowDispute(true)}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="col-span-2">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            
            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Attachments</div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {ticket.attachments.map((att, i) => (
                    <div key={i} className="flex border border-slate-200 rounded-lg p-2 gap-3 w-48 shrink-0 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-center justify-center p-2 bg-slate-100 rounded">
                        <FileText size={16} className="text-slate-400" />
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="text-sm text-slate-700 truncate">{att.name || 'document.pdf'}</span>
                        <span className="text-xs text-slate-400">{att.size || '1.2 MB'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Tabs */}
          <div className="flex border-b border-slate-200 mb-4 gap-6">
            <button 
              className={`flex items-center gap-2 pb-3 text-sm transition ${activeSection === 'conversation' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
              onClick={() => setActiveSection('conversation')}
            >
              <MessageCircle size={16} /> Conversation ({comments.length})
            </button>
            <button 
              className={`flex items-center gap-2 pb-3 text-sm transition ${activeSection === 'timeline' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
              onClick={() => setActiveSection('timeline')}
            >
              <Activity size={16} /> Activity ({timeline.length})
            </button>
          </div>

          <div className="mb-6 h-125">
            {activeSection === 'conversation' ? (
              <ConversationThread
                comments={comments}
                currentUserId={currentUser?.id}
                onSend={handleSendComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                sending={sending}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full overflow-y-auto">
                <ActivityTimeline events={timeline} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-1 space-y-4">
          
          {/* SLA Countdown */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <SlaCountdown
              slaDeadline={ticket.slaDeadline}
              slaStatus={ticket.slaStatus}
              totalPausedDuration={ticket.totalPausedDuration}
            />
          )}

          {/* Ticket Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Ticket Info</div>
            <div className="space-y-0 text-sm">
              <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">Category</span>
                <span className="text-slate-900 font-medium text-right">{categoryLabels[ticket.category] || ticket.category}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-900 font-medium text-right">{ticket.location}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">Created by</span>
                <span className="text-slate-900 font-medium text-right">{ticket.createdByName}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">Created</span>
                <span className="text-slate-900 font-medium text-right">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">Assigned to</span>
                <span className={`font-medium text-right ${ticket.assignedTechnicianName ? 'text-slate-900' : 'text-slate-400 italic inline-flex items-center justify-end gap-1'}`}>
                  {ticket.assignedTechnicianName ? (
                    <span className="inline-flex items-center gap-1"><Wrench size={12} /> {ticket.assignedTechnicianName}</span>
                  ) : 'Unassigned'}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">Resolved</span>
                  <span className="text-slate-900 font-medium text-right">{new Date(ticket.resolvedAt).toLocaleString()}</span>
                </div>
              )}
              {ticket.closedAt && (
                <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500">Closed</span>
                  <span className="text-slate-900 font-medium text-right">{new Date(ticket.closedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {ticket.tags?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tags</div>
              <div className="flex flex-wrap gap-2">
                {ticket.tags.map((tag, i) => (
                  <span key={i} className="flex items-center bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-xs font-medium">
                    <Tag size={10} className="mr-1.5 opacity-70" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {ticket.rejectionReason && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
              <h4 className="text-red-800 font-semibold mb-1 inline-flex items-center gap-1.5"><AlertCircle size={14} /> Rejection Reason</h4>
              <p className="text-red-700 text-sm">{ticket.rejectionReason}</p>
            </div>
          )}

          {/* On Hold reason */}
          {ticket.onHoldReason && ticket.status === 'ON_HOLD' && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <h4 className="text-amber-800 font-semibold mb-1 inline-flex items-center gap-1.5"><PauseCircle size={14} /> On Hold Reason</h4>
              <p className="text-amber-700 text-sm">{ticket.onHoldReason}</p>
            </div>
          )}

          {/* Dispute note */}
          {ticket.disputeNote && (
            <div className="bg-purple-50 rounded-2xl border border-purple-200 p-5">
              <h4 className="text-purple-800 font-semibold mb-1 inline-flex items-center gap-1.5"><AlertCircle size={14} /> Last Dispute Note</h4>
              <p className="text-purple-700 text-sm">{ticket.disputeNote}</p>
            </div>
          )}

          {/* Admin Actions */}
          {(isAdmin || isTech) && nextStatuses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions</div>
              <div className="flex flex-col gap-2">
                {nextStatuses.map(s => (
                  <button
                    key={s}
                    className="w-full text-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg py-2 text-sm font-medium transition duration-150 cursor-pointer"
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

          {/* Assign Staff (Admin) */}
          {isAdmin && !ticket.assignedTechnician && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assign Staff</div>
              <div className="flex flex-col gap-2">
                {technicians.filter(t => t.active !== false).map(tech => (
                  <button key={tech.id} className="w-full flex justify-between items-center text-left border border-slate-200 bg-white hover:bg-slate-50 rounded-lg p-3 transition duration-150 cursor-pointer" onClick={() => handleAssign(tech.id)}
                    disabled={actionLoading}>
                    <div className="flex flex-col">
                      <strong className="text-slate-900 text-sm">{tech.name}</strong>
                      <span className="text-slate-500 text-xs">{tech.role === 'ADMIN' ? 'Admin' : (tech.specialization || 'Support Technician')}</span>
                    </div>
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{tech.assignedTickets || 0} tickets</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status change modal (for REJECTED/ON_HOLD/WAITING) */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowStatusModal(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-lg">
                {showStatusModal === 'REJECTED' ? 'Reject Ticket' :
                 showStatusModal === 'ON_HOLD' ? 'Put On Hold' :
                 'Mark as Resolved'}
              </h3>
              <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setShowStatusModal(null)}><X size={20}/></button>
            </div>
            <div className="mb-6">
              {(showStatusModal === 'REJECTED' || showStatusModal === 'ON_HOLD') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{showStatusModal === 'REJECTED' ? 'Rejection Reason *' : 'On Hold Reason *'}</label>
                  <textarea className="rounded-xl border border-slate-200 w-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none" rows={3} value={statusReason}
                    onChange={e => setStatusReason(e.target.value)}
                    placeholder={showStatusModal === 'REJECTED' ? 'Why is this ticket being rejected?' : 'Why is this being put on hold?'} />
                </div>
              )}
              {showStatusModal === 'WAITING_USER_CONFIRMATION' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resolution Note</label>
                  <textarea className="rounded-xl border border-slate-200 w-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none" rows={3} value={resolutionNote}
                    onChange={e => setResolutionNote(e.target.value)}
                    placeholder="Describe what was done to resolve this issue..." />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" onClick={() => setShowStatusModal(null)}>Cancel</button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex-1 py-2.5 transition cursor-pointer disabled:opacity-50"
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
