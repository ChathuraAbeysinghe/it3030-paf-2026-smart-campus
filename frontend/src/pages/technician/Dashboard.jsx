import { useState, useEffect } from 'react';
import { ticketService } from '../../services/api';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import SLATimer from '../../components/SLATimer';

/**
 * Technician Dashboard — stats + ticket overview.
 */
export default function TechDashboard() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ open: 0, completed: 0, high: 0, assigned: 0 });

  useEffect(() => {
    (async () => {
      const all = await ticketService.getAll();
      const myTickets = all.filter(t => t.assignedTo === 'tech1' || t.assignedTo === 'tech2');
      setTickets(myTickets.slice(0, 5));
      setStats({
        open: all.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
        completed: all.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
        high: all.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
        assigned: myTickets.length,
      });
    })();
  }, []);

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Technician Dashboard</h1>
        <p>Overview of maintenance tasks and assignments.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📋" label="Open Tasks" value={stats.open} accent="#FBBF24" />
        <StatCard icon="✅" label="Completed" value={stats.completed} accent="#34D399" />
        <StatCard icon="⚠️" label="High Priority" value={stats.high} accent="#F87171" />
        <StatCard icon="🔧" label="My Assigned" value={stats.assigned} accent="var(--primary)" />
      </div>

      {/* Recent Tickets */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Ticket Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tickets.map(t => (
            <div key={t.id} className="ticket-mini">
              <div className="ticket-mini-left">
                <span className="ticket-mini-title">{t.title}</span>
                <span className="ticket-mini-loc">📍 {t.location}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <StatusBadge status={t.priority} />
                <StatusBadge status={t.status} />
                {(t.status === 'OPEN' || t.status === 'IN_PROGRESS') && <SLATimer deadline={t.slaDeadline} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
