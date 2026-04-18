export default function Footer() {
  return (
    <footer id="about" className="hp-footer">
      <div className="hp-container hp-footer__inner">
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
          Copyright Â© 2026 SmartCampus. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
