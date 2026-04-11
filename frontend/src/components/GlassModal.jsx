/**
 * Glassmorphic Modal overlay.
 * Usage: <GlassModal open={bool} onClose={fn} title="...">content</GlassModal>
 */
export default function GlassModal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-card animate-in"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
