import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const NAV_ITEMS = [
  { to: '/admin/dashboard',     icon: '📊', label: 'Dashboard'     },
  { to: '/admin/resources',     icon: '🏛️', label: 'Resources'     },
  { to: '/admin/bookings',      icon: '📅', label: 'Bookings'      },
  { to: '/admin/tickets',       icon: '🎫', label: 'Tickets'       },
  { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <img src="/sliit-campus-logo-.png" alt="SLIIT" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ color: '#F87171' }}>Admin Panel</span>
        </div>

        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        {/* Notification Bell in sidebar footer */}
        {/* <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
            <NotificationBell role="ADMIN" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Notifications</span>
          </div>
        </div> */}

        {/* User info */}
        {user && (
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', marginBottom: 8, cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              {user.picture
                ? <img src={user.picture} alt="" className="user-avatar" style={{ width: 36, height: 36 }} />
                : <div className="user-avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.9rem' }}>{user.name?.[0] ?? '?'}</div>
              }
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
                <span className="role-badge ADMIN">ADMIN</span>
              </div>
            </div>
            <button className="btn-secondary" onClick={logout} style={{ width: '100%', justifyContent: 'center' }}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
