import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a route and checks:
 *  1. User is authenticated (redirect to /login if not)
 *  2. User has the required role (redirect to their own dashboard if not)
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['ADMIN']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return null; // AuthContext is still resolving — render nothing

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard
    const redirectMap = {
      ADMIN:      '/admin/dashboard',
      TECHNICIAN: '/technician/dashboard',
      USER:       '/dashboard',
    };
    return <Navigate to={redirectMap[user.role] ?? '/dashboard'} replace />;
  }

  return children;
}
