import { useState, useEffect } from 'react';
<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { categoryLabels, statusLabels, ticketCategories, ticketPriorities } from '../../mock/tickets';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import TicketProgressBar from '../../components/tickets/TicketProgressBar';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_USER_CONFIRMATION', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
const TAB_LABELS = { ALL: 'All', OPEN: 'Open', IN_PROGRESS: 'In Progress', WAITING_USER_CONFIRMATION: 'Awaiting', ON_HOLD: 'On Hold', RESOLVED: 'Resolved', CLOSED: 'Closed' };
=======
import { ticketService } from '../../services/api';
import { ticketCategories, ticketPriorities } from '../../mock/tickets';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';
import GlassModal from '../../components/GlassModal';
import './modern-pages.css';
>>>>>>> Stashed changes

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    step: 1, title: '', description: '', category: 'MAINTENANCE', priority: 'MEDIUM', location: '', tags: '',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    setFiltered(activeTab === 'ALL' ? tickets : tickets.filter(t => t.status === activeTab));
  }, [activeTab, tickets]);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch { toast.error('Failed to load tickets'); }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast.warning('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await ticketService.create({ ...form, tags });
      toast.success('Ticket created successfully!');
      setShowCreate(false);
      setForm({ step: 1, title: '', description: '', category: 'MAINTENANCE', priority: 'MEDIUM', location: '', tags: '' });
      await loadTickets();
    } catch { toast.error('Failed to create ticket'); }
    setCreating(false);
  }

  return (
<<<<<<< Updated upstream
    <div className="animate-in">
      <ToastContainer />

      {/* Header */}
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
=======
    <div className="page-content animate-in user-modern-page user-modern-tickets">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
>>>>>>> Stashed changes
        <div>
          <h1>My Tickets</h1>
          <p>Track and manage your maintenance requests.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Ticket
        </button>
      </div>

<<<<<<< Updated upstream
      {/* Filter Tabs */}
      <div className="ticket-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`ticket-tab ${activeTab === tab ? 'ticket-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
            <span className="ticket-tab-count">
              {tab === 'ALL' ? tickets.length : tickets.filter(t => t.status === tab).length}
            </span>
          </button>
=======
      <div className="ticket-list">
        {tickets.map(t => (
          <div key={t.id} className="ticket-card glass-card modern-panel modern-ticket-card">
            <div className="ticket-card-header">
              <h3>{t.title}</h3>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <StatusBadge status={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            </div>
            <p className="ticket-desc">{t.description}</p>
            <div className="ticket-card-footer">
              <span>📍 {t.location}</span>
              <span>📂 {t.category}</span>
              {t.assignedToName && <span>🔧 {t.assignedToName}</span>}
              {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && (
                <SLATimer deadline={t.slaDeadline} />
              )}
            </div>
          </div>
>>>>>>> Stashed changes
        ))}
      </div>

      {/* Ticket Cards */}
      {loading ? (
        <div className="spinner-overlay" style={{ position: 'relative', minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state glass-card">
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎫</div>
          <h3>No tickets found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            {activeTab === 'ALL' ? "You haven't submitted any tickets yet." : `No ${TAB_LABELS[activeTab].toLowerCase()} tickets.`}
          </p>
          {activeTab === 'ALL' && (
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              Create your first ticket
            </button>
          )}
        </div>
      ) : (
        <div className="ticket-card-grid">
          {filtered.map(ticket => (
            <div key={ticket.id} className="ticket-card glass-card" onClick={() => navigate(`/tickets/${ticket.id}`)}>
              <div className="ticket-card-header">
                <span className="ticket-card-id">{ticket.ticketId}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </div>
              <h3 className="ticket-card-title">{ticket.title}</h3>
              <p className="ticket-card-desc">{ticket.description}</p>
              <div className="ticket-card-meta">
                <span>📍 {ticket.location}</span>
                <span>📂 {categoryLabels[ticket.category] || ticket.category}</span>
              </div>
              <TicketProgressBar status={ticket.status} />
              {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && (
                <SlaCountdown
                  slaDeadline={ticket.slaDeadline}
                  slaStatus={ticket.slaStatus}
                  totalPausedDuration={ticket.totalPausedDuration}
                />
              )}
              {ticket.assignedTechnicianName && (
                <div className="ticket-card-tech">
                  🔧 <span>{ticket.assignedTechnicianName}</span>
                </div>
              )}
              {ticket.status === 'WAITING_USER_CONFIRMATION' && (
                <div className="ticket-card-action-banner">
                  ⏳ Your confirmation is needed
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal Wizard */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="create-ticket-modal glass-card animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>New Support Ticket</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>×</button>
            </div>
            
            <div className="wizard-progress">
              <div className={`wizard-step ${form.step >= 1 ? 'active' : ''}`}>1. Category</div>
              <div className={`wizard-step ${form.step >= 2 ? 'active' : ''}`}>2. Details</div>
              <div className={`wizard-step ${form.step >= 3 ? 'active' : ''}`}>3. Location</div>
            </div>

            <form onSubmit={handleCreate} className="create-ticket-form" style={{ marginTop: '20px' }}>
              
              {/* Step 1: Category */}
              {form.step === 1 && (
                <div className="wizard-step-content animate-in">
                  <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>What type of issue are you experiencing?</p>
                  <div className="category-wizard-grid">
                    {ticketCategories.map(c => (
                      <div 
                        key={c} 
                        className={`category-wizard-card ${form.category === c ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, category: c })}
                      >
                        <div className="cat-icon">
                          {getCategoryIcon(c)}
                        </div>
                        <div className="cat-label">{categoryLabels[c]}</div>
                      </div>
                    ))}
                  </div>
                  <div className="form-actions" style={{ marginTop: '24px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                    <button type="button" className="btn-primary" onClick={() => setForm({ ...form, step: 2 })}>Next: Details →</button>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {form.step === 2 && (
                <div className="wizard-step-content animate-in">
                  <div className="form-group">
                    <label>Brief Summary *</label>
                    <input type="text" placeholder="e.g. Projector not turning on in Hall A"
                      value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Description *</label>
                    <textarea rows={4} placeholder="Please provide detailed information about the problem..."
                      value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <div className="priority-wizard-selector">
                      {ticketPriorities.map(p => (
                        <div 
                          key={p} 
                          className={`priority-wizard-option ${form.priority === p ? `selected-${p.toLowerCase()}` : ''}`}
                          onClick={() => setForm({ ...form, priority: p })}
                        >
                          {p === 'LOW' ? '🟢' : p === 'MEDIUM' ? '🟡' : p === 'HIGH' ? '🟠' : '🔴'} {p.charAt(0) + p.slice(1).toLowerCase()}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, step: 1 })}>← Back</button>
                    <button type="button" className="btn-primary" onClick={() => {
                      if (!form.title.trim() || !form.description.trim()) { toast.warning('Title and description required'); return; }
                      setForm({ ...form, step: 3 })
                    }}>Next: Location →</button>
                  </div>
                </div>
              )}

              {/* Step 3: Location & Submit */}
              {form.step === 3 && (
                <div className="wizard-step-content animate-in">
                  <div className="form-group">
                    <label>Location *</label>
                    <input type="text" placeholder="Building, Floor, Room... (e.g. Computing Building F402)"
                      value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} autoFocus />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Smart Suggestion: Leave a specific room number so technicians can find it easily.</p>
                  </div>
                  <div className="form-group">
                    <label>Tags (optional)</label>
                    <input type="text" placeholder="e.g. projector, AV, urgent"
                      value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                  </div>
                  
                  <div className="wizard-summary glass-card" style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,173,181,0.05)', border: '1px solid rgba(0,173,181,0.2)' }}>
                    <h4 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Almost done!</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You are about to report a <strong>{form.priority}</strong> priority <strong>{categoryLabels[form.category]}</strong> issue at <strong>{form.location || '[Location]'}</strong>.</p>
                  </div>

                  <div className="form-actions" style={{ marginTop: '24px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setForm({ ...form, step: 2 })}>← Back</button>
                    <button type="submit" className="btn-primary" disabled={creating}>
                      {creating ? 'Submitting...' : '🚀 Submit Ticket'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
