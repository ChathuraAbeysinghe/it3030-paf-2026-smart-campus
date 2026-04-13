import ActionCard from './ActionCard';

const ACTIONS = [
  {
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
  },
];

export default function QuickActions() {
  return (
    <section id="resources" className="hp-section hp-section--soft">
      <div className="hp-container">
        <h2 className="hp-section-title hp-section-title--center">What do you need today?</h2>
        <div className="hp-action-grid">
          {ACTIONS.map((item) => (
            <ActionCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
