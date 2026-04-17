import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { ticketCategories, ticketPriorities } from '../../mock/tickets';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';
import GlassModal from '../../components/GlassModal';
import './modern-pages.css';

const TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_USER_CONFIRMATION', 'CLOSED'];

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'MAINTENANCE',
    priority: 'MEDIUM',
    location: '',
    tags: '',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) return;

    setCreating(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await ticketService.create({ ...form, tags });
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        category: 'MAINTENANCE',
        priority: 'MEDIUM',
        location: '',
        tags: '',
      });
      await loadTickets();
    } finally {
      setCreating(false);
    }
  }

  const filtered = activeTab === 'ALL'
    ? tickets
    : tickets.filter((t) => t.status === activeTab);

  return (
    <div className="page-content animate-in user-modern-page user-modern-tickets">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Tickets</h1>
          <p>Track and manage your maintenance requests.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Ticket
        </button>
      </div>

      <div className="filter-chips" style={{ marginBottom: 12 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`filter-chip ${activeTab === tab ? 'filter-chip--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ALL' ? 'All' : tab.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 22 }}>Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎫</div>
          <h3>No tickets found</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'ALL' ? "You haven't submitted any tickets yet." : 'No tickets in this status.'}
          </p>
        </div>
      ) : (
        <div className="ticket-card-grid">
          {filtered.map((ticket) => (
            <div key={ticket.id} className="ticket-card glass-card" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <div className="ticket-card-header">
                <span className="ticket-card-id">{ticket.ticketId || ticket.id}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <StatusBadge status={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
              <h3 style={{ marginBottom: 6 }}>{ticket.title}</h3>
              <p className="ticket-desc" style={{ marginBottom: 8 }}>{ticket.description}</p>
              <div className="ticket-card-footer">
                <span>📍 {ticket.location}</span>
                <span>📂 {ticket.category}</span>
                {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && ticket.slaDeadline && (
                  <SLATimer deadline={ticket.slaDeadline} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <GlassModal open={showCreate} onClose={() => setShowCreate(false)} title="Create Ticket" width={640}>
        <form onSubmit={handleCreate} className="auth-form" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {ticketCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {ticketPriorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="form-input"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              className="form-input"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Ticket'}
          </button>
        </form>
      </GlassModal>
    </div>
  );
}
