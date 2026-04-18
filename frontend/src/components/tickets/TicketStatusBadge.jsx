import { statusLabels } from '../../mock/tickets';
import { Circle, RefreshCw, Hourglass, PauseCircle, CheckCircle2, Check, X } from 'lucide-react';

const STATUS_CONFIG = {
  OPEN:                       { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  icon: Circle },
  IN_PROGRESS:                { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  icon: RefreshCw },
  WAITING_USER_CONFIRMATION:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  icon: Hourglass },
  ON_HOLD:                    { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: PauseCircle },
  RESOLVED:                   { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  icon: CheckCircle2 },
  CLOSED:                     { color: '#059669', bg: 'rgba(5,150,105,0.15)',   icon: Check },
  REJECTED:                   { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   icon: X },
};

export default function TicketStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  const label = statusLabels[status] || status;
  const Icon = config.icon || Circle;

  return (
    <span className="ticket-status-badge" style={{
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.color}33`,
    }}>
      <Icon size={12} style={{ marginRight: 4 }} /> {label}
    </span>
  );
}
