import { useState, useEffect } from 'react';
import { bookingService, resourceService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import QRCheckin from '../../components/QRCheckin';
import GlassModal from '../../components/GlassModal';
import BookingForm from '../../components/BookingForm';
<<<<<<< Updated upstream
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
=======
import './modern-pages.css';
>>>>>>> Stashed changes

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

  useEffect(() => { loadData(); }, []);

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
        ? prev.map(b => (b.id === saved.id ? saved : b))
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

  // ── Filtering ─────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const matchStatus = filter === 'ALL' || b.status === filter;
    const term = search.toLowerCase();
    const matchSearch = !term
      || (b.facilityName || b.resourceName || '').toLowerCase().includes(term)
      || (b.purpose || '').toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
<<<<<<< Updated upstream
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
=======
    <div className="page-content animate-in user-modern-page">
      <div className="content-header">
        <h1>My Bookings</h1>
        <p>Create, edit, and manage your booking requests.</p>
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
        <div className="glass-card" style={{ marginBottom: 14, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)', padding: '12px 16px' }}>
=======
        <div className="modern-inline-card modern-inline-card--error" style={{ marginBottom: 14 }}>
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
      <div className="booking-list">
        {bookings.length === 0 && (
          <div className="modern-inline-card modern-inline-card--info" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>📅</p>
            <p>No bookings yet. Browse resources to make your first booking.</p>
>>>>>>> Stashed changes
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
            <div className="glass-card" style={{ padding: 20, color: 'var(--text-muted)' }}>Loading your bookings...</div>
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
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onQR={() => setQrModal(b)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── QR Modal ──────────────────────────────────────────── */}
      <GlassModal open={!!qrModal} onClose={() => setQrModal(null)} title="Check-in QR Code" width={320}>
        {qrModal && <QRCheckin bookingId={qrModal.id} qrCode={qrModal.qrCode} />}
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Show this at <strong>{qrModal?.facilityName || qrModal?.resourceName}</strong> to check in.
        </p>
      </GlassModal>
    </div>
  );
}

/* ── Single Booking Card ──────────────────────────────────────── */
function BookingCard({ booking: b, onEdit, onCancel, onQR }) {
  const dateObj = b.date ? new Date(b.date + 'T00:00:00') : null;
  const day     = dateObj ? dateObj.getDate() : '--';
  const month   = dateObj ? dateObj.toLocaleString('default', { month: 'short' }) : '';
  const icon    = TYPE_ICONS[b.resourceType] || TYPE_ICONS[b.facilityType] || '🏛️';

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
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{month}</div>
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
          {b.facilityCapacity && (
            <span>🏛️ Capacity: {b.facilityCapacity}</span>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          📋 {b.purpose}
        </div>

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
      </div>

      {/* Right: status + actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <StatusBadge status={b.status} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {b.status === 'APPROVED' && b.qrCode && (
            <button className="btn-sm btn-sm--primary" onClick={onQR}>📱 QR</button>
          )}
          {b.status === 'PENDING' && (
            <button className="btn-sm" onClick={() => onEdit(b)}>✏️ Edit</button>
          )}
          {(b.status === 'PENDING' || b.status === 'APPROVED') && (
            <button className="btn-sm btn-sm--danger" onClick={() => onCancel(b.id)}>Cancel</button>
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
    PENDING: '#F5A623',
    APPROVED: '#2DBD87',
    REJECTED: '#EF4444',
    CANCELLED: '#EF4444',
  };
  return map[status] || 'var(--border)';
}