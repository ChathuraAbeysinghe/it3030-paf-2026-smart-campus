import { useState, useEffect } from 'react';
import { Clock, Flame } from 'lucide-react';

/**
 * SLA Countdown Timer.
 * Shows time remaining until deadline. Changes color as it approaches.
 */
export default function SLATimer({ deadline, onExpireChange }) {
  const [remaining, setRemaining] = useState(calcRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const newRemaining = calcRemaining(deadline);
      setRemaining(newRemaining);
      if (onExpireChange && newRemaining.expired !== remaining.expired) {
        onExpireChange(newRemaining.expired);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [deadline, onExpireChange, remaining.expired]);

  // Initial call parent update
  useEffect(() => {
    if (onExpireChange) {
      onExpireChange(remaining.expired);
    }
  }, []);

  if (!deadline) return null;

  const { hours, minutes, expired, state } = remaining;

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 w-fit">
        <Flame className="text-red-500" size={14} />
        <span className="text-red-600 text-xs font-medium">SLA Breached</span>
      </div>
    );
  }

  if (state === 'RISK') {
    return (
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 w-fit">
        <Clock className="text-amber-500" size={14} />
        <span className="text-amber-600 text-xs font-medium">{hours}h {minutes}m left</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 w-fit">
      <Clock className="text-green-500" size={14} />
      <span className="text-green-600 text-xs font-medium">{hours}h {minutes}m left</span>
    </div>
  );
}

function calcRemaining(deadline) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true, state: 'BREACHED' };

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  let state = 'SAFE';
  if (hours < 4) { state = 'RISK'; }

  return { hours, minutes, expired: false, state };
}
