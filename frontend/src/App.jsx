import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './context/AuthContext';
import ProtectedRoute             from './components/ProtectedRoute';

// Auth pages (unchanged)
import Login                      from './pages/Login';
import Register                   from './pages/Register';
import OAuthCallback              from './pages/OAuthCallback';
import Homepage                   from './pages/Homepage';

// Layouts
import UserLayout                 from './layouts/UserLayout';
import AdminLayout                from './layouts/AdminLayout';
import TechnicianLayout           from './layouts/TechnicianLayout';

// USER pages
import Home                       from './pages/user/Home';
import Resources                  from './pages/user/Resources';
import MyBookings                 from './pages/user/MyBookings';
import MyTickets                  from './pages/user/MyTickets';
import Profile                    from './pages/user/Profile';

// ADMIN pages
import AdminDashboard             from './pages/admin/Dashboard';
import ManageResources            from './pages/admin/ManageResources';
import ManageBookings             from './pages/admin/ManageBookings';
import ManageTickets              from './pages/admin/ManageTickets';
import AdminNotifications         from './pages/admin/Notifications';

// TECHNICIAN pages
import TechDashboard              from './pages/technician/Dashboard';
import AssignedTickets            from './pages/technician/AssignedTickets';
import UnassignedTickets          from './pages/technician/UnassignedTickets';
import TechNotifications          from './pages/technician/Notifications';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    ADMIN:      '/admin/dashboard',
    TECHNICIAN: '/technician/dashboard',
    USER:       '/dashboard',
  };
  return <Navigate to={routes[user.role] ?? '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"              element={<Homepage />} />
          <Route path="/home"          element={<Homepage />} />
          <Route path="/app"           element={<RootRedirect />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* ── USER (Student) — Navbar Layout ── */}
          <Route element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'TECHNICIAN']}>
              <UserLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"    element={<Home />} />
            <Route path="/resources"    element={<Resources />} />
            <Route path="/my-bookings"  element={<MyBookings />} />
            <Route path="/my-tickets"   element={<MyTickets />} />
            <Route path="/profile"      element={<Profile />} />
          </Route>

          {/* ── ADMIN — Sidebar Dashboard ── */}
          <Route element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin/dashboard"     element={<AdminDashboard />} />
            <Route path="/admin/resources"     element={<ManageResources />} />
            <Route path="/admin/bookings"      element={<ManageBookings />} />
            <Route path="/admin/tickets"       element={<ManageTickets />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
          </Route>

          {/* ── TECHNICIAN — Sidebar Dashboard ── */}
          <Route element={
            <ProtectedRoute allowedRoles={['TECHNICIAN']}>
              <TechnicianLayout />
            </ProtectedRoute>
          }>
            <Route path="/technician/dashboard"     element={<TechDashboard />} />
            <Route path="/technician/assigned"       element={<AssignedTickets />} />
            <Route path="/technician/unassigned"     element={<UnassignedTickets />} />
            <Route path="/technician/notifications"  element={<TechNotifications />} />
          </Route>

          {/* ── Catch-all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
