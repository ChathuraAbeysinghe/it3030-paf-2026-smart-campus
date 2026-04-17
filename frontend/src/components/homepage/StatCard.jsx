export default function StatCard({ icon, value, label, tone = 'navy', visible = false, delay = 0 }) {
  return (
    <article
      className={`hp-stat-card hp-stat-card--${tone} ${visible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="hp-stat-card__icon" aria-hidden="true">{icon}</div>
      <div className="hp-stat-card__value">{value}</div>
      <div className="hp-stat-card__label">{label}</div>
    </article>
  );
}
