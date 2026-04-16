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
  '/tickets',
  '/profile',
  '/admin',
  '/technician',
];

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  const isAuthenticated = Boolean(user);
  
  // Check if current path is an authenticated route
  const isAuthRoute = useMemo(() => {
    return AUTH_ROUTES.some((route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`)
    );
  }, [location.pathname]);

  // Use AuthNav if user is authenticated OR if we're on an auth route (to prevent flashing GuestNav)
  const useAuthNav = useMemo(() => {
    if (isAuthenticated) return true;
    // If we're on an auth route but not authenticated yet, still show AuthNav skeleton
    // This prevents the GuestNav flash while auth is loading
    if (isAuthRoute && loading) return true;
    return false;
  }, [isAuthenticated, isAuthRoute, loading]);

  if (loading && !isAuthRoute) return null;

  return useAuthNav ? (
    <AuthNav user={user} currentPath={location.pathname} onLogout={logout} />
  ) : (
    <GuestNav currentPath={location.pathname} />
  );
}
