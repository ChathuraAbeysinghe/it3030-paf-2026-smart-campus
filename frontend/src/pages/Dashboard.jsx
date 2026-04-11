import { useAuth } from '../context/AuthContext';

const NAV = [
  { icon: '🏠', label: 'Home',      href: '/dashboard' },
  { icon: '📅', label: 'Schedule',  href: '#' },
  { icon: '📢', label: 'Notices',   href: '#' },
  { icon: '📚', label: 'Resources', href: '#' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar nav={NAV} user={user} logout={logout} accentColor="var(--primary)" />

      <main className="main-content">
        <div className="content-header animate-in">
          <UserBanner user={user} />
          <h1>Welcome back 👋</h1>
          <p style={{ marginTop: 8 }}>Here's what's happening on campus today.</p>
        </div>

        <div className="stats-grid animate-in" style={{ animationDelay: '0.1s' }}>
          <StatCard icon="📅" label="Classes Today"    value="4" />
          <StatCard icon="📢" label="New Notices"      value="3" />
          <StatCard icon="🏛️" label="Available Halls"  value="12" />
          <StatCard icon="📚" label="Resources"         value="28" />
        </div>

        <InfoCard title="Quick Access" items={[
          { icon: '🗓️', text: 'View Today\'s Timetable' },
          { icon: '📍', text: 'Find a Free Lecture Hall' },
          { icon: '📣', text: 'Campus Announcements' },
        ]} />
      </main>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────── */

export function Sidebar({ nav, user, logout, accentColor }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <img src="/sliit-campus-logo-.png" alt="SLIIT" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <span style={{ color: accentColor ?? 'var(--primary)' }}>SmartCampus</span>
      </div>

      {nav.map(item => (
        <a key={item.label} href={item.href} className="nav-item">
          <span>{item.icon}</span>
          {item.label}
        </a>
      ))}

      <div style={{ flex: 1 }} />

      {user && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', marginBottom: 8 }}>
            {user.picture
              ? <img src={user.picture} alt="avatar" className="user-avatar" style={{ width: 36, height: 36 }} />
              : <div className="user-avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                  {user.name?.[0] ?? '?'}
                </div>
            }
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
            </div>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
            🚪 Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

function UserBanner({ user }) {
  if (!user) return null;
  return (
    <div className="user-info" style={{ marginBottom: 20 }}>
      {user.picture
        ? <img src={user.picture} alt="avatar" className="user-avatar" />
        : <div className="user-avatar-placeholder">{user.name?.[0] ?? '?'}</div>
      }
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
      </div>
      <span className={`role-badge ${user.role}`} style={{ marginLeft: 'auto' }}>{user.role}</span>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h3 style={{ marginBottom: 16, color: 'var(--text)' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <a key={item.text} href="#" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
            color: 'var(--text)',
            textDecoration: 'none',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            {item.text}
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
