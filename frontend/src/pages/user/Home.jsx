import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import { ticketService } from '../../services/ticketService';
import './dashboard.css';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  useEffect(() => {
    (async () => {
      try {
        const bookings = await bookingService.getAll();
        const tickets = await ticketService.getAll();
        const myBookings = bookings.filter((b) => b.status === 'APPROVED' || b.status === 'PENDING');
        const myTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
        setStats({ bookings: myBookings.length, tickets: myTickets.length });
      } catch {
        setStats({ bookings: 0, tickets: 0 });
      }
    })();
  }, []);

  const quickActions = [
    {
      title: 'Book a Resource',
      description: 'Reserve labs, study rooms, and equipment',
      icon: 'BK',
      tone: 'amber',
      onClick: () => navigate('/resources'),
    },
    {
      title: 'Report an Issue',
      description: 'Submit and track maintenance requests',
      icon: 'orange',
      tone: 'orange',
      onClick: () => navigate('/my-tickets'),
    },
    {
      title: 'My Bookings',
      description: 'Check status and approvals instantly',
      icon: 'MB',
      tone: 'teal',
      onClick: () => navigate('/my-bookings'),
    },
    {
      title: 'My Profile',
      description: 'Manage account details and password',
      icon: 'PR',
      tone: 'indigo',
      onClick: () => navigate('/profile'),
    },
  ];

  const activity = [
    { icon: 'OK', title: 'Latest booking synced', subtitle: 'Your reservations are up to date', time: 'Just now' },
    { icon: 'TK', title: 'Ticket tracker ready', subtitle: 'Open issues are visible in My Tickets', time: '5m ago' },
    { icon: 'NT', title: 'Notification center active', subtitle: 'Check bell icon for updates', time: '12m ago' },
  ];

  const upcoming = [
    { date: 'APR 14', title: 'Lab Open Slot', location: 'Engineering Block', tag: 'Booking' },
    { date: 'APR 16', title: 'Resource Maintenance', location: 'Main Library', tag: 'Notice' },
    { date: 'APR 20', title: 'Student Tech Event', location: 'Auditorium', tag: 'Campus' },
  ];

  return (
    <div className="dashboard-home animate-in">
      <div className="dash-container">
        
        {/* Welcome Section */}
        <div className="dash-welcome">
          <div className="dash-welcome-text">
            <div className="dash-welcome-tag">Student Dashboard</div>
            <h2>Welcome back, {firstName}</h2>
            <p>Same modern experience as the new homepage, now personalized for your day-to-day campus tasks.</p>
          </div>
          <img src="/sliit-campus-logo-.png" alt="Campus" style={{ width: 68, height: 68, opacity: 0.9, objectFit: 'contain' }} />
        </div>

        {/* Stats Section */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon">BK</div>
            <div className="dash-stat-value">{stats.bookings}</div>
            <div className="dash-stat-label">ACTIVE BOOKINGS</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">TK</div>
            <div className="dash-stat-value">{stats.tickets}</div>
            <div className="dash-stat-label">OPEN TICKETS</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">RS</div>
            <div className="dash-stat-value">8</div>
            <div className="dash-stat-label">AVAILABLE RESOURCES</div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon">NT</div>
            <div className="dash-stat-value">3</div>
            <div className="dash-stat-label">NEW NOTIFICATIONS</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-section-header">
          <h3>What do you need today?</h3>
          <p>All your core actions, now in the same updated UI style.</p>
        </div>
        <div className="dash-actions">
          {quickActions.map((action) => (
            <button key={action.title} className="dash-action-card" onClick={action.onClick}>
              <div className={`dash-action-icon icon-${action.tone}`}>
                 {action.icon === 'orange' ? 'IS' : action.icon}
              </div>
              <h4>{action.title}</h4>
              <p>{action.description}</p>
              <div className="dash-action-link">Open &rarr;</div>
            </button>
          ))}
        </div>

        {/* Two Columns: Activity & Upcoming */}
        <div className="dash-two-col">
          <div className="dash-panel">
            <div className="dash-panel-header">
              <h4>Recent Activity</h4>
              <button className="dash-panel-link" onClick={() => navigate('/my-bookings')}>My Bookings</button>
            </div>
            <ul className="dash-list">
              {activity.map((item) => (
                <li key={item.title} className="dash-list-item">
                  <div className="dash-list-icon">{item.icon}</div>
                  <div className="dash-list-content">
                    <div className="dash-list-title">{item.title}</div>
                    <div className="dash-list-subtitle">{item.subtitle}</div>
                  </div>
                  <div className="dash-list-time">{item.time}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="dash-panel">
            <div className="dash-panel-header">
              <h4>Upcoming on Campus</h4>
              <button className="dash-panel-link" onClick={() => navigate('/resources')}>Resources</button>
            </div>
            <ul className="dash-list">
              {upcoming.map((event) => (
                <li key={event.title} className="dash-list-item">
                  <div className="dash-event-date">{event.date}</div>
                  <div className="dash-list-content">
                    <div className="dash-list-title">{event.title}</div>
                    <div className="dash-list-subtitle">{event.location}</div>
                  </div>
                  <div className="dash-event-tag">{event.tag}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
