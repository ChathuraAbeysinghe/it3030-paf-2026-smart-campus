import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * UserLayout — top navbar layout for students.
 * Navbar (with NotificationBell) is extracted into its own component.
 */
export default function UserLayout() {
  const location = useLocation();
  const modernRoutes = ['/dashboard', '/resources', '/my-bookings', '/my-tickets', '/profile'];
  const isModernRoute = modernRoutes.includes(location.pathname);

  return (
    <div className={`user-layout ${isModernRoute ? 'user-layout--dashboard' : ''}`}>
      <Navbar />
      <main className={`user-main ${isModernRoute ? 'user-main--dashboard' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
}
