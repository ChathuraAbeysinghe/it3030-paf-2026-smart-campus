import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './context/AuthContext';
import ProtectedRoute             from './components/ProtectedRoute';
import Login                      from './pages/Login';
import Register                   from './pages/Register';
import OAuthCallback              from './pages/OAuthCallback';
import Dashboard                  from './pages/Dashboard';
import AdminDashboard             from './pages/AdminDashboard';
import TechnicianDashboard        from './pages/TechnicianDashboard';

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
          {/* Public */}
          <Route path="/"              element={<RootRedirect />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />

          {/* USER */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['USER', 'ADMIN', 'TECHNICIAN']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* ADMIN only */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* TECHNICIAN only */}
          <Route path="/technician/dashboard" element={
            <ProtectedRoute allowedRoles={['TECHNICIAN']}>
              <TechnicianDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
