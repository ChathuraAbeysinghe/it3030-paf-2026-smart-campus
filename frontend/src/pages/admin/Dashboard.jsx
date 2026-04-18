import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingService, resourceService } from '../../services/api';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/api';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';

/**
 * Admin Dashboard — analytics overview with mock charts.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, resources: 0, bookings: 0, tickets: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !user) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      const [users, resources, bookings, tickets] = await Promise.all([
        userService.getAll(),
        resourceService.getAll(),
        bookingService.getAll(),
        ticketService.getAll(),
      ]);
      setStats({
        users: users.length,
        resources: resources.length,
        bookings: bookings.filter(b => b.status === 'PENDING' || b.status === 'APPROVED').length,
        tickets: tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
      });
      // Build recent activity from combined data
      const activity = [
        ...bookings.slice(0, 3).map(b => ({ icon: '📅', text: `${b.userName} booked ${b.resourceName}`, time: b.createdAt })),
        ...tickets.slice(0, 3).map(t => ({ icon: '🎫', text: `${t.createdByName}: "${t.title}"`, time: t.createdAt })),
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
      setRecentActivity(activity);
    })();
  }, [navigate, user]);

  return (
    <div className="animate-in">
      <div className="content-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and analytics at a glance.</p>
      </div>

      <div className="stats-grid" style={{ animationDelay: '0.1s' }}>
        <StatCard icon="👥" label="Total Users" value={stats.users} accent="#818CF8" trend={12} />
        <StatCard icon="🏛️" label="Resources" value={stats.resources} accent="var(--primary)" />
        <StatCard icon="📅" label="Active Bookings" value={stats.bookings} accent="#34D399" trend={5} />
        <StatCard icon="🎫" label="Open Tickets" value={stats.tickets} accent="#F87171" trend={-8} />
      </div>

      {/* Mock Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 24 }}>
        {/* Bar Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Bookings This Week</h3>
          <div className="mock-chart">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [60, 85, 45, 90, 70, 30, 20];
              return (
                <div key={day} className="mock-chart-col">
                  <div className="mock-chart-bar" style={{ height: `${heights[i]}%` }} />
                  <span className="mock-chart-label">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>Ticket Status</h3>
          <div className="mock-donut">
            <svg viewBox="0 0 36 36" className="mock-donut-svg">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#60A5FA" strokeWidth="3"
                strokeDasharray="35 65" strokeDashoffset="25" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#FB923C" strokeWidth="3"
                strokeDasharray="25 75" strokeDashoffset="-10" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#34D399" strokeWidth="3"
                strokeDasharray="20 80" strokeDashoffset="-35" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#9CA3AF" strokeWidth="3"
                strokeDasharray="20 80" strokeDashoffset="-55" />
            </svg>
            <div className="mock-donut-legend">
              <span><i style={{ background: '#60A5FA' }} />Open</span>
              <span><i style={{ background: '#FB923C' }} />In Progress</span>
              <span><i style={{ background: '#34D399' }} />Resolved</span>
              <span><i style={{ background: '#9CA3AF' }} />Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recentActivity.map((a, i) => (
            <div key={i} className="activity-item">
              <span className="activity-icon">{a.icon}</span>
              <span className="activity-text">{a.text}</span>
              <span className="activity-time">{timeAgo(a.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
