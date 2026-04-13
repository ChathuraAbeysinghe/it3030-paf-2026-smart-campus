import { Link } from 'react-router-dom';

export default function Button({
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  children,
}) {
  const classes = `hp-btn hp-btn--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
