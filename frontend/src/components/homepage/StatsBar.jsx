<<<<<<< Updated upstream
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
=======
import { useEffect, useRef, useState } from 'react';
import StatCard from './StatCard';

const STATS = [
  { icon: '🗓️', value: '0', label: 'ACTIVE BOOKINGS', tone: 'navy' },
  { icon: '⚠️', value: '6', label: 'OPEN TICKETS', tone: 'amber' },
  { icon: '🏛️', value: '8', label: 'AVAILABLE RESOURCES', tone: 'navy' },
  { icon: '🔔', value: '3', label: 'NEW NOTIFICATIONS', tone: 'green' },
];

export default function StatsBar() {
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (wrapRef.current) observer.observe(wrapRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="hp-stats-wrap" ref={wrapRef} aria-label="Smart campus quick stats">
      <div className="hp-container hp-stats">
        {STATS.map((item, index) => (
          <StatCard
            key={item.label}
            icon={item.icon}
            value={item.value}
            label={item.label}
            tone={item.tone}
            visible={visible}
            delay={index * 100}
          />
>>>>>>> Stashed changes
        ))}
      </div>
    </section>
  );
}
