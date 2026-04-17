const EVENTS = [
<<<<<<< Updated upstream
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
=======
  { date: 'APR 14', title: 'Innovation Lab Open Day', location: 'Computing Auditorium', tag: 'Workshops' },
  { date: 'APR 16', title: 'Career Fair 2026', location: 'Main Ground', tag: 'Career' },
  { date: 'APR 20', title: 'Hackathon Kickoff', location: 'Engineering Block', tag: 'Tech' },
  { date: 'APR 22', title: 'Student Club Expo', location: 'Campus Courtyard', tag: 'Community' },
>>>>>>> Stashed changes
];

export default function UpcomingEvents() {
  return (
<<<<<<< Updated upstream
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
=======
    <section className="hp-panel" aria-label="Upcoming events">
      <header className="hp-panel__header">
        <h3>Upcoming on Campus</h3>
        <a href="/login">Calendar</a>
      </header>

      <ul className="hp-event-list">
        {EVENTS.map((event) => (
          <li key={`${event.title}-${event.date}`}>
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
>>>>>>> Stashed changes
  );
}
