import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/Button.jsx';
import { DrillListItem } from '../components/DrillListItem.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function TodayPage() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api('/workouts/today')
      .then((data) => setWorkout(data.workout))
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function startWorkout() {
    setStarting(true);
    setError('');
    try {
      const data = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ workoutId: workout.id }),
      });
      navigate(`/workout/${data.sessionId}`);
    } catch (requestError) {
      setError(requestError.message);
      setStarting(false);
    }
  }

  if (!workout && !error) return <LoadingScreen label="Loading today’s plan" />;

  return (
    <div className="page page--today">
      <header className="page-heading">
        <span className="eyebrow">Good day, {user?.name?.split(' ')[0]}</span>
        <h1>Ready to put in the work?</h1>
        <p>Your session is planned. All that is left is to start.</p>
      </header>

      {searchParams.get('completed') === '1' && (
        <div className="success-notice" role="status">
          Workout saved. A detailed summary will be added in the next development increment.
        </div>
      )}
      <ErrorNotice message={error} />
      {workout && (
        <div className="today-grid">
          <section className="workout-hero">
            <div className="workout-hero-top">
              <span className="pill">Today’s workout</span>
              <span>{workout.difficulty}</span>
            </div>
            <div>
              <span className="eyebrow eyebrow--light">{workout.focus}</span>
              <h2>{workout.title}</h2>
              <p>{workout.description}</p>
            </div>
            <div className="workout-meta">
              <div><strong>{workout.estimatedMinutes}</strong><span>Minutes</span></div>
              <div><strong>{workout.drills.length}</strong><span>Drills</span></div>
            </div>
            <Button className="hero-button" onClick={startWorkout} disabled={starting}>
              {starting ? 'Preparing…' : 'Start workout'}
            </Button>
          </section>

          <section className="drill-panel" aria-labelledby="drill-list-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">The plan</span>
                <h2 id="drill-list-title">Today’s drills</h2>
              </div>
              <span className="section-count">{workout.drills.length} total</span>
            </div>
            <div className="drill-list">
              {workout.drills.map((drill) => <DrillListItem key={drill.id} drill={drill} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
