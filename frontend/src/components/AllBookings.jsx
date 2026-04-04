import { useMemo, useState } from 'react';
import GlassTable from './GlassTable';
import StatusBadge from './StatusBadge';

export default function AllBookings({ bookings, onApprove, onReject, onCancel }) {
  var [statusFilter, setStatusFilter] = useState('ALL');
  var [facilityFilter, setFacilityFilter] = useState('');
  var [userFilter, setUserFilter] = useState('');

  var filtered = useMemo(function () {
    var rows = Array.isArray(bookings) ? bookings : [];

    if (statusFilter !== 'ALL') {
      rows = rows.filter(function (b) { return b.status === statusFilter; });
    }
    if (facilityFilter.trim()) {
      var termFacility = facilityFilter.toLowerCase();
      rows = rows.filter(function (b) {
        var value = String(b.facilityName || b.resourceName || b.facilityId || '').toLowerCase();
        return value.includes(termFacility);
      });
    }
    if (userFilter.trim()) {
      var termUser = userFilter.toLowerCase();
      rows = rows.filter(function (b) {
        return String(b.userName || '').toLowerCase().includes(termUser);
      });
    }

    return rows;
  }, [bookings, statusFilter, facilityFilter, userFilter]);

  var columns = [
    {
      key: 'facilityName',
      label: 'Facility',
      render: function (v, row) {
        return v || row.resourceName || row.facilityId;
      }
    },
    { key: 'userName', label: 'Requested By' },
    { key: 'date', label: 'Date' },
    {
      key: 'startTime',
      label: 'Time',
      render: function (v, row) {
        return v + ' - ' + row.endTime;
      }
    },
    {
      key: 'expectedAttendees',
      label: 'Attendees',
      render: function (v) {
        return v != null ? v : '-';
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: function (v) {
        return <StatusBadge status={v} />;
      }
    },
    {
      key: 'adminNotes',
      label: 'Admin Notes',
      render: function (v) {
        return v || '-';
      }
    },
  ];

  return (
    <div className="glass-card" style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 10 }}>All Bookings</h2>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 12 }}>
        <select className="form-input" value={statusFilter} onChange={function (e) { setStatusFilter(e.target.value); }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <input
          className="form-input"
          value={facilityFilter}
          onChange={function (e) { setFacilityFilter(e.target.value); }}
          placeholder="Filter by facility"
        />

        <input
          className="form-input"
          value={userFilter}
          onChange={function (e) { setUserFilter(e.target.value); }}
          placeholder="Filter by user"
        />
      </div>

      <GlassTable
        columns={columns}
        data={filtered}
        actions={function (row) {
          if (row.status === 'PENDING') {
            return (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn-sm btn-sm--success" onClick={function () { onApprove(row.id, 'Approved by admin'); }}>
                  Approve
                </button>
                <button
                  className="btn-sm btn-sm--danger"
                  onClick={function () {
                    var reason = window.prompt('Reason for rejection:') || '';
                    if (reason.trim()) onReject(row.id, reason.trim());
                  }}
                >
                  Reject
                </button>
              </div>
            );
          }

          if (row.status === 'APPROVED') {
            return (
              <button className="btn-sm btn-sm--danger" onClick={function () { onCancel(row.id); }}>
                Cancel
              </button>
            );
          }

          return null;
        }}
        emptyMessage="No bookings found"
      />
    </div>
  );
}
