import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketService } from '../../services/ticketService';
import GlassTable from '../../components/GlassTable';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';

/**
 * Technician — Unassigned ticket queue with "Assign to Me".
 */
export default function UnassignedTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    const data = await ticketService.getUnassigned();
    setTickets(data.sort((a, b) => {
      const pMap = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (pMap[a.priority] ?? 4) - (pMap[b.priority] ?? 4);
    }));
  };

  const handleAssign = async (id) => {
    if (!user?.id) return;
    await ticketService.assign(id, user.id);
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  const columns = [
    { key: 'title', label: 'Issue', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'location', label: 'Location' },
    { key: 'category', label: 'Category', render: (v) => <span className="amenity-tag">{v}</span> },
    { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdByName', label: 'Reported By' },
    { key: 'slaDeadline', label: 'SLA', render: (v) => <SLATimer deadline={v} /> },
  ];

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Unassigned Tickets</h1>
        <p>Open tickets waiting for a technician. Claim one to start working.</p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={tickets}
          actions={(row) => (
            <button className="btn-sm btn-sm--primary" onClick={() => handleAssign(row.id)}>
              🙋 Assign to Me
            </button>
          )}
          emptyMessage="No unassigned tickets — all caught up!"
        />
      </div>
    </div>
  );
}
