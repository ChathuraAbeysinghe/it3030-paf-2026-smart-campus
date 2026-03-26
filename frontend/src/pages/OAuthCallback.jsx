import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * OAuthCallback — landing page after Google redirects back with ?role=XXX
 * Calls /api/user/me to confirm session and redirects to correct dashboard.
 */
export default function OAuthCallback() {
  const { fetchUser } = useAuth();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();

  useEffect(() => {
    const role = params.get('role');

    fetchUser().then(() => {
      const routes = {
        ADMIN:      '/admin/dashboard',
        TECHNICIAN: '/technician/dashboard',
        USER:       '/dashboard',
      };
      navigate(routes[role] ?? '/dashboard', { replace: true });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="spinner-overlay">
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Signing you in…
      </p>
    </div>
  );
}
