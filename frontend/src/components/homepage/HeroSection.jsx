import Button from './Button';

const TRUST_POINTS = [
  'Free for all students',
  'AI-powered matching',
  'Secure and verified',
];

export default function HeroSection() {
  return (
    <section id="home" className="hp-hero">
      <div className="hp-hero__overlay" />
      <div className="hp-container hp-hero__content">
        <p className="hp-pill hp-animate" style={{ '--delay': '0ms' }}>
          <span aria-hidden="true">&#10022;</span> AI-Powered Campus Operations Platform
        </p>

        <h1 className="hp-animate" style={{ '--delay': '120ms' }}>
          Your Campus,
          <span> Simplified.</span>
        </h1>

        <p className="hp-hero__lead hp-animate" style={{ '--delay': '220ms' }}>
          Book resources in seconds, report maintenance issues instantly, and keep up with campus updates in one
          connected hub designed for students.
        </p>

        <div className="hp-hero__actions hp-animate" style={{ '--delay': '340ms' }}>
          <Button to="/login" variant="cta">Book a Resource &rarr;</Button>
          <Button to="/login" variant="ghost">Report an Issue &rarr;</Button>
        </div>

        <div className="hp-trust hp-animate" style={{ '--delay': '460ms' }}>
          {TRUST_POINTS.map((point) => (
            <p key={point}>
              <span aria-hidden="true">&#10003;</span> {point}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
