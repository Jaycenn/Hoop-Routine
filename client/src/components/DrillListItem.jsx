import { targetText } from '../targets.js';

export function DrillListItem({ drill, active = false, completed = false }) {
  return (
    <article className={`drill-item ${active ? 'drill-item--active' : ''}`}>
      <div className="drill-number" aria-hidden="true">
        {completed ? '✓' : String(drill.position).padStart(2, '0')}
      </div>
      <div className="drill-copy">
        <span className="category-label">{drill.category}</span>
        <h3>{drill.name}</h3>
        <span className="sr-only">{completed ? 'Completed. ' : 'Not completed. '}{active ? 'Current drill.' : ''}</span>
        <p>{targetText(drill)}</p>
      </div>
      <span className="drill-arrow" aria-hidden="true">→</span>
    </article>
  );
}

