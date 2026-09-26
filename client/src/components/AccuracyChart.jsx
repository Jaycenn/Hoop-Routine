export function AccuracyChart({ sessions }) {
  if (!sessions.some((session) => session.accuracy !== null)) {
    return <p className="muted">Record shooting attempts to see your accuracy trend.</p>;
  }

  return (
    <div className="accuracy-chart" aria-label="Shooting accuracy by recent workout">
      {sessions.map((session, index) => {
        const accuracy = session.accuracy || 0;
        return (
          <div className="chart-column" key={session.id}>
            <span className="chart-value">{session.accuracy === null ? '—' : `${accuracy}%`}</span>
            <div className="chart-track">
              <span style={{ height: `${Math.max(4, accuracy)}%` }} />
            </div>
            <span className="chart-label">W{index + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
