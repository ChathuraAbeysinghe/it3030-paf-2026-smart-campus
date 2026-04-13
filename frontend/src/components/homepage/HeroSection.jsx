import Button from './Button';
import { SectionIcons } from './Icons';

export default function HeroSection() {
  return (
    <section id="home" className="hp-hero">
      <div className="hp-hero__overlay" />
      <div className="hp-container hp-hero__content">
        <div className="hp-pill">
          <span>{SectionIcons.check}</span>
          AI-Powered Campus Operations Platform
        </div>

        <h1>
          Your Campus,
          <span> Simplified.</span>
        </h1>

        <p>
          Book resources, report issues, and stay updated from one place.
          Built for fast, student-friendly campus operations.
        </p>

        <div className="hp-hero__cta">
          <Button to="/login" variant="cta">Book a Resource →</Button>
          <Button to="/login" variant="ghost">Report an Issue →</Button>
        </div>

        <div className="hp-trust-row">
          <span><strong>✓</strong> Free for all students</span>
          <span><strong>✓</strong> AI-powered matching</span>
          <span><strong>✓</strong> Secure and verified</span>
        </div>
      </div>
    </section>
  );
}
