import ActionCard from './ActionCard';

const ACTIONS = [
  {
    title: 'Book a Resource',
    description: 'Reserve labs, study rooms, and equipment',
    icon: 'ðŸ“…',
    tone: 'amber',
    href: '/login',
  },
  {
    title: 'Report an Issue',
    description: 'Submit and track maintenance requests',
    icon: 'ðŸš¨',
    tone: 'orange',
    href: '/login',
  },
  {
    title: 'My Bookings',
    description: 'Check the status of your reservations',
    icon: 'ðŸ“‹',
    tone: 'teal',
    href: '/login',
  },
  {
    title: 'My Profile',
    description: 'Manage your account and preferences',
    icon: 'ðŸ‘¤',
    tone: 'indigo',
    href: '/login',
  },
];

export default function QuickActions() {
  return (
    <section id="resources" className="hp-section hp-section--soft">
      <div className="hp-container">
        <header className="hp-section__header hp-section__header--center">
          <h2>What do you need today?</h2>
          <p>One tap away from bookings, issues, and account actions that keep your day moving.</p>
        </header>

        <div className="hp-actions-grid">
          {ACTIONS.map((action) => (
            <ActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              tone={action.tone}
              href={action.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
