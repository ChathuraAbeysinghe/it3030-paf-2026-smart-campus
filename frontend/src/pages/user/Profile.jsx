import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * User Profile page — with Change Password for all roles.
 */
export default function Profile() {
  const { user, logout, changePassword } = useAuth();

  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ msg: '', type: '' }); // type: 'success' | 'error'
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and personal information.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>

        {/* ── Profile Info Card ── */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Account Information</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            {user?.picture
              ? <img src={user.picture} alt="" className="user-avatar" style={{ width: 64, height: 64 }} />
              : <div className="user-avatar-placeholder" style={{ width: 64, height: 64, fontSize: '1.6rem' }}>{user?.name?.[0]}</div>
            }
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{user?.name}</div>
              <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <div className="profile-field-label">📧 Email</div>
              <div className="profile-field-value">{user?.email}</div>
            </div>
            {user?.itNumber && (
              <div className="profile-field">
                <div className="profile-field-label">🆔 IT Number</div>
                <div className="profile-field-value">{user.itNumber}</div>
              </div>
            )}
            {user?.faculty && (
              <div className="profile-field">
                <div className="profile-field-label">🎓 Faculty</div>
                <div className="profile-field-value">{user.faculty}</div>
              </div>
            )}
            <div className="profile-field">
              <div className="profile-field-label">🛡️ Role</div>
              <div className="profile-field-value">{user?.role}</div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={logout}
            style={{ marginTop: 24, background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.3)', color: '#F87171' }}
          >
            🚪 Sign Out
          </button>
        </div>

        {/* ── Change Password Card ── */}
        <div className="glass-card" style={{ padding: 28 }}>
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

      </div>
    </div>
  );
}
