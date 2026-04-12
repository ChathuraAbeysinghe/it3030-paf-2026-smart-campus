import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import AvailabilityChecker from './AvailabilityChecker';
import StatusBadge from './StatusBadge';

export default function BookingApprovalPanel({ pendingBookings, onApprove, onReject }) {
  var [selectedId, setSelectedId]           = useState('');
  var [adminNotes, setAdminNotes]           = useState('');
  var [conflicts, setConflicts]             = useState([]);
  var [loadingConflicts, setLoadingConflicts] = useState(false);

  var [actionError, setActionError] = useState('');

  useEffect(function () {
    if (!Array.isArray(pendingBookings) || pendingBookings.length === 0) {
      setSelectedId('');
      return;
    }
    if (!selectedId) {
      setSelectedId(pendingBookings[0].id);
    }
  }, [pendingBookings, selectedId]);

  var selectedBooking = useMemo(function () {
    return (pendingBookings || []).find(function (booking) {
      return booking.id === selectedId;
    }) || null;
  }, [pendingBookings, selectedId]);

  useEffect(function () {
    if (!selectedBooking) {
      setConflicts([]);
      return;
    }

    var cancelled = false;
    (async function () {
      setLoadingConflicts(true);
      try {
        var rows = await bookingService.getFacilityConflicts(selectedBooking.facilityId, selectedBooking.date);
        if (!cancelled) setConflicts(rows);
      } catch {
        if (!cancelled) setConflicts([]);
      } finally {
        if (!cancelled) setLoadingConflicts(false);
      }
    })();

    return function () { cancelled = true; };
  }, [selectedBooking]);

  async function handleApprove() {
    if (!selectedBooking) return;
    try {
      setActionError('');
      await onApprove(selectedBooking.id, adminNotes || 'Approved by admin');
      setAdminNotes('');
    } catch (err) {
      setActionError(err.message || 'Failed to approve booking');
    }
  }

  async function handleReject() {
    if (!selectedBooking) return;
    if (!adminNotes.trim()) {
      window.alert('Please add a rejection reason.');
      return;
    }
    try {
      setActionError('');
      await onReject(selectedBooking.id, adminNotes.trim());
      setAdminNotes('');
    } catch (err) {
      setActionError(err.message || 'Failed to reject booking');
    }
  }

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 10 }}>Booking Approval Panel</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
        Review pending requests and approve or reject with admin notes.
      </p>

      {(!pendingBookings || pendingBookings.length === 0) ? (
        <p style={{ color: 'var(--text-muted)' }}>No pending bookings right now.</p>
      ) : (
        <>
          <select
            className="form-input"
            style={{ marginBottom: 12 }}
            value={selectedId}
            onChange={function (e) { setSelectedId(e.target.value); }}
          >
            {(pendingBookings || []).map(function (booking) {
              var label = (booking.facilityName || booking.resourceName || booking.facilityId)
                + ' | ' + booking.date
                + ' | ' + booking.startTime + '-' + booking.endTime
                + ' | ' + (booking.userName || 'Unknown User');

              return (
                <option key={booking.id} value={booking.id}>{label}</option>
              );
            })}
          </select>

          {selectedBooking && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div className="glass-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div><strong>Facility:</strong> {selectedBooking.facilityName || selectedBooking.resourceName || selectedBooking.facilityId}</div>
                    <div><strong>User:</strong> {selectedBooking.userName}</div>
                    <div><strong>Date & Time:</strong> {selectedBooking.date} | {selectedBooking.startTime} - {selectedBooking.endTime}</div>
                    <div><strong>Purpose:</strong> {selectedBooking.purpose}</div>
                  </div>
                  <div>
                    <StatusBadge status={selectedBooking.status} />
                  </div>
                </div>
              </div>

              {loadingConflicts ? (
                <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Loading conflict data...</div>
              ) : (
                <AvailabilityChecker
                  conflicts={conflicts}
                  startTime={selectedBooking.startTime}
                  endTime={selectedBooking.endTime}
                  excludeBookingId={selectedBooking.id}
                  selectedDate={selectedBooking.date}
                  onDateSelect={function () {}}
                />
              )}

              <textarea
                className="form-input"
                rows="3"
                placeholder="Admin notes (required for rejection)"
                value={adminNotes}
                onChange={function (e) { setAdminNotes(e.target.value); }}
              />

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn-sm btn-sm--success" onClick={handleApprove}>Approve Booking</button>
                <button className="btn-sm btn-sm--danger" onClick={handleReject}>Reject Booking</button>

                {/*Show action error*/}
                {actionError && (
                  <span style={{ color: '#F87171', fontSize: '0.85rem' }}>
                    ⚠️ {actionError}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
