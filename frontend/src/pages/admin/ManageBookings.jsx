import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import AllBookings from '../../components/AllBookings';
import BookingApprovalPanel from '../../components/BookingApprovalPanel';

/**
 * Admin — Manage Bookings (approve/reject).
 */
export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAll();
      setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const replaceBooking = (updated) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const handleApprove = async (id, notes) => {
    const updated = await bookingService.approve(id, notes || 'Approved by admin');
    replaceBooking(updated);
  };

  const handleReject = async (id, reason) => {
    const updated = await bookingService.reject(id, reason);
    replaceBooking(updated);
  };

  const handleCancel = async (id) => {
    const updated = await bookingService.cancel(id);
    replaceBooking(updated);
  };

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Manage Bookings</h1>
        <p>Review all booking requests and process pending approvals.</p>
      </div>

      {error && (
        <div className="glass-card" style={{ marginBottom: 14, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Loading bookings...</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <BookingApprovalPanel
            pendingBookings={pendingBookings}
            onApprove={handleApprove}
            onReject={handleReject}
          />

          <AllBookings
            bookings={bookings}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="btn-sm" onClick={load}>Refresh</button>
      </div>
    </div>
  );
}
