import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import AvailabilityChecker from './AvailabilityChecker';
import StatusBadge from './StatusBadge';

export default function BookingApprovalPanel({ pendingBookings, onApprove, onReject }) {
  const [selectedId,       setSelectedId]       = useState('');
  const [adminNotes,       setAdminNotes]       = useState('');
  const [conflicts,        setConflicts]        = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [actionError,      setActionError]      = useState('');
  const [rejectMode,       setRejectMode]       = useState(false);

  // Auto-select first pending booking
  useEffect(() => {
    if (!Array.isArray(pendingBookings) || pendingBookings.length === 0) {
      setSelectedId('');
      return;
    }
    if (!selectedId || !pendingBookings.find(b => b.id === selectedId)) {
      setSelectedId(pendingBookings[0].id);
    }
  }, [pendingBookings]);

  const selectedBooking = useMemo(() =>
    (pendingBookings || []).find(b => b.id === selectedId) || null,
  [pendingBookings, selectedId]);

  // Load conflicts when selected booking changes
  useEffect(() => {
    if (!selectedBooking) { setConflicts([]); return; }
    let cancelled = false;
    setLoadingConflicts(true);
    bookingService.getFacilityConflicts(selectedBooking.facilityId, selectedBooking.date)
      .then(rows  => { if (!cancelled) setConflicts(rows); })
      .catch(()   => { if (!cancelled) setConflicts([]); })
      .finally(() => { if (!cancelled) setLoadingConflicts(false); });
    return () => { cancelled = true; };
  }, [selectedBooking?.id]);

  // Reset notes when switching booking
  useEffect(() => {
    setAdminNotes('');
    setActionError('');
    setRejectMode(false);
  }, [selectedId]);

  async function handleApprove() {
    if (!selectedBooking) return;
    try {
      setActionError('');
      await onApprove(selectedBooking.id, adminNotes || 'Approved by admin');
      setAdminNotes('');
      setRejectMode(false);
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking');
    }
  }

  async function handleReject() {
    if (!selectedBooking) return;
    if (!adminNotes.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    try {
      setActionError('');
      await onReject(selectedBooking.id, adminNotes.trim());
      setAdminNotes('');
      setRejectMode(false);
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking');
    }
  }

  if (!pendingBookings || pendingBookings.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: '2rem', marginBottom: 8 }}>✅</p>
        <p style={{ fontWeight: 600, color: 'var(--text)' }}>All caught up!</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
          No pending bookings to review.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

      {/* ── LEFT: Pending list ───────────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
            Pending Requests
          </span>
          <span style={{
            marginLeft: 8, fontSize: '0.7rem', fontWeight: 700,
            background: 'rgba(251,191,36,0.2)', color: '#FBBF24',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 20, padding: '2px 8px',
          }}>
            {pendingBookings.length}
          </span>
        </div>

        <div style={{ maxHeight: 520, overflowY: 'auto', scrollbarWidth: 'thin' }}>
          {pendingBookings.map(b => {
            const isSelected = b.id === selectedId;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(0,173,181,0.1)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text)', marginBottom: 4 }}>
                  {b.facilityName || b.resourceName || b.facilityId}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                  👤 {b.userName || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                  📅 {b.date} &nbsp;🕐 {b.startTime}–{b.endTime}
                </div>
                {b.bookingType && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: b.bookingType === 'REQUEST' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                    color: b.bookingType === 'REQUEST' ? '#FBBF24' : '#34D399',
                    border: b.bookingType === 'REQUEST' ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.3)',
                  }}>
                    {b.bookingType}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Detail + Actions ──────────────────────────── */}
      {selectedBooking ? (
        <div style={{ display: 'grid', gap: 14 }}>

          {/* Booking info card */}
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, marginBottom: 4, fontSize: '1rem' }}>
                  {selectedBooking.facilityName || selectedBooking.resourceName || selectedBooking.facilityId}
                </h3>
                <StatusBadge status={selectedBooking.status} />
              </div>
              {selectedBooking.bookingType && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: selectedBooking.bookingType === 'REQUEST' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                  color: selectedBooking.bookingType === 'REQUEST' ? '#FBBF24' : '#34D399',
                  border: selectedBooking.bookingType === 'REQUEST' ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(52,211,153,0.3)',
                }}>
                  {selectedBooking.bookingType === 'REQUEST' ? '📩 REQUEST' : '📋 BOOKING'}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.83rem' }}>
              {[
                { label: 'Requested by', value: selectedBooking.userName },
                { label: 'Date',         value: selectedBooking.date },
                { label: 'Time',         value: `${selectedBooking.startTime} – ${selectedBooking.endTime}` },
                { label: 'Attendees',    value: selectedBooking.expectedAttendees },
                { label: 'Capacity',     value: selectedBooking.facilityCapacity || 'N/A' },
                { label: 'Min required', value: selectedBooking.minimumAttendeesRequired || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>{label}</div>
                  <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: '0.83rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: 2 }}>Purpose</div>
              <div style={{ color: 'var(--text)' }}>{selectedBooking.purpose}</div>
            </div>

            {/* REQUEST warning */}
            {selectedBooking.bookingType === 'REQUEST' && (
              <div style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.3)',
                fontSize: '0.8rem', color: '#FBBF24',
              }}>
                ⚠️ This is a <strong>REQUEST</strong> — attendees are below 60% of facility capacity.
                Admin discretion required.
              </div>
            )}
          </div>

          {/* Availability checker */}
          {loadingConflicts ? (
            <div className="glass-card" style={{ padding: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Checking conflicts...
            </div>
          ) : (
            <AvailabilityChecker
              conflicts={conflicts}
              startTime={selectedBooking.startTime}
              endTime={selectedBooking.endTime}
              excludeBookingId={selectedBooking.id}
              selectedDate={selectedBooking.date}
              onDateSelect={() => {}}
            />
          )}

          {/* Action area */}
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ marginBottom: 10, fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)' }}>
              {rejectMode ? '✕ Reject Booking' : 'Admin Notes'}
            </div>

            <textarea
              className="form-input"
              rows="3"
              placeholder={rejectMode
                ? 'Rejection reason (required)...'
                : 'Optional notes for approval...'}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              style={{ marginBottom: 10 }}
              autoFocus={rejectMode}
            />

            {actionError && (
              <div style={{
                marginBottom: 10, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#F87171', fontSize: '0.82rem',
              }}>
                ⚠️ {actionError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!rejectMode ? (
                <>
                  <button className="btn-sm btn-sm--success" onClick={handleApprove}>
                    ✅ Approve Booking
                  </button>
                  <button
                    className="btn-sm btn-sm--danger"
                    onClick={() => { setRejectMode(true); setActionError(''); }}
                  >
                    ✕ Reject
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-sm btn-sm--danger"
                    onClick={handleReject}
                    disabled={!adminNotes.trim()}
                  >
                    ✕ Confirm Reject
                  </button>
                  <button
                    className="btn-sm"
                    onClick={() => { setRejectMode(false); setAdminNotes(''); setActionError(''); }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Select a booking from the list to review.
        </div>
      )}
    </div>
  );
}