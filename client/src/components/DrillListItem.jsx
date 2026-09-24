function targetText(drill) {
  const parts = [];
  if (drill.targetMakes !== null && drill.targetMakes !== undefined) parts.push(`${drill.targetMakes} makes`);
  if (drill.targetAttempts !== null && drill.targetAttempts !== undefined) parts.push(`${drill.targetAttempts} attempts`);
  if (drill.targetRepetitions !== null && drill.targetRepetitions !== undefined) parts.push(`${drill.targetRepetitions} rounds`);
  if (drill.targetSeconds) parts.push(`${Math.round(drill.targetSeconds / 60)} min`);
  return parts.join(' · ');
}

export function DrillListItem({ drill, active = false, completed = false }) {
  return (
    <article className={`drill-item ${active ? 'drill-item--active' : ''}`}>
      <div className="drill-number" aria-hidden="true">
        {completed ? '✓' : String(drill.position).padStart(2, '0')}
      </div>
      <div className="drill-copy">
        <span className="category-label">{drill.category}</span>
        <h3>{drill.name}</h3>
        <p>{targetText(drill)}</p>
      </div>
      <span className="drill-arrow" aria-hidden="true">→</span>
    </article>
  );
}

