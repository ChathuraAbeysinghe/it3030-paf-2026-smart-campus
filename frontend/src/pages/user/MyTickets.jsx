import { useState, useEffect } from 'react';
import { ticketService } from '../../services/api';
import { ticketCategories, ticketPriorities } from '../../mock/tickets';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';
import GlassModal from '../../components/GlassModal';

/**
 * My Tickets — ticket list with create form + SLA timer.
 */
export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'MEDIUM', location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await ticketService.getAll();
      setTickets(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    })();
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.category || !form.location) return;
    setSubmitting(true);
    const ticket = await ticketService.create({
      ...form,
      createdBy: 'u1',
      createdByName: 'Current User',
    });
    setTickets(prev => [ticket, ...prev]);
    setShowCreate(false);
    setForm({ title: '', description: '', category: '', priority: 'MEDIUM', location: '' });
    setSubmitting(false);
  };

  return (
    <div className="page-content animate-in">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Tickets</h1>
          <p>Track your reported issues and maintenance requests.</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }} onClick={() => setShowCreate(true)}>
          ➕ Report Issue
        </button>
      </div>

      <div className="ticket-list">
        {tickets.map(t => (
          <div key={t.id} className="ticket-card glass-card">
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
        ))}
      </div>

      {/* Create Ticket Modal */}
      <GlassModal open={showCreate} onClose={() => setShowCreate(false)} title="Report an Issue" width={520}>
        <div className="auth-form" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <div className="form-input-wrapper">
              <input className="form-input" placeholder="Brief issue description" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <div className="form-input-wrapper" style={{ alignItems: 'flex-start' }}>
              <textarea className="form-input" rows={3} placeholder="Detailed description of the issue..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="form-input-wrapper">
                <select className="form-input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="" disabled>Select category</option>
                  {ticketCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="form-input-wrapper">
                <select className="form-input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {ticketPriorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <div className="form-input-wrapper">
              <input className="form-input" placeholder="e.g., Block B, 2nd Floor, Lab 01" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary btn-glow" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Submitting...' : '🎫 Submit Ticket'}
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
