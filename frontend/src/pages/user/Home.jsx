import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService, ticketService } from '../../services/api';
import StatCard from '../../components/StatCard';
import './dashboard.css';

/**
 * Student Home — welcome + quick actions + summary cards.
 */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

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
    <div className="page-content dashboard-home animate-in">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-text">
          <p className="welcome-kicker">Student Dashboard</p>
          <h1>Welcome back, {firstName} 👋</h1>
          <p className="welcome-sub">
            Same modern experience as the new homepage. Manage your resources, bookings, and report issues all in one place.
          </p>
        </div>
        <img src="/sliit-campus-logo-.png" alt="" className="welcome-illustration" />
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
        <h2 className="section-title">What do you need today?</h2>
        <p className="section-subtitle">Jump into the most used actions from your dashboard.</p>
        <div className="quick-actions-grid">
          <button type="button" className="quick-action-card action-card" onClick={() => navigate('/resources')}>
            <span className="quick-action-icon">📚</span>
            <span className="quick-action-label">Book a Resource</span>
            <span className="quick-action-desc">Browse and reserve campus facilities</span>
            <span className="card-link open-link">Open →</span>
          </button>
          <button type="button" className="quick-action-card action-card" onClick={() => navigate('/my-tickets')}>
            <span className="quick-action-icon">⚠️</span>
            <span className="quick-action-label">Report an Issue</span>
            <span className="quick-action-desc">Submit a maintenance request</span>
            <span className="card-link open-link">Open →</span>
          </button>
          <button type="button" className="quick-action-card action-card" onClick={() => navigate('/my-bookings')}>
            <span className="quick-action-icon">📋</span>
            <span className="quick-action-label">View Bookings</span>
            <span className="quick-action-desc">Check your booking status</span>
            <span className="card-link open-link">Open →</span>
          </button>
          <button type="button" className="quick-action-card action-card" onClick={() => navigate('/profile')}>
            <span className="quick-action-icon">👤</span>
            <span className="quick-action-label">My Profile</span>
            <span className="quick-action-desc">View and manage your account</span>
            <span className="card-link open-link">Open →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
