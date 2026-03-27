/**
 * Navbar.jsx
 * ─────────────────────────────────────────────────────────────────
 * Shared top navbar used by the USER (student) layout.
 * Admin / Technician use the Sidebar instead.
 * ─────────────────────────────────────────────────────────────────
 */
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const NAV_LINKS = [
  { to: '/dashboard',   icon: '🏠', label: 'Home'      },
  { to: '/resources',   icon: '📚', label: 'Resources'  },
  { to: '/my-bookings', icon: '📅', label: 'Bookings'   },
  { to: '/my-tickets',  icon: '🎫', label: 'Tickets'    },
  { to: '/profile',     icon: '👤', label: 'Profile'    },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="user-navbar glass-card">
      {/* Brand */}
      <div className="user-navbar-brand" onClick={() => navigate('/dashboard')}>
        <img src="/sliit-campus-logo-.png" alt="SLIIT" className="user-navbar-logo" />
        <span>SmartCampus</span>
      </div>

      {/* Links */}
      <div className="user-navbar-links">
        {NAV_LINKS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `user-nav-link ${isActive ? 'user-nav-link--active' : ''}`
            }
          >
            <span className="user-nav-icon">{icon}</span>
            <span className="user-nav-label">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Right section */}
      <div className="user-navbar-right">
        {/* ── Notification Bell (floating dropdown) ── */}
        <NotificationBell role="USER" />

        {/* ── User avatar ── */}
        {user && (
          <div
            className="user-navbar-avatar"
            onClick={() => navigate('/profile')}
            title={user.name}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="user-avatar"
                style={{ width: 34, height: 34 }}
              />
            ) : (
              <div
                className="user-avatar-placeholder"
                style={{ width: 34, height: 34, fontSize: '0.85rem' }}
              >
                {user.name?.[0] ?? '?'}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
