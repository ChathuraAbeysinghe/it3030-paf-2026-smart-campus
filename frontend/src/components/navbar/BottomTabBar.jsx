import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/resources', label: 'Resources', icon: '📚' },
  { to: '/my-bookings', label: 'Bookings', icon: '📅' },
  { to: '/my-tickets', label: 'Tickets', icon: '🎫' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function BottomTabBar() {
  return (
    <nav className="auth-bottom-tabs" aria-label="Dashboard mobile tabs">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `auth-bottom-tabs__item ${isActive ? 'is-active' : ''}`}>
          <span>{tab.icon}</span>
          <small>{tab.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
