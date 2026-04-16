import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import StatCard from '../../components/StatCard';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import SlaCountdown from '../../components/tickets/SlaCountdown';

/**
 * Technician Dashboard — real stats + ticket overview.
 */
export default function TechDashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, high: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await ticketService.getAssigned();
        setTickets(all.slice(0, 5));
        setStats({
          active: all.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'ON_HOLD').length,
          completed: all.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
          high: all.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
          total: all.length,
        });
      } catch {}
      setLoading(false);
    })();
  }, []);

  const slaBreached = tickets.filter(t => t.slaStatus === 'BREACHED' && t.status !== 'CLOSED' && t.status !== 'REJECTED');

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Technician Dashboard</h1>
        <p>Overview of maintenance tasks and assignments.</p>
      </div>

      <div className="stats-grid">
        <StatCard icon="📋" label="Active Tasks" value={stats.active} accent="#FBBF24" />
        <StatCard icon="✅" label="Completed" value={stats.completed} accent="#34D399" />
        <StatCard icon="⚠️" label="High Priority" value={stats.high} accent="#F87171" />
        <StatCard icon="🔧" label="Total Assigned" value={stats.total} accent="var(--primary)" />
      </div>

      {/* SLA Breach Warning */}
      {slaBreached.length > 0 && (
        <div className="sla-breach-alert" style={{ marginTop: 16 }}>
          🚨 <strong>{slaBreached.length} ticket{slaBreached.length > 1 ? 's' : ''} breached SLA!</strong> Action needed.
        </div>
      )}

      {/* Recent Tickets */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Recent Assigned Tickets</h3>
          <button className="btn-link" onClick={() => navigate('/technician/assigned')}>View All →</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>Loading...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>No assigned tickets yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tickets.map(t => (
              <div key={t.id} className="ticket-mini" onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer' }}>
                <div className="ticket-mini-left">
                  <span className="ticket-mini-title">{t.title}</span>
                  <span className="ticket-mini-loc">📍 {t.location}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <TicketPriorityBadge priority={t.priority} />
                  <TicketStatusBadge status={t.status} />
                  {t.status !== 'CLOSED' && t.status !== 'REJECTED' && (
                    <SlaCountdown slaDeadline={t.slaDeadline} slaStatus={t.slaStatus}
                      totalPausedDuration={t.totalPausedDuration} compact />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
