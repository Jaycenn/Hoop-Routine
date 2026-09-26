import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/Button.jsx';
import { DrillListItem } from '../components/DrillListItem.jsx';
import { DrillResultForm } from '../components/DrillResultForm.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';

const emptyResult = {
  makes: '', attempts: '', repetitions: '', timeSeconds: '', completed: false, notes: '',
};

function formResult(result) {
  return {
    makes: result.makes ?? '',
    attempts: result.attempts ?? '',
    repetitions: result.repetitions ?? '',
    timeSeconds: result.timeSeconds ?? '',
    completed: Boolean(result.completed),
    notes: result.notes || '',
  };
}

export function WorkoutPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [result, setResult] = useState(emptyResult);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const loadSession = useCallback(async () => {
    const data = await api(`/sessions/${sessionId}`);
    setSession(data.session);
    if (data.session.status === 'completed') {
      navigate(`/summary/${sessionId}`, { replace: true });
      return;
    }
    const nextIndex = data.session.drills.findIndex((drill) => !drill.result.completed);
    setActiveIndex(nextIndex === -1 ? data.session.drills.length - 1 : nextIndex);
  }, [navigate, sessionId]);

  useEffect(() => {
    loadSession().catch((requestError) => setError(requestError.message));
  }, [loadSession]);

  const activeDrill = session?.drills[activeIndex];
  const completedCount = useMemo(
    () => session?.drills.filter((drill) => drill.result.completed).length || 0,
    [session],
  );

  useEffect(() => {
    setResult(activeDrill ? formResult(activeDrill.result) : emptyResult);
    setError('');
  }, [activeDrill]);

  function chooseDrill(index) {
    setActiveIndex(index);
  }

  async function cancelWorkout() {
    const confirmed = window.confirm(
      'Cancel this workout? The session and any results already entered will be deleted.',
    );
    if (!confirmed) return;

    setCancelling(true);
    setError('');
    try {
      await api(`/sessions/${sessionId}`, { method: 'DELETE' });
      navigate('/today', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setCancelling(false);
    }
  }

  async function saveResult(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/sessions/${sessionId}/drills/${activeDrill.id}`, {
        method: 'PATCH',
        body: JSON.stringify(result),
      });

      const isLast = activeIndex === session.drills.length - 1;
      if (isLast) {
        await api(`/sessions/${sessionId}/complete`, { method: 'POST' });
        navigate(`/summary/${sessionId}`);
        return;
      }

      const data = await api(`/sessions/${sessionId}`);
      setSession(data.session);
      setActiveIndex((current) => Math.min(current + 1, data.session.drills.length - 1));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (!session && !error) return <LoadingScreen label="Opening your workout" />;
  if (!session) return <div className="page"><ErrorNotice message={error} /></div>;

  return (
    <div className="page workout-page">
      <header className="workout-header">
        <div>
          <span className="eyebrow">Active workout</span>
          <h1>{session.title}</h1>
        </div>
        <div className="workout-header-actions">
          <ProgressBar current={completedCount} total={session.drills.length} />
          <Button
            type="button"
            variant="danger"
            onClick={cancelWorkout}
            disabled={saving || cancelling}
          >
            {cancelling ? 'Cancelling…' : 'Cancel workout'}
          </Button>
        </div>
      </header>

      <div className="active-layout">
        <aside className="workout-sidebar" aria-label="Workout drills">
          {session.drills.map((drill, index) => (
            <button key={drill.id} type="button" onClick={() => chooseDrill(index)}>
              <DrillListItem drill={drill} active={index === activeIndex} completed={drill.result.completed} />
            </button>
          ))}
        </aside>

        <section className="active-drill-panel">
          <div className="active-drill-copy">
            <span className="pill">{activeDrill.category}</span>
            <p className="drill-step">Drill {activeIndex + 1} of {session.drills.length}</p>
            <h2>{activeDrill.name}</h2>
            <p>{activeDrill.instructions}</p>
          </div>
          <DrillResultForm
            value={result}
            onChange={setResult}
            onSubmit={saveResult}
            saving={saving || cancelling}
            error={error}
            isLast={activeIndex === session.drills.length - 1}
          />
        </section>
      </div>
    </div>
  );
}
