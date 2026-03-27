import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * UserLayout — top navbar layout for students.
 * Navbar (with NotificationBell) is extracted into its own component.
 */
export default function UserLayout() {
  return (
    <div className="user-layout">
      <Navbar />
      <main className="user-main">
        <Outlet />
      </main>
    </div>
  );
}
