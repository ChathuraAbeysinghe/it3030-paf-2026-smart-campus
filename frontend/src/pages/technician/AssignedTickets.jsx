import { useState, useEffect } from 'react';
import { ticketService } from '../../services/api';
import GlassTable from '../../components/GlassTable';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';

/**
 * Technician — My Assigned Tickets with status update.
 */
export default function AssignedTickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await ticketService.getAll();
      setTickets(all.filter(t => t.assignedTo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    })();
  }, []);

  const handleStatus = async (id, status) => {
    await ticketService.updateStatus(id, status);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const columns = [
    { key: 'title', label: 'Issue', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'location', label: 'Location' },
    { key: 'category', label: 'Category', render: (v) => <span className="amenity-tag">{v}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={v} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'slaDeadline', label: 'SLA', render: (v, row) => (row.status !== 'CLOSED' && row.status !== 'RESOLVED') ? <SLATimer deadline={v} /> : '—' },
  ];

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>My Assigned Tickets</h1>
        <p>Tickets assigned to you. Update their status as you work.</p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={tickets}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 6 }}>
              {row.status === 'IN_PROGRESS' && (
                <button className="btn-sm btn-sm--success" onClick={() => handleStatus(row.id, 'RESOLVED')}>✅ Resolve</button>
              )}
              {row.status === 'OPEN' && (
                <button className="btn-sm btn-sm--primary" onClick={() => handleStatus(row.id, 'IN_PROGRESS')}>▶ Start</button>
              )}
            </div>
          )}
          emptyMessage="No tickets assigned to you"
        />
      </div>
    </div>
  );
}
