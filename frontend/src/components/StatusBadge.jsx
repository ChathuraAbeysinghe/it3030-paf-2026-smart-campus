/**
 * Color-coded status badge for bookings, tickets, etc.
 */
const COLORS = {
  PENDING:     { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: 'rgba(251,191,36,0.3)' },
  APPROVED:    { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', border: 'rgba(52,211,153,0.3)' },
  REJECTED:    { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.3)' },
  CANCELLED:   { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.3)' },
  OPEN:        { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', border: 'rgba(96,165,250,0.3)' },
  IN_PROGRESS: { bg: 'rgba(251,146,60,0.12)',  color: '#FB923C', border: 'rgba(251,146,60,0.3)' },
  RESOLVED:    { bg: 'rgba(52,211,153,0.12)',  color: '#34D399', border: 'rgba(52,211,153,0.3)' },
  CLOSED:      { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.3)' },
  LOW:         { bg: 'rgba(96,165,250,0.12)',  color: '#60A5FA', border: 'rgba(96,165,250,0.3)' },
  MEDIUM:      { bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: 'rgba(251,191,36,0.3)' },
  HIGH:        { bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.3)' },
  CRITICAL:    { bg: 'rgba(239,68,68,0.2)',    color: '#EF4444', border: 'rgba(239,68,68,0.4)' },
};

export default function StatusBadge({ status }) {
  const s = COLORS[status] || COLORS.PENDING;
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.3px',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      textTransform: 'uppercase',
    }}>
      {status?.replace('_', ' ')}
    </span>
  );
}
