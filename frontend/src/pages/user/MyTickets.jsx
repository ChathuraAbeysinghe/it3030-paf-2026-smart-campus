import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { ticketCategories, ticketPriorities } from '../../mock/tickets';
import SLATimer from '../../components/SLATimer';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';
import { Plus, MapPin, Folder, ChevronDown, ImagePlus, AlertTriangle, X, Ticket } from 'lucide-react';

const TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_USER_CONFIRMATION', 'CLOSED'];

export default function MyTickets() {
  const navigate = useNavigate();
  
  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() - Date.now() <= 0;
  };
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [editingTicketId, setEditingTicketId] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [ticketToCancel, setTicketToCancel] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'MAINTENANCE',
    priority: 'MEDIUM',
    location: '',
    tags: '',
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    location: '',
    tags: '',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) return;

    setCreating(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await ticketService.create({ ...form, tags });
      toast.success('Ticket created successfully');
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        category: 'MAINTENANCE',
        priority: 'MEDIUM',
        location: '',
        tags: '',
      });
      await loadTickets();
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  }

  function openEdit(ticket) {
    setEditingTicketId(ticket.id);
    setEditForm({
      title: ticket.title || '',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM',
      location: ticket.location || '',
      tags: Array.isArray(ticket.tags) ? ticket.tags.join(', ') : '',
    });
    setShowEdit(true);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingTicketId) return;
    if (!editForm.title.trim() || !editForm.description.trim() || !editForm.location.trim()) return;

    setUpdating(true);
    try {
      const tags = editForm.tags
        ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await ticketService.updateTicket(editingTicketId, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        location: editForm.location,
        tags,
      });
      toast.success('Ticket updated successfully');
      setShowEdit(false);
      setEditingTicketId('');
      await loadTickets();
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  }

  function openCancelModal(ticket) {
    setTicketToCancel(ticket);
    setCancelReason('');
    setShowCancel(true);
  }

  function closeCancelModal() {
    if (cancellingId) return;
    setShowCancel(false);
    setTicketToCancel(null);
    setCancelReason('');
  }

  async function handleCancelTicket() {
    if (!ticketToCancel) return;

    setCancellingId(ticketToCancel.id);
    try {
      await ticketService.cancelTicket(ticketToCancel.id, cancelReason);
      toast.info('Ticket cancelled successfully');
      closeCancelModal();
      await loadTickets();
    } catch {
      toast.error('Failed to cancel ticket');
    } finally {
      setCancellingId('');
    }
  }

  const filtered = activeTab === 'ALL'
    ? tickets
    : tickets.filter((t) => t.status === activeTab);

  const getPriorityOptionLabel = (priority) => {
    if (priority === 'CRITICAL') return 'Critical';
    if (priority === 'HIGH') return 'High';
    if (priority === 'MEDIUM') return 'Medium';
    return 'Low';
  };

  return (
    <div className="font-['Inter'] bg-slate-50 min-h-screen p-6">
      <ToastContainer />
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your maintenance requests</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors duration-150 cursor-pointer" 
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} /> + New Ticket
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`cursor-pointer px-4 py-1.5 text-sm transition-colors duration-150 ${activeTab === tab ? 'bg-indigo-600 text-white font-medium rounded-lg' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'ALL' ? 'All' : tab.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mb-4 inline-flex rounded-full bg-indigo-50 p-3 text-indigo-600">
            <Ticket size={22} />
          </div>
          <h3 className="text-slate-900 font-semibold mb-2">No tickets found</h3>
          <p className="text-slate-500">
            {activeTab === 'ALL' ? "You haven't submitted any tickets yet." : 'No tickets in this status.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((ticket) => (
            <div 
              key={ticket.id} 
              className={`rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition duration-150 cursor-pointer relative ${isOverdue(ticket.slaDeadline) && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') ? 'border-l-4 border-l-red-500' : ''}`} 
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">{ticket.ticketId || ticket.id}</span>
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border-blue-200' : ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' : ticket.status === 'WAITING_USER_CONFIRMATION' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {ticket.status === 'WAITING_USER_CONFIRMATION' ? 'WAITING' : ticket.status}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 text-base mt-2">{ticket.title}</h3>
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{ticket.description}</p>
              
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /><span className="text-xs text-slate-500">{ticket.location}</span></div>
                <div className="flex items-center gap-1.5"><Folder size={12} className="text-slate-400" /><span className="text-xs text-slate-500">{ticket.category}</span></div>
              </div>

              {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && ticket.slaDeadline && (
                <div className="mt-3">
                  <SLATimer deadline={ticket.slaDeadline} />
                </div>
              )}

              {ticket.status === 'OPEN' && (
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg transition duration-150 font-medium cursor-pointer" onClick={() => openEdit(ticket)}>Edit</button>
                  <button className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition duration-150 font-medium cursor-pointer" onClick={() => openCancelModal(ticket)} disabled={cancellingId === ticket.id}>{cancellingId === ticket.id ? '...' : 'Cancel'}</button>
                </div>
              )}

              <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center">
                <span className="text-xs text-slate-400">{new Date(ticket.createdAt || Date.now()).toLocaleDateString()}</span>
                <span className="text-indigo-600 text-xs font-medium hover:underline">View details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE SLIDE-IN PANEL */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${showCreate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20" onClick={() => setShowCreate(false)}></div>
        <div 
          className={`relative w-120 h-full bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 ${showCreate ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 text-lg">Report an Issue</h2>
            <button className="rounded-lg hover:bg-slate-100 p-2 transition duration-150 cursor-pointer" onClick={() => setShowCreate(false)}>
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
              <input 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Brief summary of the issue"
                value={form.title}
                onChange={(e) => setForm(p => ({...p, title: e.target.value}))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                rows={4}
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={(e) => setForm(p => ({...p, description: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <div className="relative">
                  <select 
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm w-full bg-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    value={form.category}
                    onChange={(e) => setForm(p => ({...p, category: e.target.value}))}
                  >
                    {ticketCategories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <div className="relative">
                  <select 
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm w-full bg-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    value={form.priority}
                    onChange={(e) => setForm(p => ({...p, priority: e.target.value}))}
                  >
                    {ticketPriorities.map((p) => <option key={p} value={p}>{getPriorityOptionLabel(p)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  className="rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="e.g. Block A, Floor 2"
                  value={form.location}
                  onChange={(e) => setForm(p => ({...p, location: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
              <input 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="projector, urgent, block-a (comma separated)"
                value={form.tags}
                onChange={(e) => setForm(p => ({...p, tags: e.target.value}))}
              />
              <p className="text-xs text-slate-400 mt-1">Helps with ticket routing and search</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attachments (Mock)</label>
              <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50 p-6 text-center cursor-pointer hover:bg-slate-100 transition">
                <ImagePlus className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">Drag images here or click to browse</p>
                <p className="text-slate-400 text-xs mt-1">Max 3 images · JPG, PNG · Up to 5MB each</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
            <button className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex-1 py-2.5 transition flex justify-center items-center cursor-pointer" onClick={handleCreate} disabled={creating}>
              {creating ? <span className="animate-pulse">Creating...</span> : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT SLIDE-IN PANEL (matching create panel design) */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${showEdit ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20" onClick={() => setShowEdit(false)}></div>
        <div 
          className={`relative w-120 h-full bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 ${showEdit ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 text-lg">Edit Ticket</h2>
            <button className="rounded-lg hover:bg-slate-100 p-2 transition duration-150 cursor-pointer" onClick={() => setShowEdit(false)}>
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
              <input 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={editForm.title}
                onChange={(e) => setEditForm(p => ({...p, title: e.target.value}))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm(p => ({...p, description: e.target.value}))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <div className="relative">
                  <select 
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm w-full bg-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    value={editForm.priority}
                    onChange={(e) => setEditForm(p => ({...p, priority: e.target.value}))}
                  >
                    {ticketPriorities.map((p) => <option key={p} value={p}>{getPriorityOptionLabel(p)}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                <input 
                  className="rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  value={editForm.location}
                  onChange={(e) => setEditForm(p => ({...p, location: e.target.value}))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
              <input 
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                value={editForm.tags}
                onChange={(e) => setEditForm(p => ({...p, tags: e.target.value}))}
              />
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
            <button className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex-1 py-2.5 transition flex justify-center items-center cursor-pointer" onClick={handleUpdate} disabled={updating}>
              {updating ? <span className="animate-pulse">Saving...</span> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* CANCEL TICKET MODAL */}
      {showCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative">
            <div className="text-center">
              <AlertTriangle className="text-amber-500 mx-auto" size={24} />
              <h2 className="font-bold text-slate-900 text-lg mt-2">Cancel Ticket</h2>
              <p className="text-slate-500 text-sm mt-1">This will move the ticket to rejected state.</p>
            </div>
            
            <div className="mt-6">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason (Optional)</label>
              <textarea 
                className="rounded-xl border border-slate-200 w-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
                rows={3}
                placeholder="Add a short reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer"
                onClick={closeCancelModal}
                disabled={!!cancellingId}
              >
                Keep Ticket
              </button>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex-1 py-2.5 transition cursor-pointer"
                onClick={handleCancelTicket}
                disabled={!!cancellingId}
              >
                {cancellingId ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
