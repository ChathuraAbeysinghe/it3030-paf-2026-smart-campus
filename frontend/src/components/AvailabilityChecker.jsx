/**
 * AvailabilityChecker.jsx
 * 14-day strip for quick date selection + availability info.
 * No full month calendar. No separate date input.
 */
import { useMemo } from 'react';
import StatusBadge from './StatusBadge';

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}
function overlaps(sA, eA, sB, eB) {
  return toMinutes(sA) < toMinutes(eB) && toMinutes(eA) > toMinutes(sB);
}
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function nextDays(n = 14) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function AvailabilityChecker({
  conflicts,
  startTime,
  endTime,
  excludeBookingId,
  selectedDate,
  onDateSelect,
}) {
  const safe = Array.isArray(conflicts) ? conflicts : [];
  const slots    = safe.filter(b => b.id !== excludeBookingId);
  const approved = slots.filter(b => b.status === 'APPROVED');
  const pending  = slots.filter(b => b.status === 'PENDING');
  const overlapping = slots.filter(b =>
    startTime && endTime && overlaps(startTime, endTime, b.startTime, b.endTime)
  );
  const hasConflict = overlapping.length > 0;

  const strip = useMemo(() => nextDays(14), []);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="glass-card" style={{ padding: '14px 16px', display: 'grid', gap: 12 }}>

      {/* ── Title ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
          📅 Select Date
        </span>
        {selectedDate && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {fmtDate(selectedDate)}
          </span>
        )}
      </div>

      {/* ── 14-day strip ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6,
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'thin',
      }}>
        {strip.map(d => {
          const day        = new Date(d + 'T00:00:00');
          const dayLabel   = day.toLocaleDateString('en-US', { weekday: 'short' });
          const dateNum    = day.getDate();
          const isSelected = d === selectedDate;
          const isToday    = d === today;

          return (
            <button
              key={d}
              type="button"
              onClick={() => onDateSelect && onDateSelect(d)}
              style={{
                flexShrink: 0,
                width: 48, padding: '7px 4px',
                borderRadius: 10,
                border: isSelected
                  ? '1.5px solid var(--primary)'
                  : '1px solid rgba(255,255,255,0.1)',
                background: isSelected
                  ? 'rgba(0,173,181,0.2)'
                  : isToday
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(255,255,255,0.02)',
                color: isSelected ? 'var(--primary)' : 'var(--text)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2,
              }}
            >
              <span style={{
                fontSize: '0.62rem',
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                {dayLabel}
              </span>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: isSelected ? 700 : 500,
              }}>
                {dateNum}
              </span>
              {isToday && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: 'var(--primary)', display: 'block',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      {!selectedDate ? (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Select a date above to check availability.
        </p>
      ) : (
        <>
          {/* Count chips */}
          {slots.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.83rem', color: '#34D399',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              ✅ No existing bookings — this date is fully available.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {approved.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#34D399' }}>
                    {approved.length}
                  </span>
                  <span style={{ color: '#34D399' }}>
                    Approved booking{approved.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {pending.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 8, padding: '6px 12px', fontSize: '0.82rem',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#FBBF24' }}>
                    {pending.length}
                  </span>
                  <span style={{ color: '#FBBF24' }}>
                    Pending booking{pending.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Time conflict status */}
          {!startTime || !endTime ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Enter start and end time to check for conflicts.
            </p>
          ) : hasConflict ? (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              fontSize: '0.83rem', color: '#F87171',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              <span>⚠️</span>
              <span>
                <strong>{startTime}–{endTime}</strong> overlaps with{' '}
                {overlapping.length} existing booking{overlapping.length > 1 ? 's' : ''}.
                Please choose a different time.
              </span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.83rem', color: '#34D399',
              background: 'rgba(52,211,153,0.07)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              ✅ <strong>{startTime}–{endTime}</strong> is available — no conflicts.
            </div>
          )}

          {/* Booked slots list */}
          {slots.length > 0 && (
            <div style={{ display: 'grid', gap: 6 }}>
              <p style={{
                margin: 0, fontSize: '0.74rem', fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px',
              }}>
                Booked Time Slots
              </p>
              {approved.map(b => (
                <SlotRow key={b.id} booking={b} isConflict={overlapping.some(o => o.id === b.id)} />
              ))}
              {pending.length > 0 && (
                <>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Pending — may conflict if approved later
                  </p>
                  {pending.map(b => (
                    <SlotRow key={b.id} booking={b} isConflict={overlapping.some(o => o.id === b.id)} />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SlotRow({ booking: b, isConflict }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 10, padding: '7px 12px', borderRadius: 8,
      border: isConflict ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.07)',
      background: isConflict ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.82rem', fontWeight: 600, flexShrink: 0,
          color: isConflict ? '#F87171' : 'var(--text)',
          background: isConflict ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
          padding: '2px 8px', borderRadius: 6,
        }}>
          {b.startTime} – {b.endTime}
        </span>
        <span style={{
          fontSize: '0.78rem', color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {b.userName || 'Unknown'}
        </span>
        {isConflict && (
          <span style={{ fontSize: '0.68rem', color: '#F87171', fontWeight: 700, flexShrink: 0 }}>
            ⚠ CONFLICT
          </span>
        )}
      </div>
      <StatusBadge status={b.status} />
    </div>
  );
}