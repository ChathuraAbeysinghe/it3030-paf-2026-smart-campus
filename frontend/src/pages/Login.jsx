import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Students: IT12345678@my.sliit.lk  |  Staff/Admin/Tech: admin@sliit.lk
const SLIIT_EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@(my\.)?sliit\.lk$/i;

export default function Login() {
  const { loginWithGoogle, loginManual } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const oauthError = searchParams.get('oauthError');

  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!SLIIT_EMAIL_REGEX.test(email.trim()))
      errs.email = 'Enter a valid SLIIT email (@sliit.lk or @my.sliit.lk)';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      const user = await loginManual(email.trim(), password);
      const routes = { ADMIN: '/admin/dashboard', TECHNICIAN: '/technician/dashboard', USER: '/dashboard' };
      navigate(routes[user.role] ?? '/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() && password;

  return (
    <div className="page-center">
      <div className="glass-card animate-in auth-card">
        {/* Decorative blobs */}
        <div className="auth-blob auth-blob--top" />
        <div className="auth-blob auth-blob--bottom" />

        {/* Logo */}
        <div className="auth-logo">
          <img src="/sliit-campus-logo-.png" alt="SLIIT" className="auth-logo-img" />
        </div>

        <h1 className="auth-title">Smart Campus</h1>
        <h2 className="auth-subtitle">Operations Hub</h2>
        <p className="auth-desc">Sign in to access your workspace</p>

        {/* Error toast */}
        {apiError && (
          <div className="auth-toast auth-toast--error animate-in">
            <span className="auth-toast-icon">⚠️</span>
            {apiError}
          </div>
        )}

        {oauthError && (
          <div className="auth-toast auth-toast--error animate-in">
            <span className="auth-toast-icon">⚠️</span>
            {oauthError}
            <button
              type="button"
              onClick={() => {
                searchParams.delete('oauthError');
                setSearchParams(searchParams, { replace: true });
              }}
              style={{ marginLeft: 8, background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              aria-label="Dismiss OAuth error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Manual Login Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Campus Email</label>
            <div className={`form-input-wrapper ${errors.email ? 'form-input--error' : ''}`}>
              <span className="form-input-icon">📧</span>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="your.email@sliit.lk"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})); }}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
            <span className="form-hint">Use your SLIIT email (@sliit.lk or @my.sliit.lk)</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className={`form-input-wrapper ${errors.password ? 'form-input--error' : ''}`}>
              <span className="form-input-icon">🔒</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="form-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn-primary btn-glow"
            disabled={isLoading || !isFormValid}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Signing in…
              </>
            ) : (
              <>🚀 Sign In</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google Login */}
        <button className="btn-google" onClick={loginWithGoogle}>
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Register Link */}
        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create account</Link>
        </p>

        <p className="auth-terms">
          By signing in, you agree to the Smart Campus
          <br />terms of use and privacy policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1732 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.3441C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  );
}
