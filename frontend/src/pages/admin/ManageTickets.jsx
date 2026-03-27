import { useState, useEffect } from 'react';
import { ticketService, userService } from '../../services/api';
import GlassTable from '../../components/GlassTable';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';

/**
 * Admin — Manage Tickets (assign technicians, update status).
 */
export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      const [t, techs] = await Promise.all([ticketService.getAll(), userService.getTechnicians()]);
      setTickets(t.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setTechnicians(techs);
    })();
  }, []);

  const handleAssign = async (ticketId, techId) => {
    const tech = technicians.find(t => t.id === techId);
    await ticketService.assign(ticketId, techId, tech?.name);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assignedTo: techId, assignedToName: tech?.name, status: 'IN_PROGRESS' } : t));
  };

  const handleStatus = async (id, status) => {
    await ticketService.updateStatus(id, status);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  const columns = [
    { key: 'title', label: 'Title', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'category', label: 'Category', render: (v) => <span className="amenity-tag">{v}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdByName', label: 'Created By' },
    { key: 'assignedToName', label: 'Assigned To', render: (v) => v || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span> },
    { key: 'slaDeadline', label: 'SLA', render: (v, row) => (row.status === 'OPEN' || row.status === 'IN_PROGRESS') ? <SLATimer deadline={v} /> : '—' },
  ];

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Manage Tickets</h1>
        <p>Assign technicians and track issue resolution.</p>
      </div>

      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
          <button key={s} className={`filter-chip ${filter === s ? 'filter-chip--active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {!row.assignedTo && (
                <select
                  className="btn-sm"
                  style={{ background: 'var(--primary-dim)', border: '1px solid rgba(0,173,181,0.3)', color: 'var(--primary)', borderRadius: 8, padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                  onChange={e => handleAssign(row.id, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Assign...</option>
                  {technicians.filter(t => t.active).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              {row.status === 'IN_PROGRESS' && (
                <button className="btn-sm btn-sm--success" onClick={() => handleStatus(row.id, 'RESOLVED')}>Resolve</button>
              )}
              {row.status === 'RESOLVED' && (
                <button className="btn-sm btn-sm--primary" onClick={() => handleStatus(row.id, 'CLOSED')}>Close</button>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}
