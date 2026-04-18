import { useState, useRef, useEffect } from 'react';
import { Send, Edit2, Trash2 } from 'lucide-react';

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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {comments.map(c => {
          if (c.isDeleted && c.messageType === 'TEXT') {
            return (
              <div key={c.id} className="text-center my-2">
                <span className="text-xs text-slate-400 italic">This message was deleted.</span>
              </div>
            );
          }

          // SYSTEM messages
          if (c.messageType === 'SYSTEM') {
            return (
              <div key={c.id} className="flex justify-center my-4">
                <span className="bg-slate-100 rounded-full px-4 py-1.5 text-xs text-slate-500 italic">
                  {c.message}
                </span>
              </div>
            );
          }

          // RESOLUTION_NOTE
          if (c.messageType === 'RESOLUTION_NOTE') {
            return (
              <div key={c.id} className="flex justify-center my-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-3 max-w-sm w-full text-center">
                  <div className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">✓ Resolution Note</div>
                  <div className="text-xs text-green-600 mb-2">{c.senderName} · {formatTime(c.timestamp)}</div>
                  <div className="text-sm text-green-800">{c.message}</div>
                </div>
              </div>
            );
          }

          // DISPUTE_NOTE
          if (c.messageType === 'DISPUTE_NOTE') {
            return (
              <div key={c.id} className="flex justify-center my-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 max-w-sm w-full text-center">
                  <div className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">User Disputed Resolution</div>
                  <div className="text-xs text-amber-600 mb-2">{c.senderName} · {formatTime(c.timestamp)}</div>
                  <div className="text-sm text-amber-800">{c.message}</div>
                </div>
              </div>
            );
          }

          // TEXT messages
          const isOwn = c.senderId === currentUserId;

          return (
            <div key={c.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0">
                  {getInitials(c.senderName)}
                </div>
              )}
              
              <div className={`max-w-[75%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                <div className={`text-xs mb-1 ${isOwn ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>
                  {!isOwn && (
                    <span className="mr-2">
                      {c.senderName}
                      {(c.senderRole === 'TECHNICIAN' || c.senderRole === 'ADMIN') && (
                        <span className="ml-2 bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
                          {c.senderRole}
                        </span>
                      )}
                    </span>
                  )}
                  {isOwn && <span className="mr-2 text-slate-400">{formatTime(c.timestamp)}</span>}
                  {!isOwn && <span className="font-normal text-slate-400">{formatTime(c.timestamp)}</span>}
                </div>

                <div className={`relative group ${isOwn ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm'} px-4 py-2.5 text-sm`}>
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <textarea value={editText} onChange={e => setEditText(e.target.value)}
                        className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded p-2 text-sm outline-none resize-none" rows={2} />
                      <div className="flex justify-end gap-2">
                        <button className="text-xs bg-white text-indigo-600 px-2 py-1 rounded font-medium" onClick={() => saveEdit(c)}>Save</button>
                        <button className="text-xs border border-white/50 text-white px-2 py-1 rounded" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap">{c.message}</div>
                      {c.isEdited && <div className={`text-[10px] mt-1 ${isOwn ? 'text-white/70' : 'text-slate-400'}`}>(edited)</div>}
                    </>
                  )}

                  {/* Hover actions for own messages */}
                  {isOwn && !editingId && (
                    <div className="absolute top-1/2 -left-12 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button className="text-slate-400 hover:text-indigo-600 p-1 bg-white rounded shadow-sm border border-slate-100" onClick={() => startEdit(c)} title="Edit">
                        <Edit2 size={12} />
                      </button>
                      <button className="text-slate-400 hover:text-red-600 p-1 bg-white rounded shadow-sm border border-slate-100" onClick={() => onDelete?.(c.id)} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Message input */}
      <div className="mt-4 flex gap-2 w-full pt-4 border-t border-slate-100">
        <input
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
          placeholder="Type a message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 transition duration-150 disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? <span className="animate-pulse w-[18px] h-[18px] block rounded-full border-2 border-white/30 border-t-white"></span> : <Send size={18} strokeWidth={2.5} />}
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
