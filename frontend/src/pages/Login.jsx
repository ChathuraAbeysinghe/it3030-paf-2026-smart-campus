import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="page-center">
      <div className="glass-card animate-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow blob */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,173,181,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo / Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(0,173,181,0.25), rgba(0,173,181,0.05))',
          border: '1px solid rgba(0,173,181,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: '2rem',
          backdropFilter: 'blur(10px)',
        }}>
          <img src="/sliit-campus-logo-.png" alt="SLIIT" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--text)' }}>
          Smart Campus
        </h1>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 400,
          color: 'var(--primary)',
          marginBottom: '8px',
          letterSpacing: '0.5px',
        }}>
          Operations Hub
        </h2>
        <p style={{ fontSize: '0.875rem', marginBottom: '36px', color: 'var(--text-muted)' }}>
          Sign in to access your workspace
        </p>

        <hr className="divider" />

        <button className="btn-primary" onClick={login} style={{ marginTop: '24px' }}>
          <GoogleIcon />
          Continue with Google
        </button>

        <p style={{
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          marginTop: '24px',
          lineHeight: 1.6,
        }}>
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
