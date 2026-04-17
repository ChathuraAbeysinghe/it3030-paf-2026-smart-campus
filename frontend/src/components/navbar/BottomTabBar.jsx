import { NavLink } from 'react-router-dom';

const TABS = [
<<<<<<< Updated upstream
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/resources', label: 'Resources', icon: '📚' },
  { to: '/my-bookings', label: 'Bookings', icon: '📅' },
  { to: '/my-tickets', label: 'Tickets', icon: '🎫' },
  { to: '/profile', label: 'Profile', icon: '👤' },
=======
  { to: '/dashboard', label: 'Home', symbol: 'H' },
  { to: '/resources', label: 'Resources', symbol: 'R' },
  { to: '/my-bookings', label: 'Bookings', symbol: 'B' },
  { to: '/my-tickets', label: 'Tickets', symbol: 'T' },
  { to: '/profile', label: 'Profile', symbol: 'P' },
>>>>>>> Stashed changes
];

export default function BottomTabBar() {
  return (
    <nav className="auth-bottom-tabs" aria-label="Dashboard mobile tabs">
      {TABS.map((tab) => (
<<<<<<< Updated upstream
        <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `auth-bottom-tabs__item ${isActive ? 'is-active' : ''}`}>
          <span>{tab.icon}</span>
=======
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `auth-bottom-tabs__item ${isActive ? 'is-active' : ''}`}
        >
          <span>{tab.symbol}</span>
>>>>>>> Stashed changes
          <small>{tab.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}
