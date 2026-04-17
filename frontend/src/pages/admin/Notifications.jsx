import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const TICKET_TYPES = new Set(['TICKET', 'TICKET_CREATED', 'TICKET_ASSIGNED', 'STATUS_UPDATED', 'COMMENT_ADDED', 'DISPUTED', 'CLOSED']);

/**
 * Admin Notifications — full page list.
 */
export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications('ADMIN');

  const handleOpen = async (notification) => {
    await markAsRead(notification.id);
    if (notification.relatedTicketId) {
      navigate(`/admin/tickets/${notification.relatedTicketId}?tab=chat`);
    }
  };

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Notifications</h1>
        <p>All system alerts and updates.</p>
      </div>

      <div className="notif-page-list">
        {notifications.length === 0 && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</p>
            <p>No notifications.</p>
          </div>
        )}
        {notifications.map(n => (
          <div
            key={n.id}
            className={`notif-page-item glass-card ${n.read ? '' : 'notif-page-item--unread'}`}
            onClick={() => handleOpen(n)}
          >
            <div className="notif-page-icon">
              {n.type === 'BOOKING' ? '📅' : TICKET_TYPES.has(n.type) ? '🎫' : '📢'}
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
