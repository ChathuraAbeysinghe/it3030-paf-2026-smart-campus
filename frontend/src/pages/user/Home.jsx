import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
<<<<<<< Updated upstream
import { bookingService } from '../../services/api';
import { ticketService } from '../../services/ticketService';
import StatCard from '../../components/StatCard';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import SlaCountdown from '../../components/tickets/SlaCountdown';
import './dashboard.css';

/**
 * Student Home — welcome + quick actions + summary cards + Ticket Widget.
=======
import { bookingService, ticketService } from '../../services/api';
import '../homepage.css';
import './dashboard.css';

/**
 * Student Home — updated to match the public homepage visual language.
>>>>>>> Stashed changes
 */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  useEffect(() => {
    (async () => {
<<<<<<< Updated upstream
      const bookings = await bookingService.getAll();
      const myTickets = await ticketService.getMyTickets();
      
      const myBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING');
      const activeTickets = myTickets.filter(t => t.status !== 'CLOSED' && t.status !== 'REJECTED');
      
      setStats({ bookings: myBookings.length, tickets: activeTickets.length });
      
      // Get the 3 most recently updated tickets
      setRecentTickets(myTickets.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3));
=======
      try {
        const bookings = await bookingService.getAll();
        const tickets = await ticketService.getAll();
        const myBookings = bookings.filter((b) => b.status === 'APPROVED' || b.status === 'PENDING');
        const myTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
        setStats({ bookings: myBookings.length, tickets: myTickets.length });
      } catch {
        // Keep fallback counters if API calls fail in local/dev mode.
        setStats({ bookings: 0, tickets: 0 });
      }
>>>>>>> Stashed changes
    })();
  }, []);

  const quickActions = [
    {
      title: 'Book a Resource',
      description: 'Reserve labs, study rooms, and equipment',
      icon: '📅',
      tone: 'amber',
      onClick: () => navigate('/resources'),
    },
    {
      title: 'Report an Issue',
      description: 'Submit and track maintenance requests',
      icon: '🚨',
      tone: 'orange',
      onClick: () => navigate('/my-tickets'),
    },
    {
      title: 'My Bookings',
      description: 'Check status and approvals instantly',
      icon: '📋',
      tone: 'teal',
      onClick: () => navigate('/my-bookings'),
    },
    {
      title: 'My Profile',
      description: 'Manage account details and password',
      icon: '👤',
      tone: 'indigo',
      onClick: () => navigate('/profile'),
    },
  ];

  const activity = [
    { icon: '✅', title: 'Latest booking synced', subtitle: 'Your reservations are up to date', time: 'Just now' },
    { icon: '🎫', title: 'Ticket tracker ready', subtitle: 'Open issues are visible in My Tickets', time: '5m ago' },
    { icon: '🔔', title: 'Notification center active', subtitle: 'Check bell icon for updates', time: '12m ago' },
  ];

  const upcoming = [
    { date: 'APR 14', title: 'Lab Open Slot', location: 'Engineering Block', tag: 'Booking' },
    { date: 'APR 16', title: 'Resource Maintenance', location: 'Main Library', tag: 'Notice' },
    { date: 'APR 20', title: 'Student Tech Event', location: 'Auditorium', tag: 'Campus' },
  ];

  return (
<<<<<<< Updated upstream
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
=======
    <div className="hp-page dashboard-home animate-in">
      <section className="hp-section" style={{ padding: '10px 0 22px' }}>
        <div className="hp-container" style={{ width: '100%' }}>
          <article
            className="hp-panel"
            style={{
              background: 'linear-gradient(115deg, #FFFFFF 0%, #F8FAFF 100%)',
              borderColor: '#DCE5F3',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <p style={{ marginBottom: 8, fontWeight: 600, color: '#D4891A' }}>Student Dashboard</p>
                <h2 style={{ marginBottom: 8 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
                <p style={{ margin: 0, maxWidth: 620 }}>
                  Same modern experience as the new homepage, now personalized for your day-to-day campus tasks.
                </p>
              </div>

              <img src="/sliit-campus-logo-.png" alt="Campus" className="dashboard-welcome-icon" />
            </div>
          </article>
>>>>>>> Stashed changes
        </div>

        <div className="hp-container" style={{ width: '100%', marginTop: 18 }}>
          <div className="hp-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
            <article className="hp-stat-card hp-stat-card--navy is-visible">
              <div className="hp-stat-card__icon">🗓️</div>
              <div className="hp-stat-card__value">{stats.bookings}</div>
              <div className="hp-stat-card__label">ACTIVE BOOKINGS</div>
            </article>
            <article className="hp-stat-card hp-stat-card--amber is-visible">
              <div className="hp-stat-card__icon">⚠️</div>
              <div className="hp-stat-card__value">{stats.tickets}</div>
              <div className="hp-stat-card__label">OPEN TICKETS</div>
            </article>
            <article className="hp-stat-card hp-stat-card--navy is-visible">
              <div className="hp-stat-card__icon">🏛️</div>
              <div className="hp-stat-card__value">8</div>
              <div className="hp-stat-card__label">AVAILABLE RESOURCES</div>
            </article>
            <article className="hp-stat-card hp-stat-card--green is-visible">
              <div className="hp-stat-card__icon">🔔</div>
              <div className="hp-stat-card__value">3</div>
              <div className="hp-stat-card__label">NEW NOTIFICATIONS</div>
            </article>
          </div>
        </div>

        <div className="hp-container" style={{ width: '100%', marginTop: 26 }}>
          <header className="hp-section__header" style={{ marginBottom: 16 }}>
            <h2 className="section-heading">What do you need today?</h2>
            <p className="section-subtext">All your core actions, now in the same updated UI style.</p>
          </header>
          <div className="hp-actions-grid">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className="hp-action-card"
                style={{ textAlign: 'left', cursor: 'pointer' }}
                onClick={action.onClick}
              >
                <div className={`hp-action-card__icon hp-action-card__icon--${action.tone}`} aria-hidden="true">{action.icon}</div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <span className="hp-action-card__link card-link">
                  Open <span aria-hidden="true">&rarr;</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="hp-container" style={{ width: '100%', marginTop: 24 }}>
          <div className="hp-two-col">
            <section className="hp-panel" aria-label="Recent activity">
              <header className="hp-panel__header">
                <h3>Recent Activity</h3>
                <button
                  type="button"
                  onClick={() => navigate('/my-bookings')}
                  style={{ border: 0, background: 'transparent', color: '#D4891A', fontWeight: 600, cursor: 'pointer' }}
                >
                  My Bookings
                </button>
              </header>

              <ul className="hp-feed-list">
                {activity.map((item) => (
                  <li key={item.title}>
                    <div className="hp-feed-list__icon">{item.icon}</div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>
                    <time>{item.time}</time>
                  </li>
                ))}
              </ul>
            </section>

            <section className="hp-panel" aria-label="Upcoming campus events">
              <header className="hp-panel__header">
                <h3>Upcoming on Campus</h3>
                <button
                  type="button"
                  onClick={() => navigate('/resources')}
                  style={{ border: 0, background: 'transparent', color: '#D4891A', fontWeight: 600, cursor: 'pointer' }}
                >
                  Resources
                </button>
              </header>

              <ul className="hp-event-list">
                {upcoming.map((event) => (
                  <li key={event.title}>
                    <div className="hp-event-date">{event.date}</div>
                    <div className="hp-event-meta">
                      <h4>{event.title}</h4>
                      <p>{event.location}</p>
                    </div>
                    <span className="hp-event-tag">{event.tag}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
