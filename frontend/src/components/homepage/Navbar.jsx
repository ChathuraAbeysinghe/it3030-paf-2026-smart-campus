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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState('home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const ids = LINKS.map((item) => item.href.slice(1));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0.2, 0.35, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`hp-navbar ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="hp-container hp-navbar__inner">
        <a className="hp-brand" href="#home" onClick={() => setMenuOpen(false)}>
          <span className="hp-brand__mark">
            <span>SLIIT</span>
            <span>UNI</span>
          </span>
          <span className="hp-brand__text">Smart Campus</span>
        </a>

        <nav className={`hp-nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Homepage navigation">
          {LINKS.map((link) => {
            const sectionId = link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                className={activeId === sectionId ? 'is-active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            );
          })}

          <div className="hp-nav-links__mobile-actions">
            <Button to="/login" variant="ghost" onClick={() => setMenuOpen(false)}>Login</Button>
            <Button to="/register" variant="outline" onClick={() => setMenuOpen(false)}>Register</Button>
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
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
