import { useState, useEffect, useRef } from 'react';
import { bookingService, resourceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import QRCheckin from '../../components/QRCheckin';
import GlassModal from '../../components/GlassModal';
import BookingForm from '../../components/BookingForm';
import ResourcePicker from '../../components/BookingResourcePicker';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const TYPE_ICONS = {
  LECTURE_HALL: '🏛️',
  LAB:          '🔬',
  SEMINAR_ROOM: '📋',
  AUDITORIUM:   '🎭',
  MEETING_ROOM: '👥',
  STUDY_AREA:   '📚',
  EQUIPMENT:    '🔧',
};

// step: 'list' | 'pick' | 'form' | 'edit'

export default function MyBookings() {
  const { user } = useAuth();

  const [bookings,         setBookings]         = useState([]);
  const [resources,        setResources]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [filter,           setFilter]           = useState('ALL');
  const [search,           setSearch]           = useState('');
  const [qrModal,          setQrModal]          = useState(null);
  const [editingBooking,   setEditingBooking]   = useState(null);
  const [step,             setStep]             = useState('list');
  const [selectedResource, setSelectedResource] = useState(null);

  // Polling ref for auto-cancel detection
  const pollRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  // ── Auto-cancel polling (every 30 seconds) ────────────────────
  // Polls the backend for today's APPROVED+unchecked bookings to detect
  // server-side auto-cancels (the Spring scheduler cancels them every minute).
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const today = new Date().toISOString().split('T')[0];

      setBookings(prev => {
        const todayApproved = prev.filter(b =>
          b.status === 'APPROVED' && !b.checkedIn && b.date === today
        );
        if (todayApproved.length === 0) return prev;

        todayApproved.forEach(async (b) => {
          try {
            const result = await bookingService.getCheckinStatus(b.id);
            if (!result) return;

            if (result.autoCancelled || result.status === 'CANCELLED') {
              setBookings(curr => curr.map(x =>
                x.id === b.id
                  ? { ...x, status: 'CANCELLED',
                      adminNotes: 'Auto-cancelled: no check-in within 15 minutes of start time' }
                  : x
              ));
              // If QR modal is open for this booking, close it
              setQrModal(prev => (prev && prev.id === b.id) ? null : prev);
            }
          } catch { /* silently ignore */ }
        });

        return prev;
      });
    }, 30_000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSaved = (saved, actionType) => {
    setBookings(prev => {
      const exists = prev.some(b => b.id === saved.id);
      const next = exists
        ? prev.map(b => b.id === saved.id ? saved : b)
        : [saved, ...prev];
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    if (actionType === 'updated') setEditingBooking(null);
    setStep('list');
    setSelectedResource(null);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const updated = await bookingService.cancel(id);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setStep('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Called when check-in succeeds — update booking in list and modal
  const handleCheckinSuccess = (data) => {
    setBookings(prev => prev.map(b =>
      b.id === data.bookingId
        ? { ...b, checkedIn: true, checkedInAt: data.checkedInAt }
        : b
    ));
    setQrModal(prev =>
      prev ? { ...prev, checkedIn: true, checkedInAt: data.checkedInAt } : prev
    );
  };

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'ALL' || b.status === filter;
    const term = search.toLowerCase();
    const matchSearch = !term
      || (b.facilityName || b.resourceName || '').toLowerCase().includes(term)
      || (b.purpose || '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-content animate-in">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>My Bookings</h1>
          <p>Manage your facility and resource booking requests.</p>
        </div>

        {step === 'list' && (
          <button
            className="btn-primary"
            style={{ width: 'auto' }}
            onClick={() => {
              setSelectedResource(null);
              setEditingBooking(null);
              setStep('pick');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            + New Booking
          </button>
        )}

        {(step === 'pick' || step === 'form' || step === 'edit') && (
          <button
            className="btn-sm"
            onClick={() => { setStep('list'); setSelectedResource(null); setEditingBooking(null); }}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────── */}
      {step !== 'list' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: '0.82rem' }}>
          <span
            style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => { setStep('list'); setSelectedResource(null); setEditingBooking(null); }}
          >
            My Bookings
          </span>
          <span style={{ color: 'var(--text-muted)' }}>›</span>

          {step === 'pick' && (
            <span style={{ color: 'var(--text)' }}>Select Facility</span>
          )}

          {step === 'form' && (
            <>
              <span
                style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setSelectedResource(null); setStep('pick'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Select Facility
              </span>
              <span style={{ color: 'var(--text-muted)' }}>›</span>
              <span style={{ color: 'var(--text)' }}>{selectedResource?.name || 'Booking Details'}</span>
            </>
          )}

          {step === 'edit' && (
            <span style={{ color: 'var(--text)' }}>Edit Booking</span>
          )}
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="glass-card" style={{ marginBottom: 14, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)', padding: '12px 16px' }}>
          {error}
        </div>
      )}

      {/* ══ STEP: PICK ════════════════════════════════════════════ */}
      {step === 'pick' && (
        <ResourcePicker
          resources={resources}
          onSelect={(resource) => {
            setSelectedResource(resource);
            setStep('form');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCancel={() => setStep('list')}
        />
      )}

      {/* ══ STEP: FORM ════════════════════════════════════════════ */}
      {step === 'form' && (
        <BookingForm
          resources={resources}
          selectedResource={selectedResource}
          onChangeResource={() => {
            setSelectedResource(null);
            setStep('pick');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSaved={handleBookingSaved}
          onCancelEdit={() => { setStep('list'); setSelectedResource(null); }}
        />
      )}

      {/* ══ STEP: EDIT ════════════════════════════════════════════ */}
      {step === 'edit' && (
        <BookingForm
          resources={resources}
          initialBooking={editingBooking}
          onSaved={handleBookingSaved}
          onCancelEdit={() => { setEditingBooking(null); setStep('list'); }}
        />
      )}

      {/* ══ STEP: LIST ════════════════════════════════════════════ */}
      {step === 'list' && (
        <>
          {/* ── Summary stat chips ──────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            {[
              { label: 'Total',     value: bookings.length,       color: 'var(--primary)' },
              { label: 'Pending',   value: counts.PENDING   || 0, color: '#FBBF24' },
              { label: 'Approved',  value: counts.APPROVED  || 0, color: '#34D399' },
              { label: 'Rejected',  value: counts.REJECTED  || 0, color: '#F87171' },
              { label: 'Cancelled', value: counts.CANCELLED || 0, color: '#9CA3AF' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Filter Bar ──────────────────────────────────────── */}
          <div className="filter-bar glass-card" style={{ marginTop: 12 }}>
            <div className="filter-search">
              <span className="form-input-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by facility or purpose"
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
          </div>

          {/* ── Booking Cards ───────────────────────────────────── */}
          {loading ? (
            <div className="glass-card" style={{ padding: 20, color: 'var(--text-muted)' }}>
              Loading your bookings...
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: 10 }}>📅</p>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                {search || filter !== 'ALL' ? 'No bookings match your filter.' : 'No bookings yet.'}
              </p>
              {!search && filter === 'ALL' && (
                <p style={{ fontSize: '0.85rem' }}>Click <strong>+ New Booking</strong> to get started.</p>
              )}
            </div>
          ) : (
            <div className="booking-list" style={{ marginTop: 16 }}>
              {filtered.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  today={today}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onQR={() => setQrModal({ ...b })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── QR Check-in Modal ─────────────────────────────────── */}
      <GlassModal
        open={!!qrModal}
        onClose={() => setQrModal(null)}
        title="📱 QR Check-in"
        width={360}
      >
        {qrModal && (
          <>
            {/* Booking summary inside modal */}
            <div style={{
              padding: '10px 14px', marginBottom: 14, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.82rem',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {qrModal.facilityName || qrModal.resourceName || qrModal.facilityId}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                📅 {qrModal.date} &nbsp; 🕐 {qrModal.startTime} – {qrModal.endTime}
              </div>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                👥 {qrModal.expectedAttendees} attendees · 📋 {qrModal.purpose}
              </div>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#FBBF24' }}>
                ⏱ Check in within 15 minutes of start time to keep your booking
              </div>
            </div>

            <QRCheckin
              bookingId={qrModal.id}
              qrCode={qrModal.qrCode}
              booking={qrModal}
              onCheckinSuccess={handleCheckinSuccess}
            />
          </>
        )}
      </GlassModal>
    </div>
  );
}

// ── Single Booking Card ───────────────────────────────────────────

function BookingCard({ booking: b, today, onEdit, onCancel, onQR }) {
  const dateObj = b.date ? new Date(b.date + 'T00:00:00') : null;
  const day     = dateObj ? dateObj.getDate() : '--';
  const month   = dateObj ? dateObj.toLocaleString('default', { month: 'short' }) : '';
  const icon    = TYPE_ICONS[b.resourceType] || TYPE_ICONS[b.facilityType] || '🏛️';
  const isToday = b.date === today;

  // Warn if approved today and not yet checked in
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const startMins = b.startTime
    ? b.startTime.split(':').map(Number).reduce((h, m) => h * 60 + m, 0)
    : null;
  const deadlineMins = startMins != null ? startMins + 15 : null;
  const checkinOpen  = startMins != null ? startMins - 15 : null;

  const showCheckinWarning = (
    b.status === 'APPROVED' &&
    !b.checkedIn &&
    isToday &&
    startMins != null &&
    nowMins >= checkinOpen &&
    nowMins <= deadlineMins
  );
  const checkinUrgent = showCheckinWarning && (deadlineMins - nowMins) <= 5;

  return (
    <div className="glass-card" style={{
      display: 'flex', gap: 16, padding: '16px 20px',
      alignItems: 'flex-start', flexWrap: 'wrap',
      borderLeft: `3px solid ${statusColor(b.status)}`,
    }}>

      {/* Date block */}
      <div style={{
        minWidth: 52, textAlign: 'center',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 10, padding: '8px 6px', flexShrink: 0,
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
          {day}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
          {month}
        </div>
        {isToday && (
          <div style={{ fontSize: '0.58rem', color: 'var(--primary)', fontWeight: 700, marginTop: 3, letterSpacing: '0.3px' }}>
            TODAY
          </div>
        )}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
            {b.facilityName || b.resourceName || b.facilityId}
          </span>
          {b.bookingType && (
            <span className="filter-chip filter-chip--active" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              {b.bookingType}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>🕐 {b.startTime} – {b.endTime}</span>
          <span>👥 {b.expectedAttendees || '-'} attendees</span>
          {b.facilityCapacity && <span>🏛️ Capacity: {b.facilityCapacity}</span>}
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          📋 {b.purpose}
        </div>

        {/* Admin notes */}
        {b.adminNotes && (
          <div style={{
            marginTop: 8, fontSize: '0.8rem',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8, padding: '6px 10px',
            color: '#F87171', display: 'inline-block',
          }}>
            📝 {b.adminNotes}
          </div>
        )}

        {/* Checked-in badge */}
        {b.checkedIn && (
          <div style={{
            marginTop: 8, fontSize: '0.78rem',
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 8, padding: '5px 10px',
            color: '#34D399', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            ✅ Checked in
            {b.checkedInAt && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                at {new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Check-in warning banner */}
        {showCheckinWarning && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 8,
            background: checkinUrgent ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.08)',
            border: `1px solid ${checkinUrgent ? 'rgba(248,113,113,0.4)' : 'rgba(251,191,36,0.3)'}`,
            fontSize: '0.78rem',
            color: checkinUrgent ? '#F87171' : '#FBBF24',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {checkinUrgent ? '🚨' : '⏱'}
            {checkinUrgent
              ? 'Check in immediately! Less than 5 minutes left before auto-cancel.'
              : 'Check in now — booking will auto-cancel 15 min after start time.'
            }
          </div>
        )}
      </div>

      {/* Right: status + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <StatusBadge status={b.status} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* QR / Check-in button — only for APPROVED bookings with a QR code */}
          {b.status === 'APPROVED' && b.qrCode && (
            <button
              className={`btn-sm ${b.checkedIn ? '' : 'btn-sm--primary'}`}
              onClick={onQR}
              title={b.checkedIn ? 'View check-in details' : 'Open QR code to check in'}
              style={{
                background: b.checkedIn
                  ? 'rgba(52,211,153,0.15)'
                  : showCheckinWarning && checkinUrgent
                    ? 'rgba(248,113,113,0.25)'
                    : undefined,
                borderColor: b.checkedIn
                  ? 'rgba(52,211,153,0.4)'
                  : showCheckinWarning && checkinUrgent
                    ? 'rgba(248,113,113,0.5)'
                    : undefined,
                color: b.checkedIn
                  ? '#34D399'
                  : showCheckinWarning && checkinUrgent
                    ? '#F87171'
                    : undefined,
                animation: showCheckinWarning && checkinUrgent && !b.checkedIn
                  ? 'pulse 1.5s infinite'
                  : undefined,
              }}
            >
              {b.checkedIn ? '✅ Checked In' : '📱 QR Check-in'}
            </button>
          )}

          {b.status === 'PENDING' && (
            <button className="btn-sm" onClick={() => onEdit(b)}>✏️ Edit</button>
          )}

          {(b.status === 'PENDING' || b.status === 'APPROVED') && (
            <button className="btn-sm btn-sm--danger" onClick={() => onCancel(b.id)}>
              Cancel
            </button>
          )}
        </div>

        {b.status === 'PENDING' && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Awaiting review</span>
        )}
      </div>
    </div>
  );
}

function statusColor(status) {
  const map = {
    PENDING:   '#F5A623',
    APPROVED:  '#2DBD87',
    REJECTED:  '#EF4444',
    CANCELLED: '#EF4444',
  };
  return map[status] || 'var(--border)';
}