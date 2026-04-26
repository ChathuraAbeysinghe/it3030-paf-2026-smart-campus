import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MobileDrawer from './MobileDrawer';

const SECTION_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'resources', label: 'Resources' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'about', label: 'About' },
];

export default function GuestNav({ currentPath }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState('home');

  const isHomePage = currentPath === '/' || currentPath === '/home';

  const links = useMemo(
    () => SECTION_LINKS.map((item) => ({ ...item, href: isHomePage ? `#${item.id}` : `/home#${item.id}` })),
    [isHomePage]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    const sections = SECTION_LINKS.map((item) => document.getElementById(item.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      {
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0.2, 0.35, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHomePage]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header className={`guest-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="guest-nav__inner">
        <a className="guest-nav__brand" href={isHomePage ? '#home' : '/home#home'}>
          <span className="guest-nav__logo">
            <strong>SLIIT</strong>
            <strong>UNI</strong>
          </span>
          <span className="guest-nav__brand-text">Smart Campus</span>
        </a>

        <nav className="guest-nav__links" aria-label="Guest navigation">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={activeId === link.id ? 'is-active' : ''}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="guest-nav__actions">
          <Link to="/login" className="guest-nav__link">Login</Link>
          <Link to="/register" className="guest-nav__btn guest-nav__btn--outline">Register</Link>
        </div>

        <button
          type="button"
          className={`guest-nav__toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label="Open menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        links={links}
        actions={[
          { label: 'Login', to: '/login', kind: 'ghost' },
          { label: 'Register', to: '/register', kind: 'outline' },
        ]}
        variant="guest"
      />
    </header>
  );
}
