import { Link } from 'react-router-dom';
import { formatWorkoutDate, formatWorkoutDuration, formatWorkoutTime } from '../time.js';

export function HistoryListItem({ session }) {
  const content = (
    <>
      <div>
        <span className="category-label">{formatWorkoutDate(session.completedAt || session.startedAt)}</span>
        <h3>{session.title}</h3>
        {session.status === 'completed' ? (
          <p>
            {session.completedDrills} drills · Started {formatWorkoutTime(session.startedAt)} · Finished {formatWorkoutTime(session.completedAt)} · {formatWorkoutDuration(session.totalSeconds)}
          </p>
        ) : (
          <p>{session.completedDrills} drills completed · Started {formatWorkoutTime(session.startedAt)} · In progress</p>
        )}
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
