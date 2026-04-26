import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { bookingService } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import BookingApprovalPanel from '../../components/BookingApprovalPanel';
import GlassModal from '../../components/GlassModal';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const STATUS_COLORS = {
  PENDING:   '#FBBF24',
  APPROVED:  '#34D399',
  REJECTED:  '#F87171',
  CANCELLED: '#6B7280',
};

// ── Date helpers ──────────────────────────────────────────────────
function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

function buildDateStrip(n = 37) {
  const days = [];
  const start = new Date();
  start.setDate(start.getDate() - 7);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(toDateStr(d));
  }
  return days;
}

function fmtDate(str) {
  if (!str) return '';
  return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function isToday(str) {
  return str === toDateStr(new Date());
}

// ─────────────────────────────────────────────────────────────────
export default function ManageBookings() {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [filter,      setFilter]      = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [detailModal, setDetailModal] = useState(null);
  // view: 'table' | 'panel' | 'checkin'
  const [view,        setView]        = useState('table');

  // Date strip state
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [useDateStrip, setUseDateStrip] = useState(true);
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const dateStrip = useMemo(() => buildDateStrip(37), []);
  const today     = toDateStr(new Date());

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

  const notify = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const replaceBooking = (updated) =>
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));

  const handleApprove = async (id, notes) => {
    const updated = await bookingService.approve(id, notes || 'Approved by admin');
    replaceBooking(updated);
    notify('Booking approved successfully!');
  };

  const handleReject = async (id, reason) => {
    const updated = await bookingService.reject(id, reason);
    replaceBooking(updated);
    notify('Booking rejected.');
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this approved booking?')) return;
    const updated = await bookingService.cancel(id);
    replaceBooking(updated);
    notify('Booking cancelled.');
  };

  const handleCheckin = async (id, qrCode) => {
    const data = await bookingService.checkin(id, qrCode);
    setBookings(prev => prev.map(b => (
      b.id === data.bookingId
        ? { ...b, checkedIn: true, checkedInAt: data.checkedInAt }
        : b
    )));
    notify('Check-in successful!');
    return data;
  };

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = bookings;

    if (useDateStrip) {
      rows = rows.filter(b => b.date === selectedDate);
    } else {
      if (dateFrom) rows = rows.filter(b => b.date >= dateFrom);
      if (dateTo)   rows = rows.filter(b => b.date <= dateTo);
    }

    if (filter !== 'ALL') rows = rows.filter(b => b.status === filter);

    const term = search.toLowerCase().trim();
    if (term) {
      rows = rows.filter(b => {
        const hay = [b.facilityName, b.resourceName, b.userName, b.purpose].join(' ').toLowerCase();
        return hay.includes(term);
      });
    }

    return rows;
  }, [bookings, selectedDate, useDateStrip, dateFrom, dateTo, filter, search]);

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  // Today's approved bookings (for check-in view)
  const todayApproved = useMemo(() =>
    bookings.filter(b => b.status === 'APPROVED' && b.date === today)
      .sort((a, b) => {
        const toMins = t => t ? t.split(':').map(Number).reduce((h, m) => h * 60 + m) : 0;
        return toMins(a.startTime) - toMins(b.startTime);
      }),
  [bookings, today]);

  const statsBase = useMemo(() =>
    useDateStrip ? bookings.filter(b => b.date === selectedDate) : bookings,
  [bookings, selectedDate, useDateStrip]);

  const counts = useMemo(() =>
    statsBase.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {}),
  [statsBase]);

  const bookingsByDate = useMemo(() =>
    bookings.reduce((acc, b) => {
      if (b.date) acc[b.date] = (acc[b.date] || 0) + 1;
      return acc;
    }, {}),
  [bookings]);

  const checkedInCount = todayApproved.filter(b => b.checkedIn).length;
  const notCheckedIn   = todayApproved.filter(b => !b.checkedIn);

  return (
    <div className="animate-in">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Manage Bookings</h1>
          <p>Review all booking requests, approvals, and check-in status.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* View tabs */}
          {[
            { key: 'table',   label: '📋 Table View' },
            { key: 'panel',   label: '✅ Approval Panel', badge: pendingBookings.length },
            { key: 'checkin', label: 'Check-in Status', badge: notCheckedIn.length > 0 ? notCheckedIn.length : 0, badgeColor: '#FBBF24' },
          ].map(v => (
            <button
              key={v.key}
              className={`filter-chip ${view === v.key ? 'filter-chip--active' : ''}`}
              onClick={() => setView(v.key)}
              style={{ position: 'relative' }}
            >
              {v.label}
              {v.badge > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: v.badgeColor || '#F87171',
                  color: v.badgeColor ? '#000' : '#fff',
                  fontSize: '0.65rem', fontWeight: 700,
                  width: 18, height: 18, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {v.badge}
                </span>
              )}
            </button>
          ))}
          <button className="btn-sm" onClick={load} disabled={loading}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Alerts ────────────────────────────────────────────── */}
      {error && (
        <div className="glass-card" style={{ marginBottom: 14, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)', padding: '12px 16px' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ marginBottom: 14, color: '#34D399', border: '1px solid rgba(52,211,153,0.35)', padding: '12px 16px' }}>
          ✓ {success}
        </div>
      )}

      {/* ── Stat chips ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {[
          { label: 'Total',     value: statsBase.length,         color: 'var(--primary)' },
          { label: 'Pending',   value: counts.PENDING   || 0,    color: '#FBBF24' },
          { label: 'Approved',  value: counts.APPROVED  || 0,    color: '#34D399' },
          { label: 'Rejected',  value: counts.REJECTED  || 0,    color: '#F87171' },
          { label: 'Cancelled', value: counts.CANCELLED || 0,    color: '#9CA3AF' },
        ].map(s => (
          <div
            key={s.label}
            className="glass-card"
            style={{
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer',
              border: (filter === s.label.toUpperCase() || (s.label === 'Total' && filter === 'ALL'))
                ? `1px solid ${s.color}`
                : '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={() => setFilter(s.label === 'Total' ? 'ALL' : s.label.toUpperCase())}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Date selector (only for table view) ───────────────── */}
      {view === 'table' && (
        <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              📅 {useDateStrip ? fmtDate(selectedDate) : 'Date Range Filter'}
            </span>
            <button
              className="btn-sm"
              style={{ fontSize: '0.75rem' }}
              onClick={() => { setUseDateStrip(v => !v); setDateFrom(''); setDateTo(''); }}
            >
              {useDateStrip ? '📆 Switch to Range' : '📅 Switch to Day View'}
            </button>
          </div>

          {useDateStrip && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'thin' }}>
              {dateStrip.map(d => {
                const day      = new Date(d + 'T00:00:00');
                const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum   = day.getDate();
                const isSelec  = d === selectedDate;
                const count    = bookingsByDate[d] || 0;
                const hasPend  = bookings.some(b => b.date === d && b.status === 'PENDING');

                return (
                  <button key={d} type="button" onClick={() => setSelectedDate(d)}
                    style={{
                      flexShrink: 0, width: 54, padding: '8px 4px', borderRadius: 10,
                      border: isSelec ? '1.5px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                      background: isSelec ? 'rgba(0,173,181,0.2)' : isToday(d) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      color: isSelec ? 'var(--primary)' : 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}
                  >
                    <span style={{ fontSize: '0.62rem', color: isSelec ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {dayLabel}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: isSelec ? 700 : 500 }}>{dayNum}</span>
                    {count > 0 && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 700,
                        background: hasPend ? '#FBBF24' : '#34D399',
                        color: '#000', borderRadius: 10, padding: '1px 5px', lineHeight: 1.4,
                      }}>
                        {count}
                      </span>
                    )}
                    {isToday(d) && (
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'block' }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!useDateStrip && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" className="form-input" style={{ width: 'auto' }}
                value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="From date" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input type="date" className="form-input" style={{ width: 'auto' }}
                value={dateTo} onChange={e => setDateTo(e.target.value)} title="To date" />
              {(dateFrom || dateTo) && (
                <button className="btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ VIEW: CHECK-IN STATUS ════════════════════════════════ */}
      {view === 'checkin' && (
        <CheckinStatusView
          todayApproved={todayApproved}
          checkedInCount={checkedInCount}
          today={today}
          onCheckin={handleCheckin}
        />
      )}

      {/* ══ VIEW: APPROVAL PANEL ═════════════════════════════════ */}
      {view === 'panel' && (
        <div style={{ marginTop: 4 }}>
          <BookingApprovalPanel
            pendingBookings={pendingBookings}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}

      {/* ══ VIEW: TABLE ══════════════════════════════════════════ */}
      {view === 'table' && (
        <>
          <div className="filter-bar glass-card" style={{ marginBottom: 12 }}>
            <div className="filter-search">
              <span className="form-input-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by facility, user, or purpose"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="filter-chips">
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  className={`filter-chip ${filter === s ? 'filter-chip--active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                  {s !== 'ALL' && counts[s] > 0 && (
                    <span style={{
                      marginLeft: 5, fontSize: '0.65rem', fontWeight: 700,
                      background: STATUS_COLORS[s], color: '#000',
                      borderRadius: 10, padding: '1px 5px',
                    }}>
                      {counts[s]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="glass-card" style={{ padding: 20, color: 'var(--text-muted)' }}>
              Loading bookings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 10 }}>📅</p>
              <p style={{ fontWeight: 600 }}>
                No bookings for {useDateStrip ? fmtDate(selectedDate) : 'selected range'}.
              </p>
              {filter !== 'ALL' && (
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Try switching to <strong>All</strong>.</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(b => (
                <AdminBookingRow
                  key={b.id}
                  booking={b}
                  today={today}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onCancel={handleCancel}
                  onDetail={() => setDetailModal(b)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <GlassModal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Booking Details"
        width={500}
      >
        {detailModal && <BookingDetailView booking={detailModal} />}
      </GlassModal>
    </div>
  );
}

// ── Check-in Status View (admin) ──────────────────────────────────

function CheckinStatusView({ todayApproved, checkedInCount, today, onCheckin }) {
  const total = todayApproved.length;

  if (total === 0) {
    return (
      <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '2rem', marginBottom: 8 }}>📱</p>
        <p style={{ fontWeight: 600 }}>No approved bookings today</p>
        <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
          Approved bookings for today ({today}) will appear here with their check-in status.
        </p>
      </div>
    );
  }

  const pct = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary card */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: 4 }}>Today's Check-in Status</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{today}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34D399' }}>{checkedInCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Checked In</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FBBF24' }}>{total - checkedInCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{total}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Check-in rate</span>
            <span style={{ fontWeight: 600, color: pct === 100 ? '#34D399' : 'var(--text)' }}>{pct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${pct}%`,
              background: pct === 100 ? '#34D399' : pct > 50 ? 'var(--primary)' : '#FBBF24',
              transition: 'width 0.5s',
            }} />
          </div>
        </div>
      </div>

      {/* Booking rows */}
      {todayApproved.map(b => {
        const nowMins   = new Date().getHours() * 60 + new Date().getMinutes();
        const startMins = b.startTime ? b.startTime.split(':').map(Number).reduce((h, m) => h * 60 + m) : 0;
        const deadMins  = startMins + 15;
        const openMins  = startMins - 15;
        const isWindow  = nowMins >= openMins && nowMins <= deadMins;
        const isExpired = nowMins > deadMins;

        return (
          <div key={b.id} className="glass-card" style={{
            padding: '14px 18px',
            borderLeft: `3px solid ${b.checkedIn ? '#34D399' : isExpired ? '#F87171' : isWindow ? '#FBBF24' : '#6B7280'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>

              {/* Left info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 4 }}>
                  {b.facilityName || b.facilityId}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>👤 {b.userName}</span>
                  <span>🕐 {b.startTime} – {b.endTime}</span>
                  <span>👥 {b.expectedAttendees} attendees</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  📋 {b.purpose}
                </div>
              </div>

              {/* Right: check-in status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {b.checkedIn ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(52,211,153,0.15)',
                    border: '1px solid rgba(52,211,153,0.4)',
                    fontSize: '0.78rem', fontWeight: 600, color: '#34D399',
                  }}>
                    ✅ Checked In
                  </div>
                ) : isExpired ? (
                  <div style={{
                    padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(248,113,113,0.12)',
                    border: '1px solid rgba(248,113,113,0.35)',
                    fontSize: '0.78rem', fontWeight: 600, color: '#F87171',
                  }}>
                    ⏰ Missed (Auto-cancel pending)
                  </div>
                ) : isWindow ? (
                  <div style={{
                    padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(251,191,36,0.12)',
                    border: '1px solid rgba(251,191,36,0.35)',
                    fontSize: '0.78rem', fontWeight: 600, color: '#FBBF24',
                  }}>
                    ⏱ Window Open
                  </div>
                ) : (
                  <div style={{
                    padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(107,114,128,0.1)',
                    border: '1px solid rgba(107,114,128,0.3)',
                    fontSize: '0.78rem', color: '#9CA3AF',
                  }}>
                    ⏳ Not Started
                  </div>
                )}

                {b.checkedIn && b.checkedInAt && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    at {new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}

                {!b.checkedIn && !isExpired && (
                  <AdminCheckinControl booking={b} onCheckin={onCheckin} isWindow={isWindow} />
                )}

                {b.adminNotes && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', maxWidth: 180, textAlign: 'right' }}>
                    {b.adminNotes}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminCheckinControl({ booking, onCheckin, isWindow }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitCheckin = async () => {
    const qrCode = code.trim();
    if (!qrCode) {
      setError('Enter the scanned QR code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCheckin(booking.id, qrCode);
      setCode('');
    } catch (err) {
      setError(err.message || 'Check-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 6, width: '100%', maxWidth: 260 }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 4, textAlign: 'right' }}>
        Scan or paste QR code to check in
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ flex: '1 1 150px', minWidth: 150, fontSize: '0.78rem', padding: '6px 10px' }}
          placeholder="Paste scanned QR code"
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && isWindow) {
              e.preventDefault();
              submitCheckin();
            }
          }}
        />
        <button
          className="btn-sm btn-sm--success"
          onClick={submitCheckin}
          disabled={loading || !isWindow}
        >
          {loading ? 'Checking…' : isWindow ? 'Check in' : 'Not started'}
        </button>
      </div>
      {!isWindow && (
        <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Check-in opens 15 minutes before the booking start time.
        </div>
      )}
      {error && (
        <div style={{ marginTop: 4, fontSize: '0.7rem', color: '#F87171', textAlign: 'right' }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Admin Booking Row ─────────────────────────────────────────────

function AdminBookingRow({ booking: b, today, onApprove, onReject, onCancel, onDetail }) {
  const [notes,    setNotes]    = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="glass-card"
      style={{
        padding: '14px 18px',
        borderLeft: `3px solid ${STATUS_COLORS[b.status] || 'var(--border)'}`,
        cursor: b.status === 'PENDING' ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onClick={() => { if (b.status === 'PENDING') setExpanded(e => !e); }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
              {b.facilityName || b.resourceName || b.facilityId}
            </span>
            {b.bookingType && (
              <span className="filter-chip filter-chip--active" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                {b.bookingType}
              </span>
            )}
            <StatusBadge status={b.status} />
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>👤 {b.userName}</span>
            <span>📅 {b.date}</span>
            <span>🕐 {b.startTime} – {b.endTime}</span>
            <span>👥 {b.expectedAttendees} attendees</span>
            {b.facilityCapacity && <span>🏛️ Cap: {b.facilityCapacity}</span>}
          </div>

          <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            📋 {b.purpose}
          </div>

          {b.adminNotes && (
            <div style={{
              marginTop: 6, fontSize: '0.78rem',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 6, padding: '4px 8px',
              color: '#F87171', display: 'inline-block',
            }}>
              📝 {b.adminNotes}
            </div>
          )}

          {/* Check-in status badge for approved bookings */}
          {b.status === 'APPROVED' && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {b.checkedIn ? (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                  color: '#34D399',
                }}>
                  ✅ Checked in {b.checkedInAt ? `at ${new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                </span>
              ) : (
                <span style={{
                  fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99,
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                  color: '#FBBF24',
                }}>
                  ⏳ Not checked in
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div
          style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <button className="btn-sm" onClick={onDetail} title="View details">🔍</button>
          {b.status === 'APPROVED' && (
            <button className="btn-sm btn-sm--danger" onClick={() => onCancel(b.id)}>Cancel</button>
          )}
          {b.status === 'PENDING' && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {/* Expandable approve/reject panel */}
      {expanded && b.status === 'PENDING' && (
        <div
          style={{
            marginTop: 12, paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap',
          }}
          onClick={e => e.stopPropagation()}
        >
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 180, fontSize: '0.82rem', padding: '6px 10px' }}
            placeholder="Admin notes (required for rejection)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            autoFocus
          />
          <button
            className="btn-sm btn-sm--success"
            onClick={() => { onApprove(b.id, notes || 'Approved by admin'); setExpanded(false); }}
          >
            ✓ Approve
          </button>
          <button
            className="btn-sm btn-sm--danger"
            onClick={() => {
              if (!notes.trim()) { alert('Please add a rejection reason.'); return; }
              onReject(b.id, notes.trim());
              setExpanded(false);
            }}
          >
            ✕ Reject
          </button>
          <button className="btn-sm" onClick={() => { setExpanded(false); setNotes(''); }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail Modal Content ──────────────────────────────────────────

function BookingDetailView({ booking: b }) {
  const rows = [
    { label: 'Booking ID',      value: b.id },
    { label: 'Facility',        value: b.facilityName || b.resourceName || b.facilityId },
    { label: 'Requested by',    value: `${b.userName} (${b.userEmail || 'N/A'})` },
    { label: 'Date',            value: b.date },
    { label: 'Time',            value: `${b.startTime} – ${b.endTime}` },
    { label: 'Attendees',       value: b.expectedAttendees },
    { label: 'Capacity',        value: b.facilityCapacity || 'N/A' },
    { label: 'Min required',    value: b.minimumAttendeesRequired || 'N/A' },
    { label: 'Type',            value: b.bookingType || 'BOOKING' },
    { label: 'Purpose',         value: b.purpose },
    { label: 'Status',          value: <StatusBadge status={b.status} /> },
    { label: 'Admin notes',     value: b.adminNotes || '—' },
    { label: 'QR Code',         value: b.qrCode || '—' },
    {
      label: 'Check-in',
      value: b.checkedIn
        ? `✅ Checked in at ${b.checkedInAt ? new Date(b.checkedInAt).toLocaleString() : '—'}`
        : '⏳ Not yet checked in',
    },
    { label: 'Created',         value: b.createdAt ? new Date(b.createdAt).toLocaleString() : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 0', borderBottom: '1px solid var(--border)',
          fontSize: '0.85rem', gap: 12,
        }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
          <span style={{ color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}