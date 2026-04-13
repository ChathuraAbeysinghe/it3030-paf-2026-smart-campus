const STEPS = [
  {
    icon: '🔎',
    title: 'Search or Report',
    text: 'Find resources instantly or submit any campus issue in seconds.',
  },
  {
    icon: '🤖',
    title: 'We Match and Notify',
    text: 'Smart routing sends your booking or issue to the right team quickly.',
  },
  {
    icon: '✅',
    title: 'Done',
    text: 'Track approvals and updates until your request is completed.',
  },
];

export default function HowItWorks() {
  return (
    <section id="bookings" className="hp-section hp-section--white">
      <div className="hp-container">
        <h2 className="hp-section-title hp-section-title--center">Get things done in 3 steps</h2>
        <div className="hp-steps">
          {STEPS.map((step, index) => (
            <article className="hp-step" key={step.title}>
              <div className="hp-step__icon-wrap">
                <span className="hp-step__icon">{step.icon}</span>
                <span className="hp-step__num">{index + 1}</span>
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
