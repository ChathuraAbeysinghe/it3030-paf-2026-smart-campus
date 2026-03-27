import { useNotifications } from '../../hooks/useNotifications';

/**
 * Technician Notifications page.
 */
export default function TechNotifications() {
  const { notifications, markAsRead } = useNotifications('TECHNICIAN');

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Notifications</h1>
        <p>Your alerts and ticket updates.</p>
      </div>

      <div className="notif-page-list">
        {notifications.length === 0 && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</p>
            <p>All caught up! No notifications.</p>
          </div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`notif-page-item glass-card ${n.read ? '' : 'notif-page-item--unread'}`}
            onClick={() => markAsRead(n.id)}
          >
            <div className="notif-page-icon">
              {n.type === 'TICKET' ? '🎫' : '📢'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{n.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {timeAgo(n.createdAt)}
            </div>
            {!n.read && <div className="notif-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
