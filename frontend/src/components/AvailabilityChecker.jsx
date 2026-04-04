import { useEffect, useMemo, useState } from 'react';
import StatusBadge from './StatusBadge';

function toMinutes(timeValue) {
  if (!timeValue) return 0;
  var parts = String(timeValue).split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

function hasOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

function toDateValue(dateObj) {
  var year = dateObj.getFullYear();
  var month = String(dateObj.getMonth() + 1).padStart(2, '0');
  var day = String(dateObj.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function parseDateValue(dateValue) {
  if (!dateValue) return null;
  var parsed = new Date(dateValue + 'T00:00:00');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCalendarCells(baseMonthDate) {
  var year = baseMonthDate.getFullYear();
  var month = baseMonthDate.getMonth();
  var firstDayIndex = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  var cells = [];
  for (var i = 0; i < firstDayIndex; i += 1) {
    cells.push(null);
  }
  for (var day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getMonthTitle(baseMonthDate) {
  return baseMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function AvailabilityChecker({
  conflicts,
  startTime,
  endTime,
  excludeBookingId,
  selectedDate,
  onDateSelect,
}) {
  var safeConflicts = Array.isArray(conflicts) ? conflicts : [];
  var [calendarMonth, setCalendarMonth] = useState(function () {
    var fromSelected = parseDateValue(selectedDate);
    return fromSelected || new Date();
  });

  useEffect(function () {
    var parsed = parseDateValue(selectedDate);
    if (!parsed) return;
    setCalendarMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [selectedDate]);

  var calendarCells = useMemo(function () {
    return getCalendarCells(calendarMonth);
  }, [calendarMonth]);

  function goToPreviousMonth() {
    setCalendarMonth(function (prev) {
      return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
    });
  }

  function goToNextMonth() {
    setCalendarMonth(function (prev) {
      return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
    });
  }

  var bookedSlots = safeConflicts.filter(function (b) {
    return b.id !== excludeBookingId;
  });

  var overlapping = bookedSlots.filter(function (b) {
    if (!startTime || !endTime) return false;
    return hasOverlap(startTime, endTime, b.startTime, b.endTime);
  });

  var selectedDateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString()
    : 'No date selected';

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 10 }}>Availability Checker</h3>

      <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button type="button" className="btn-sm" onClick={goToPreviousMonth}>Prev</button>
          <strong>{getMonthTitle(calendarMonth)}</strong>
          <button type="button" className="btn-sm" onClick={goToNextMonth}>Next</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (dayLabel) {
            return (
              <div key={dayLabel} style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {dayLabel}
              </div>
            );
          })}

          {calendarCells.map(function (dateObj, index) {
            if (!dateObj) {
              return <div key={'blank-' + index} />;
            }

            var dateValue = toDateValue(dateObj);
            var isSelected = selectedDate === dateValue;

            return (
              <button
                key={dateValue}
                type="button"
                onClick={function () {
                  if (onDateSelect) onDateSelect(dateValue);
                }}
                style={{
                  borderRadius: 8,
                  padding: '6px 0',
                  border: isSelected ? '1px solid rgba(0,173,181,0.75)' : '1px solid rgba(255,255,255,0.12)',
                  background: isSelected ? 'rgba(0,173,181,0.22)' : 'rgba(255,255,255,0.03)',
                  color: isSelected ? '#00ADB5' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 500,
                }}
              >
                {dateObj.getDate()}
              </button>
            );
          })}
        </div>

        <p style={{ marginTop: 10, marginBottom: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Selected Date: {selectedDateLabel}
        </p>
      </div>

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
