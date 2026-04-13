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
];

export default function ActivityFeed() {
  return (
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
  );
}
