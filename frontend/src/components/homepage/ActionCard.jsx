import { Link } from 'react-router-dom';

export default function ActionCard({ icon, title, description, tone, to }) {
  return (
    <article className="hp-action-card">
      <span className={`hp-action-card__icon hp-action-card__icon--${tone}`}>{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to} className="hp-action-card__link">→</Link>
    </article>
  );
}
