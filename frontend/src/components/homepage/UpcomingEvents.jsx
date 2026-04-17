const EVENTS = [
  { date: 'APR 14', title: 'Innovation Lab Open Day', location: 'Computing Auditorium', tag: 'Workshops' },
  { date: 'APR 16', title: 'Career Fair 2026', location: 'Main Ground', tag: 'Career' },
  { date: 'APR 20', title: 'Hackathon Kickoff', location: 'Engineering Block', tag: 'Tech' },
  { date: 'APR 22', title: 'Student Club Expo', location: 'Campus Courtyard', tag: 'Community' },
];

export default function UpcomingEvents() {
  return (
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
  );
}
