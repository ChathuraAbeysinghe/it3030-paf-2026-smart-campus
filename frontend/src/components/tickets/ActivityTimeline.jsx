/**
 * Vertical activity timeline for ticket audit trail.
 */
const EVENT_CONFIG = {
  CREATED:        { icon: '🎫', color: '#3B82F6' },
  ASSIGNED:       { icon: '🔧', color: '#8B5CF6' },
  STATUS_CHANGED: { icon: '🔄', color: '#F59E0B' },
  COMMENTED:      { icon: '💬', color: '#6B7280' },
  ATTACHMENT_ADDED: { icon: '📎', color: '#6B7280' },
  RESOLVED:       { icon: '✅', color: '#10B981' },
  DISPUTED:       { icon: '⚠️', color: '#EF4444' },
  CLOSED:         { icon: '✓', color: '#059669' },
  SLA_BREACHED:   { icon: '🚨', color: '#EF4444' },
  ON_HOLD:        { icon: '⏸️', color: '#6B7280' },
  REOPENED:       { icon: '🔁', color: '#F59E0B' },
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
      <div className="timeline-empty">
        <span style={{ opacity: 0.5 }}>No activity yet</span>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      {events.map((event, i) => {
        const config = EVENT_CONFIG[event.eventType] || { icon: '●', color: '#6B7280' };
        const isLast = i === events.length - 1;

        return (
          <div key={event.id || i} className="timeline-item">
            <div className="timeline-connector">
              <div className="timeline-dot" style={{ background: config.color, borderColor: config.color }}>
                <span style={{ fontSize: '0.65rem' }}>{config.icon}</span>
              </div>
              {!isLast && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <div className="timeline-description">{event.description}</div>
              <div className="timeline-meta">
                <span className="timeline-actor">{event.actorName}</span>
                <span className="timeline-time">{formatTimelineDate(event.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
