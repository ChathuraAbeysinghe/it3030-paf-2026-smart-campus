import { useState, useEffect } from 'react';

/**
 * SLA Countdown Timer.
 * Shows time remaining until deadline. Changes color as it approaches.
 */
export default function SLATimer({ deadline }) {
  const [remaining, setRemaining] = useState(calcRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(calcRemaining(deadline)), 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;

  const { hours, minutes, expired, color, label } = remaining;

  return (
    <span className="sla-timer" style={{ color, borderColor: color + '40' }}>
      ⏱ {expired ? 'OVERDUE' : `${hours}h ${minutes}m`}
      <span className="sla-timer-label">{label}</span>
    </span>
  );
}

function calcRemaining(deadline) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true, color: '#EF4444', label: 'SLA Breached' };

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  let color = '#34D399'; // green
  let label = 'On Track';
  if (hours < 4) { color = '#FBBF24'; label = 'Approaching'; }
  if (hours < 1) { color = '#F87171'; label = 'Urgent'; }

  return { hours, minutes, expired: false, color, label };
}
