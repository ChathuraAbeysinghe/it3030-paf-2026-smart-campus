const EVENTS = [
  {
    date: '14',
    month: 'APR',
    title: 'Innovation Expo 2026',
    location: 'Main Auditorium',
    tag: 'Featured',
  },
  {
    date: '18',
    month: 'APR',
    title: 'AI Club Workshop',
    location: 'Computing Lab 5',
    tag: 'Workshop',
  },
  {
    date: '22',
    month: 'APR',
    title: 'Career Fair',
    location: 'University Grounds',
    tag: 'Career',
  },
];

export default function UpcomingEvents() {
  return (
    <article className="hp-panel">
      <h3>Upcoming on Campus</h3>
      <div className="hp-events">
        {EVENTS.map((event) => (
          <div key={event.title} className="hp-events__item">
            <div className="hp-events__date">
              <strong>{event.date}</strong>
              <span>{event.month}</span>
            </div>
            <div>
              <strong>{event.title}</strong>
              <p>{event.location}</p>
            </div>
            <span className="hp-events__tag">{event.tag}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
