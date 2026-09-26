import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { HistoryListItem } from '../components/HistoryListItem.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';

export function HistoryPage() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    api('/sessions')
      .then((data) => {
        if (!active) return;
        setSessions(data.sessions);
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!sessions && !error) return <LoadingScreen label="Loading workout history" />;

  return (
    <div className="page narrow-page">
      <header className="page-heading">
        <span className="eyebrow">Workout history</span>
        <h1>Every session counts.</h1>
        <p>Review your completed workouts and continue anything unfinished.</p>
      </header>
      <ErrorNotice message={error} />
      {sessions?.length === 0 ? (
        <EmptyState title="Your history starts with today’s workout.">
          Complete your first session and it will appear here.
        </EmptyState>
      ) : (
        <section className="history-list" aria-label="Workout sessions">
          {sessions?.map((session) => <HistoryListItem key={session.id} session={session} />)}
        </section>
      )}
    </div>
  );
}
