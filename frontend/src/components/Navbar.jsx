import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestNav from './navbar/GuestNav';
import AuthNav from './navbar/AuthNav';

const AUTH_ROUTES = [
  '/dashboard',
  '/resources',
  '/my-bookings',
  '/my-tickets',
  '/profile',
  '/admin',
  '/technician',
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const isAuthenticated = Boolean(user);
  const useAuthNav = useMemo(() => {
    if (!isAuthenticated) return false;
    return AUTH_ROUTES.some((route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`)
    );
  }, [isAuthenticated, location.pathname]);

  if (loading) return null;

  return useAuthNav
    ? <AuthNav user={user} currentPath={location.pathname} onLogout={logout} />
    : <GuestNav currentPath={location.pathname} />;
}
