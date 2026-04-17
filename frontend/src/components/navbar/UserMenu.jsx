import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

<<<<<<< Updated upstream
function UserMenu({ user, onLogout }) {
=======
export default function UserMenu({ user, onLogout }) {
>>>>>>> Stashed changes
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="auth-user-menu" ref={menuRef}>
<<<<<<< Updated upstream
      <button type="button" className="auth-user-menu__trigger" aria-label="User menu" onClick={() => setOpen((prev) => !prev)}>
=======
      <button
        type="button"
        className="auth-user-menu__trigger"
        aria-label="User menu"
        onClick={() => setOpen((prev) => !prev)}
      >
>>>>>>> Stashed changes
        {user?.picture ? (
          <img src={user.picture} alt={user?.name ?? 'User'} className="auth-user-menu__avatar" />
        ) : (
          <span className="auth-user-menu__initials">{user?.name?.[0] ?? 'U'}</span>
        )}
      </button>

      <div className={`auth-user-menu__dropdown ${open ? 'is-open' : ''}`}>
<<<<<<< Updated upstream
        <button type="button" onClick={() => { navigate('/profile'); setOpen(false); }}>Profile</button>
        <button type="button" onClick={() => { navigate('/profile'); setOpen(false); }}>Settings</button>
        <button type="button" className="danger" onClick={onLogout}>Logout</button>
=======
        <button type="button" onClick={() => { navigate('/profile'); setOpen(false); }}>
          Profile
        </button>
        <button type="button" onClick={() => { navigate('/profile'); setOpen(false); }}>
          Settings
        </button>
        <button type="button" className="danger" onClick={onLogout}>
          Logout
        </button>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}
<<<<<<< Updated upstream

export default UserMenu;
=======
>>>>>>> Stashed changes
