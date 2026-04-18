import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { ticketCategories, ticketPriorities } from '../../mock/tickets';
import SLATimer from '../../components/SLATimer';
import ToastContainer, { toast } from '../../components/tickets/ToastNotification';
import { Plus, MapPin, Folder, ChevronDown, ImagePlus, AlertTriangle, X, Ticket, Search, Clock3, Type, FileText, Hash, Wrench, Monitor, Wind, Lightbulb, Shield, Package, Wifi, Droplets, ClipboardList, CheckCircle2 } from 'lucide-react';

const TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_USER_CONFIRMATION', 'RESOLVED', 'CLOSED', 'REJECTED'];

const STATUS_LABELS = {
  ALL: 'All',
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_USER_CONFIRMATION: 'Waiting for You',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};

const PRIORITY_SLA_LABELS = {
  LOW: 'Official Response within 24 Business Hours.',
  MEDIUM: 'Official Response within 12 Business Hours.',
  HIGH: 'Official Response within 4 Business Hours.',
  CRITICAL: 'Official Response within 2 Business Hours.',
};

const PRIORITY_THEME = {
  LOW: 'border-slate-300 text-slate-700 bg-slate-100/80',
  MEDIUM: 'border-amber-300 text-amber-800 bg-amber-100/80',
  HIGH: 'border-orange-300 text-orange-800 bg-orange-100/80',
  CRITICAL: 'border-rose-300 text-rose-800 bg-rose-100/80',
};

function getCategoryVisual(category) {
  if (category === 'IT_NETWORK' || category === 'AV_EQUIPMENT') return { Icon: Monitor, tint: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' };
  if (category === 'HVAC') return { Icon: Wind, tint: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' };
  if (category === 'ELECTRICAL') return { Icon: Lightbulb, tint: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
  if (category === 'SECURITY') return { Icon: Shield, tint: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  if (category === 'SUPPLIES') return { Icon: Package, tint: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' };
  if (category === 'PLUMBING') return { Icon: Droplets, tint: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
  if (category === 'WIFI') return { Icon: Wifi, tint: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' };
  if (category === 'GENERAL') return { Icon: ClipboardList, tint: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
  return { Icon: Wrench, tint: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [activeCreateSection, setActiveCreateSection] = useState('problem');
  const [activeEditSection, setActiveEditSection] = useState('problem');
  const [createSuccess, setCreateSuccess] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const createTitleRef = useRef(null);
  const editTitleRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: ticketCategories[0] || 'GENERAL',
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

  useEffect(() => {
    if (!showCreate && !showEdit && !showCancel) return;

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (showCancel) {
        closeCancelModal();
        return;
      }
      if (showEdit) {
        if (!updating) setShowEdit(false);
        return;
      }
      if (showCreate && !creating) setShowCreate(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCreate, showEdit, showCancel, creating, updating, cancellingId]);

  useEffect(() => {
    if (!showCreate) return;
    setActiveCreateSection('problem');
    setCreateSuccess(false);
    const timerId = window.setTimeout(() => createTitleRef.current?.focus(), 120);
    return () => window.clearTimeout(timerId);
  }, [showCreate]);

  useEffect(() => {
    if (!showEdit) return;
    setActiveEditSection('problem');
    setEditSuccess(false);
    const timerId = window.setTimeout(() => editTitleRef.current?.focus(), 120);
    return () => window.clearTimeout(timerId);
  }, [showEdit]);

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
    const errors = validateForm(form);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setCreating(true);
    setCreateSuccess(false);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      await ticketService.create({ ...form, tags });
      setCreateSuccess(true);
      toast.success('Ticket created successfully');
      await new Promise((resolve) => window.setTimeout(resolve, 380));
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        category: ticketCategories[0] || 'GENERAL',
        priority: 'MEDIUM',
        location: '',
        tags: '',
      });
      setCreateErrors({});
      await loadTickets();
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setCreateSuccess(false);
      setCreating(false);
    }
  }

  function openEdit(ticket) {
    setEditingTicketId(ticket.id);
    setEditErrors({});
    setActiveEditSection('problem');
    setEditSuccess(false);
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
    const errors = validateForm(editForm);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setUpdating(true);
    setEditSuccess(false);
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
      setEditSuccess(true);
      toast.success('Ticket updated successfully');
      await new Promise((resolve) => window.setTimeout(resolve, 320));
      setShowEdit(false);
      setEditingTicketId('');
      setEditErrors({});
      await loadTickets();
    } catch {
      toast.error('Failed to update ticket');
    } finally {
      setEditSuccess(false);
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleTickets = filtered
    .filter((ticket) => {
      if (!normalizedQuery) return true;
      const searchable = [
        ticket.ticketId,
        ticket.title,
        ticket.description,
        ticket.location,
        ticket.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const aCreated = new Date(a.createdAt || 0).getTime();
      const bCreated = new Date(b.createdAt || 0).getTime();

      if (sortBy === 'OLDEST') return aCreated - bCreated;
      if (sortBy === 'PRIORITY') {
        const priorityWeight = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        const aPriority = priorityWeight[a.priority] || 0;
        const bPriority = priorityWeight[b.priority] || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return bCreated - aCreated;
      }
      if (sortBy === 'SLA_RISK') {
        const rankSlaRisk = (ticket) => {
          const actionable = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS';
          if (!actionable || !ticket.slaDeadline) return Number.MAX_SAFE_INTEGER;
          return new Date(ticket.slaDeadline).getTime() - Date.now();
        };
        return rankSlaRisk(a) - rankSlaRisk(b);
      }

      return bCreated - aCreated;
    });

  const tabCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    acc.ALL += 1;
    return acc;
  }, { ALL: 0 });

  const getPriorityOptionLabel = (priority) => {
    if (priority === 'CRITICAL') return 'Critical';
    if (priority === 'HIGH') return 'High';
    if (priority === 'MEDIUM') return 'Medium';
    return 'Low';
  };

  const getStatusLabel = (status) => STATUS_LABELS[status] || status.replaceAll('_', ' ');

  const getStatusBadgeClass = (status) => {
    if (status === 'OPEN') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'IN_PROGRESS') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'WAITING_USER_CONFIRMATION') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (status === 'RESOLVED') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'REJECTED') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const getRowAccentClass = (status) => {
    if (status === 'OPEN') return 'border-l-blue-500';
    if (status === 'IN_PROGRESS') return 'border-l-amber-500';
    if (status === 'WAITING_USER_CONFIRMATION') return 'border-l-violet-500';
    if (status === 'RESOLVED' || status === 'CLOSED') return 'border-l-green-500';
    if (status === 'REJECTED') return 'border-l-rose-500';
    return 'border-l-slate-300';
  };

  const formatRelativeDate = (dateValue) => {
    const target = new Date(dateValue || Date.now()).getTime();
    const now = Date.now();
    const diffMs = target - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffDays) >= 1) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diffDays, 'day');
    }

    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (Math.abs(diffHours) >= 1) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diffHours, 'hour');
    }

    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diffMinutes, 'minute');
  };

  const validateForm = (payload) => {
    const errors = {};
    if (!payload.title?.trim()) errors.title = 'Title is required.';
    if (!payload.description?.trim()) errors.description = 'Description is required.';
    if (!payload.location?.trim()) errors.location = 'Location is required.';
    return errors;
  };

  const createSectionClass = (section) => {
    const dimmed = activeCreateSection && activeCreateSection !== section;
    return `rounded-2xl border transition-all duration-200 p-4 ${dimmed ? 'border-slate-200/70 opacity-50 blur-[0.2px]' : 'border-indigo-200 bg-white/80 shadow-sm'}`;
  };

  const editSectionClass = (section) => {
    const dimmed = activeEditSection && activeEditSection !== section;
    return `rounded-2xl border transition-all duration-200 p-4 ${dimmed ? 'border-slate-200/70 opacity-50 blur-[0.2px]' : 'border-indigo-200 bg-white/80 shadow-sm'}`;
  };

  const getEmptyStateContent = () => {
    if (searchQuery.trim()) {
      return {
        title: 'No matching tickets',
        message: 'Try a different keyword or clear your current search.',
        actionLabel: 'Clear Search',
        onAction: () => setSearchQuery(''),
      };
    }

    if (activeTab === 'ALL') {
      return {
        title: 'No tickets yet',
        message: "You haven't submitted any tickets yet.",
        actionLabel: 'Create New Ticket',
        onAction: () => setShowCreate(true),
      };
    }

    return {
      title: `No ${getStatusLabel(activeTab)} tickets`,
      message: 'There are no tickets in this status right now.',
      actionLabel: 'Show All Tickets',
      onAction: () => setActiveTab('ALL'),
    };
  };

  return (
    <div className="font-['Inter'] bg-slate-50 min-h-screen p-4 sm:p-6">
      <ToastContainer />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your maintenance requests</p>
        </div>
        <button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer w-full sm:w-auto" 
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />  New Ticket
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="mb-6 overflow-x-auto pb-1">
        <div className="bg-white rounded-xl border border-slate-200 p-1 inline-flex min-w-max" role="tablist" aria-label="Ticket status filters">
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                className={`cursor-pointer px-4 py-1.5 text-sm transition-colors duration-150 rounded-lg whitespace-nowrap inline-flex items-center gap-2 ${isActive ? 'bg-indigo-600 text-white font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{getStatusLabel(tab)}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tabCounts[tab] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Search by title, location, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="ticket-sort" className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">Sort by</label>
          <select
            id="ticket-sort"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="PRIORITY">Priority</option>
            <option value="SLA_RISK">SLA risk</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">Loading tickets...</div>
      ) : visibleTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="mb-4 inline-flex rounded-full bg-indigo-50 p-3 text-indigo-600">
            <Ticket size={22} />
          </div>
          <h3 className="text-slate-900 font-semibold mb-2">{getEmptyStateContent().title}</h3>
          <p className="text-slate-500">{getEmptyStateContent().message}</p>
          <button
            className="mt-5 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors duration-150 cursor-pointer"
            onClick={getEmptyStateContent().onAction}
          >
            {getEmptyStateContent().actionLabel}
          </button>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {visibleTickets.map((ticket) => (
            (() => {
              const createdDate = new Date(ticket.createdAt || Date.now());
              const day = createdDate.getDate();
              const month = createdDate.toLocaleString('default', { month: 'short' });

              return (
            <div 
              key={ticket.id} 
              className={`rounded-2xl border border-slate-200 bg-white p-4 transition duration-150 relative flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 items-start hover:shadow-md border-l-4 ${isOverdue(ticket.slaDeadline) && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') ? 'border-l-red-500' : getRowAccentClass(ticket.status)}`}
            >
              <div className="min-w-14.5 text-center bg-slate-50 rounded-xl px-2 py-2.5 border border-slate-100">
                <div className="text-2xl font-bold text-slate-800 leading-none">{day}</div>
                <div className="text-[11px] mt-1 uppercase tracking-wide text-slate-500 font-semibold">{month}</div>
              </div>

              <div className="flex-1 min-w-55">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold px-2.5 py-1 rounded-full">{ticket.ticketId || ticket.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : ticket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {getPriorityOptionLabel(ticket.priority)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1" title={ticket.title}>{ticket.title}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </div>

                <div className="flex gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /><span className="text-xs text-slate-500">{ticket.location}</span></div>
                  <div className="flex items-center gap-1.5"><Folder size={12} className="text-slate-400" /><span className="text-xs text-slate-500">{ticket.category}</span></div>
                </div>

                {isOverdue(ticket.slaDeadline) && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 border border-red-200">
                    <Clock3 size={12} />
                    Needs urgent attention
                  </div>
                )}

                {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && ticket.slaDeadline && (
                  <div className="mt-3 max-w-xs">
                    <SLATimer deadline={ticket.slaDeadline} />
                  </div>
                )}
              </div>

              <div className="sm:min-w-42.5 w-full sm:w-auto sm:self-stretch flex flex-col sm:items-end justify-between gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                {ticket.status === 'OPEN' && (
                  <div className="flex gap-2 sm:justify-end" onClick={(e) => e.stopPropagation()}>
                    <button className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg transition duration-150 font-medium cursor-pointer" onClick={() => openEdit(ticket)}>Edit</button>
                    <button className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg transition duration-150 font-medium cursor-pointer" onClick={() => openCancelModal(ticket)} disabled={cancellingId === ticket.id}>{cancellingId === ticket.id ? '...' : 'Cancel'}</button>
                  </div>
                )}

                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:gap-2 w-full">
                  <span className="text-xs text-slate-400">Created {formatRelativeDate(ticket.createdAt)}</span>
                  <button
                    className="text-indigo-600 text-xs font-medium hover:underline cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    View details →
                  </button>
                </div>
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}

      {/* CREATE SLIDE-IN PANEL */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${showCreate ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20" onClick={() => setShowCreate(false)}></div>
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Create ticket panel"
          className={`relative w-full sm:w-140 h-full border-l border-white/40 bg-linear-to-b from-white/85 to-slate-100/85 backdrop-blur-xl flex flex-col transition-transform duration-300 ${showCreate ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 text-lg">Report an Issue</h2>
            <button className="rounded-lg hover:bg-slate-100 p-2 transition duration-150 cursor-pointer" onClick={() => setShowCreate(false)}>
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="wizard-progress">
              {[
                ['problem', 'Step 1: The Problem'],
                ['classification', 'Step 2: Classification'],
                ['logistics', 'Step 3: Logistics'],
                ['review', 'Step 4: Review'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`wizard-step ${activeCreateSection === id ? 'active' : ''}`}
                  onClick={() => setActiveCreateSection(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className={createSectionClass('problem')} onFocus={() => setActiveCreateSection('problem')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 1: The Problem</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      ref={createTitleRef}
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${createErrors.title ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      placeholder="Brief summary of the issue"
                      value={form.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((p) => ({ ...p, title: value }));
                        if (createErrors.title) {
                          setCreateErrors((prev) => ({ ...prev, title: undefined }));
                        }
                      }}
                    />
                  </div>
                  {createErrors.title && <p className="mt-1 text-xs text-red-600">{createErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea 
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none ${createErrors.description ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      rows={5}
                      maxLength={500}
                      placeholder="Describe the issue in detail..."
                      value={form.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((p) => ({ ...p, description: value }));
                        if (createErrors.description) {
                          setCreateErrors((prev) => ({ ...prev, description: undefined }));
                        }
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    {createErrors.description ? <p className="text-red-600">{createErrors.description}</p> : <span className="text-slate-400">Add enough context for faster resolution</span>}
                    <span className={`${form.description.length > 450 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>{form.description.length}/500</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={createSectionClass('classification')} onFocus={() => setActiveCreateSection('classification')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 2: Classification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                  <div className="category-wizard-grid">
                    {ticketCategories.map((category) => {
                      const visual = getCategoryVisual(category);
                      const selected = form.category === category;
                      const label = category.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
                      return (
                        <button
                          key={category}
                          type="button"
                          className={`category-wizard-card ${selected ? 'selected' : ''} ${selected ? visual.bg : ''}`}
                          onClick={() => {
                            setActiveCreateSection('classification');
                            setForm((p) => ({ ...p, category }));
                          }}
                        >
                          <visual.Icon size={22} className={`mx-auto mb-2 ${selected ? visual.tint : 'text-slate-500'}`} />
                          <div className="cat-label">{label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                  <div className="priority-wizard-selector">
                    {ticketPriorities.map((priority) => {
                      const selected = form.priority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          className={`priority-wizard-option ${selected ? `selected-${priority.toLowerCase()}` : ''}`}
                          onClick={() => {
                            setActiveCreateSection('classification');
                            setForm((p) => ({ ...p, priority }));
                          }}
                        >
                          {getPriorityOptionLabel(priority)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${PRIORITY_THEME[form.priority] || PRIORITY_THEME.MEDIUM}`}>
                  {PRIORITY_SLA_LABELS[form.priority]}
                </div>
              </div>
            </section>

            <section className={createSectionClass('logistics')} onFocus={() => setActiveCreateSection('logistics')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 3: Logistics</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${createErrors.location ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      placeholder="e.g. Block A, Floor 2"
                      value={form.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setForm((p) => ({ ...p, location: value }));
                        if (createErrors.location) {
                          setCreateErrors((prev) => ({ ...prev, location: undefined }));
                        }
                      }}
                    />
                  </div>
                  {createErrors.location && <p className="mt-1 text-xs text-red-600">{createErrors.location}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      className="rounded-xl border border-slate-200 bg-white/90 pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="projector, urgent, block-a"
                      value={form.tags}
                      onChange={(e) => setForm(p => ({...p, tags: e.target.value}))}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Comma-separated tags improve routing and search</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attachments (Mock)</label>
                  <div className="border border-dashed border-slate-300 rounded-2xl bg-white/60 backdrop-blur-sm p-6 text-center cursor-pointer hover:bg-white/80 transition">
                    <ImagePlus className="mx-auto text-slate-400 mb-2" size={30} />
                    <p className="text-slate-600 text-sm">Drag images here or click to browse</p>
                    <p className="text-slate-500 text-xs mt-1">Max 3 images · JPG, PNG · Up to 5MB each</p>
                  </div>
                </div>
              </div>
            </section>

            <section className={createSectionClass('review')} onFocus={() => setActiveCreateSection('review')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 4: Review Before Submit</h3>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Title</span><span className="text-slate-800 font-medium text-right">{form.title || 'Not provided'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Category</span><span className="text-slate-800 font-medium text-right">{form.category.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Priority</span><span className={`rounded-full px-2 py-0.5 border text-xs ${PRIORITY_THEME[form.priority] || PRIORITY_THEME.MEDIUM}`}>{getPriorityOptionLabel(form.priority)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Location</span><span className="text-slate-800 font-medium text-right">{form.location || 'Not provided'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Description</span><span className="text-slate-800 font-medium text-right">{form.description.trim() ? `${form.description.length} chars` : 'Not provided'}</span></div>
              </div>
            </section>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
            <button className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex-1 py-2.5 transition flex justify-center items-center cursor-pointer" onClick={handleCreate} disabled={creating}>
              {creating ? (
                createSuccess
                  ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={16} /> Created</span>
                  : <span className="animate-pulse">Creating...</span>
              ) : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>

      {/* EDIT SLIDE-IN PANEL (matching create panel design) */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity ${showEdit ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/20" onClick={() => setShowEdit(false)}></div>
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Edit ticket panel"
          className={`relative w-full sm:w-120 h-full border-l border-white/40 bg-linear-to-b from-white/85 to-slate-100/85 backdrop-blur-xl flex flex-col transition-transform duration-300 ${showEdit ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 text-lg">Edit Ticket</h2>
            <button className="rounded-lg hover:bg-slate-100 p-2 transition duration-150 cursor-pointer" onClick={() => setShowEdit(false)}>
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="wizard-progress">
              {[
                ['problem', 'Step 1: Problem'],
                ['details', 'Step 2: Priority & Logistics'],
                ['review', 'Step 3: Review'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`wizard-step ${activeEditSection === id ? 'active' : ''}`}
                  onClick={() => setActiveEditSection(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <section className={editSectionClass('problem')} onFocus={() => setActiveEditSection('problem')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 1: The Problem</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                  <div className="relative">
                    <Type className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      ref={editTitleRef}
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${editErrors.title ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      value={editForm.title}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditForm((p) => ({ ...p, title: value }));
                        if (editErrors.title) {
                          setEditErrors((prev) => ({ ...prev, title: undefined }));
                        }
                      }}
                    />
                  </div>
                  {editErrors.title && <p className="mt-1 text-xs text-red-600">{editErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea 
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none ${editErrors.description ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      rows={5}
                      maxLength={500}
                      value={editForm.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditForm((p) => ({ ...p, description: value }));
                        if (editErrors.description) {
                          setEditErrors((prev) => ({ ...prev, description: undefined }));
                        }
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    {editErrors.description ? <p className="text-red-600">{editErrors.description}</p> : <span className="text-slate-400">Update issue context for clarity</span>}
                    <span className={`${editForm.description.length > 450 ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>{editForm.description.length}/500</span>
                  </div>
                </div>
              </div>
            </section>

            <section className={editSectionClass('details')} onFocus={() => setActiveEditSection('details')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 2: Priority & Logistics</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                  <div className="priority-wizard-selector">
                    {ticketPriorities.map((priority) => {
                      const selected = editForm.priority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          className={`priority-wizard-option ${selected ? `selected-${priority.toLowerCase()}` : ''}`}
                          onClick={() => {
                            setActiveEditSection('details');
                            setEditForm((p) => ({ ...p, priority }));
                          }}
                        >
                          {getPriorityOptionLabel(priority)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-xl border px-3 py-2 text-xs font-semibold ${PRIORITY_THEME[editForm.priority] || PRIORITY_THEME.MEDIUM}`}>
                  {PRIORITY_SLA_LABELS[editForm.priority]}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      className={`rounded-xl border pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${editErrors.location ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white/90'}`}
                      value={editForm.location}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditForm((p) => ({ ...p, location: value }));
                        if (editErrors.location) {
                          setEditErrors((prev) => ({ ...prev, location: undefined }));
                        }
                      }}
                    />
                  </div>
                  {editErrors.location && <p className="mt-1 text-xs text-red-600">{editErrors.location}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tags</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                      className="rounded-xl border border-slate-200 bg-white/90 pl-10 pr-4 py-2.5 text-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      value={editForm.tags}
                      onChange={(e) => setEditForm(p => ({...p, tags: e.target.value}))}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={editSectionClass('review')} onFocus={() => setActiveEditSection('review')}>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Step 3: Review Updates</h3>
              <div className="rounded-xl border border-slate-200 bg-white/80 p-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Title</span><span className="text-slate-800 font-medium text-right">{editForm.title || 'Not provided'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Priority</span><span className={`rounded-full px-2 py-0.5 border text-xs ${PRIORITY_THEME[editForm.priority] || PRIORITY_THEME.MEDIUM}`}>{getPriorityOptionLabel(editForm.priority)}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Location</span><span className="text-slate-800 font-medium text-right">{editForm.location || 'Not provided'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Description</span><span className="text-slate-800 font-medium text-right">{editForm.description.trim() ? `${editForm.description.length} chars` : 'Not provided'}</span></div>
              </div>
            </section>
          </div>
          
          <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
            <button className="border border-slate-200 text-slate-700 font-medium rounded-lg flex-1 py-2.5 transition hover:bg-slate-50 cursor-pointer" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex-1 py-2.5 transition flex justify-center items-center cursor-pointer" onClick={handleUpdate} disabled={updating}>
              {updating ? (
                editSuccess
                  ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={16} /> Saved</span>
                  : <span className="animate-pulse">Saving...</span>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* CANCEL TICKET MODAL */}
      {showCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative" role="dialog" aria-modal="true" aria-label="Cancel ticket confirmation">
            <div className="text-center">
              <AlertTriangle className="text-amber-500 mx-auto" size={24} />
              <h2 className="font-bold text-slate-900 text-lg mt-2">Cancel Ticket</h2>
              <p className="text-slate-500 text-sm mt-1">This will move {ticketToCancel?.ticketId || 'this ticket'} to rejected state.</p>
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
