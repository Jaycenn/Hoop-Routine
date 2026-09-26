import { Link } from 'react-router-dom';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

export function HistoryListItem({ session }) {
  const content = (
    <>
      <div>
        <span className="category-label">{formatDate(session.completedAt || session.startedAt)}</span>
        <h3>{session.title}</h3>
        <p>{session.completedDrills} drills completed · {Math.round((session.totalSeconds || 0) / 60)} min</p>
      </div>
      <div className="history-score">
        <strong>{session.accuracy === null ? '—' : `${session.accuracy}%`}</strong>
        <span>Shooting</span>
      </div>
    </>
  );

  if (session.status === 'completed') {
    return <Link className="history-item" to={`/summary/${session.id}`}>{content}</Link>;
  }
  return <Link className="history-item history-item--open" to={`/workout/${session.id}`}>{content}</Link>;
}
