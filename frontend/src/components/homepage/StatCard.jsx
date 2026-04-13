export default function StatCard({ icon, value, label, tone }) {
  return (
    <article className="hp-stat-card">
      <div className={`hp-stat-card__icon hp-stat-card__icon--${tone}`}>{icon}</div>
      <div className="hp-stat-card__value">{value}</div>
      <div className="hp-stat-card__label">{label}</div>
    </article>
  );
}
