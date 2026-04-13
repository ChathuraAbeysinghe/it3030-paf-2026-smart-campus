import StatCard from './StatCard';
import { SectionIcons } from './Icons';

const STATS = [
  { icon: SectionIcons.calendar, value: '0', label: 'Active Bookings', tone: 'navy' },
  { icon: SectionIcons.alert, value: '6', label: 'Open Tickets', tone: 'amber' },
  { icon: SectionIcons.building, value: '8', label: 'Available Resources', tone: 'navy' },
  { icon: SectionIcons.bell, value: '3', label: 'New Notifications', tone: 'green' },
];

export default function StatsBar() {
  return (
    <section className="hp-stats-wrap">
      <div className="hp-container hp-stats">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
