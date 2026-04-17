<<<<<<< Updated upstream
const ACTIVITY = [
  {
    icon: '📍',
    title: 'Lab B-204 booking approved',
    subtitle: 'Capacity check passed and QR generated for check-in.',
    time: '2m ago',
  },
  {
    icon: '🛠️',
    title: 'Issue routed to maintenance team',
    subtitle: 'Projector fault in LH-03 is now in progress.',
    time: '18m ago',
  },
  {
    icon: '🔔',
    title: 'Schedule reminder delivered',
    subtitle: 'Upcoming booking starts in 30 minutes.',
    time: '1h ago',
  },
=======
const ACTIVITIES = [
  { icon: '🛠️', title: 'Lab AC Issue Reported', subtitle: 'Engineering Block - Floor 3', time: '12m ago' },
  { icon: '✅', title: 'Study Room B2 Booking Approved', subtitle: 'Main Library', time: '32m ago' },
  { icon: '🔔', title: 'Ticket Assigned to Technician', subtitle: 'Projector maintenance request', time: '1h ago' },
  { icon: '📅', title: 'Seminar Hall Reservation Confirmed', subtitle: 'Faculty of Business', time: '2h ago' },
>>>>>>> Stashed changes
];

export default function ActivityFeed() {
  return (
<<<<<<< Updated upstream
    <article className="hp-panel">
      <h3>Recent Activity</h3>
      <div className="hp-feed">
        {ACTIVITY.map((item) => (
          <div key={item.title} className="hp-feed__item">
            <span className="hp-feed__icon">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.subtitle}</p>
            </div>
            <small>{item.time}</small>
          </div>
        ))}
      </div>
    </article>
=======
    <section id="tickets" className="hp-panel" aria-label="Recent activity feed">
      <header className="hp-panel__header">
        <h3>Recent Activity</h3>
        <a href="/login">View all</a>
      </header>

      <ul className="hp-feed-list">
        {ACTIVITIES.map((activity) => (
          <li key={`${activity.title}-${activity.time}`}>
            <div className="hp-feed-list__icon" aria-hidden="true">{activity.icon}</div>
            <div>
              <h4>{activity.title}</h4>
              <p>{activity.subtitle}</p>
            </div>
            <time>{activity.time}</time>
          </li>
        ))}
      </ul>
    </section>
>>>>>>> Stashed changes
  );
}
