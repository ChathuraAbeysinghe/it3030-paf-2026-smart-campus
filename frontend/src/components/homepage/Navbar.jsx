import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#resources', label: 'Resources' },
  { href: '#bookings', label: 'Bookings' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#about', label: 'About' },
];

const BOTTOM_LINKS = [
  { href: '#home', label: 'Home', icon: 'ðŸ ' },
  { href: '#resources', label: 'Resources', icon: 'ðŸ“š' },
  { href: '#bookings', label: 'Bookings', icon: 'ðŸ“…' },
  { href: '#tickets', label: 'Tickets', icon: 'ðŸŽ«' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = LINKS.map((link) => link.href.slice(1));
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-35% 0px -50% 0px',
        threshold: [0.1, 0.25, 0.4],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className={`hp-navbar ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="hp-container hp-navbar__inner">
          <a className="hp-brand" href="#home" onClick={() => setMenuOpen(false)}>
            <span className="hp-brand__mark">
              <span>SLIIT</span>
              <span>UNI</span>
            </span>
            <span className="hp-brand__text">Smart Campus</span>
          </a>

          <nav className={`hp-nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Homepage Navigation">
            {LINKS.map((link) => {
              const sectionId = link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={activeSection === sectionId ? 'is-active' : ''}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              );
            })}
            <div className="hp-nav-links__mobile-actions">
              <Link to="/login" className="hp-mobile-login" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Button to="/register" variant="outline" className="hp-mobile-register" onClick={() => setMenuOpen(false)}>
                Register
              </Button>
            </div>
          </nav>

          <div className="hp-navbar__actions">
            <Button to="/login" variant="primary">Report Item</Button>
            <Link to="/login" className="hp-login-link">Login</Link>
            <Button to="/register" variant="outline">Register</Button>
          </div>

          <button
            type="button"
            className={`hp-menu-toggle ${menuOpen ? 'is-open' : ''}`}
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav className="hp-bottom-tabs" aria-label="Mobile quick navigation">
        {BOTTOM_LINKS.map((link) => {
          const sectionId = link.href.slice(1);
          return (
            <a
              key={link.href}
              href={link.href}
              className={activeSection === sectionId ? 'is-active' : ''}
            >
              <span aria-hidden="true">{link.icon}</span>
              <small>{link.label}</small>
            </a>
          );
        })}
      </nav>
    </>
  );
}
