import { useEffect, useMemo, useRef, useState } from 'react';

const STEPS = [
  {
    number: 1,
    icon: 'ðŸ”',
    title: 'Search or Report',
    text: 'Find the resource you need or report a maintenance issue in under a minute.',
  },
  {
    number: 2,
    icon: 'ðŸ¤–',
    title: 'We Match and Notify',
    text: 'Smart routing directs your request to the right team while notifications keep you updated.',
  },
  {
    number: 3,
    icon: 'âœ…',
    title: 'Done',
    text: 'Get confirmation, check status, and move forward without waiting in queues.',
  },
];

function AnimatedNumber({ value, start }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!start) return;

    let frame;
    const duration = 450;
    const startTime = performance.now();

    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [start, value]);

  return <span>{display}</span>;
}

export default function HowItWorks() {
  const [startCount, setStartCount] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartCount(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  const steps = useMemo(() => STEPS, []);

  return (
    <section id="bookings" className="hp-section" ref={sectionRef}>
      <div className="hp-container">
        <header className="hp-section__header hp-section__header--center">
          <h2>Get things done in 3 steps</h2>
          <p>From request to resolution, every action is guided and trackable.</p>
        </header>

        <div className="hp-steps">
          {steps.map((step) => (
            <article key={step.number} className="hp-step-card">
              <div className="hp-step-card__icon" aria-hidden="true">{step.icon}</div>
              <div className="hp-step-card__badge" aria-label={`Step ${step.number}`}>
                <AnimatedNumber value={step.number} start={startCount} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
