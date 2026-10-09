import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { shootingTotals } from '../drafts.js';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Button } from '../components/Button.jsx';
import { formatWorkoutDuration, formatWorkoutTime } from '../time.js';

export function SummaryPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    setSession(null);
    api(`/sessions/${sessionId}`)
      .then((data) => {
        if (!active) return;
        setSession(data.session);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [sessionId, loadAttempt]);

  const stats = useMemo(() => {
    if (!session) return null;
    const result = shootingTotals(session.drills);
    return {
      ...result,
      accuracy: result.attempts > 0 ? Math.round((result.makes / result.attempts) * 100) : null,
    };
  }, [session]);

  if (!session && !error) return <LoadingScreen label="Building your summary" />;
  if (!session) return <div className="page"><ErrorNotice message={error} /><Button onClick={() => setLoadAttempt((count) => count + 1)}>Retry loading summary</Button></div>;

  if (session.status !== 'completed') return <Navigate to={'/workout/' + sessionId} replace />;
  return (
    <div className="page summary-page">
      <header className="summary-hero">
        <span className="eyebrow eyebrow--light">Workout complete</span>
        <h1>Work logged.<br />Progress earned.</h1>
        <p>{session.title}</p>
        <div className="summary-score">
          <strong>{stats.accuracy === null ? '—' : `${stats.accuracy}%`}</strong>
          <span>Overall shooting accuracy</span>
        </div>
      </header>

      <section className="summary-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Your results</span>
            <h2>Session at a glance</h2>
          </div>
        </div>
        <div className="stats-grid">
          <StatCard label="Drills completed" value={`${stats.completed}/${session.drills.length}`} />
          <StatCard label="Started" value={formatWorkoutTime(session.startedAt)} />
          <StatCard label="Finished" value={formatWorkoutTime(session.completedAt)} />
          <StatCard label="Total workout time" value={formatWorkoutDuration(session.totalSeconds)} />
          <StatCard label="Shots made" value={stats.makes} detail={`${stats.attempts} attempts`} />
          <StatCard label="Rounds recorded" value={stats.repetitions} />
        </div>

        <div className="result-list">
          {session.drills.map((drill) => (
            <article className="result-row" key={drill.id}>
              <div>
                <span className="category-label">{drill.category}</span>
                <h3>{drill.name}</h3>
                {drill.result.notes && <p>{drill.result.notes}</p>}
              </div>
              <div className="result-values">
                {drill.result.attempts !== null && <span><strong>{drill.result.makes || 0}/{drill.result.attempts}</strong> shooting</span>}
                {drill.result.repetitions !== null && <span><strong>{drill.result.repetitions}</strong> rounds</span>}
              </div>
            </article>
          ))}
        </div>

        <div className="action-row">
          <Link to="/progress" className="button button--primary">View progress</Link>
          <Link to="/today" className="inline-link">Back to today</Link>
        </div>
      </section>
    </div>
  );
}
