import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { statusLabels, categoryLabels } from '../../mock/tickets';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import StatCard from '../../components/StatCard';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';

const TABS = ['ALL', 'IN_PROGRESS', 'OPEN', 'WAITING_USER_CONFIRMATION', 'ON_HOLD'];
const TAB_LABELS = { ALL: 'All Assigned', IN_PROGRESS: 'In Progress', OPEN: 'Open', WAITING_USER_CONFIRMATION: 'Awaiting', ON_HOLD: 'On Hold' };

export default function AssignedTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { loadTickets(); }, []);

  useEffect(() => {
    setFiltered(activeTab === 'ALL' ? tickets : tickets.filter(t => t.status === activeTab));
  }, [activeTab, tickets]);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await ticketService.getAssigned();
      setTickets(data);
    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  }

  async function quickStatusChange(ticketId, newStatus, e) {
    e.stopPropagation();
    setActionLoading(ticketId);
    try {
      await ticketService.updateStatus(ticketId, { status: newStatus });
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      await loadTickets();
    } catch { toast.error('Failed to update status'); }
    setActionLoading(null);
  }

  const activeTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'REJECTED');
  const resolvedThisWeek = tickets.filter(t => {
    if (!t.resolvedAt) return false;
    const resolved = new Date(t.resolvedAt);
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
    return resolved > oneWeekAgo;
  });
  const slaCompliance = activeTickets.length > 0
    ? Math.round((activeTickets.filter(t => t.slaStatus !== 'BREACHED').length / activeTickets.length) * 100)
    : 100;

  return (
    <div className="animate-in">
      <ToastContainer />

      <div className="content-header">
        <h1>My Assigned Tickets</h1>
        <p>Manage your assigned maintenance tasks.</p>
      </div>

      {/* Performance Cards */}
      <div className="stats-grid">
        <StatCard icon="📋" label="Active Tasks" value={activeTickets.length} accent="#3B82F6" />
        <StatCard icon="✅" label="Resolved (7d)" value={resolvedThisWeek.length} accent="#10B981" />
        <StatCard icon="📊" label="SLA Compliance" value={`${slaCompliance}%`} accent={slaCompliance >= 80 ? '#10B981' : '#EF4444'} />
        <StatCard icon="🔧" label="Total Assigned" value={tickets.length} accent="var(--primary)" />
      </div>

      {/* Tab Filters */}
      <div className="ticket-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`ticket-tab ${activeTab === tab ? 'ticket-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {TAB_LABELS[tab]}
            <span className="ticket-tab-count">
              {tab === 'ALL' ? tickets.length : tickets.filter(t => t.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="spinner-overlay" style={{ position: 'relative', minHeight: 200 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔧</div>
          <h3>No tickets found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'ALL' ? 'No tickets assigned to you yet.' : `No ${TAB_LABELS[activeTab].toLowerCase()} tickets.`}
          </p>
        </div>
      ) : (
        <div className="ticket-list-stack">
          {filtered.map(ticket => (
            <div key={ticket.id} className="ticket-list-item glass-card" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <div className="ticket-list-left">
                <div className="ticket-list-header">
                  <span className="ticket-card-id">{ticket.ticketId}</span>
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                </div>
                <h3 className="ticket-list-title">{ticket.title}</h3>
                <div className="ticket-card-meta">
                  <span>📍 {ticket.location}</span>
                  <span>📂 {categoryLabels[ticket.category]}</span>
                  <span>👤 {ticket.createdByName}</span>
                </div>
                {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                  <SlaCountdown slaDeadline={ticket.slaDeadline} slaStatus={ticket.slaStatus}
                    totalPausedDuration={ticket.totalPausedDuration} compact />
                )}
              </div>
              <div className="ticket-list-actions">
                {ticket.status === 'OPEN' && (
                  <button className="quick-action-btn action-in-progress"
                    onClick={e => quickStatusChange(ticket.id, 'IN_PROGRESS', e)}
                    disabled={actionLoading === ticket.id}>
                    ▶ Start
                  </button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                  <button className="quick-action-btn action-waiting"
                    onClick={e => { e.stopPropagation(); navigate(`/tickets/${ticket.id}`); }}
                    disabled={actionLoading === ticket.id}>
                    ✓ Resolve
                  </button>
                )}
                {ticket.status === 'ON_HOLD' && (
                  <button className="quick-action-btn action-in-progress"
                    onClick={e => quickStatusChange(ticket.id, 'IN_PROGRESS', e)}
                    disabled={actionLoading === ticket.id}>
                    ▶ Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
