import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { Button } from '../components/Button.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { HistoryListItem } from '../components/HistoryListItem.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';

export function HistoryPage() {
  const [sessions, setSessions] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const loadPage = useCallback(async (cursor = null, signal) => {
    if (busy.current && !signal) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const data = await api('/sessions' + (cursor ? '?before=' + encodeURIComponent(cursor) : ''), { signal });
      if (signal?.aborted) return;
      setSessions((current) => cursor ? [...new Map([...(current || []), ...data.sessions].map((row) => [row.id, row])).values()] : data.sessions);
      setNextCursor(data.nextCursor);
    } catch (failure) { if (!signal?.aborted) setError(failure.message); }
    finally { busy.current = false; if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    loadPage(null, controller.signal);
    return () => controller.abort();
  }, [loadPage]);
  if (!sessions && !error) return <LoadingScreen label="Loading workout history" />;
  return (
    <div className="page narrow-page">
      <header className="page-heading">
        <span className="eyebrow">Workout history</span>
        <h1>Every session counts.</h1>
        <p>Review your completed workouts and continue anything unfinished.</p>
      </header>
      <ErrorNotice message={error} />
      {!sessions && error && <Button disabled={loading} onClick={() => loadPage()}>Retry history</Button>}
      {sessions?.length === 0 ? (
        <EmptyState title="Your history starts with today’s workout.">Start a session and it will appear here.</EmptyState>
      ) : (
        <section className="history-list" aria-label="Workout sessions" aria-busy={loading}>
          {sessions?.map((session) => <HistoryListItem key={session.id} session={session} />)}
        </section>
      )}
      {nextCursor && <Button disabled={loading} onClick={() => loadPage(nextCursor)}>{loading ? 'Loading…' : 'Load older sessions'}</Button>}
    </div>
  );
}
