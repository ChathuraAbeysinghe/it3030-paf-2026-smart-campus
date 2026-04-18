import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-red-600 text-lg flex items-center gap-2">
            <AlertTriangle size={20} /> Issue Not Fixed
          </h3>
          <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-slate-500 text-sm mb-4">
            Please describe what's still wrong. The technician will be notified and the ticket will be reopened.
          </p>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dispute Note *</label>
          <textarea
            className="rounded-xl border border-slate-200 w-full px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition resize-none"
            placeholder="Describe what's still wrong..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={4}
          />
        </div>
        <div className="flex gap-3">
          <button 
            className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex-1 py-2.5 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!note.trim() || loading}
          >
            {loading ? 'Submitting...' : <><AlertTriangle size={16} /> Submit Dispute</>}
          </button>
        </div>
      </div>
    </div>
  );
}
