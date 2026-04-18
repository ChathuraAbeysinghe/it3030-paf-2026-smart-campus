/**
 * ─────────────────────────────────────────────────────────────────
 * Full QR check-in component for approved bookings.
 *
 * Check-in rules (matches backend):
 *   - Window opens:  startTime - 15 minutes
 *   - Window closes: startTime + 15 minutes  (after this → auto-cancelled)
 *   - User taps "Confirm Check-in" while showing the QR at the venue
 *
 * States:
 *   idle      → QR visible, countdown running, button active
 *   loading   → API call in progress
 *   success   → checked in
 *   already   → already checked in (show timestamp)
 *   notReady  → window not open yet / wrong date
 *   expired   → window closed (booking will be auto-cancelled)
 *   error     → API returned error, can retry
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────

function toMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function nowSeconds() {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0];
}

function deadlineSeconds(startTime) {
  if (!startTime) return null;
  const [h, m] = startTime.split(':').map(Number);
  return (h * 60 + m + 15) * 60; // startTime + 15 min in seconds
}

function openSeconds(startTime) {
  if (!startTime) return null;
  const [h, m] = startTime.split(':').map(Number);
  return (h * 60 + m - 15) * 60; // startTime - 15 min in seconds
}

function formatCountdown(secs) {
  if (secs == null || secs <= 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Deterministic QR grid from qrCode string (9×9)
function buildQRGrid(qrCode) {
  const size = 9;
  const seed = String(qrCode || '').split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  return Array.from({ length: size * size }, (_, i) =>
    (seed * (i + 1) * 17 + seed * i) % 3 !== 0
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function QRCheckin({ bookingId, qrCode, booking, onCheckinSuccess }) {
  const [status,      setStatus]      = useState('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [countdown,   setCountdown]   = useState(null);  // seconds until deadline
  const [checkinData, setCheckinData] = useState(null);

  const startTime = booking?.startTime;
  const endTime   = booking?.endTime;
  const date      = booking?.date;
  const isCheckedIn = booking?.checkedIn;

  // ── Determine initial status ──────────────────────────────────
  useEffect(() => {
    if (isCheckedIn) {
      setStatus('already');
      return;
    }

    if (!isToday(date)) {
      setStatus('notReady');
      return;
    }

    const nowMins = nowMinutes();
    const openMins    = toMinutes(startTime) - 15;
    const deadlineMins = toMinutes(startTime) + 15;

    if (nowMins < openMins)     { setStatus('notReady'); return; }
    if (nowMins > deadlineMins) { setStatus('expired');  return; }

    setStatus('idle');
  }, [date, startTime, isCheckedIn]);

  // ── Countdown tick ────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'idle' || !startTime || !isToday(date)) return;

    const tick = () => {
      const deadline = deadlineSeconds(startTime);
      const now      = nowSeconds();
      const secs     = Math.max(0, deadline - now);
      setCountdown(secs);
      if (secs === 0) setStatus('expired');
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, startTime, date]);

  // ── Check-in action ───────────────────────────────────────────
  const handleCheckin = useCallback(async () => {
    if (!qrCode) {
      setErrorMsg('QR code not available for this booking.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await bookingService.checkin(bookingId, qrCode);
      setCheckinData(data);
      setStatus('success');
      if (onCheckinSuccess) onCheckinSuccess(data);
    } catch (err) {
      setErrorMsg(err.message || 'Check-in failed. Please try again.');
      setStatus('error');
    }
  }, [bookingId, qrCode, onCheckinSuccess]);

  // ── Build QR display ─────────────────────────────────────────
  const qrGrid = qrCode ? buildQRGrid(qrCode) : [];
  const countdownColor =
    countdown == null    ? '#34D399' :
    countdown < 60       ? '#F87171' :
    countdown < 180      ? '#FBBF24' : '#34D399';
  const totalWindow = 15 * 60; // 900 seconds
  const pct = countdown != null ? Math.max(0, Math.min(100, (countdown / totalWindow) * 100)) : 100;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

      {/* ── Already checked in ─── */}
      {status === 'already' && (
        <Result
          icon="✅"
          color="#34D399"
          title="Already Checked In"
          subtitle={
            booking?.checkedInAt
              ? `Checked in at ${new Date(booking.checkedInAt).toLocaleTimeString()}`
              : 'Your attendance has been recorded.'
          }
        />
      )}

      {/* ── Not yet open / wrong date ─── */}
      {status === 'notReady' && (
        <>
          <QRDisplay grid={qrGrid} code={qrCode} dim />
          <div style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
            fontSize: '0.82rem', color: '#FBBF24', textAlign: 'center',
          }}>
            {!isToday(date)
              ? `📅 Check-in is only available on your booking date (${date})`
              : `⏳ Check-in opens at ${startTime} minus 15 min. Please wait.`
            }
          </div>
        </>
      )}

      {/* ── Window expired / auto-cancelled ─── */}
      {status === 'expired' && (
        <Result
          icon="⏰"
          color="#F87171"
          title="Check-in Window Closed"
          subtitle="The 15-minute grace period has passed. This booking has been auto-cancelled and the time slot is now free."
        />
      )}

      {/* ── Success ─── */}
      {status === 'success' && (
        <Result
          icon="🎉"
          color="#34D399"
          title="Check-in Successful!"
          subtitle={
            checkinData?.checkedInAt
              ? `Welcome! Checked in at ${new Date(checkinData.checkedInAt).toLocaleTimeString()}`
              : 'Your attendance has been recorded. Enjoy your booking!'
          }
        />
      )}

      {/* ── Error — can retry ─── */}
      {status === 'error' && (
        <>
          <QRDisplay grid={qrGrid} code={qrCode} />
          <div style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
            fontSize: '0.82rem', color: '#F87171', textAlign: 'center',
          }}>
            ⚠️ {errorMsg}
          </div>
          <button className="btn-primary btn-glow" style={{ width: '100%' }} onClick={handleCheckin}>
            Try Again
          </button>
        </>
      )}

      {/* ── Loading ─── */}
      {status === 'loading' && (
        <>
          <QRDisplay grid={qrGrid} code={qrCode} dim />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            <span className="btn-spinner" style={{ display: 'inline-block', marginRight: 8 }} />
            Confirming check-in…
          </div>
        </>
      )}

      {/* ── Idle: window open, ready to check in ─── */}
      {status === 'idle' && (
        <>
          <QRDisplay grid={qrGrid} code={qrCode} />

          {/* Countdown */}
          {countdown != null && (
            <div style={{ width: '100%' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 6,
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ⏱ Auto-cancel in
                </span>
                <span style={{
                  fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace',
                  color: countdownColor,
                }}>
                  {formatCountdown(countdown)}
                </span>
              </div>
              {/* Progress bar */}
              <div style={{
                width: '100%', height: 6, borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 99,
                  background: countdownColor,
                  transition: 'width 1s linear, background 0.5s',
                }} />
              </div>
              <div style={{
                marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center',
              }}>
                Check in before {startTime ? (() => {
                  const [h, m] = startTime.split(':').map(Number);
                  const d = new Date(); d.setHours(h, m + 15, 0);
                  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                })() : '—'} to keep your booking
              </div>
            </div>
          )}

          {/* Check-in button */}
          <button
            className="btn-primary btn-glow"
            style={{ width: '100%', marginTop: 4 }}
            onClick={handleCheckin}
          >
            📱 Confirm Check-in
          </button>

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            Show this QR code at the venue entrance, then tap the button to confirm your arrival.
          </p>
        </>
      )}
    </div>
  );
}

// ── QR grid display ───────────────────────────────────────────────
function QRDisplay({ grid, code, dim = false }) {
  const SIZE = 9;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
        gap: 2, padding: 14, borderRadius: 14,
        background: dim ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: dim ? 0.45 : 1,
        transition: 'opacity 0.3s',
      }}>
        {grid.map((filled, i) => (
          <div key={i} style={{
            width: 11, height: 11, borderRadius: 2,
            background: filled ? 'var(--text)' : 'transparent',
          }} />
        ))}
      </div>
      <div style={{
        marginTop: 6, fontSize: '0.65rem', color: 'var(--text-muted)',
        fontFamily: 'monospace', letterSpacing: '0.8px',
      }}>
        {code}
      </div>
    </div>
  );
}

// ── Result display ────────────────────────────────────────────────
function Result({ icon, color, title, subtitle }) {
  return (
    <div style={{
      width: '100%', textAlign: 'center',
      padding: '20px 16px', borderRadius: 14,
      background: `${color}10`, border: `1px solid ${color}35`,
    }}>
      <div style={{ fontSize: '2.8rem', marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem', color, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{subtitle}</div>
    </div>
  );
}