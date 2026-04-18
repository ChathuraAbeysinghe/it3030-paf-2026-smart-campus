import { 
  Ticket, PenTool, RefreshCw, MessageSquare, Paperclip, 
  CheckCircle, AlertTriangle, CheckSquare, Bell, PauseCircle, RotateCcw, AlertCircle
} from 'lucide-react';

/**
 * Vertical activity timeline for ticket audit trail.
 */
const EVENT_CONFIG = {
  CREATED:        { icon: Ticket, color: 'bg-blue-500', bg: 'bg-blue-50 text-blue-500' },
  ASSIGNED:       { icon: PenTool, color: 'bg-indigo-500', bg: 'bg-indigo-50 text-indigo-500' },
  STATUS_CHANGED: { icon: RefreshCw, color: 'bg-amber-500', bg: 'bg-amber-50 text-amber-500' },
  COMMENTED:      { icon: MessageSquare, color: 'bg-slate-500', bg: 'bg-slate-50 text-slate-500' },
  ATTACHMENT_ADDED: { icon: Paperclip, color: 'bg-slate-500', bg: 'bg-slate-50 text-slate-500' },
  RESOLVED:       { icon: CheckCircle, color: 'bg-green-500', bg: 'bg-green-50 text-green-500' },
  DISPUTED:       { icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50 text-red-500' },
  CLOSED:         { icon: CheckSquare, color: 'bg-emerald-600', bg: 'bg-emerald-50 text-emerald-600' },
  SLA_BREACHED:   { icon: Bell, color: 'bg-red-500', bg: 'bg-red-50 text-red-500' },
  ON_HOLD:        { icon: PauseCircle, color: 'bg-slate-500', bg: 'bg-slate-50 text-slate-500' },
  REOPENED:       { icon: RotateCcw, color: 'bg-amber-500', bg: 'bg-amber-50 text-amber-500' },
};

function formatTimelineDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="text-slate-400 text-sm">No activity yet</span>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.eventType] || { icon: AlertCircle, color: 'bg-slate-500', bg: 'bg-slate-50 text-slate-500' };
        const IconComponent = config.icon;

        return (
          <div key={event.id || i} className="relative">
            <div className={`absolute -left-[36px] top-0 rounded-full p-[6px] ${config.bg} shadow-sm ring-[3px] ring-white z-10`}>
              <IconComponent size={14} strokeWidth={2.5} />
            </div>
            
            {/* Content */}
            <div className="flex flex-col">
              <div className="text-sm text-slate-800 leading-snug">{event.description}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">{event.actorName}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{formatTimelineDate(event.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
