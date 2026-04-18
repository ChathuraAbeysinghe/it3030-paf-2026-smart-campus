import { useEffect, useMemo, useState } from 'react';
import { bookingService } from '../services/api';
import '../pages/user/modern-pages.css';

function toInitialForm(data, selectedResource) {
  const source = data || {};
  return {
    facilityId: selectedResource?.id || source.facilityId || source.resourceId || '',
    date: source.date || '',
    startTime: source.startTime || '',
    endTime: source.endTime || '',
    attendees: source.expectedAttendees || source.attendees || 1,
    purpose: source.purpose || '',
  };
}

export default function BookingForm({
  resources = [],
  onSaved,
  initialData,
  initialBooking,
  onCancel,
  onCancelEdit,
  selectedResource,
  onChangeResource,
}) {
  const editingSource = initialData || initialBooking || null;
  const isEdit = !!editingSource;

  const [form, setForm] = useState(toInitialForm(editingSource, selectedResource));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    setForm(toInitialForm(editingSource, selectedResource));
    setError('');
  }, [initialData, initialBooking, selectedResource]);

  const facility = useMemo(() => {
    if (selectedResource) return selectedResource;
    return resources.find((r) => r.id === form.facilityId) || null;
  }, [resources, form.facilityId, selectedResource]);

  useEffect(() => {
    if (!form.facilityId || !form.date) {
      setConflicts([]);
      return;
    }

    let disposed = false;
    (async () => {
      setChecking(true);
      try {
        const rows = await bookingService.getFacilityConflicts(form.facilityId, form.date);
        if (!disposed) setConflicts(rows || []);
      } catch {
        if (!disposed) setConflicts([]);
      } finally {
        if (!disposed) setChecking(false);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [form.facilityId, form.date]);

  const hasTimeError = form.startTime && form.endTime && form.startTime >= form.endTime;

  const hasOverlap = useMemo(() => {
    if (!form.startTime || !form.endTime) return false;
    const editId = editingSource?.id || null;
    return conflicts
      .filter((c) => c.id !== editId)
      .some((c) => c.startTime < form.endTime && c.endTime > form.startTime);
  }, [conflicts, form.startTime, form.endTime, editingSource]);

  const exceedsCapacity = facility?.capacity ? Number(form.attendees) > facility.capacity : false;

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (hasTimeError) {
      setError('End time must be after start time.');
      return;
    }

    if (hasOverlap) {
      setError('This time range conflicts with an existing booking.');
      return;
    }

    if (exceedsCapacity) {
      setError('Attendees exceed facility capacity.');
      return;
    }

    setSubmitting(true);
    const payload = {
      facilityId: form.facilityId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      purpose: form.purpose,
      attendees: Number(form.attendees),
    };

    try {
      const saved = isEdit
        ? await bookingService.update(editingSource.id, payload)
        : await bookingService.create(payload);

      if (!isEdit) setForm(toInitialForm(null, selectedResource));
      if (onSaved) onSaved(saved, isEdit ? 'updated' : 'created');
    } catch (err) {
      setError(err.message || 'Failed to save booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelHandler = onCancelEdit || onCancel;

  return (
    <div className="glass-card modern-booking-form modern-panel">
      <h2>{isEdit ? 'Edit Booking' : 'Create Booking Request'}</h2>
      <p>Fill in details and submit your booking.</p>

      {error && (
        <div className="modern-inline-card modern-inline-card--error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {selectedResource ? (
          <div className="glass-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700 }}>{selectedResource.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Capacity: {selectedResource.capacity || '-'}
              </div>
            </div>
            {!isEdit && onChangeResource && (
              <button type="button" className="btn-sm" onClick={onChangeResource}>Change</button>
            )}
          </div>
        ) : (
          <select
            className="form-input modern-standalone-input"
            value={form.facilityId}
            onChange={(e) => setField('facilityId', e.target.value)}
            required
          >
            <option value="">Select Facility</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity || '-'})</option>
            ))}
          </select>
        )}

        <div className="modern-booking-form__grid">
          <input className="form-input modern-standalone-input" type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} required />
          <input className="form-input modern-standalone-input" type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required />
          <input className="form-input modern-standalone-input" type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} required />
          <input
            className="form-input modern-standalone-input"
            type="number"
            min="1"
            value={form.attendees}
            onChange={(e) => setField('attendees', e.target.value)}
            placeholder="Expected attendees"
            required
          />
        </div>

        <textarea
          className="form-input modern-standalone-input"
          rows="3"
          value={form.purpose}
          onChange={(e) => setField('purpose', e.target.value)}
          placeholder="Purpose of booking"
          required
        />

        {checking ? (
          <div className="modern-inline-card modern-inline-card--info">Checking availability...</div>
        ) : hasOverlap ? (
          <div className="modern-inline-card modern-inline-card--error">Selected slot overlaps with an existing booking.</div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn-primary btn-glow"
            type="submit"
            disabled={submitting || hasTimeError || hasOverlap || exceedsCapacity || !form.facilityId}
            style={{ width: 'auto' }}
          >
            {submitting ? 'Saving...' : isEdit ? 'Update Booking' : 'Submit Booking'}
          </button>

          {cancelHandler && (
            <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={cancelHandler}>
              Cancel
            </button>
          )}

          {hasTimeError && <span style={{ color: '#F87171', fontSize: '0.8rem' }}>End time must be after start time.</span>}
          {exceedsCapacity && <span style={{ color: '#F87171', fontSize: '0.8rem' }}>Attendees exceed capacity.</span>}
        </div>
      </form>
    </div>
  );
}
