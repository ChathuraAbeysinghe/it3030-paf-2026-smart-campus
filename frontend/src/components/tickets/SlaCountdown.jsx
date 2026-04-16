import { useState, useEffect } from 'react';

/**
 * Real-time SLA countdown with colored progress bar.
 * Updates every 30 seconds.
 */
export default function SlaCountdown({ slaDeadline, slaStatus, totalPausedDuration = 0, compact = false }) {
  const [remaining, setRemaining] = useState('');
  const [status, setStatus] = useState(slaStatus || 'WITHIN_SLA');
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    function update() {
      if (!slaDeadline) { setRemaining('—'); return; }
      if (slaStatus === 'PAUSED') { setRemaining('SLA Paused'); setStatus('PAUSED'); return; }

      const now = Date.now();
      const deadline = new Date(slaDeadline).getTime();
      const diff = deadline - now + (totalPausedDuration * 1000);

      if (diff <= 0) {
        const overdue = Math.abs(diff);
        const h = Math.floor(overdue / 3600000);
        const m = Math.floor((overdue % 3600000) / 60000);
        setRemaining(`OVERDUE ${h}h ${m}m`);
        setStatus('BREACHED');
        setPercent(100);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setRemaining(`${h}h ${m}m left`);

        // Calculate percent elapsed
        // We don't have createdAt here easily, so just use remaining vs a rough total
        const totalMs = deadline - (deadline - diff - totalPausedDuration * 1000);
        const pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - diff) / totalMs) * 100)) : 0;
        setPercent(pct);

        if (pct >= 75) setStatus('AT_RISK');
        else setStatus('WITHIN_SLA');
      }
    }

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [slaDeadline, slaStatus, totalPausedDuration]);

  // Override with prop if provided
  const displayStatus = slaStatus || status;

  const statusColors = {
    WITHIN_SLA: { color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    AT_RISK:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    BREACHED:   { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
    PAUSED:     { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  };

  const cfg = statusColors[displayStatus] || statusColors.WITHIN_SLA;

  if (compact) {
    return (
      <span className={`sla-pill sla-${displayStatus.toLowerCase()}`} style={{
        color: cfg.color, background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
      }}>
        ⏱ {remaining}
      </span>
    );
  }

  return (
    <div className="sla-countdown">
      <div className="sla-header">
        <span className="sla-label" style={{ color: cfg.color }}>
          ⏱ {remaining}
        </span>
        <span className={`sla-status-text sla-${displayStatus.toLowerCase()}`}>
          {displayStatus === 'WITHIN_SLA' ? 'Within SLA' :
           displayStatus === 'AT_RISK' ? 'At Risk' :
           displayStatus === 'BREACHED' ? 'SLA Breached' :
           'SLA Paused'}
        </span>
      </div>
      <div className="sla-bar-track">
        <div
          className={`sla-bar-fill sla-bar-${displayStatus.toLowerCase()}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
