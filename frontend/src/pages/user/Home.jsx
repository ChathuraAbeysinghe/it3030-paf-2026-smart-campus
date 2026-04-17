import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import { ticketService } from '../../services/ticketService';
import '../homepage.css';
import './dashboard.css';

/**
 * Student Home updated to match the public homepage visual language.
 */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ bookings: 0, tickets: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
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
        // Keep fallback counters if API calls fail in local/dev mode.
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
      icon: 'IS',
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
                <h2 style={{ marginBottom: 8 }}>Welcome back, {firstName}</h2>
                <p style={{ margin: 0, maxWidth: 620 }}>
                  Same modern experience as the new homepage, now personalized for your day-to-day campus tasks.
                </p>
              </div>

              <img src="/sliit-campus-logo-.png" alt="Campus" className="dashboard-welcome-icon" />
            </div>
          </article>
        </div>

        <div className="hp-container" style={{ width: '100%', marginTop: 18 }}>
          <div className="hp-stats" style={{ gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))' }}>
            <article className="hp-stat-card hp-stat-card--navy is-visible">
              <div className="hp-stat-card__icon" aria-hidden="true">BK</div>
              <div className="hp-stat-card__value">{stats.bookings}</div>
              <div className="hp-stat-card__label">ACTIVE BOOKINGS</div>
            </article>
            <article className="hp-stat-card hp-stat-card--amber is-visible">
              <div className="hp-stat-card__icon" aria-hidden="true">TK</div>
              <div className="hp-stat-card__value">{stats.tickets}</div>
              <div className="hp-stat-card__label">OPEN TICKETS</div>
            </article>
            <article className="hp-stat-card hp-stat-card--navy is-visible">
              <div className="hp-stat-card__icon" aria-hidden="true">RS</div>
              <div className="hp-stat-card__value">8</div>
              <div className="hp-stat-card__label">AVAILABLE RESOURCES</div>
            </article>
            <article className="hp-stat-card hp-stat-card--green is-visible">
              <div className="hp-stat-card__icon" aria-hidden="true">NT</div>
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
                    <div className="hp-feed-list__icon" aria-hidden="true">{item.icon}</div>
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
