import { Link } from 'react-router-dom';

export function PlannedPage({ title, description }) {
  return (
    <div className="page narrow-page">
      <section className="planned-panel">
        <span className="eyebrow">Planned for Week 2</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button--primary" to="/today">Back to today</Link>
      </section>
    </div>
  );
}
