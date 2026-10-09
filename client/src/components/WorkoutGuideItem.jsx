import { targetText } from '../targets.js';
import { DrillInstructions } from './DrillInstructions.jsx';


export function WorkoutGuideItem({ drill, expanded, onToggle }) {
  const detailsId = `workout-guide-${drill.id}`;

  return (
    <article className={`workout-guide-item ${expanded ? 'workout-guide-item--open' : ''}`}>
      <button
        type="button"
        className="workout-guide-summary"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
      >
        <span className="drill-number" aria-hidden="true">
          {String(drill.position).padStart(2, '0')}
        </span>
        <span className="workout-guide-copy">
          <span className="category-label">{drill.category}</span>
          <strong>{drill.name}</strong>
          <small>{targetText(drill)}</small>
        </span>
        <span className="workout-guide-arrow" aria-hidden="true">⌄</span>
      </button>

      {expanded && (
        <div className="workout-guide-details" id={detailsId}>
          <span className="eyebrow">How to do it</span>
          <DrillInstructions instructions={drill.instructions} />
          <div className="workout-guide-facts">
            <span><strong>Target</strong>{targetText(drill)}</span>
            <span><strong>Equipment</strong>{drill.equipment || 'Equipment not specified; check the instructions.'}</span>
          </div>
        </div>
      )}
    </article>
  );
}
