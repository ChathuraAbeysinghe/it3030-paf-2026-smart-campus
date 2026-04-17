<<<<<<< Updated upstream
const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#resources', label: 'Resources' },
  { href: '#bookings', label: 'Bookings' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#about', label: 'About' },
];

=======
>>>>>>> Stashed changes
export default function Footer() {
  return (
    <footer id="about" className="hp-footer">
      <div className="hp-container hp-footer__inner">
<<<<<<< Updated upstream
        <a className="hp-brand" href="#home">
          <span className="hp-brand__mark">
            <span>SLIIT</span>
            <span>UNI</span>
          </span>
          <span className="hp-brand__text">Smart Campus</span>
        </a>

        <nav className="hp-footer__links" aria-label="Footer links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </nav>

        <p className="hp-footer__copy">© {new Date().getFullYear()} SmartCampus. All rights reserved.</p>
=======
        <div className="hp-footer__brand">
          <span className="hp-brand__mark hp-brand__mark--footer">
            <span>SLIIT</span>
            <span>UNI</span>
          </span>
          <p>Smart Campus Operations Hub</p>
        </div>

        <nav className="hp-footer__links" aria-label="Footer links">
          <a href="#home">Home</a>
          <a href="#resources">Resources</a>
          <a href="#bookings">Bookings</a>
          <a href="#tickets">Tickets</a>
          <a href="/login">Login</a>
        </nav>

        <p className="hp-footer__copyright">
          Copyright © 2026 SmartCampus. All rights reserved.
        </p>
>>>>>>> Stashed changes
      </div>
    </footer>
  );
}
