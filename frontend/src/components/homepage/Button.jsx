import { Link } from 'react-router-dom';

export default function Button({
<<<<<<< Updated upstream
  to,
  href,
  variant = 'primary',
  className = '',
  onClick,
  children,
=======
  children,
  variant = 'primary',
  to,
  href,
  onClick,
  className = '',
  type = 'button',
>>>>>>> Stashed changes
}) {
  const classes = `hp-btn hp-btn--${variant} ${className}`.trim();

  if (to) {
    return (
<<<<<<< Updated upstream
      <Link to={to} className={classes} onClick={onClick}>
=======
      <Link to={to} className={classes}>
>>>>>>> Stashed changes
        {children}
      </Link>
    );
  }

  if (href) {
    return (
<<<<<<< Updated upstream
      <a href={href} className={classes} onClick={onClick}>
=======
      <a href={href} className={classes}>
>>>>>>> Stashed changes
        {children}
      </a>
    );
  }

  return (
<<<<<<< Updated upstream
    <button type="button" className={classes} onClick={onClick}>
=======
    <button type={type} className={classes} onClick={onClick}>
>>>>>>> Stashed changes
      {children}
    </button>
  );
}
