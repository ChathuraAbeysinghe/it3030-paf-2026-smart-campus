import { CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Resolution confirmation panel — shown to USER when WAITING_USER_CONFIRMATION.
 */
export default function ResolutionConfirmPanel({ ticket, onConfirm, onDispute, loading }) {
  if (!ticket || ticket.status !== 'WAITING_USER_CONFIRMATION') return null;

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex gap-4 mt-6">
      <div className="shrink-0 mt-1 text-indigo-600">
        <CheckCircle2 size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-indigo-900 font-bold text-lg mb-1">
          The technician has marked this issue as resolved
        </h3>
        <p className="text-indigo-700/80 text-sm mb-4">Please confirm if the issue is completely fixed on your end.</p>
        
        {ticket.resolutionNote && (
          <div className="bg-white/60 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-900 mb-4 whitespace-pre-wrap">
            <strong className="block text-xs uppercase tracking-wider text-indigo-500 mb-1">Resolution note:</strong>
            {ticket.resolutionNote}
          </div>
        )}

        {ticket.resolutionAttachments?.length > 0 && (
          <div className="mb-4">
            <strong className="block text-xs uppercase tracking-wider text-indigo-500 mb-2">Evidence:</strong>
            <div className="flex gap-2">
              {ticket.resolutionAttachments.map((a, i) => (
                <img key={i} src={a.url} alt={a.filename} className="w-16 h-16 object-cover rounded-xl border border-indigo-200" />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          <button 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-3 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            onClick={onConfirm} 
            disabled={loading}
          >
            <CheckCircle2 size={18} /> Confirm — Issue is Fixed
          </button>
          <button 
            className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg py-3 transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            onClick={onDispute} 
            disabled={loading}
          >
            <AlertTriangle size={18} /> Dispute — Still Broken
          </button>
        </div>
      </div>
    </div>
  );
}
