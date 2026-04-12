import { useState, useEffect } from 'react';
import { bookingService, resourceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import QRCheckin from '../../components/QRCheckin';
import GlassModal from '../../components/GlassModal';
import BookingForm from '../../components/BookingForm';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [qrModal, setQrModal] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bookingRows, resourceRows] = await Promise.all([
        bookingService.getAll(),
        resourceService.getAll(),
      ]);

      setBookings(bookingRows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setResources(resourceRows || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    }
  };

  const handleBookingSaved = (saved, actionType) => {
    setBookings(prev => {
      const exists = prev.some(b => b.id === saved.id);
      const next = exists
        ? prev.map(b => (b.id === saved.id ? saved : b))
        : [saved, ...prev];
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    if (actionType === 'updated') {
      setEditingBooking(null);
    }
  };

  const handleCancel = async (id) => {
    try {
      const updated = await bookingService.cancel(id);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>My Bookings</h1>
        <p>Create, edit, and manage your booking requests.</p>
      </div>

      {error && (
        <div className="glass-card" style={{ marginBottom: 14, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)' }}>
          {error}
        </div>
      )}

      <BookingForm
        resources={resources}
        initialBooking={editingBooking}
        onSaved={handleBookingSaved}
        onCancelEdit={() => setEditingBooking(null)}
      />

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
              <h3>{b.facilityName || b.resourceName || b.facilityId}</h3>
              <div className="booking-meta">
                <span>🕐 {b.startTime} — {b.endTime}</span>
                <span>📋 {b.purpose}</span>
                <span>👥 {b.expectedAttendees || '-'} attendees</span>
                {b.adminNotes ? <span>📝 {b.adminNotes}</span> : null}
              </div>
            </div>
            <div className="booking-card-right">
              <StatusBadge status={b.status} />
              <div className="booking-actions" style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>

                {b.status === 'APPROVED' && b.qrCode && (
                  <button className="btn-sm btn-sm--primary" onClick={() => setQrModal(b)}>📱 QR Check-in</button>
                )}

                {b.status === 'PENDING' && (
                  <>
                    <button className="btn-sm" onClick={() => setEditingBooking(b)}>Edit</button>
                    <button className="btn-sm btn-sm--danger" onClick={() => handleCancel(b.id)}>Cancel</button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting admin review</span>
                  </>
                )}

                {b.status === 'APPROVED' && (
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
