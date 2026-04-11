import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Dashboard';

const NAV = [
  { icon: '📊', label: 'Overview',    href: '/admin/dashboard' },
  { icon: '👥', label: 'Users',       href: '#' },
  { icon: '🏛️', label: 'Halls',       href: '#' },
  { icon: '🗓️', label: 'Timetable',   href: '#' },
  { icon: '⚙️', label: 'Settings',    href: '#' },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar nav={NAV} user={user} logout={logout} accentColor="#F87171" />

      <main className="main-content">
        <div className="content-header animate-in">
          <h1>Admin Dashboard</h1>
          <p style={{ marginTop: 8 }}>
            Full system overview and management controls.
          </p>
        </div>

        <div className="stats-grid animate-in" style={{ animationDelay: '0.1s' }}>
          <StatCard icon="👥" label="Total Users"      value="284"  accent="#818CF8" />
          <StatCard icon="🏛️" label="Lecture Halls"   value="36"   accent="var(--primary)" />
          <StatCard icon="⚠️" label="Active Conflicts" value="5"    accent="#F87171" />
          <StatCard icon="🔧" label="Technicians"      value="12"   accent="#FBBF24" />
        </div>

        {/* User Management Table */}
        <div className="glass-card animate-in" style={{ padding: 24, animationDelay: '0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3>Recent Users</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}>View all →</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Email', 'Role', 'Status'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_USERS.map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 12px', fontSize: '0.875rem', color: 'var(--text)' }}>{u.name}</td>
                  <td style={{ padding: '12px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <span className={`role-badge ${u.role}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: u.active ? '#34D399' : '#9CA3AF',
                    }}>
                      {u.active ? '● Active' : '○ Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

const SAMPLE_USERS = [
  { name: 'Alex Johnson',   email: 'alex@campus.edu',  role: 'USER',       active: true  },
  { name: 'Maria Silva',    email: 'maria@campus.edu', role: 'TECHNICIAN', active: true  },
  { name: 'John Doe',       email: 'john@campus.edu',  role: 'USER',       active: false },
  { name: 'Sara Ahmed',     email: 'sara@campus.edu',  role: 'ADMIN',      active: true  },
];
