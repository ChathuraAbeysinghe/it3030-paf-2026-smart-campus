const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#resources', label: 'Resources' },
  { href: '#bookings', label: 'Bookings' },
  { href: '#tickets', label: 'Tickets' },
  { href: '#about', label: 'About' },
];

export default function Footer() {
  return (
    <footer id="about" className="hp-footer">
      <div className="hp-container hp-footer__inner">
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
      </div>
    </footer>
  );
}
