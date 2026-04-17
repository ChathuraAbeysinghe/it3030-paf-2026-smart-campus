/**
 * NotificationBell.jsx
 * ─────────────────────────────────────────────────────────────────
 * Bell icon + animated floating dropdown panel.
 * Features: badge count, mark-as-read, mark-all-read, clear-all.
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

const TYPE_ICON = {
  BOOKING: '📅',
  TICKET:  '🎫',
  TICKET_CREATED: '🎫',
  TICKET_ASSIGNED: '🎫',
  STATUS_UPDATED: '🎫',
  COMMENT_ADDED: '🎫',
  DISPUTED: '🎫',
  CLOSED: '🎫',
  SYSTEM:  '📢',
};

function ticketPathByRole(role, ticketId) {
  if (!ticketId) return null;
  if (role === 'ADMIN') return `/admin/tickets/${ticketId}?tab=chat`;
  if (role === 'TECHNICIAN') return `/technician/tickets/${ticketId}?tab=conversation`;
  return `/tickets/${ticketId}?tab=conversation`;
}

export default function NotificationBell({ role }) {
  const navigate = useNavigate();
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef               = useRef(null);

  /* ── Load notifications ─────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!role) return;
    const data = await notificationService.getNotifications(role);
    setNotifications(data);
  }, [role]);

  useEffect(() => {
    load();
    const timerId = window.setInterval(load, 30000);
    return () => window.clearInterval(timerId);
  }, [load]);

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  /* ── Actions ────────────────────────────────────────────────── */
  const handleMarkRead = async (notification) => {
    await notificationService.markAsRead(notification.id);
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));

    const path = ticketPathByRole(role, notification.relatedTicketId);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(role);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    await notificationService.clearAll(role);
    setNotifications([]);
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="nb-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className={`nb-bell ${open ? 'nb-bell--active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown Panel */}
      <div className={`nb-dropdown glass-card ${open ? 'nb-dropdown--open' : ''}`}>
        {/* Header */}
        <div className="nb-header">
          <div className="nb-header-left">
            <span className="nb-header-title">🔔 Notifications</span>
            {unreadCount > 0 && (
              <span className="nb-unread-count">{unreadCount} unread</span>
            )}
          </div>
          <div className="nb-header-actions">
            {unreadCount > 0 && (
              <button className="nb-action-btn" onClick={handleMarkAllRead} title="Mark all as read">
                ✓ All read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="nb-action-btn nb-action-btn--danger" onClick={handleClearAll} title="Clear all">
                🗑
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="nb-list">
          {notifications.length === 0 ? (
            <div className="nb-empty">
              <span className="nb-empty-icon">🔔</span>
              <span>All caught up!</span>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`nb-item ${n.read ? '' : 'nb-item--unread'}`}
                onClick={() => handleMarkRead(n)}
                role="button"
                tabIndex={0}
              >
                <div className="nb-item-icon">{TYPE_ICON[n.type] ?? '📢'}</div>
                <div className="nb-item-body">
                  <div className="nb-item-title">{n.title}</div>
                  <div className="nb-item-msg">{n.message}</div>
                  <div className="nb-item-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <div className="nb-item-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
