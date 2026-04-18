const PRIORITY_CONFIG = {
  CRITICAL: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)', label: 'Critical', pulse: true },
  HIGH:     { color: '#F97316', bg: 'rgba(249,115,22,0.15)', label: 'High',     pulse: false },
  MEDIUM:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', label: 'Medium',   pulse: false },
  LOW:      { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: 'Low',     pulse: false },
};

export default function TicketPriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span className={`ticket-priority-badge ${config.pulse ? 'priority-pulse' : ''}`} style={{
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.color}33`,
    }}>
      <span className="priority-dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}
