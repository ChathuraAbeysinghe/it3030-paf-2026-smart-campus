import { useState, useRef, useEffect } from 'react';

/**
 * Conversation thread with 4 message types:
 * TEXT, SYSTEM, RESOLUTION_NOTE, DISPUTE_NOTE
 */
export default function ConversationThread({
  comments = [], currentUserId, onSend, onEdit, onDelete, sending = false
}) {
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend?.(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.message);
  };

  const saveEdit = (c) => {
    onEdit?.(c.id, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const roleColors = {
    USER: '#818CF8',
    ADMIN: '#F87171',
    TECHNICIAN: '#FBBF24',
    SYSTEM: '#6B7280',
  };

  return (
    <div className="conversation-thread">
      <div className="thread-messages">
        {comments.map(c => {
          if (c.isDeleted && c.messageType === 'TEXT') {
            return (
              <div key={c.id} className="msg-deleted">
                <span className="msg-deleted-text">{c.message}</span>
              </div>
            );
          }

          // SYSTEM messages
          if (c.messageType === 'SYSTEM') {
            return (
              <div key={c.id} className="msg-system">
                <div className="msg-system-line" />
                <span className="msg-system-text">{c.message}</span>
                <div className="msg-system-line" />
              </div>
            );
          }

          // RESOLUTION_NOTE
          if (c.messageType === 'RESOLUTION_NOTE') {
            return (
              <div key={c.id} className="msg-resolution">
                <div className="msg-resolution-label">✓ Resolution Note</div>
                <div className="msg-resolution-sender">{c.senderName} · {formatTime(c.timestamp)}</div>
                <div className="msg-resolution-text">{c.message}</div>
              </div>
            );
          }

          // DISPUTE_NOTE
          if (c.messageType === 'DISPUTE_NOTE') {
            return (
              <div key={c.id} className="msg-dispute">
                <div className="msg-dispute-label">⚠ User Disputed Resolution</div>
                <div className="msg-dispute-sender">{c.senderName} · {formatTime(c.timestamp)}</div>
                <div className="msg-dispute-text">{c.message}</div>
              </div>
            );
          }

          // TEXT messages
          const isOwn = c.senderId === currentUserId;

          return (
            <div key={c.id} className={`msg-bubble-wrapper ${isOwn ? 'msg-own' : 'msg-other'}`}>
              {!isOwn && (
                <div className="msg-sender-info">
                  <span className="msg-sender-name">{c.senderName}</span>
                  <span className="msg-role-badge" style={{
                    color: roleColors[c.senderRole] || '#9CA3AF',
                    background: `${roleColors[c.senderRole] || '#9CA3AF'}20`,
                  }}>
                    {c.senderRole}
                  </span>
                </div>
              )}
              <div className={`msg-bubble ${isOwn ? 'msg-bubble-own' : 'msg-bubble-other'}`}>
                {editingId === c.id ? (
                  <div className="msg-edit-area">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      className="msg-edit-input" rows={2} />
                    <div className="msg-edit-actions">
                      <button className="msg-edit-btn" onClick={() => saveEdit(c)}>Save</button>
                      <button className="msg-edit-btn msg-edit-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="msg-text">{c.message}</div>
                    <div className="msg-meta">
                      <span className="msg-time">{formatTime(c.timestamp)}</span>
                      {c.isEdited && <span className="msg-edited">(edited)</span>}
                    </div>
                  </>
                )}
                {/* Hover actions for own messages */}
                {isOwn && !editingId && (
                  <div className="msg-actions">
                    <button className="msg-action-btn" onClick={() => startEdit(c)} title="Edit">✏️</button>
                    <button className="msg-action-btn" onClick={() => onDelete?.(c.id)} title="Delete">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Message input */}
      <div className="thread-input-area">
        <textarea
          className="thread-input"
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="thread-send-btn"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
