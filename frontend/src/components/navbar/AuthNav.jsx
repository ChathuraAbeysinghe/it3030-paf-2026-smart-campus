import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import UserMenu from './UserMenu';
import MobileDrawer from './MobileDrawer';
import BottomTabBar from './BottomTabBar';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/resources', label: 'Resources' },
  { to: '/my-bookings', label: 'Bookings' },
  { to: '/my-tickets', label: 'Tickets' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

export default function AuthNav({ user, currentPath, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const drawerLinks = useMemo(() => NAV_ITEMS.map((item) => ({ label: item.label, to: item.to })), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`auth-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="auth-nav__inner">
          <button type="button" className="auth-nav__brand" onClick={() => navigate('/dashboard')}>
            <img src="/sliit-campus-logo-.png" alt="SmartCampus" />
            <span>SmartCampus</span>
          </button>

          <nav className="auth-nav__links" aria-label="Authenticated navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `auth-nav__tab ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="auth-nav__right">
            <NotificationBadge role={user?.role ?? 'USER'} />
            <UserMenu user={user} onLogout={onLogout} />
          </div>

          <button
            type="button"
            className={`auth-nav__toggle ${menuOpen ? 'is-open' : ''}`}
            aria-label="Open menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Account"
        links={drawerLinks}
        actions={[
          { label: 'Profile', to: '/profile', kind: 'ghost' },
          { label: 'Logout', onClick: onLogout, kind: 'outline' },
        ]}
        variant="auth"
      />

      {currentPath !== '/login' && currentPath !== '/register' && <BottomTabBar />}
    </>
  );
}
