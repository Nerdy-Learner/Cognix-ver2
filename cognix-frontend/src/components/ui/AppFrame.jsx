export function PageHero({ eyebrow, title, description, meta = [], actions, aside }) {
  return (
    <section className="page-hero">
      <div className="page-hero-copy">
        <div className="page-eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
        {meta.length ? (
          <div className="page-meta-row">
            {meta.map((item) => (
              <div key={item.label} className="page-meta-chip">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>
      {aside ? <div className="page-hero-aside">{aside}</div> : null}
    </section>
  );
}

export function MetricTile({ label, value, detail, tone = "accent" }) {
  return (
    <div className={`metric-tile tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {detail ? <div className="metric-detail">{detail}</div> : null}
    </div>
  );
}

export function Surface({ className = "", children, ...props }) {
  return (
    <section className={`app-surface ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
