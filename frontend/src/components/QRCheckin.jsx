/**
 * QR Code Check-in display for approved bookings.
 * Generates a visual mock QR code pattern.
 */
export default function QRCheckin({ bookingId, qrCode }) {
  if (!qrCode) return null;

  // Generate a deterministic grid pattern
  const seed = qrCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const grid = [];
  for (let i = 0; i < 81; i++) {
    grid.push((seed * (i + 1) * 17) % 3 !== 0);
  }

  return (
    <div className="qr-checkin">
      <div className="qr-grid">
        {grid.map((filled, i) => (
          <div key={i} className={`qr-cell ${filled ? 'qr-cell--filled' : ''}`} />
        ))}
      </div>
      <div className="qr-label">{qrCode}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
        Scan at venue to check in
      </div>
    </div>
  );
}
