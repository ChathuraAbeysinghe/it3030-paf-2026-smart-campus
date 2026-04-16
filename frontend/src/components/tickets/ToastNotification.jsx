import { useState, useEffect, useCallback } from 'react';

/**
 * Toast Notification System — top-right stack with auto-dismiss.
 */
let toastId = 0;
let listeners = [];

export function addToast(type, message, duration = 4000) {
  const id = ++toastId;
  const toast = { id, type, message, duration };
  listeners.forEach(fn => fn(toast));
  return id;
}

export function toast(msg) { return addToast('info', msg); }
toast.success = (msg) => addToast('success', msg);
toast.error = (msg) => addToast('error', msg);
toast.warning = (msg) => addToast('warning', msg);
toast.info = (msg) => addToast('info', msg);

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => {
        const next = [...prev, { ...t, entering: true }];
        return next.slice(-3); // Max 3 toasts
      });
      // Auto-dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, t.duration);
      // Remove entering flag
      setTimeout(() => {
        setToasts(prev => prev.map(x => x.id === t.id ? { ...x, entering: false } : x));
      }, 50);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter(fn => fn !== handler); };
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item toast-${t.type} ${t.entering ? 'toast-entering' : ''}`}>
          <span className="toast-icon">{icons[t.type] || 'ℹ️'}</span>
          <span className="toast-message">{t.message}</span>
          <button className="toast-dismiss" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
