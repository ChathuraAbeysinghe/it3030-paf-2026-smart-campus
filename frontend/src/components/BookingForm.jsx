import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import AvailabilityChecker from './AvailabilityChecker';

const MIN_OCCUPANCY = 0.60;

function computeMinRequired(capacity) {
  if (!capacity || capacity === 0) return 1;
  return Math.ceil(capacity * MIN_OCCUPANCY);
}

function normalizeBooking(initialBooking) {
  if (!initialBooking) {
    return {
      facilityId: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      attendees: null,
    };
  }

  return {
    facilityId: initialBooking.facilityId || initialBooking.resourceId || '',
    date: initialBooking.date || '',
    startTime: initialBooking.startTime || '',
    endTime: initialBooking.endTime || '',
    purpose: initialBooking.purpose || '',
    attendees: initialBooking.expectedAttendees || 1,
  };
}

export default function BookingForm({
  resources,
  onSaved,
  initialBooking,
  onCancelEdit,
}) {
  var [form, setForm]               = useState(normalizeBooking(initialBooking));
  var [conflicts, setConflicts]     = useState([]);
  var [loadingConflicts, setLoadingConflicts] = useState(false);
  var [submitting, setSubmitting]   = useState(false);
  var [error, setError]             = useState('');

  // ── selected resource state for capacity validation ──
  var [selectedResource, setSelectedResource] = useState(null);

  var isEdit = !!initialBooking;

  useEffect(function () {
    setForm(normalizeBooking(initialBooking));
    setError('');
  }, [initialBooking]);

  // ── load resource details when facility changes ──
  useEffect(function () {
    if (!form.facilityId) { setSelectedResource(null); return; }
    var found = (resources || []).find(function (r) { return r.id === form.facilityId; });
    setSelectedResource(found || null);
  }, [form.facilityId, resources]);

  useEffect(function () {
    var canCheck = form.facilityId && form.date;
    if (!canCheck) {
      setConflicts([]);
      return;
    }

    var cancelled = false;
    (async function () {
      setLoadingConflicts(true);
      try {
        var rows = await bookingService.getFacilityConflicts(form.facilityId, form.date);
        if (!cancelled) setConflicts(rows);
      } catch {
        if (!cancelled) setConflicts([]);
      } finally {
        if (!cancelled) setLoadingConflicts(false);
      }
    })();

    return function () { cancelled = true; };
  }, [form.facilityId, form.date]);

  // ── capacity validation computed values ──
  var capacity     = selectedResource ? selectedResource.capacity : null;
  var minRequired  = computeMinRequired(capacity);
  var attendees    = Number(form.attendees) || 0;
  var overCapacity = capacity != null && attendees > capacity;
  var belowMinimum = capacity != null && attendees > 0 && attendees < minRequired;

  // ── booking type label (BOOKING or REQUEST) ──
  var bookingTypeLabel = useMemo(function () {
    if (!capacity || attendees === 0 || overCapacity) return null;
    return attendees >= minRequired ? 'BOOKING' : 'REQUEST';
  }, [attendees, capacity, minRequired, overCapacity]);

  var hasBasicInvalidTime = useMemo(function () {
    if (!form.startTime || !form.endTime) return false;
    return form.startTime >= form.endTime;
  }, [form.startTime, form.endTime]);

  var hasOverlap = useMemo(function () {
    if (!form.startTime || !form.endTime || conflicts.length === 0) return false;
    var editId = initialBooking ? initialBooking.id : null;
    return conflicts
      .filter(function (c) { return c.id !== editId; })
      .some(function (c) {
        return c.startTime < form.endTime && c.endTime > form.startTime;
      });
  }, [conflicts, form.startTime, form.endTime, initialBooking]);

  function onChange(key, value) {
    setForm(function (prev) { return { ...prev, [key]: value }; });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (hasBasicInvalidTime) {
      setError('Start time must be before end time');
      return;
    }

    // ── block submit if over capacity ──
    if (overCapacity) {
      setError('Attendees exceed facility capacity');
      return;
    }

    if (hasOverlap) {
      setError('This time slot conflicts with an existing booking');
      return;
    }

    setSubmitting(true);
    setError('');

    var payload = {
      facilityId: form.facilityId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: form.purpose,
      attendees: Number(form.attendees),
    };

    try {
      var saved = isEdit
        ? await bookingService.update(initialBooking.id, payload)
        : await bookingService.create(payload);

      if (!isEdit) {
        setForm(normalizeBooking(null));
      }
      if (onSaved) onSaved(saved, isEdit ? 'updated' : 'created');
    } catch (err) {
      setError(err.message || 'Failed to save booking');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
      <h2 style={{ marginBottom: 6 }}>{isEdit ? 'Edit Booking' : 'Create Booking Request'}</h2>
      <p style={{ marginBottom: 14, color: 'var(--text-muted)' }}>
        Fill in the booking details and verify availability before submitting.
      </p>

      {error && (
        <div className="glass-card" style={{ marginBottom: 12, color: '#F87171', border: '1px solid rgba(248,113,113,0.35)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <select
            className="form-input"
            value={form.facilityId}
            onChange={function (e) { onChange('facilityId', e.target.value); }}
            required
          >
            <option value="">Select Facility</option>
            {(resources || []).map(function (resource) {
              return (
                <option key={resource.id} value={resource.id}>
                  {/* ── capacity in dropdown ── */}
                  {resource.name} (Cap: {resource.capacity})
                </option>
              );
            })}
          </select>

          <input
            className="form-input"
            type="date"
            value={form.date}
            onChange={function (e) { onChange('date', e.target.value); }}
            required
          />

          <input
            className="form-input"
            type="time"
            value={form.startTime}
            onChange={function (e) { onChange('startTime', e.target.value); }}
            required
          />

          <input
            className="form-input"
            type="time"
            value={form.endTime}
            onChange={function (e) { onChange('endTime', e.target.value); }}
            required
          />

          <input
            className="form-input"
            type="number"
            min="1"
            max={capacity || undefined}
            value={form.attendees}
            onChange={function (e) { onChange('attendees', e.target.value); }}
            placeholder="Expected attendees"
            required
            // ── border color changes based on validation ──
            style={{ borderColor: overCapacity ? '#F87171' : belowMinimum ? '#FBBF24' : undefined }}
          />
        </div>

        {/* ── Capacity validation panel ── */}
        {selectedResource && capacity != null && (
          <div className="glass-card" style={{
            padding: '10px 14px', display: 'grid', gap: 6,
            border: overCapacity
              ? '1px solid rgba(248,113,113,0.5)'
              : belowMinimum
                ? '1px solid rgba(251,191,36,0.5)'
                : '1px solid rgba(52,211,153,0.4)',
          }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.83rem' }}>
              <span>🏛️ <strong>Capacity:</strong> {capacity}</span>
              <span>👥 <strong>Min required (60%):</strong> {minRequired}</span>
              {attendees > 0 && !overCapacity && (
                <span>📊 <strong>Occupancy:</strong> {Math.round((attendees / capacity) * 100)}%</span>
              )}
            </div>

            {overCapacity && (
              <div style={{ color: '#F87171', fontWeight: 600, fontSize: '0.85rem' }}>
                🚫 Attendees ({attendees}) exceed the capacity of {selectedResource.name} ({capacity}). Please reduce the number of attendees.
              </div>
            )}

            {!overCapacity && belowMinimum && (
              <div style={{ color: '#FBBF24', fontSize: '0.85rem' }}>
                ⚠️ You currently have fewer attendees than required. This booking will be sent as a <strong>request</strong> and needs admin approval before confirmation.
              </div>
            )}

            {!overCapacity && !belowMinimum && attendees > 0 && (
              <div style={{ color: '#34D399', fontSize: '0.85rem' }}>
                ✅ Attendee count meets the minimum requirement. This will be submitted as a <strong>BOOKING</strong>.
              </div>
            )}
          </div>
        )}

        {/*Booking type badge*/}
        {bookingTypeLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Submission type:</span>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: bookingTypeLabel === 'BOOKING' ? 'rgba(52,211,153,0.18)' : 'rgba(251,191,36,0.18)',
              color: bookingTypeLabel === 'BOOKING' ? '#34D399' : '#FBBF24',
              border: bookingTypeLabel === 'BOOKING' ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(251,191,36,0.4)',
            }}>
              {bookingTypeLabel === 'BOOKING' ? '📋 BOOKING' : '📩 REQUEST'}
            </span>
          </div>
        )}

        <textarea
          className="form-input"
          rows="3"
          value={form.purpose}
          onChange={function (e) { onChange('purpose', e.target.value); }}
          placeholder="Purpose of booking"
          required
        />

        {loadingConflicts ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)' }}>Checking availability...</div>
        ) : (
          <AvailabilityChecker
            conflicts={conflicts}
            startTime={form.startTime}
            endTime={form.endTime}
            excludeBookingId={initialBooking ? initialBooking.id : null}
            selectedDate={form.date}
            onDateSelect={function (dateValue) { onChange('date', dateValue); }}
          />
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn-sm btn-sm--primary"
            type="submit"
            // ── over capacity ──
            disabled={submitting || overCapacity || hasOverlap || hasBasicInvalidTime}
          >
            {/* ── button label changes based on booking type ── */}
            {submitting ? 'Saving...' : isEdit ? 'Update Booking'
              : bookingTypeLabel === 'REQUEST' ? 'Submit Request' : 'Submit Booking'}
          </button>

          {isEdit && (
            <button type="button" className="btn-sm" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}

          {hasOverlap && (
            <span style={{ color: '#F87171', fontSize: '0.8rem' }}>
              ⚠️ Time slot already booked
            </span>
          )}
        </div>
      </form>
    </div>
  );
}