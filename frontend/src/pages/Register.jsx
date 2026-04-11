import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SLIIT_EMAIL_REGEX = /^[A-Z]{2}\d{8}@my\.sliit\.lk$/i;

const FACULTY_PREFIXES = {
  'COMPUTING': 'IT',
  'ENGINEERING': 'EN',
  'SLIIT BUSINESS SCHOOL': 'BM',
  'HUMANITIES & SCIENCES': 'SH',
  'GRADUATE STUDIES': 'MS',
  'SCHOOL OF ARCHITECTURE': 'AR',
  'SCHOOL OF LAW': 'LW',
  'SCHOOL OF HOSPITALITY & CULINARY': 'HC',
  'FOUNDATION PROGRAMME': 'FO'
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName]               = useState('');
  const [itNumber, setItNumber]       = useState('');
  const [faculty, setFaculty]         = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [errors, setErrors]           = useState({});
  const [apiError, setApiError]       = useState('');
  const [success, setSuccess]         = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  const handleFacultyChange = (e) => {
    const newFaculty = e.target.value;
    setFaculty(newFaculty);
    setErrors(p => ({ ...p, faculty: '' }));

    const prefix = FACULTY_PREFIXES[newFaculty];
    if (prefix) {
      setItNumber(prev => {
        const rawNums = prev.replace(/^[a-zA-Z]+/, '');
        return prefix + rawNums;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';
    
    if (!itNumber.trim()) errs.itNumber = 'IT Number is required';
    else if (!/^[A-Z]{2}\d{8}$/i.test(itNumber.trim()))
      errs.itNumber = 'Must be in format AB12345678';
    else if (faculty && FACULTY_PREFIXES[faculty] && !itNumber.toUpperCase().startsWith(FACULTY_PREFIXES[faculty]))
      errs.itNumber = `ID prefix must be ${FACULTY_PREFIXES[faculty]} for ${faculty}`;
      
    if (!faculty) errs.faculty = 'Faculty is required';

    if (!email.trim()) errs.email = 'Email is required';
    else if (!SLIIT_EMAIL_REGEX.test(email.trim()))
      errs.email = 'Use your SLIIT email (AB********@my.sliit.lk)';
    else if (itNumber.trim() && !email.toLowerCase().startsWith(itNumber.toLowerCase()))
      errs.email = 'Email IT number must match your IT Number';
      
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    else if (!/\d/.test(password))
      errs.password = 'Password must contain at least one number';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess(false);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      await register(name.trim(), itNumber.trim(), faculty, email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim() && itNumber.trim() && faculty && SLIIT_EMAIL_REGEX.test(email.trim())
    && password.length >= 6 && /\d/.test(password) && password === confirmPassword 
    && email.toLowerCase().startsWith(itNumber.toLowerCase());

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/\d/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 2) return { level: score, label: 'Weak', color: '#F87171' };
    if (score <= 3) return { level: score, label: 'Fair', color: '#FBBF24' };
    return { level: score, label: 'Strong', color: '#34D399' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="page-center">
      <div className="glass-card animate-in auth-card auth-card--wide" style={{ padding: '34px 40px' }}>
        {/* Decorative blobs */}
        <div className="auth-blob auth-blob--top" />
        <div className="auth-blob auth-blob--bottom" />

        {/* Logo */}
        <div className="auth-logo">
          <img src="/sliit-campus-logo-.png" alt="SLIIT" className="auth-logo-img" />
        </div>

        <h1 className="auth-title">Create Account</h1>
        <h2 className="auth-subtitle">Smart Campus Hub</h2>
        <p className="auth-desc">Register with your SLIIT campus email</p>

        {/* Error toast */}
        {apiError && (
          <div className="auth-toast auth-toast--error animate-in">
            <span className="auth-toast-icon">⚠️</span>
            {apiError}
          </div>
        )}

        {/* Success toast */}
        {success && (
          <div className="auth-toast auth-toast--success animate-in">
            <span className="auth-toast-icon">✅</span>
            Account created! Redirecting to login…
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-row">
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div className={`form-input-wrapper ${errors.name ? 'form-input--error' : ''}`}>
                <span className="form-input-icon">👤</span>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(p => ({...p, name: ''})); }}
                  autoComplete="name"
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Faculty */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-faculty">Faculty</label>
              <div className={`form-input-wrapper ${errors.faculty ? 'form-input--error' : ''}`} style={{ paddingRight: 0 }}>
                <span className="form-input-icon">🎓</span>
                <select
                  id="reg-faculty"
                  className="form-input"
                  value={faculty}
                  onChange={handleFacultyChange}
                  style={{ cursor: 'pointer', appearance: 'none' }}
                >
                  <option value="" disabled>Select your faculty</option>
                  <option value="COMPUTING">COMPUTING</option>
                  <option value="ENGINEERING">ENGINEERING</option>
                  <option value="SLIIT BUSINESS SCHOOL">SLIIT BUSINESS SCHOOL</option>
                  <option value="HUMANITIES & SCIENCES">HUMANITIES & SCIENCES</option>
                  <option value="GRADUATE STUDIES">GRADUATE STUDIES</option>
                  <option value="SCHOOL OF ARCHITECTURE">SCHOOL OF ARCHITECTURE</option>
                  <option value="SCHOOL OF LAW">SCHOOL OF LAW</option>
                  <option value="SCHOOL OF HOSPITALITY & CULINARY">SCHOOL OF HOSPITALITY &amp; CULINARY</option>
                  <option value="FOUNDATION PROGRAMME">FOUNDATION PROGRAMME</option>
                </select>
                <div style={{ padding: '0 14px', pointerEvents: 'none', color: 'var(--text-muted)' }}>▼</div>
              </div>
              {errors.faculty && <span className="form-error">{errors.faculty}</span>}
            </div>
          </div>

          <div className="form-row">
            {/* IT Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-itnumber">IT Number</label>
              <div className={`form-input-wrapper ${errors.itNumber ? 'form-input--error' : ''}`}>
                <span className="form-input-icon">🆔</span>
                <input
                  id="reg-itnumber"
                  type="text"
                  className="form-input"
                  placeholder="AB12345678"
                  value={itNumber}
                  onChange={(e) => { setItNumber(e.target.value); setErrors(p => ({...p, itNumber: ''})); }}
                />
              </div>
              {errors.itNumber && <span className="form-error">{errors.itNumber}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Campus Email</label>
              <div className={`form-input-wrapper ${errors.email ? 'form-input--error' : ''}`}>
                <span className="form-input-icon">📧</span>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="AB12345678@my.sliit.lk"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})); }}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
              <span className="form-hint">Use your SLIIT email (AB********@my.sliit.lk)</span>
            </div>
          </div>

          <div className="form-row">
            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className={`form-input-wrapper ${errors.password ? 'form-input--error' : ''}`}>
                <span className="form-input-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 6 chars, at least 1 number"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})); }}
                  autoComplete="new-password"
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
              {/* Password strength bar */}
              {password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="password-strength-segment"
                        style={{ background: i <= strength.level ? strength.color : 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <div className={`form-input-wrapper ${errors.confirmPassword ? 'form-input--error' : ''}`}>
                <span className="form-input-icon">🔑</span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirm(e.target.value); setErrors(p => ({...p, confirmPassword: ''})); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                <span className="form-success">✓ Passwords match</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-glow"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" />
                Creating account…
              </>
            ) : (
              <>🎓 Create Account</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>

        <p className="auth-terms">
          By registering, you agree to the Smart Campus
          <br />terms of use and privacy policy.
        </p>
      </div>
    </div>
  );
}
