import { Link } from 'react-router-dom';

export default function MobileDrawer({
  open,
  onClose,
  title = 'Menu',
  links = [],
  actions = [],
  variant = 'guest',
}) {
  return (
    <>
<<<<<<< Updated upstream
      <div className={`nav-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden={!open} />
=======
      <div
        className={`nav-drawer-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
>>>>>>> Stashed changes

      <aside className={`nav-drawer nav-drawer--${variant} ${open ? 'is-open' : ''}`} aria-label={title}>
        <div className="nav-drawer__header">
          <h3>{title}</h3>
<<<<<<< Updated upstream
          <button type="button" onClick={onClose} aria-label="Close menu">X</button>
        </div>

        <div className="nav-drawer__links">
          {links.map((link) => (
            link.to ? (
              <Link key={`${link.label}-${link.to}`} to={link.to} onClick={onClose}>{link.label}</Link>
            ) : (
              <a key={`${link.label}-${link.href}`} href={link.href} onClick={onClose}>{link.label}</a>
            )
          ))}
=======
          <button type="button" onClick={onClose} aria-label="Close menu">
            X
          </button>
        </div>

        <div className="nav-drawer__links">
          {links.map((link) => {
            if (link.to) {
              return (
                <Link key={`${link.label}-${link.to}`} to={link.to} onClick={onClose}>
                  {link.label}
                </Link>
              );
            }

            return (
              <a key={`${link.label}-${link.href}`} href={link.href} onClick={onClose}>
                {link.label}
              </a>
            );
          })}
>>>>>>> Stashed changes
        </div>

        {actions.length > 0 && (
          <div className="nav-drawer__actions">
<<<<<<< Updated upstream
            {actions.map((action) => (
              action.to ? (
                <Link
                  key={`${action.label}-${action.to}`}
                  to={action.to}
                  className={`nav-drawer__btn nav-drawer__btn--${action.kind ?? 'ghost'}`}
                  onClick={onClose}
                >
                  {action.label}
                </Link>
              ) : (
=======
            {actions.map((action) => {
              if (action.to) {
                return (
                  <Link
                    key={`${action.label}-${action.to}`}
                    to={action.to}
                    className={`nav-drawer__btn nav-drawer__btn--${action.kind ?? 'ghost'}`}
                    onClick={onClose}
                  >
                    {action.label}
                  </Link>
                );
              }

              return (
>>>>>>> Stashed changes
                <button
                  key={action.label}
                  type="button"
                  className={`nav-drawer__btn nav-drawer__btn--${action.kind ?? 'ghost'}`}
                  onClick={() => {
                    action.onClick?.();
                    onClose();
                  }}
                >
                  {action.label}
                </button>
<<<<<<< Updated upstream
              )
            ))}
=======
              );
            })}
>>>>>>> Stashed changes
          </div>
        )}
      </aside>
    </>
  );
}
