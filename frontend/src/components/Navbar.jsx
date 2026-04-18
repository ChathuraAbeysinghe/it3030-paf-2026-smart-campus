import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestNav from './navbar/GuestNav';
import AuthNav from './navbar/AuthNav';
import './navbar/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!user;
  const isStudent = user?.role === 'USER';

  if (isAuthenticated && isStudent) {
    return <AuthNav user={user} currentPath={location.pathname} onLogout={logout} />;
  }

  return <GuestNav currentPath={location.pathname} />;
}
