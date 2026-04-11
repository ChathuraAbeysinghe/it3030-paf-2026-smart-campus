import { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import GlassTable from '../../components/GlassTable';
import StatusBadge from '../../components/StatusBadge';

/**
 * Admin — Manage Bookings (approve/reject).
 */
export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => { load(); }, []);
  const load = async () => {
    const data = await bookingService.getAll();
    setBookings(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  const handleStatus = async (id, status) => {
    await bookingService.updateStatus(id, status);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, qrCode: status === 'APPROVED' ? 'QR-' + id : b.qrCode } : b));
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const columns = [
    { key: 'resourceName', label: 'Resource' },
    { key: 'userName', label: 'Requested By' },
    { key: 'date', label: 'Date' },
    { key: 'startTime', label: 'Time', render: (v, row) => `${v} — ${row.endTime}` },
    { key: 'purpose', label: 'Purpose', render: (v) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Manage Bookings</h1>
        <p>Review and process booking requests.</p>
      </div>

      {/* Filters */}
      <div className="filter-chips" style={{ marginBottom: 20 }}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button key={s} className={`filter-chip ${filter === s ? 'filter-chip--active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'ALL' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <GlassTable
          columns={columns}
          data={filtered}
          actions={(row) => row.status === 'PENDING' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-sm btn-sm--success" onClick={() => handleStatus(row.id, 'APPROVED')}>✅ Approve</button>
              <button className="btn-sm btn-sm--danger" onClick={() => handleStatus(row.id, 'REJECTED')}>❌ Reject</button>
            </div>
          ) : null}
          emptyMessage="No bookings found"
        />
      </div>
    </div>
  );
}
