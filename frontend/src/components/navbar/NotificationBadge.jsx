import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationService } from '../../services/notificationService';

const TYPE_LABEL = {
  BOOKING: 'BK',
  TICKET: 'TK',
  SYSTEM: 'SY',
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

<<<<<<< Updated upstream
function NotificationBadge({ role = 'USER' }) {
=======
export default function NotificationBadge({ role = 'USER' }) {
>>>>>>> Stashed changes
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    const data = await notificationService.getNotifications(role);
    setNotifications(data);
  }, [role]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  return (
    <div className="auth-notification" ref={wrapRef}>
      <button
        type="button"
        className="auth-notification__trigger"
        aria-label="Open notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="auth-notification__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      <div className={`auth-notification__panel ${open ? 'is-open' : ''}`}>
        <div className="auth-notification__header">
          <strong>Notifications</strong>
          <span>{unreadCount} unread</span>
        </div>

        <div className="auth-notification__list">
          {notifications.length === 0 ? (
            <p className="auth-notification__empty">No notifications</p>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`auth-notification__item ${item.read ? '' : 'is-unread'}`}
                onClick={() => handleRead(item.id)}
              >
                <span className="auth-notification__type">{TYPE_LABEL[item.type] ?? 'IN'}</span>
                <span className="auth-notification__content">
                  <strong>{item.title}</strong>
                  <small>{item.message}</small>
                </span>
                <span className="auth-notification__time">{timeAgo(item.createdAt)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
<<<<<<< Updated upstream

export default NotificationBadge;
=======
>>>>>>> Stashed changes
