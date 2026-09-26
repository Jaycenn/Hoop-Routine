import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/Button.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { StatCard } from '../components/StatCard.jsx';

export function SummaryPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
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
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!session) return null;
    const result = session.drills.reduce((total, drill) => ({
      completed: total.completed + (drill.result.completed ? 1 : 0),
      makes: total.makes + (drill.result.makes || 0),
      attempts: total.attempts + (drill.result.attempts || 0),
      repetitions: total.repetitions + (drill.result.repetitions || 0),
    }), { completed: 0, makes: 0, attempts: 0, repetitions: 0 });
    return {
      ...result,
      accuracy: result.attempts > 0 ? Math.round((result.makes / result.attempts) * 100) : null,
      minutes: Math.round((session.totalSeconds || 0) / 60),
    };
  }, [session]);

  if (!session && !error) return <LoadingScreen label="Building your summary" />;
  if (!session) return <div className="page"><ErrorNotice message={error} /></div>;

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
          <StatCard label="Time trained" value={`${stats.minutes} min`} />
          <StatCard label="Shots made" value={stats.makes} detail={`${stats.attempts} attempts`} />
          <StatCard label="Repetitions" value={stats.repetitions} />
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
                {drill.result.repetitions !== null && <span><strong>{drill.result.repetitions}</strong> reps</span>}
                {drill.result.timeSeconds !== null && <span><strong>{drill.result.timeSeconds}s</strong> time</span>}
              </div>
            </article>
          ))}
        </div>

        <div className="action-row">
          <Link to="/progress"><Button>View progress</Button></Link>
          <Link to="/today" className="inline-link">Back to today</Link>
        </div>
      </section>
    </div>
  );
}
