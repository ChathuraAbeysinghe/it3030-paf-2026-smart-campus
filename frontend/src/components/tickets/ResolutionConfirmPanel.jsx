/**
 * Resolution confirmation panel — shown to USER when WAITING_USER_CONFIRMATION.
 */
export default function ResolutionConfirmPanel({ ticket, onConfirm, onDispute, loading }) {
  if (!ticket || ticket.status !== 'WAITING_USER_CONFIRMATION') return null;

  return (
    <div className="resolution-panel">
      <div className="resolution-panel-icon">✅</div>
      <div className="resolution-panel-content">
        <h3 className="resolution-panel-title">
          The technician has marked this issue as resolved
        </h3>
        {ticket.resolutionNote && (
          <div className="resolution-panel-note">
            <strong>Resolution note:</strong> {ticket.resolutionNote}
          </div>
        )}
        {ticket.resolutionAttachments?.length > 0 && (
          <div className="resolution-panel-attachments">
            <strong>Evidence:</strong>
            <div className="attachment-thumbs">
              {ticket.resolutionAttachments.map((a, i) => (
                <img key={i} src={a.url} alt={a.filename} className="attachment-thumb" />
              ))}
            </div>
          </div>
        )}
        <div className="resolution-panel-actions">
          <button className="resolution-btn-confirm" onClick={onConfirm} disabled={loading}>
            ✓ Confirm — Issue is Fixed
          </button>
          <button className="resolution-btn-dispute" onClick={onDispute} disabled={loading}>
            ✗ Dispute — Still Broken
          </button>
        </div>
      </div>
    </div>
  );
}
