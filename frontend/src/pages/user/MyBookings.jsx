import { useState, useEffect } from 'react';
import { bookingService, resourceService } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import QRCheckin from '../../components/QRCheckin';
import GlassModal from '../../components/GlassModal';
import BookingForm from '../../components/BookingForm';
import './modern-pages.css';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

const TYPE_ICONS = {
  LECTURE_HALL: '🏫',
  LAB: '💻',
  STUDY_ROOM: '📚',
  AUDITORIUM: '🎤',
  RESOURCE: '🏛️',
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [step, setStep] = useState('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRows, resourceRows] = await Promise.all([
        bookingService.getAll(),
        resourceService.getAll(),
      ]);
      setBookings((bookingRows || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setResources(resourceRows || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSaved = (saved) => {
    setBookings((prev) => {
      const exists = prev.some((b) => b.id === saved.id);
      const next = exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev];
      return next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    setEditingBooking(null);
    setStep('list');
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const updated = await bookingService.cancel(id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    }
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filter === 'ALL' || b.status === filter;
    const term = search.toLowerCase();
    const text = `${b.facilityName || b.resourceName || ''} ${b.purpose || ''}`.toLowerCase();
    return matchStatus && (!term || text.includes(term));
  });

  if (step === 'new' || step === 'edit') {
    return (
      <div className="page-content animate-in user-modern-page">
        <div className="content-header">
          <h1>{step === 'new' ? 'New Booking' : 'Edit Booking'}</h1>
          <p>Complete the booking details below.</p>
        </div>

        <BookingForm
          resources={resources}
          initialData={editingBooking}
          onSaved={handleBookingSaved}
          onCancel={() => {
            setEditingBooking(null);
            setStep('list');
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-content animate-in user-modern-page">
      <div className="content-header">
        <h1>My Bookings</h1>
        <p>Create, edit, and manage your booking requests.</p>
      </div>

      {error && (
        <div className="modern-inline-card modern-inline-card--error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className="filter-bar glass-card" style={{ marginBottom: 12 }}>
        <div className="filter-search">
          <span className="form-input-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by facility or purpose"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="filter-chips">
          {STATUS_FILTERS.map((s) => (
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

      <div style={{ marginBottom: 12 }}>
        <button className="btn-primary btn-glow" onClick={() => setStep('new')}>+ New Booking</button>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: 20, color: 'var(--text-muted)' }}>Loading your bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="modern-inline-card modern-inline-card--info" style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📅</p>
          <p>{search || filter !== 'ALL' ? 'No bookings match your filters.' : 'No bookings yet.'}</p>
        </div>
      ) : (
        <div className="booking-list" style={{ marginTop: 16 }}>
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onEdit={() => {
                setEditingBooking(b);
                setStep('edit');
              }}
              onCancel={handleCancel}
              onQR={() => setQrModal(b)}
            />
          ))}
        </div>
      )}

      <GlassModal open={!!qrModal} onClose={() => setQrModal(null)} title="Check-in QR Code" width={320}>
        {qrModal && <QRCheckin bookingId={qrModal.id} qrCode={qrModal.qrCode} />}
      </GlassModal>
    </div>
  );
}

function BookingCard({ booking: b, onEdit, onCancel, onQR }) {
  const dateObj = b.date ? new Date(`${b.date}T00:00:00`) : null;
  const day = dateObj ? dateObj.getDate() : '--';
  const month = dateObj ? dateObj.toLocaleString('default', { month: 'short' }) : '';
  const icon = TYPE_ICONS[b.resourceType] || TYPE_ICONS[b.facilityType] || '🏛️';

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        gap: 16,
        padding: '16px 20px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        borderLeft: `3px solid ${statusColor(b.status)}`,
      }}
    >
      <div
        style={{
          minWidth: 52,
          textAlign: 'center',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          padding: '8px 6px',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>{month}</div>
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
            {b.facilityName || b.resourceName || b.facilityId}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>🕐 {b.startTime} - {b.endTime}</span>
          <span>👥 {b.expectedAttendees || '-'} attendees</span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📋 {b.purpose}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
        <StatusBadge status={b.status} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {b.status === 'APPROVED' && b.qrCode && (
            <button className="btn-sm btn-sm--primary" onClick={onQR}>QR</button>
          )}
          {b.status === 'PENDING' && (
            <button className="btn-sm" onClick={onEdit}>Edit</button>
          )}
          {(b.status === 'PENDING' || b.status === 'APPROVED') && (
            <button className="btn-sm btn-sm--danger" onClick={() => onCancel(b.id)}>Cancel</button>
          )}
        </div>
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
