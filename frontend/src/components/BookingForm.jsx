/**
 * BookingForm.jsx — updated to accept a pre-selected resource.
 * When `selectedResource` prop is provided:
 *   - The facility dropdown is hidden
 *   - A resource info card is shown at the top instead
 *   - `onChangeResource` button lets user go back to picker
 */
import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import AvailabilityChecker from './AvailabilityChecker';
import { getResourceVisual, formatResourceType } from './resource/resourceVisuals';

const MIN_OCCUPANCY = 0.60;

function computeMinRequired(capacity) {
  if (!capacity || capacity === 0) return 1;
  return Math.ceil(capacity * MIN_OCCUPANCY);
}

function normalizeBooking(initialBooking) {
  if (!initialBooking) {
    return { facilityId: '', date: '', startTime: '', endTime: '', purpose: '', attendees: null };
  }
  return {
    facilityId:  initialBooking.facilityId  || initialBooking.resourceId || '',
    date:        initialBooking.date        || '',
    startTime:   initialBooking.startTime   || '',
    endTime:     initialBooking.endTime     || '',
    purpose:     initialBooking.purpose     || '',
    attendees:   initialBooking.expectedAttendees || 1,
  };
}

export default function BookingForm({
  resources,
  onSaved,
  initialBooking,
  onCancelEdit,
  selectedResource,    // ← NEW: pre-selected resource object from ResourcePicker
  onChangeResource,    // ← NEW: callback to go back to resource picker
}) {
  const [form, setForm]                   = useState(normalizeBooking(initialBooking));
  const [conflicts, setConflicts]         = useState([]);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState('');

  const isEdit = !!initialBooking;

  // When a pre-selected resource arrives, set facilityId automatically
  useEffect(() => {
    if (selectedResource) {
      setForm(prev => ({ ...prev, facilityId: selectedResource.id }));
    }
  }, [selectedResource]);

  useEffect(() => {
    const normalized = normalizeBooking(initialBooking);
    if (!normalized.facilityId && selectedResource && selectedResource.id) {
      normalized.facilityId = selectedResource.id;
    }
    setForm(normalized);
    setError('');
  }, [initialBooking]);

  // Resolve current resource
  const currentResource = selectedResource
    || (resources || []).find(r => r.id === form.facilityId)
    || null;

  const capacity    = currentResource ? currentResource.capacity : null;
  const minRequired = computeMinRequired(capacity);
  const attendees   = Number(form.attendees) || 0;
  const overCapacity = capacity != null && attendees > capacity;
  const belowMinimum = capacity != null && attendees > 0 && attendees < minRequired;

  const bookingTypeLabel = useMemo(() => {
    if (!capacity || attendees === 0 || overCapacity) return null;
    return attendees >= minRequired ? 'BOOKING' : 'REQUEST';
  }, [attendees, capacity, minRequired, overCapacity]);

  const hasBasicInvalidTime = useMemo(() => {
    if (!form.startTime || !form.endTime) return false;
    return form.startTime >= form.endTime;
  }, [form.startTime, form.endTime]);

  const hasOverlap = useMemo(() => {
    if (!form.startTime || !form.endTime || conflicts.length === 0) return false;
    const editId = initialBooking ? initialBooking.id : null;
    return conflicts
      .filter(c => c.id !== editId)
      .some(c => c.startTime < form.endTime && c.endTime > form.startTime);
  }, [conflicts, form.startTime, form.endTime, initialBooking]);

  // Load conflicts when facility + date change
  useEffect(() => {
    const canCheck = form.facilityId && form.date;
    if (!canCheck) { setConflicts([]); return; }

    let cancelled = false;
    (async () => {
      setLoadingConflicts(true);
      try {
        const rows = await bookingService.getFacilityConflicts(form.facilityId, form.date);
        if (!cancelled) setConflicts(rows);
      } catch {
        if (!cancelled) setConflicts([]);
      } finally {
        if (!cancelled) setLoadingConflicts(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.facilityId, form.date]);

  const onChange = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasBasicInvalidTime) { setError('Start time must be before end time'); return; }
    if (overCapacity)         { setError('Attendees exceed facility capacity'); return; }
    if (hasOverlap)           { setError('This time slot conflicts with an existing booking'); return; }

    setSubmitting(true);
    setError('');

    const payload = {
      facilityId: form.facilityId,
      date:       form.date,
      startTime:  form.startTime,
      endTime:    form.endTime,
      purpose:    form.purpose,
      attendees:  Number(form.attendees),
    };

    try {
      const saved = isEdit
        ? await bookingService.update(initialBooking.id, payload)
        : await bookingService.create(payload);

      if (!isEdit) setForm(normalizeBooking(null));
      if (onSaved) onSaved(saved, isEdit ? 'updated' : 'created');
    } catch (err) {
      setError(err.message || 'Failed to save booking');
    } finally {
      setSubmitting(false);
    }
  };

  const visual = currentResource ? getResourceVisual(currentResource.type) : null;

  return (
    <div className="glass-card animate-in" style={{ padding: 20, marginBottom: 20 }}>
      <h2 style={{ marginBottom: 4 }}>
        {isEdit ? 'Edit Booking' : '📅 Complete Your Booking'}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
        {isEdit
          ? 'Update the details for your booking request.'
          : 'Fill in the details to confirm your booking request.'}
      </p>

      {error && (
        <div className="glass-card" style={{ marginBottom: 12, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)', padding: '10px 14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>

        {/* ── Selected Resource Card ──────────────────────────── */}
        {currentResource && visual ? (
          <div className="glass-card" style={{
            display: 'flex', gap: 16, alignItems: 'center',
            padding: '12px 16px', flexWrap: 'wrap',
            border: '1px solid rgba(0,173,181,0.4)',
          }}>
            <img
              src={visual.image}
              alt={visual.label}
              style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: '1.2rem' }}>{visual.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                  {currentResource.name}
                </span>
                <span className="filter-chip filter-chip--active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                  {formatResourceType(currentResource.type)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>📍 {currentResource.location}</span>
                <span>👥 Capacity: {currentResource.capacity}</span>
                <span>🕐 {currentResource.availableFrom} – {currentResource.availableTo}</span>
              </div>
              {currentResource.description && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {currentResource.description}
                </div>
              )}
            </div>

            {/* Change resource button — only for new booking */}
            {!isEdit && onChangeResource && (
              <button
                type="button"
                className="btn-sm"
                onClick={onChangeResource}
                style={{ flexShrink: 0 }}
              >
                🔄 Change
              </button>
            )}
          </div>
        ) : !isEdit && (
          /* Fallback dropdown when no resource is pre-selected (edit mode) */
          <select
            className="form-input"
            value={form.facilityId}
            onChange={e => onChange('facilityId', e.target.value)}
            required
          >
            <option value="">Select Facility</option>
            {(resources || []).map(r => (
              <option key={r.id} value={r.id}>
                {r.name} (Cap: {r.capacity})
              </option>
            ))}
          </select>
        )}

        {/* ── Date + Time row ─────────────────────────────────── */}
          <div className="form-group">
        {/* ── Availability checker ────────────────────────────── */}
        {loadingConflicts ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)', padding: '10px 14px' }}>
            Checking availability...
          </div>
        ) : (
          <AvailabilityChecker
            conflicts={conflicts}
            startTime={form.startTime}
            endTime={form.endTime}
            excludeBookingId={initialBooking ? initialBooking.id : null}
            selectedDate={form.date}
            onDateSelect={val => onChange('date', val)}
          />
        )}
          </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>  
          <div className="form-group">
            <label className="form-label">Start Time *</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">🕐</span>
              <input
                className="form-input"
                type="time"
                value={form.startTime}
                onChange={e => onChange('startTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">End Time *</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">🕑</span>
              <input
                className="form-input"
                type="time"
                value={form.endTime}
                onChange={e => onChange('endTime', e.target.value)}
                required
                style={{ borderColor: hasBasicInvalidTime ? '#F87171' : undefined }}
              />
            </div>
            {hasBasicInvalidTime && (
              <span className="form-error">End time must be after start time</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Expected Attendees *</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon">👥</span>
              <input
                className="form-input"
                type="number"
                min="1"
                max={capacity || undefined}
                value={form.attendees || ''}
                onChange={e => onChange('attendees', e.target.value)}
                placeholder="e.g. 30"
                required
                style={{ borderColor: overCapacity ? '#F87171' : belowMinimum ? '#FBBF24' : undefined }}
              />
            </div>
          </div>
        </div>

        {/* ── Capacity validation panel ───────────────────────── */}
        {currentResource && capacity != null && (
          <div className="glass-card" style={{
            padding: '10px 14px', display: 'grid', gap: 6,
            border: `1px solid ${overCapacity ? 'rgba(248,113,113,0.5)' : belowMinimum ? 'rgba(251,191,36,0.5)' : 'rgba(52,211,153,0.4)'}`,
          }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.83rem' }}>
              <span>🏛️ <strong>Capacity:</strong> {capacity}</span>
              <span>👥 <strong>Min (60%):</strong> {minRequired}</span>
              {attendees > 0 && !overCapacity && (
                <span>📊 <strong>Occupancy:</strong> {Math.round((attendees / capacity) * 100)}%</span>
              )}
            </div>
            {overCapacity && (
              <div style={{ color: '#F87171', fontSize: '0.83rem' }}>
                🚫 {attendees} attendees exceed the capacity of {currentResource.name} ({capacity}). Please reduce.
              </div>
            )}
            {!overCapacity && belowMinimum && (
              <div style={{ color: '#FBBF24', fontSize: '0.83rem' }}>
                ⚠️ Below minimum — will be submitted as a <strong>REQUEST</strong> pending admin confirmation.
              </div>
            )}
            {!overCapacity && !belowMinimum && attendees > 0 && (
              <div style={{ color: '#34D399', fontSize: '0.83rem' }}>
                ✅ Attendee count meets the minimum. Submitting as a <strong>BOOKING</strong>.
              </div>
            )}
          </div>
        )}

        {/* ── Booking type badge ──────────────────────────────── */}
        {bookingTypeLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submission type:</span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: bookingTypeLabel === 'BOOKING' ? 'rgba(52,211,153,0.18)' : 'rgba(251,191,36,0.18)',
              color:      bookingTypeLabel === 'BOOKING' ? '#34D399' : '#FBBF24',
              border:     bookingTypeLabel === 'BOOKING' ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(251,191,36,0.4)',
            }}>
              {bookingTypeLabel === 'BOOKING' ? '📋 BOOKING' : '📩 REQUEST'}
            </span>
          </div>
        )}

        {/* ── Purpose ─────────────────────────────────────────── */}
        <div className="form-group">
          <label className="form-label">Purpose *</label>
          <div className="form-input-wrapper" style={{ alignItems: 'flex-start' }}>
            <span className="form-input-icon" style={{ paddingTop: 2 }}>📝</span>
            <textarea
              className="form-input"
              rows="3"
              value={form.purpose}
              onChange={e => onChange('purpose', e.target.value)}
              placeholder="Describe the purpose of this booking"
              required
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>


        {/* ── Submit row ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn-primary btn-glow"
            type="submit"
            disabled={submitting || overCapacity || hasOverlap || hasBasicInvalidTime || !form.facilityId}
            style={{ width: 'auto' }}
          >
            {submitting
              ? '⏳ Saving...'
              : isEdit
                ? '💾 Update Booking'
                : bookingTypeLabel === 'REQUEST'
                  ? '📩 Submit Request'
                  : '📅 Submit Booking'}
          </button>

          {isEdit && (
            <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}

          {hasOverlap && (
            <span style={{ color: '#F87171', fontSize: '0.8rem' }}>⚠️ Time slot already booked</span>
          )}
        </div>
      </form>
    </div>
  );
}