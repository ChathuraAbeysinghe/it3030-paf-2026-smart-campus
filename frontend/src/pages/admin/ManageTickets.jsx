import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/api';
import { categoryLabels, statusLabels, ticketCategories, ticketStatuses, priorityLabels } from '../../mock/tickets';
import StatCard from '../../components/StatCard';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';

export default function ManageTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [slaFilter, setSlaFilter] = useState('ALL');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allTickets, statsData] = await Promise.all([
        ticketService.getAll(),
        ticketService.getStats(),
      ]);
      setTickets(allTickets);
      setStats(statsData);

      // Fetch assignable staff (technicians + admins)
      const techs = await userService.getAssignableStaff();
      setTechnicians(techs);

    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  }

  async function handleAssign(ticketId, techId, e) {
    e.stopPropagation();
    try {
      await ticketService.assign(ticketId, techId);
      toast.success('Staff assigned!');
      await loadData();
    } catch { toast.error('Failed to assign'); }
  }

  // Filtered tickets
  const filtered = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (slaFilter !== 'ALL' && t.slaStatus !== slaFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (t.title?.toLowerCase().includes(s) || t.ticketId?.toLowerCase().includes(s) ||
              t.location?.toLowerCase().includes(s) || t.createdByName?.toLowerCase().includes(s));
    }
    return true;
  });

  const slaBreachedCount = tickets.filter(t => t.slaStatus === 'BREACHED' && t.status !== 'CLOSED' && t.status !== 'REJECTED').length;

  return (
    <div className="animate-in">
      <ToastContainer />

      <div className="content-header">
        <h1>Ticket Management</h1>
        <p>Monitor, assign, and manage all maintenance tickets.</p>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard icon="📋" label="Open" value={stats.open || 0} accent="#3B82F6" />
        <StatCard icon="🔄" label="In Progress" value={stats.inProgress || 0} accent="#F59E0B" />
        <StatCard icon="⏳" label="Awaiting" value={stats.waitingConfirmation || 0} accent="#8B5CF6" />
        <StatCard icon="🚨" label="SLA Breached" value={slaBreachedCount} accent="#EF4444" />
        <StatCard icon="✅" label="Resolved Today" value={stats.resolvedToday || 0} accent="#10B981" />
      </div>

      {/* SLA Breach Alert */}
      {slaBreachedCount > 0 && (
        <div className="sla-breach-alert">
          🚨 <strong>{slaBreachedCount} ticket{slaBreachedCount > 1 ? 's have' : ' has'} breached SLA!</strong>
          <button className="sla-breach-btn" onClick={() => setSlaFilter(slaFilter === 'BREACHED' ? 'ALL' : 'BREACHED')}>
            {slaFilter === 'BREACHED' ? 'Show All' : 'Show Breached'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="ticket-filter-bar glass-card">
        <div className="filter-search">
          <input
            type="text"
            placeholder="🔍 Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-selects">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Status</option>
            {ticketStatuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Priority</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{priorityLabels[p]}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
            <option value="ALL">All Categories</option>
            {ticketCategories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>)}
          </select>
          <select value={slaFilter} onChange={e => setSlaFilter(e.target.value)} className="filter-select">
            <option value="ALL">All SLA</option>
            <option value="WITHIN_SLA">Within SLA</option>
            <option value="AT_RISK">At Risk</option>
            <option value="BREACHED">Breached</option>
            <option value="PAUSED">Paused</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="spinner-overlay" style={{ position: 'relative', minHeight: 200 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <h3>No tickets match your filters</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try changing the filters above.</p>
        </div>
      ) : (
        <div className="glass-card ticket-table-wrapper">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Category</th>
                <th>SLA</th>
                <th>Assigned To</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id} className="ticket-table-row" onClick={() => navigate(`/admin/tickets/${ticket.id}`)}>
                  <td className="ticket-table-id">
                    {ticket.ticketId}
                    {!ticket.viewedByAdmin && <span className="new-badge" style={{marginLeft:6}}>NEW</span>}
                  </td>
                  <td>
                    <div className="ticket-table-title">{ticket.title}</div>
                    <div className="ticket-table-location">📍 {ticket.location} · 👤 {ticket.createdByName}</div>
                  </td>
                  <td><TicketPriorityBadge priority={ticket.priority} /></td>
                  <td><TicketStatusBadge status={ticket.status} /></td>
                  <td><span className="ticket-table-category">{categoryLabels[ticket.category]}</span></td>
                  <td>
                    {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' ? (
                      <SlaCountdown slaDeadline={ticket.slaDeadline} slaStatus={ticket.slaStatus}
                        totalPausedDuration={ticket.totalPausedDuration} compact />
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {ticket.assignedTechnicianName ? (
                      <span className="ticket-table-tech">🔧 {ticket.assignedTechnicianName}</span>
                    ) : (
                      <select
                        className="inline-assign-select"
                        value=""
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleAssign(ticket.id, e.target.value, e)}
                      >
                        <option value="" disabled>Assign...</option>
                        {technicians.filter(t => t.active !== false).map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.role || 'STAFF'})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="ticket-table-date">
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
