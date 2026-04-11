import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/api';

/**
 * Hook to manage notifications for a given role.
 * Returns { notifications, unreadCount, markAsRead, refresh }
 */
export function useNotifications(role) {
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    if (!role) return;
    const data = await notificationService.getByRole(role);
    setNotifications(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  }, [role]);

  useEffect(() => { refresh(); }, [refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return { notifications, unreadCount, markAsRead, refresh };
}
