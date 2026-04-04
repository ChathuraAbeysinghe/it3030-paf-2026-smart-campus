import StatusBadge from './StatusBadge';

function toMinutes(timeValue) {
  if (!timeValue) return 0;
  var parts = String(timeValue).split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

function hasOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

export default function AvailabilityChecker({
  conflicts,
  startTime,
  endTime,
  excludeBookingId,
}) {
  var safeConflicts = Array.isArray(conflicts) ? conflicts : [];

  var bookedSlots = safeConflicts.filter(function (b) {
    return b.id !== excludeBookingId;
  });

  var overlapping = bookedSlots.filter(function (b) {
    if (!startTime || !endTime) return false;
    return hasOverlap(startTime, endTime, b.startTime, b.endTime);
  });

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 10 }}>Availability Checker</h3>

      {!startTime || !endTime ? (
        <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
          Pick a start and end time to validate overlap.
        </p>
      ) : overlapping.length > 0 ? (
        <div style={{ color: '#F87171', marginBottom: 10 }}>
          Selected time range overlaps with {overlapping.length} existing booking(s).
        </div>
      ) : (
        <div style={{ color: '#34D399', marginBottom: 10 }}>
          Selected time range is available.
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {bookedSlots.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No existing bookings for this date.</p>
        ) : (
          bookedSlots.map(function (booking) {
            return (
              <div
                key={booking.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              >
                <div style={{ display: 'grid', gap: 2 }}>
                  <strong style={{ fontSize: '0.9rem' }}>{booking.startTime} - {booking.endTime}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {booking.userName || 'Unknown User'}
                  </span>
                </div>
                <StatusBadge status={booking.status} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
