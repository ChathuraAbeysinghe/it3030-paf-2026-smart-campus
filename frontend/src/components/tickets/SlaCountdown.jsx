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

      const h = Math.floor(Math.abs(diff) / 3600000);
      const m = Math.floor((Math.abs(diff) % 3600000) / 60000);

      if (diff <= 0) {
        setRemaining(`OVERDUE`);
        setStatus('BREACHED');
        setPercent(100);
      } else {
        setRemaining(`${h}h ${m}m left`);

        // Rough calculation for percent if original start time is missing
        const totalMs = deadline - (deadline - diff - totalPausedDuration * 1000);
        const pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - diff) / totalMs) * 100)) : 0;
        
        // For visual sake, let's derive percent from hours left if < 4
        let visualPct = 0;
        if (h >= 4) visualPct = 25;
        else if (h >= 2) visualPct = 50;
        else if (h >= 1) visualPct = 75;
        else visualPct = 90;

        setPercent(visualPct);

        if (h < 2) setStatus('AT_RISK');
        else setStatus('WITHIN_SLA');
      }
    }

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [slaDeadline, slaStatus, totalPausedDuration]);

  const displayStatus = slaStatus || status;

  if (compact) {
    return (
      <span className="text-sm font-medium">
        {remaining}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">SLA STATUS</div>
      <div className={`text-2xl font-bold mb-2 ${displayStatus === 'WITHIN_SLA' ? 'text-green-600' : displayStatus === 'AT_RISK' ? 'text-amber-600 animate-pulse' : 'text-red-600'}`}>
        {remaining}
      </div>
      <div className="mb-4">
        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${displayStatus === 'WITHIN_SLA' ? 'bg-green-100 text-green-700' : displayStatus === 'AT_RISK' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
          {displayStatus === 'WITHIN_SLA' ? 'WITHIN SLA' : displayStatus === 'AT_RISK' ? 'AT RISK' : 'BREACHED'}
        </span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${displayStatus === 'WITHIN_SLA' ? 'bg-green-500' : displayStatus === 'AT_RISK' ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
