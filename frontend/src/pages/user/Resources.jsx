import { useState, useEffect } from 'react';
import { resourceService, bookingService } from '../../services/api';
import { resourceTypes } from '../../mock/resources';
import GlassModal from '../../components/GlassModal';

/**
 * Resources page — card grid with filters and booking modal.
 */
export default function Resources() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [bookingModal, setBookingModal] = useState(null); // resource or null
  const [bookingForm, setBookingForm] = useState({ date: '', startTime: '', endTime: '', purpose: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResources();
  }, [filter, search]);

  const loadResources = async () => {
    const data = await resourceService.getAll({ type: filter, search });
    setResources(data);
  };

  const handleBook = async () => {
    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose) return;
    setSubmitting(true);
    await bookingService.create({
      resourceId: bookingModal.id,
      resourceName: bookingModal.name,
      userId: 'u1',
      userName: 'Current User',
      ...bookingForm,
    });
    setSubmitting(false);
    setBookingModal(null);
    setBookingForm({ date: '', startTime: '', endTime: '', purpose: '' });
    alert('Booking request submitted!');
  };

  return (
    <div className="page-content animate-in">
      <div className="content-header">
        <h1>Campus Resources</h1>
        <p>Browse and book campus facilities, lecture halls, and labs.</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar glass-card">
        <div className="filter-search">
          <span className="form-input-icon">🔍</span>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="filter-chips">
          {resourceTypes.map(type => (
            <button
              key={type}
              className={`filter-chip ${filter === type ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'ALL' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      <div className="resource-grid">
        {resources.map(r => (
          <div key={r.id} className="resource-card glass-card">
            <div className="resource-card-img" style={{ backgroundImage: `url(${r.image})` }}>
              <span className={`resource-avail ${r.available ? 'resource-avail--yes' : 'resource-avail--no'}`}>
                {r.available ? '● Available' : '● In Use'}
              </span>
            </div>
            <div className="resource-card-body">
              <h3>{r.name}</h3>
              <div className="resource-meta">
                <span>📍 {r.location}</span>
                <span>👥 {r.capacity}</span>
              </div>
              <div className="resource-type-badge">{r.type.replace('_', ' ')}</div>
              <div className="resource-amenities">
                {r.amenities.slice(0, 3).map(a => (
                  <span key={a} className="amenity-tag">{a}</span>
                ))}
                {r.amenities.length > 3 && <span className="amenity-tag">+{r.amenities.length - 3}</span>}
              </div>
              <button
                className="btn-primary"
                style={{ marginTop: 12 }}
                disabled={!r.available}
                onClick={() => setBookingModal(r)}
              >
                📅 Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      <GlassModal open={!!bookingModal} onClose={() => setBookingModal(null)} title={`Book ${bookingModal?.name}`}>
        <div className="auth-form" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <div className="form-input-wrapper">
              <input type="date" className="form-input" value={bookingForm.date} onChange={e => setBookingForm(p => ({ ...p, date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <div className="form-input-wrapper">
                <input type="time" className="form-input" value={bookingForm.startTime} onChange={e => setBookingForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <div className="form-input-wrapper">
                <input type="time" className="form-input" value={bookingForm.endTime} onChange={e => setBookingForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Purpose</label>
            <div className="form-input-wrapper" style={{ alignItems: 'flex-start' }}>
              <textarea
                className="form-input"
                rows={3}
                placeholder="What is this booking for?"
                value={bookingForm.purpose}
                onChange={e => setBookingForm(p => ({ ...p, purpose: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          <button className="btn-primary btn-glow" onClick={handleBook} disabled={submitting}>
            {submitting ? 'Submitting...' : '✅ Submit Booking Request'}
          </button>
        </div>
      </GlassModal>
    </div>
  );
}
