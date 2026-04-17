import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Home', symbol: 'H' },
  { to: '/resources', label: 'Resources', symbol: 'R' },
  { to: '/my-bookings', label: 'Bookings', symbol: 'B' },
  { to: '/my-tickets', label: 'Tickets', symbol: 'T' },
  { to: '/notifications', label: 'Alerts', symbol: 'N' },
  { to: '/profile', label: 'Profile', symbol: 'P' },
];

export default function BottomTabBar() {
  return (
    <nav className="auth-bottom-tabs" aria-label="Dashboard mobile tabs">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `auth-bottom-tabs__item ${isActive ? 'is-active' : ''}`}
        >
          <span>{tab.symbol}</span>
          <small>{tab.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
