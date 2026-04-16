import { useState } from 'react';

/**
 * Modal for user to dispute a resolved ticket.
 */
export default function DisputeModal({ open, onClose, onSubmit, loading }) {
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (!note.trim()) return;
    onSubmit(note.trim());
    setNote('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dispute-modal glass-card animate-in" onClick={e => e.stopPropagation()}>
        <div className="dispute-modal-header">
          <h3>⚠ Report that the issue isn't resolved</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="dispute-modal-body">
          <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.85rem' }}>
            Please describe what's still wrong. The technician will be notified and the ticket will be reopened.
          </p>
          <textarea
            className="dispute-textarea"
            placeholder="Describe what's still wrong..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
          />
        </div>
        <div className="dispute-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="resolution-btn-dispute"
            onClick={handleSubmit}
            disabled={!note.trim() || loading}
          >
            {loading ? 'Submitting...' : '⚠ Submit Dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}
