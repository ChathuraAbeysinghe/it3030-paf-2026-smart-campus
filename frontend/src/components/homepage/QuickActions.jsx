import ActionCard from './ActionCard';

const ACTIONS = [
  {
<<<<<<< Updated upstream
    icon: '📅',
    title: 'Book a Resource',
    description: 'Reserve labs, study rooms, and equipment',
    tone: 'amber',
    to: '/login',
  },
  {
    icon: '⚠️',
    title: 'Report an Issue',
    description: 'Submit and track maintenance requests',
    tone: 'orange',
    to: '/login',
  },
  {
    icon: '📋',
    title: 'My Bookings',
    description: 'Check the status of your reservations',
    tone: 'teal',
    to: '/login',
  },
  {
    icon: '👤',
    title: 'My Profile',
    description: 'Manage your account and preferences',
    tone: 'indigo',
    to: '/login',
=======
    title: 'Book a Resource',
    description: 'Reserve labs, study rooms, and equipment',
    icon: '📅',
    tone: 'amber',
    href: '/login',
  },
  {
    title: 'Report an Issue',
    description: 'Submit and track maintenance requests',
    icon: '🚨',
    tone: 'orange',
    href: '/login',
  },
  {
    title: 'My Bookings',
    description: 'Check the status of your reservations',
    icon: '📋',
    tone: 'teal',
    href: '/login',
  },
  {
    title: 'My Profile',
    description: 'Manage your account and preferences',
    icon: '👤',
    tone: 'indigo',
    href: '/login',
>>>>>>> Stashed changes
  },
];

export default function QuickActions() {
  return (
    <section id="resources" className="hp-section hp-section--soft">
      <div className="hp-container">
<<<<<<< Updated upstream
        <h2 className="hp-section-title hp-section-title--center">What do you need today?</h2>
        <div className="hp-action-grid">
          {ACTIONS.map((item) => (
            <ActionCard key={item.title} {...item} />
=======
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
>>>>>>> Stashed changes
          ))}
        </div>
      </div>
    </section>
  );
}
