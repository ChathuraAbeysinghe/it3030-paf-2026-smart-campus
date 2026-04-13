/**
 * ResourcePicker.jsx
 * Step 1 of the booking flow — pick a facility visually before filling the form.
 * Matches the Resources page card style exactly.
 */
import { useState, useMemo } from 'react';
import { getResourceVisual, formatResourceType } from './resource/resourceVisuals';

const TYPE_FILTERS = [
  'ALL', 'LECTURE_HALL', 'LAB', 'SEMINAR_ROOM',
  'AUDITORIUM', 'MEETING_ROOM', 'STUDY_AREA', 'EQUIPMENT',
];

export default function ResourcePicker({ resources, onSelect, onCancel }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const available = useMemo(() => {
    return (resources || []).filter(r => {
      if (r.status === 'OUT_OF_SERVICE') return false;
      if (filter !== 'ALL' && r.type !== filter) return false;
      const term = search.toLowerCase();
      if (term) {
        const hay = [r.name, r.location, r.description, r.type].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [resources, filter, search]);

  return (
    <div className="glass-card animate-in" style={{ padding: '20px 24px', marginBottom: 20 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ margin: 0 }}>Select a Facility</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Choose the facility you want to book. Only active resources are shown.
          </p>
        </div>
        <button className="btn-sm btn-sm--danger" onClick={onCancel}>✕ Cancel</button>
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="filter-bar glass-card" style={{ marginBottom: 16 }}>
        <div className="filter-search">
          <span className="form-input-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, location, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              className={`filter-chip ${filter === t ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t === 'ALL' ? 'All' : formatResourceType(t)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resource grid ──────────────────────────────────── */}
      {available.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</p>
          <p>No active resources match your search.</p>
        </div>
      ) : (
        <div className="rm-card-grid">
          {available.map(resource => (
            <ResourcePickerCard
              key={resource.id}
              resource={resource}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Single resource card ──────────────────────────────────────── */
function ResourcePickerCard({ resource, onSelect }) {
  const visual  = getResourceVisual(resource.type);
  const hours   = `${resource.availableFrom || '--:--'} – ${resource.availableTo || '--:--'}`;

  return (
    <div
      className="glass-card rm-resource-card"
      style={{ cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s' }}
      onClick={() => onSelect(resource)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = '';
      }}
      title={`Click to book ${resource.name}`}
    >
      {/* Image + badge */}
      <div className="rm-resource-image-wrap">
        <img
          src={visual.image}
          alt={visual.label}
          className="rm-resource-image"
        />
        <span className="rm-resource-icon-badge">{visual.icon}</span>
        <span className="rm-status-pill rm-status-pill--active">Active</span>

        {/* "Book" overlay on hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,173,181,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'inherit',
          opacity: 0,
          transition: 'opacity 0.18s',
        }}
          className="rm-book-overlay"
        >
          <span style={{
            background: 'var(--primary)', color: '#fff',
            padding: '8px 20px', borderRadius: 999,
            fontWeight: 700, fontSize: '0.85rem',
          }}>
            📅 Book This
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="rm-resource-body">
        <h3 style={{ margin: 0 }}>{resource.name}</h3>
        <div className="rm-resource-type">{formatResourceType(resource.type)}</div>
        <p className="rm-resource-desc" style={{ WebkitLineClamp: 2 }}>
          {resource.description || 'No description available.'}
        </p>

        {/* Meta */}
        <div className="rm-resource-meta">
          <span>📍 {resource.location || '—'}</span>
          <span>👥 Capacity: {resource.capacity || '—'}</span>
        </div>
        <div className="rm-resource-meta" style={{ marginTop: -6 }}>
          <span>🕐 Available: {hours}</span>
        </div>

        {/* Click hint */}
        <div style={{
          marginTop: 10, textAlign: 'center',
          fontSize: '0.78rem', color: 'var(--primary)',
          fontWeight: 600, opacity: 0.8,
        }}>
          Click to book →
        </div>
      </div>
    </div>
  );
}