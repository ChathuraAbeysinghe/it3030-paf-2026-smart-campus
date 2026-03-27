/**
 * Slide-in notification panel.
 */
export default function NotificationPanel({ open, onClose, notifications, onMarkRead }) {
  return (
    <div className={`notif-panel ${open ? 'notif-panel--open' : ''}`}>
      <div className="notif-panel-header">
        <h3>🔔 Notifications</h3>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="notif-panel-list">
        {notifications.length === 0 && (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</p>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`notif-item ${n.read ? '' : 'notif-item--unread'}`}
            onClick={() => onMarkRead(n.id)}
          >
            <div className="notif-item-icon">
              {n.type === 'BOOKING' ? '📅' : n.type === 'TICKET' ? '🎫' : '📢'}
            </div>
            <div className="notif-item-content">
              <div className="notif-item-title">{n.title}</div>
              <div className="notif-item-message">{n.message}</div>
              <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
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
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
