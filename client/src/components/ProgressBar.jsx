export function ProgressBar({ current, total, label = 'Workout progress' }) {
  const value = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <span>{current} of {total}</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

