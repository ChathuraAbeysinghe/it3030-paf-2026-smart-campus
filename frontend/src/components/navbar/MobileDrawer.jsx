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
      <div className={`nav-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden={!open} />

      <aside className={`nav-drawer nav-drawer--${variant} ${open ? 'is-open' : ''}`} aria-label={title}>
        <div className="nav-drawer__header">
          <h3>{title}</h3>
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
        </div>

        {actions.length > 0 && (
          <div className="nav-drawer__actions">
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
              )
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
