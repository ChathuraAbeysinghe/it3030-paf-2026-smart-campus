import { Check, Pause, X } from 'lucide-react';

/**
 * Visual step indicator for ticket workflow.
 * Steps: OPEN → IN_PROGRESS → WAITING → RESOLVED → CLOSED
 * ON_HOLD & REJECTED show special states.
 */
const STEPS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'WAITING_USER_CONFIRMATION', label: 'Awaiting' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

function getStepIndex(status) {
  const idx = STEPS.findIndex(s => s.key === status);
  if (idx >= 0) return idx;
  if (status === 'ON_HOLD') return 1; // Show between IN_PROGRESS
  if (status === 'REJECTED') return 0;
  return 0;
}

export default function TicketProgressBar({ status }) {
  const isRejected = status === 'REJECTED';
  const isOnHold = status === 'ON_HOLD';
  const currentIdx = getStepIndex(status);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4 w-full">
      <div className="flex items-center w-full relative">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          // Compute circle classes
          let circleClass = "flex items-center justify-center w-7 h-7 rounded-full z-10 shrink-0 ";
          
          if (isRejected && i === 0) {
            circleClass += "bg-red-500 text-white";
          } else if (isOnHold && i === 1) {
            circleClass += "bg-amber-500 text-white animate-pulse";
          } else if (isCompleted) {
            circleClass += "bg-indigo-600 text-white";
          } else if (isCurrent) {
            circleClass += "bg-indigo-600 text-white ring-4 ring-indigo-100";
          } else {
            circleClass += "bg-slate-100 border-2 border-slate-200 text-slate-400";
          }

          // Compute label classes
          let labelClass = "absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs mt-2 ";
          if (isCurrent && !isRejected && !isOnHold) labelClass += "text-indigo-600 font-medium";
          else if (isRejected && i === 0) labelClass += "text-red-500 font-medium";
          else if (isOnHold && i === 1) labelClass += "text-amber-500 font-medium";
          else labelClass += "text-slate-500";

          return (
            <div key={step.key} className="flex-1 flex items-center relative first:max-w-fit last:flex-none">
              {/* Connector Line (except for the last item, handled by layout differently or drawn to the next) */}
              
              <div className="relative flex justify-center items-center">
                <div className={circleClass}>
                  {(isCompleted && !isRejected && !isOnHold) && <Check size={14} strokeWidth={3} />}
                  {(isRejected && i === 0) && <X size={14} strokeWidth={3} />}
                  {(isOnHold && i === 1) && <Pause size={14} strokeWidth={3} />}
                </div>
                <span className={labelClass}>
                  {isOnHold && i === 1 ? 'On Hold' : isRejected && i === 0 ? 'Rejected' : step.label}
                </span>
              </div>
              
              {/* Line connector following the circle */}
              {i < STEPS.length - 1 && (
                <div className={`h-[2px] flex-1 mx-2 ${isCompleted && !isRejected ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Spacer for labels */}
    </div>
  );
}
