const ACTIVITIES = [
  { icon: 'ðŸ› ï¸', title: 'Lab AC Issue Reported', subtitle: 'Engineering Block - Floor 3', time: '12m ago' },
  { icon: 'âœ…', title: 'Study Room B2 Booking Approved', subtitle: 'Main Library', time: '32m ago' },
  { icon: 'ðŸ””', title: 'Ticket Assigned to Technician', subtitle: 'Projector maintenance request', time: '1h ago' },
  { icon: 'ðŸ“…', title: 'Seminar Hall Reservation Confirmed', subtitle: 'Faculty of Business', time: '2h ago' },
];

export default function ActivityFeed() {
  return (
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
  );
}
