/**
 * Color-coded status badge for bookings, tickets, etc.
 */
const BADGE_CLASS = {
  PENDING: 'badge badge-pending',
  APPROVED: 'badge badge-active',
  REJECTED: 'badge badge-rejected',
  CANCELLED: 'badge badge-rejected',
  OPEN: 'badge badge-open',
  IN_PROGRESS: 'badge badge-open',
  RESOLVED: 'badge badge-active',
  CLOSED: 'badge badge-rejected',
  LOW: 'badge badge-open',
  MEDIUM: 'badge badge-pending',
  HIGH: 'badge badge-rejected',
  CRITICAL: 'badge badge-rejected',
};

export default function StatusBadge({ status }) {
  const className = BADGE_CLASS[status] || 'badge badge-pending';
  return (
    <span className={className}>
      {status?.replace('_', ' ')}
    </span>
  );
}
