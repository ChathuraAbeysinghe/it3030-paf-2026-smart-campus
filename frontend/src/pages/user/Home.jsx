import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import { ticketService } from '../../services/ticketService';
import StatCard from '../../components/StatCard';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import './dashboard.css';

/**
 * Student Home — welcome + quick actions + summary cards + Ticket Widget.
 */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  useEffect(() => {
    (async () => {
      const bookings = await bookingService.getAll();
      const myTickets = await ticketService.getMyTickets();
      
      const myBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING');
      const activeTickets = myTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'REJECTED');
      
      setStats({ bookings: myBookings.length, tickets: activeTickets.length });
      
      // Get the 3 most recently updated tickets
      setRecentTickets(myTickets.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3));
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
        <StatCard icon="🎫" label="Active Tickets" value={stats.tickets} accent="#FB923C" />
        <StatCard icon="🏛️" label="Available Resources" value="8" accent="#818CF8" />
        <StatCard icon="🔔" label="New Notifications" value="3" accent="#FBBF24" />
      </div>

      <div className="home-dashboard-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginTop: '24px' }}>
        {/* Quick Actions */}
        <div className="quick-actions">
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

        {/* Ticket Tracker Widget */}
        <div className="ticket-tracker-widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div>
              <h2 className="section-title" style={{ fontSize: '20px' }}>Issue Tracker</h2>
              <p className="section-subtitle">Recent ticket activity</p>
            </div>
            <a href="#" className="card-link" onClick={(e) => { e.preventDefault(); navigate('/my-tickets'); }}>View All</a>
          </div>
          
          <div className="tracker-list">
            {recentTickets.length === 0 ? (
              <div className="empty-tracker">
                <span style={{ fontSize: '24px', opacity: 0.5 }}>🎫</span>
                <p>No recent tickets</p>
              </div>
            ) : (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="tracker-item" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <div className="tracker-header">
                    <span className="tracker-id">{ticket.ticketId}</span>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div className="tracker-title">{ticket.title}</div>
                  
                  {ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED' && ticket.status !== 'RESOLVED' && (
                    <div className="tracker-sla">
                      <SlaCountdown 
                        slaDeadline={ticket.slaDeadline} 
                        slaStatus={ticket.slaStatus}
                        totalPausedDuration={ticket.totalPausedDuration}
                        compact
                      />
                    </div>
                  )}
                  {ticket.status === 'WAITING_USER_CONFIRMATION' && (
                    <div className="tracker-action-req">Action Required</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
