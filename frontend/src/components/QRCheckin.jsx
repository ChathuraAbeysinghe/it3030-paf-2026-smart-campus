/**
 * ─────────────────────────────────────────────────────────────────
 * Full QR check-in component for approved bookings.
 *
 * Check-in rules (matches backend):
 *   - Window opens:  startTime - 15 minutes
 *   - Window closes: startTime + 15 minutes  (after this → auto-cancelled)
 *   - User shows the QR to staff/admin, and the booking updates once the QR is scanned or entered on the admin side
 *
 * States:
 *   idle      → QR visible, countdown running, waiting for staff scan
 *   success   → checked in
 *   already   → already checked in (show timestamp)
 *   notReady  → window not open yet / wrong date
 *   expired   → window closed (booking will be auto-cancelled)
 *   error     → API returned error, can retry
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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

function formatCountdown(secs) {
  if (secs == null || secs <= 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Main Component ────────────────────────────────────────────────

export default function QRCheckin({ bookingId, qrCode, booking, onCheckinSuccess }) {
  const [status,      setStatus]      = useState('idle');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [countdown,   setCountdown]   = useState(null);  // seconds until deadline
  const [checkinData, setCheckinData] = useState(null);
  const successNotifiedRef = useRef(false);
  const onCheckinSuccessRef = useRef(onCheckinSuccess);

  const startTime = booking?.startTime;
  const endTime   = booking?.endTime;
  const date      = booking?.date;
  const isCheckedIn = booking?.checkedIn;

  useEffect(() => {
    onCheckinSuccessRef.current = onCheckinSuccess;
  }, [onCheckinSuccess]);

  // ── Determine initial status ──────────────────────────────────
  useEffect(() => {
    if (!qrCode) {
      setStatus('error');
      setErrorMsg('QR code not available for this booking.');
      setCountdown(null);
      return;
    }

    if (isCheckedIn) {
      setStatus(successNotifiedRef.current ? 'success' : 'already');
      setErrorMsg('');
      setCountdown(null);
      return;
    }

    if (successNotifiedRef.current) {
      setStatus('success');
      setErrorMsg('');
      setCountdown(null);
      return;
    }

    if (!isToday(date)) {
      setStatus('notReady');
      setErrorMsg('');
      setCountdown(null);
      return;
    }

    const nowMins = nowMinutes();
    const openMins    = toMinutes(startTime) - 15;
    const deadlineMins = toMinutes(startTime) + 15;

    if (nowMins < openMins)     { setStatus('notReady'); setErrorMsg(''); setCountdown(null); return; }
    if (nowMins > deadlineMins) { setStatus('expired');  setErrorMsg(''); setCountdown(null); return; }

    setErrorMsg('');
    setStatus('idle');
  }, [date, startTime, isCheckedIn, qrCode]);

  // ── Live check-in sync ────────────────────────────────────────
  useEffect(() => {
    if (!bookingId || ['success', 'already', 'expired', 'error'].includes(status)) return;

    let active = true;

    const refreshStatus = async () => {
      try {
        const data = await bookingService.getCheckinStatus(bookingId);
        if (!active || !data) return;

        if (data.checkedIn) {
          const checkedInAt = data.checkedInAt || booking?.checkedInAt || null;
          successNotifiedRef.current = true;
          setCheckinData({ bookingId, checkedInAt });
          setStatus('success');
          setCountdown(null);
          setErrorMsg('');
          if (onCheckinSuccessRef.current) onCheckinSuccessRef.current({ bookingId, checkedInAt });
          return;
        }

        if (data.status === 'CANCELLED') {
          successNotifiedRef.current = false;
          setCheckinData(null);
          setStatus('expired');
          setCountdown(null);
        }
      } catch {
        // Keep the current UI and retry on the next poll.
      }
    };

    refreshStatus();
    const intervalId = setInterval(refreshStatus, 5000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [bookingId, booking?.checkedInAt, status]);

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
          <QRDisplay code={qrCode} dim />
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
        <Result
          icon="⚠️"
          color="#F87171"
          title="QR Code Unavailable"
          subtitle={errorMsg || 'This booking does not have a QR code yet.'}
        />
      )}

      {/* ── Idle: window open, ready to check in ─── */}
      {status === 'idle' && (
        <>
          <QRDisplay code={qrCode} />

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

          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            Show this QR code to the admin or staff member. Check-in updates automatically once the code is scanned or entered on the admin side.
          </p>
        </>
      )}
    </div>
  );
}

// ── QR grid display ───────────────────────────────────────────────
function QRDisplay({ code, dim = false }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12, borderRadius: 16,
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.12)',
        opacity: dim ? 0.45 : 1,
        transition: 'opacity 0.3s',
      }}>
        <QRCodeSVG
          value={code || ''}
          size={176}
          level="M"
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#0F172A"
        />
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