import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './profile.css';

/**
 * User Profile page — Extended Personal Details, Activity Summary,
 * Virtual ID Card, and Change Password.
 */
export default function Profile() {
  const { user, logout, changePassword } = useAuth();

  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ msg: '', type: '' });
  const [saving, setSaving] = useState(false);

  /* ── Editable fields ────────────────────────────────────────── */
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    phone: '',
    year: '',
    degree: '',
  });

  useEffect(() => {
    // Load any saved extended profile from localStorage
    const saved = localStorage.getItem(`profile_ext_${user?.email}`);
    if (saved) setProfile(JSON.parse(saved));
  }, [user?.email]);

  const handleSaveProfile = () => {
    localStorage.setItem(`profile_ext_${user?.email}`, JSON.stringify(profile));
    setEditMode(false);
  };

  /* ── Change Password ────────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwStatus({ msg: '', type: '' });

    if (form.newPass.length < 6) {
      return setPwStatus({ msg: 'New password must be at least 6 characters.', type: 'error' });
    }
    if (form.newPass !== form.confirm) {
      return setPwStatus({ msg: 'New passwords do not match.', type: 'error' });
    }

    setSaving(true);
    try {
      await changePassword(form.current, form.newPass);
      setPwStatus({ msg: '✅ Password changed successfully!', type: 'success' });
      setForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      setPwStatus({ msg: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Mock activity stats ────────────────────────────────────── */
  const activityStats = [
    { icon: '📅', value: 12, label: 'Total Bookings', color: '#00ADB5' },
    { icon: '✅', value: 8, label: 'Completed', color: '#34D399' },
    { icon: '⏳', value: 3, label: 'Pending Tickets', color: '#FBBF24' },
    { icon: '🛠️', value: 1, label: 'In Progress', color: '#818CF8' },
  ];

  /* ── Derive display data ────────────────────────────────────── */
  const itNumber = user?.itNumber || user?.email?.split('@')[0]?.toUpperCase() || 'N/A';
  const faculty = user?.faculty || 'Faculty of Computing';
  const joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and personal information.</p>
      </div>

      {/* ── Activity Summary Cards ─────────────────────────────── */}
      <div className="profile-activity-grid">
        {activityStats.map((stat) => (
          <div key={stat.label} className="profile-activity-card glass-card">
            <div className="profile-activity-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="profile-activity-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="profile-activity-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="profile-main-grid">

        {/* ── LEFT COLUMN ──────────────────────────────────────── */}
        <div className="profile-left">

          {/* ── Virtual ID Card ─────────────────────────────────── */}
          <div className="virtual-id-card">
            <div className="vid-header">
              <div className="vid-logo">🎓</div>
              <div className="vid-institution">
                <span className="vid-uni">SLIIT</span>
                <span className="vid-label">Smart Campus</span>
              </div>
              <div className="vid-badge-type">Student ID</div>
            </div>

            <div className="vid-body">
              <div className="vid-avatar-wrap">
                {user?.picture
                  ? <img src={user.picture} alt="" className="vid-avatar" />
                  : <div className="vid-avatar-placeholder">{user?.name?.[0]}</div>
                }
                <div className="vid-status-dot" />
              </div>

              <div className="vid-info">
                <div className="vid-name">{user?.name || 'Student'}</div>
                <div className="vid-id">{itNumber}</div>
                <div className="vid-faculty">{faculty}</div>
              </div>
            </div>

            <div className="vid-footer">
              <div className="vid-detail">
                <span className="vid-detail-label">Email</span>
                <span className="vid-detail-value">{user?.email}</span>
              </div>
              <div className="vid-detail">
                <span className="vid-detail-label">Valid</span>
                <span className="vid-detail-value">{currentYear} — {currentYear + 1}</span>
              </div>
            </div>

            <div className="vid-barcode">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="vid-bar"
                  style={{
                    width: Math.random() > 0.5 ? 3 : 2,
                    height: 28,
                    opacity: 0.3 + Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Extended Personal Details ───────────────────────── */}
          <div className="glass-card profile-details-card">
            <div className="profile-details-header">
              <h3>Personal Information</h3>
              {!editMode ? (
                <button className="btn-sm btn-sm--primary" onClick={() => setEditMode(true)}>
                  ✏️ Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-sm btn-sm--success" onClick={handleSaveProfile}>💾 Save</button>
                  <button className="btn-sm btn-sm--danger" onClick={() => setEditMode(false)}>✕</button>
                </div>
              )}
            </div>

            <div className="profile-detail-grid">
              {/* Read-only fields */}
              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">🆔</div>
                <div>
                  <div className="profile-detail-label">Student ID <span className="profile-lock-badge">🔒</span></div>
                  <div className="profile-detail-value">{itNumber}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">📧</div>
                <div>
                  <div className="profile-detail-label">Email <span className="profile-lock-badge">🔒</span></div>
                  <div className="profile-detail-value">{user?.email}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">🎓</div>
                <div>
                  <div className="profile-detail-label">Faculty <span className="profile-lock-badge">🔒</span></div>
                  <div className="profile-detail-value">{faculty}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">🛡️</div>
                <div>
                  <div className="profile-detail-label">Role <span className="profile-lock-badge">🔒</span></div>
                  <div className="profile-detail-value">
                    <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="profile-detail-item">
                <div className="profile-detail-icon">📱</div>
                <div style={{ flex: 1 }}>
                  <div className="profile-detail-label">Phone Number</div>
                  {editMode ? (
                    <input
                      type="tel"
                      className="profile-edit-input"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+94 XX XXX XXXX"
                    />
                  ) : (
                    <div className="profile-detail-value">{profile.phone || '—'}</div>
                  )}
                </div>
              </div>

              <div className="profile-detail-item">
                <div className="profile-detail-icon">📚</div>
                <div style={{ flex: 1 }}>
                  <div className="profile-detail-label">Degree Program</div>
                  {editMode ? (
                    <input
                      type="text"
                      className="profile-edit-input"
                      value={profile.degree}
                      onChange={(e) => setProfile((p) => ({ ...p, degree: e.target.value }))}
                      placeholder="BSc (Hons) in IT"
                    />
                  ) : (
                    <div className="profile-detail-value">{profile.degree || '—'}</div>
                  )}
                </div>
              </div>

              <div className="profile-detail-item">
                <div className="profile-detail-icon">🗓️</div>
                <div style={{ flex: 1 }}>
                  <div className="profile-detail-label">Year of Study</div>
                  {editMode ? (
                    <select
                      className="profile-edit-input"
                      value={profile.year}
                      onChange={(e) => setProfile((p) => ({ ...p, year: e.target.value }))}
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  ) : (
                    <div className="profile-detail-value">{profile.year || '—'}</div>
                  )}
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">📅</div>
                <div>
                  <div className="profile-detail-label">Member Since</div>
                  <div className="profile-detail-value">{joinDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
        <div className="profile-right">

          {/* ── Change Password Card ───────────────────────────── */}
          <div className="glass-card profile-panel" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 6 }}>Change Password</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN')
                ? 'Update your staff account password. Changes apply immediately.'
                : 'Update your account password.'}
            </p>

            {pwStatus.msg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 10,
                marginBottom: 16,
                fontSize: '0.82rem',
                fontWeight: 500,
                background: pwStatus.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${pwStatus.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                color: pwStatus.type === 'success' ? '#34D399' : '#F87171',
              }}>
                {pwStatus.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="auth-form" style={{ gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">🔒</span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={form.current}
                    onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">🔑</span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min 6 characters"
                    value={form.newPass}
                    onChange={e => setForm(p => ({ ...p, newPass: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="form-input-wrapper">
                  <span className="form-input-icon">✅</span>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={form.confirm}
                    onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary btn-glow"
                disabled={saving || !form.current || !form.newPass || !form.confirm}
              >
                {saving ? '⏳ Saving…' : '🔐 Update Password'}
              </button>
            </form>
          </div>

          {/* ── Sign Out ───────────────────────────────────────── */}
          <button
            className="btn-primary btn-danger profile-signout-btn"
            onClick={logout}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
