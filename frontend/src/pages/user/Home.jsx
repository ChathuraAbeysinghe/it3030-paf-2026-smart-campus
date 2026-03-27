import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService, ticketService } from '../../services/api';
import StatCard from '../../components/StatCard';

/**
 * Student Home — welcome + quick actions + summary cards.
 */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });

  useEffect(() => {
    (async () => {
      const bookings = await bookingService.getAll();
      const tickets = await ticketService.getAll();
      const myBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING');
      const myTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
      setStats({ bookings: myBookings.length, tickets: myTickets.length });
    })();
  }, []);

  return (
    <div className="page-content animate-in">
      {/* Welcome Section */}
      <div className="welcome-section glass-card">
        <div className="welcome-text">
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's what's happening on campus today. Manage your resources, bookings, and report issues all in one place.</p>
        </div>
        <div className="welcome-avatar">
          {user?.picture
            ? <img src={user.picture} alt="" className="user-avatar" style={{ width: 72, height: 72 }} />
            : <div className="user-avatar-placeholder" style={{ width: 72, height: 72, fontSize: '2rem' }}>{user?.name?.[0]}</div>
          }
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginTop: 24 }}>
        <StatCard icon="📅" label="Active Bookings" value={stats.bookings} accent="var(--primary)" />
        <StatCard icon="🎫" label="Open Tickets" value={stats.tickets} accent="#FB923C" />
        <StatCard icon="🏛️" label="Available Resources" value="8" accent="#818CF8" />
        <StatCard icon="🔔" label="New Notifications" value="3" accent="#FBBF24" />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Quick Actions</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-card glass-card" onClick={() => navigate('/resources')}>
            <span className="quick-action-icon">📚</span>
            <span className="quick-action-label">Book a Resource</span>
            <span className="quick-action-desc">Browse and reserve campus facilities</span>
          </button>
          <button className="quick-action-card glass-card" onClick={() => navigate('/my-tickets')}>
            <span className="quick-action-icon">⚠️</span>
            <span className="quick-action-label">Report an Issue</span>
            <span className="quick-action-desc">Submit a maintenance request</span>
          </button>
          <button className="quick-action-card glass-card" onClick={() => navigate('/my-bookings')}>
            <span className="quick-action-icon">📋</span>
            <span className="quick-action-label">View Bookings</span>
            <span className="quick-action-desc">Check your booking status</span>
          </button>
          <button className="quick-action-card glass-card" onClick={() => navigate('/profile')}>
            <span className="quick-action-icon">👤</span>
            <span className="quick-action-label">My Profile</span>
            <span className="quick-action-desc">View and manage your account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
