import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './profile.css';
import './modern-pages.css';

/**
 * User Profile page — Extended Personal Details, Activity Summary,
 * Virtual ID Card, and Change Password.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();
  const userRole = user?.role ?? 'USER';

  const profileRouteByRole = {
    ADMIN: '/admin/profile',
    TECHNICIAN: '/technician/profile',
    USER: '/profile',
  };

  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState({ msg: '', type: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwStatus({ msg: '', type: '' });

    if (form.newPass.length < 6) {
      setPwStatus({ msg: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (form.newPass !== form.confirm) {
      setPwStatus({ msg: 'New passwords do not match.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await changePassword(form.current, form.newPass);
      setPwStatus({ msg: 'Password changed successfully!', type: 'success' });
      setForm({ current: '', newPass: '', confirm: '' });

      setTimeout(() => {
        navigate(profileRouteByRole[user?.role] ?? '/profile');
      }, 1200);
    } catch (err) {
      setPwStatus({ msg: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const activityStats = [
    { icon: '📅', value: 12, label: 'Total Bookings', color: '#00ADB5' },
    { icon: '✅', value: 8, label: 'Completed', color: '#34D399' },
    { icon: '⏳', value: 3, label: 'Pending Tickets', color: '#FBBF24' },
    { icon: '🛠️', value: 1, label: 'In Progress', color: '#818CF8' },
  ];

  const accountTypeByRole = {
    ADMIN: 'Staff Account',
    TECHNICIAN: 'Technical Account',
    USER: 'Student Account',
  };
  const accountType = accountTypeByRole[userRole] ?? 'Campus Account';
  const loginMethod = user?.email?.includes('@sliit.lk') ? 'SLIIT Email' : 'Campus Login';
  const joinDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="page-content animate-in user-modern-page user-modern-profile">
      <div className="content-header">
        <h1>My Profile</h1>
        <p>Manage your account settings and personal information.</p>
      </div>

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
        <div className="profile-left">
          <div className="virtual-id-card">
            <div className="vid-header">
              <div className="vid-logo">🎓</div>
              <div className="vid-institution">
                <span className="vid-uni">SLIIT</span>
                <span className="vid-label">Smart Campus</span>
              </div>
              <div className="vid-badge-type">{accountType}</div>
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
                <div className="vid-id" style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 2 }}>{userRole}</div>
                <div className="vid-faculty">{loginMethod}</div>
              </div>
            </div>

            <div className="vid-footer">
              <div className="vid-detail">
                <span className="vid-detail-label">Email</span>
                <span className="vid-detail-value">{user?.email}</span>
              </div>
              <div className="vid-detail">
                <span className="vid-detail-label">Valid</span>
                <span className="vid-detail-value">{currentYear} - {currentYear + 1}</span>
              </div>
            </div>
          </div>

          <div className="glass-card profile-details-card">
            <div className="profile-details-header">
              <h3>Personal Information</h3>
              <span className="role-badge" style={{ color: '#1B2A4A', borderColor: '#E2E8F0', background: '#F8FAFC' }}>
                {accountType}
              </span>
            </div>

            <div className="profile-detail-grid">
              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">@</div>
                <div>
                  <div className="profile-detail-label">Email</div>
                  <div className="profile-detail-value">{user?.email}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">R</div>
                <div>
                  <div className="profile-detail-label">Role</div>
                  <div className="profile-detail-value">
                    <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">N</div>
                <div>
                  <div className="profile-detail-label">Name</div>
                  <div className="profile-detail-value">{user?.name || '-'}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">M</div>
                <div>
                  <div className="profile-detail-label">Member Since</div>
                  <div className="profile-detail-value">{joinDate}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">S</div>
                <div>
                  <div className="profile-detail-label">Session Type</div>
                  <div className="profile-detail-value">{loginMethod}</div>
                </div>
              </div>

              <div className="profile-detail-item profile-detail--locked">
                <div className="profile-detail-icon">V</div>
                <div>
                  <div className="profile-detail-label">Profile Valid</div>
                  <div className="profile-detail-value">{currentYear} - {currentYear + 1}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-right">
          <div className="glass-card profile-panel" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 6 }}>Change Password</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              {(userRole === 'ADMIN' || userRole === 'TECHNICIAN')
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
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>

          <button
            className="btn-primary btn-danger profile-signout-btn"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
