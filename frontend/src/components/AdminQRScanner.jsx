/**
 * AdminQRScanner.jsx
 * Admin enters/pastes QR code → looks up booking → confirms check-in.
 * Used in ManageBookings admin panel.
 */
import { useState } from 'react';
import { bookingService } from '../../services/api';
import StatusBadge from '../StatusBadge';
import QRCheckin from '../QRCheckin';

export default function AdminQRScanner() {
  const [qrInput,  setQrInput]  = useState('');
  const [booking,  setBooking]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!qrInput.trim()) return;
    setLoading(true); setError(''); setBooking(null); setSuccess('');
    try {
      const data = await bookingService.getByQrCode(qrInput.trim().toUpperCase());
      setBooking(data);
    } catch (err) {
      setError(err.message || 'QR code not found.');
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    if (!booking) return;
    setChecking(true); setError(''); setSuccess('');
    try {
      const updated = await bookingService.checkIn(booking.id);
      setBooking(updated);
      setSuccess('✅ Check-in successful! Booking marked as attended.');
    } catch (err) {
      setError(err.message || 'Check-in failed.');
    } finally { setChecking(false); }
  };

  const reset = () => { setQrInput(''); setBooking(null); setError(''); setSuccess(''); };

  const isExpired = booking && !booking.checkedIn && (() => {
    const now = new Date();
    const bookingDate = new Date(booking.date + 'T' + booking.startTime);
    return now > new Date(bookingDate.getTime() + 30 * 60 * 1000);
  })();

  return (
    <div className="glass-card" style={{ padding: '20px 24px', maxWidth: 520 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: '1.4rem' }}>📷</span>
        <div>
          <h3 style={{ margin: 0 }}>QR Check-In Scanner</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Enter or scan the QR code to check in a booking
          </p>
        </div>
      </div>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <div className="form-input-wrapper" style={{ flex: 1 }}>
          <span className="form-input-icon">🔑</span>
          <input className="form-input" value={qrInput}
            onChange={e => { setQrInput(e.target.value.toUpperCase()); setError(''); }}
            placeholder="e.g. QR-A1B2C3D4-2026"
            style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.5px' }}
            autoFocus />
        </div>
        <button type="submit" className="btn-sm btn-sm--primary" disabled={loading || !qrInput.trim()}>
          {loading ? '...' : 'Look Up'}
        </button>
        {booking && <button type="button" className="btn-sm" onClick={reset}>✕</button>}
      </form>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
          color: '#F87171', fontSize: '0.83rem' }}>⚠️ {error}</div>
      )}
      {success && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)',
          color: '#34D399', fontSize: '0.83rem', fontWeight: 600 }}>{success}</div>
      )}

      {booking && (
        <div style={{ marginTop: 16 }}>
          {/* Status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
            background: booking.checkedIn ? 'rgba(52,211,153,0.08)' : isExpired ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${booking.checkedIn ? 'rgba(52,211,153,0.3)' : isExpired ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={booking.status} />
              {booking.checkedIn && (
                <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>
                  ✓ Checked in {booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString() : ''}
                </span>
              )}
              {!booking.checkedIn && isExpired && (
                <span style={{ fontSize: '0.78rem', color: '#F87171', fontWeight: 600 }}>
                  ⚠ 30-min window expired
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {booking.startTime} – {booking.endTime}
            </span>
          </div>

          {/* Booking info */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            {[
              { icon: '🏛️', label: 'Facility',   value: booking.facilityName || booking.facilityId },
              { icon: '👤', label: 'User',        value: `${booking.userName}${booking.userEmail ? ` (${booking.userEmail})` : ''}` },
              { icon: '📅', label: 'Date',        value: booking.date },
              { icon: '🕐', label: 'Time',        value: `${booking.startTime} – ${booking.endTime}` },
              { icon: '👥', label: 'Attendees',   value: `${booking.expectedAttendees}${booking.facilityCapacity ? ` / ${booking.facilityCapacity} capacity` : ''}` },
              { icon: '📋', label: 'Purpose',     value: booking.purpose },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', gap: 10, padding: '9px 14px',
                borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                <span style={{ flexShrink: 0 }}>{icon}</span>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, width: 72 }}>{label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          {!booking.checkedIn && booking.status === 'APPROVED' && (
            <button className="btn-primary btn-glow" style={{ width: '100%' }}
              onClick={handleCheckIn} disabled={checking}>
              {checking ? '⏳ Processing...' : '✅ Mark as Checked In'}
            </button>
          )}

          {booking.status !== 'APPROVED' && !booking.checkedIn && (
            <div style={{ padding: '10px 14px', borderRadius: 8,
              background: 'rgba(156,163,175,0.08)', border: '1px solid rgba(156,163,175,0.2)',
              fontSize: '0.83rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              This booking is <strong>{booking.status}</strong> — check-in only allowed for APPROVED bookings.
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
            <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center' }}>
              <QRCheckin qrCode={booking.qrCode} booking={booking} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}