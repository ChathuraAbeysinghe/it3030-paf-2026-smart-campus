export default function ActionCard({ title, description, icon, tone = 'amber', href = '/login' }) {
  return (
    <article className="hp-action-card">
      <div className={`hp-action-card__icon hp-action-card__icon--${tone}`} aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={href} className="hp-action-card__link" aria-label={`${title} action`}>
        Explore <span aria-hidden="true">&rarr;</span>
      </a>
    </article>
  );
}
