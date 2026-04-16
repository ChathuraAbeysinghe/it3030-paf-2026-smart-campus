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
    <div className="ticket-progress-bar">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        let dotClass = 'step-dot';
        if (isRejected) {
          dotClass += i === 0 ? ' step-rejected' : ' step-future';
        } else if (isOnHold && i === 1) {
          dotClass += ' step-paused';
        } else if (isCompleted) {
          dotClass += ' step-completed';
        } else if (isCurrent) {
          dotClass += ' step-current';
        } else {
          dotClass += ' step-future';
        }

        return (
          <div key={step.key} className="step-item">
            {i > 0 && (
              <div className={`step-line ${isCompleted && !isRejected ? 'line-completed' : ''} ${isRejected ? 'line-rejected' : ''}`} />
            )}
            <div className={dotClass}>
              {isCompleted && !isRejected ? '✓' : ''}
              {isRejected && i === 0 ? '✗' : ''}
              {isOnHold && i === 1 ? '⏸' : ''}
            </div>
            <span className={`step-label ${isCurrent ? 'label-current' : ''} ${isRejected && i === 0 ? 'label-rejected' : ''}`}>
              {isOnHold && i === 1 ? 'On Hold' : step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
