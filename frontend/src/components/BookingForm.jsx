import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import AvailabilityChecker from './AvailabilityChecker';

function normalizeBooking(initialBooking) {
  if (!initialBooking) {
    return {
      facilityId: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      attendees: 1,
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
  var [form, setForm] = useState(normalizeBooking(initialBooking));
  var [conflicts, setConflicts] = useState([]);
  var [loadingConflicts, setLoadingConflicts] = useState(false);
  var [submitting, setSubmitting] = useState(false);
  var [error, setError] = useState('');

  var isEdit = !!initialBooking;

  useEffect(function () {
    setForm(normalizeBooking(initialBooking));
    setError('');
  }, [initialBooking]);

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

    return function () {
      cancelled = true;
    };
  }, [form.facilityId, form.date]);

  var hasBasicInvalidTime = useMemo(function () {
    if (!form.startTime || !form.endTime) return false;
    return form.startTime >= form.endTime;
  }, [form.startTime, form.endTime]);

  function onChange(key, value) {
    setForm(function (prev) {
      return { ...prev, [key]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (hasBasicInvalidTime) {
      setError('Start time must be before end time');
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
                  {resource.name}
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
            value={form.attendees}
            onChange={function (e) { onChange('attendees', e.target.value); }}
            placeholder="Expected attendees"
            required
          />
        </div>

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
          />
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-sm btn-sm--primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : (isEdit ? 'Update Booking' : 'Submit Booking')}
          </button>
          {isEdit && (
            <button type="button" className="btn-sm" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
