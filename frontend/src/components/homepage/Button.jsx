import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary',
  to,
  href,
  onClick,
  className = '',
  type = 'button',
}) {
  const classes = `hp-btn hp-btn--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
