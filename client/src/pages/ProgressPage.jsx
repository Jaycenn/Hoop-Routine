import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { AccuracyChart } from '../components/AccuracyChart.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { StatCard } from '../components/StatCard.jsx';

export function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    api('/progress')
      .then((data) => {
        if (!active) return;
        setProgress(data.progress);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!progress && !error) return <LoadingScreen label="Calculating your progress" />;
  if (!progress) return <div className="page"><ErrorNotice message={error} /></div>;

  return (
    <div className="page narrow-page">
      <header className="page-heading">
        <span className="eyebrow">Progress</span>
        <h1>Your work, in numbers.</h1>
        <p>Use your results to see what is improving and where to focus next.</p>
      </header>

      {progress.totalWorkouts === 0 ? (
        <EmptyState title="Complete a workout to unlock progress.">
          Your shooting accuracy, completed drills, and training time will appear here.
        </EmptyState>
      ) : (
        <>
          <section className="stats-grid progress-stats" aria-label="Progress overview">
            <StatCard label="Workouts" value={progress.totalWorkouts} />
            <StatCard label="Training time" value={`${progress.totalMinutes} min`} />
            <StatCard label="Completed drills" value={progress.completedDrills} />
            <StatCard label="Shooting accuracy" value={progress.accuracy === null ? '—' : `${progress.accuracy}%`} detail={`${progress.makes}/${progress.attempts} shots`} />
          </section>

          <section className="progress-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Recent workouts</span>
                <h2>Accuracy trend</h2>
              </div>
            </div>
            <AccuracyChart sessions={progress.recentSessions} />
          </section>

          <section className="progress-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">By drill type</span>
                <h2>Category results</h2>
              </div>
            </div>
            <div className="accuracy-rows">
              {progress.categories.map((category) => (
                <div className="accuracy-row" key={category.category}>
                  <div>
                    <strong>{category.category}</strong>
                    <span>{category.completed} drills completed</span>
                  </div>
                  <strong>{category.accuracy === null ? 'Recorded' : `${category.accuracy}%`}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
