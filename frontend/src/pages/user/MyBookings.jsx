import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QRCheckin from '../../components/QRCheckin';
import GlassModal from '../../components/GlassModal';

/**
 * My Bookings — booking list with status, QR check-in, and cancel.
 */
export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await bookingService.getAll();
      setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    })();
  }, []);

  const handleCancel = async (id) => {
    await bookingService.updateStatus(id, 'CANCELLED');
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
  };

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>My Bookings</h1>
        <p>Track and manage your resource bookings.</p>
      </div>

      <div className="booking-list">
        {bookings.length === 0 && (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📅</p>
            <p>No bookings yet. Browse resources to make your first booking.</p>
          </div>
        )}

        {bookings.map(b => (
          <div key={b.id} className="booking-card glass-card">
            <div className="booking-card-left">
              <div className="booking-date">
                <div className="booking-date-day">{new Date(b.date).getDate()}</div>
                <div className="booking-date-month">{new Date(b.date).toLocaleString('default', { month: 'short' })}</div>
              </div>
            </div>
            <div className="booking-card-body">
              <h3>{b.resourceName}</h3>
              <div className="booking-meta">
                <span>🕐 {b.startTime} — {b.endTime}</span>
                <span>📋 {b.purpose}</span>
              </div>
            </div>
            <div className="booking-card-right">
              <StatusBadge status={b.status} />
              <div className="booking-actions" style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                {b.status === 'APPROVED' && b.qrCode && (
                  <button className="btn-sm btn-sm--primary" onClick={() => setQrModal(b)}>📱 QR Check-in</button>
                )}
                {b.status === 'PENDING' && (
                  <button className="btn-sm btn-sm--danger" onClick={() => handleCancel(b.id)}>Cancel</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      <GlassModal open={!!qrModal} onClose={() => setQrModal(null)} title="Check-in QR Code" width={320}>
        {qrModal && <QRCheckin bookingId={qrModal.id} qrCode={qrModal.qrCode} />}
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Show this QR code at <strong>{qrModal?.resourceName}</strong> to check in.
        </p>
      </GlassModal>
    </div>
  );
}
