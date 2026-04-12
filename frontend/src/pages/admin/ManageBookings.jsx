import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import BookingApprovalPanel from '../../components/BookingApprovalPanel';
import GlassModal from '../../components/GlassModal';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function ManageBookings() {
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [filter,      setFilter]      = useState('ALL');
  const [search,      setSearch]      = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [view,        setView]        = useState('table'); // 'table' | 'panel'

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

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    if (filter !== 'ALL' && b.status !== filter) return false;
    const term = search.toLowerCase();
    if (term) {
      const hay = [b.facilityName, b.resourceName, b.userName, b.purpose].join(' ').toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (dateFrom && b.date < dateFrom) return false;
    if (dateTo   && b.date > dateTo)   return false;
    return true;
  });

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-in">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Manage Bookings</h1>
          <p>Review all booking requests and process pending approvals.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`filter-chip ${view === 'table' ? 'filter-chip--active' : ''}`}
            onClick={() => setView('table')}
          >
            📋 Table View
          </button>
          <button
            className={`filter-chip ${view === 'panel' ? 'filter-chip--active' : ''}`}
            onClick={() => setView('panel')}
            style={{ position: 'relative' }}
          >
            ✅ Approval Panel
            {pendingBookings.length > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#F87171', color: '#fff',
                fontSize: '0.65rem', fontWeight: 700,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pendingBookings.length}
              </span>
            )}
          </button>
          <button className="btn-sm" onClick={load}>🔄 Refresh</button>
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        {[
          { label: 'Total',     value: bookings.length,         color: 'var(--primary)' },
          { label: 'Pending',   value: counts.PENDING   || 0,   color: '#FBBF24' },
          { label: 'Approved',  value: counts.APPROVED  || 0,   color: '#34D399' },
          { label: 'Rejected',  value: counts.REJECTED  || 0,   color: '#F87171' },
          { label: 'Cancelled', value: counts.CANCELLED || 0,   color: '#9CA3AF' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── APPROVAL PANEL VIEW ───────────────────────────────── */}
      {view === 'panel' && (
        <div style={{ marginTop: 16 }}>
          <BookingApprovalPanel
            pendingBookings={pendingBookings}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}

      {/* ── TABLE VIEW ────────────────────────────────────────── */}
      {view === 'table' && (
        <>
          {/* Filter bar — same as Resources page */}
          <div className="filter-bar glass-card" style={{ marginTop: 12 }}>
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
                </button>
              ))}
            </div>

            {/* Date range filter */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto' }}
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="From date"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto' }}
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="To date"
              />
              {(dateFrom || dateTo) && (
                <button className="btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="glass-card" style={{ padding: 20, color: 'var(--text-muted)', marginTop: 12 }}>
              Loading bookings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', marginTop: 12 }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 10 }}>📅</p>
              <p>No bookings found for the selected filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {filtered.map(b => (
                <AdminBookingRow
                  key={b.id}
                  booking={b}
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

/* ── Admin Booking Row ────────────────────────────────────────── */
function AdminBookingRow({ booking: b, onApprove, onReject, onCancel, onDetail }) {
  const [notes,    setNotes]    = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card" style={{
      padding: '14px 18px',
      borderLeft: `3px solid ${statusColor(b.status)}`,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>

        {/* Left info */}
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
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" onClick={onDetail} title="View details">🔍</button>
            {b.status === 'PENDING' && (
              <button
                className="btn-sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? '▲ Hide' : '▼ Actions'}
              </button>
            )}
            {b.status === 'APPROVED' && (
              <button className="btn-sm btn-sm--danger" onClick={() => onCancel(b.id)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Expandable approve/reject panel ── */}
      {expanded && b.status === 'PENDING' && (
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 180, fontSize: '0.82rem', padding: '6px 10px' }}
            placeholder="Admin notes (required for rejection)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
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
        </div>
      )}
    </div>
  );
}

/* ── Detail Modal Content ─────────────────────────────────────── */
function BookingDetailView({ booking: b }) {
  const rows = [
    { label: 'Booking ID',  value: b.id },
    { label: 'Facility',    value: b.facilityName || b.resourceName || b.facilityId },
    { label: 'Requested by',value: `${b.userName} (${b.userEmail || 'N/A'})` },
    { label: 'Date',        value: b.date },
    { label: 'Time',        value: `${b.startTime} – ${b.endTime}` },
    { label: 'Attendees',   value: b.expectedAttendees },
    { label: 'Capacity',    value: b.facilityCapacity || 'N/A' },
    { label: 'Min required',value: b.minimumAttendeesRequired || 'N/A' },
    { label: 'Type',        value: b.bookingType || 'BOOKING' },
    { label: 'Purpose',     value: b.purpose },
    { label: 'Status',      value: <StatusBadge status={b.status} /> },
    { label: 'Admin notes', value: b.adminNotes || '—' },
    { label: 'Created',     value: b.createdAt ? new Date(b.createdAt).toLocaleString() : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {rows.map(({ label, value }) => (
        <div key={label} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 0',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.85rem',
          gap: 12,
        }}>
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
          <span style={{ color: 'var(--text)', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function statusColor(status) {
  const map = {
    PENDING:   '#FBBF24',
    APPROVED:  '#34D399',
    REJECTED:  '#F87171',
    CANCELLED: '#6B7280',
  };
  return map[status] || 'var(--border)';
}