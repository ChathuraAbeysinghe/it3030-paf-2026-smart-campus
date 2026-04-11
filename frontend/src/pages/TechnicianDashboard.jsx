import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Dashboard';

const NAV = [
  { icon: '🔧', label: 'My Tasks',    href: '/technician/dashboard' },
  { icon: '🏛️', label: 'Halls',       href: '#' },
  { icon: '⚠️', label: 'Issues',       href: '#' },
  { icon: '📋', label: 'Reports',     href: '#' },
];

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar nav={NAV} user={user} logout={logout} accentColor="#FBBF24" />

      <main className="main-content">
        <div className="content-header animate-in">
          <h1>Technician Dashboard</h1>
          <p style={{ marginTop: 8 }}>Manage maintenance tasks and facility issues.</p>
        </div>

        <div className="stats-grid animate-in" style={{ animationDelay: '0.1s' }}>
          <StatCard icon="📋" label="Open Tasks"      value="7"   accent="#FBBF24" />
          <StatCard icon="✅" label="Completed Today" value="3"   accent="#34D399" />
          <StatCard icon="⚠️" label="High Priority"   value="2"   accent="#F87171" />
          <StatCard icon="🏛️" label="Halls Assigned"  value="5"   accent="var(--primary)" />
        </div>

        {/* Task Board */}
        <div className="glass-card animate-in" style={{ padding: 24, animationDelay: '0.15s' }}>
          <h3 style={{ marginBottom: 20 }}>Active Work Orders</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WORK_ORDERS.map((w, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{w.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{w.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{w.location}</div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: w.priority === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                  color:      w.priority === 'High' ? '#F87171' : '#FBBF24',
                  border:     `1px solid ${w.priority === 'High' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
                }}>
                  {w.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
      <div className="stat-value" style={{ color: accent ?? 'var(--primary)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const WORK_ORDERS = [
  { icon: '💡', title: 'Lighting repair — Hall A',          location: 'Block C, Room 101', priority: 'High'   },
  { icon: '❄️', title: 'AC not working — Seminar Room 2',   location: 'Block B, Room 204', priority: 'High'   },
  { icon: '🚰', title: 'Leaking pipe — Restroom Level 2',   location: 'Main Building',     priority: 'Medium' },
  { icon: '🖥️', title: 'Projector alignment — Lecture Hall', location: 'Block A, Room 302', priority: 'Medium' },
];
