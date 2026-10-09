import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formResult, readDraft, writeDraft, removeDraft, withoutDraft } from '../drafts.js';
import { useUnsavedWarning } from '../components/useUnsavedWarning.js';
import { Button } from '../components/Button.jsx';
import { DrillListItem } from '../components/DrillListItem.jsx';
import { DrillInstructions } from '../components/DrillInstructions.jsx';
import { DrillResultForm } from '../components/DrillResultForm.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { ProgressBar } from '../components/ProgressBar.jsx';
import { formatElapsedClock, formatWorkoutTime } from '../time.js';

export function WorkoutPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  return <WorkoutSession key={user.id + ':' + sessionId} sessionId={sessionId} userId={user.id} />;
}

function WorkoutSession({ sessionId, userId }) {
  const draftKey = 'hooproutine:draft:session:' + userId + ':' + sessionId;
  const [session, setSession] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drafts, setDrafts] = useState(() => {
    const saved = readDraft(draftKey, {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [loadAttempt, setLoadAttempt] = useState(0);
  const busy = useRef(false);
  const navigate = useNavigate();
  useUnsavedWarning(Object.keys(drafts).length > 0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api('/sessions/' + sessionId, { signal: controller.signal }).then(({ session: loaded }) => {
      if (controller.signal.aborted) return;
      if (loaded.status === 'completed') {
        removeDraft(draftKey); navigate('/summary/' + sessionId, { replace: true }); return;
      }
      setSession(loaded);
      const next = loaded.drills.findIndex((drill) => !drill.result.completed);
      setActiveIndex(next < 0 ? loaded.drills.length - 1 : next);
    }).catch((failure) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [draftKey, navigate, sessionId, loadAttempt]);
  useEffect(() => {
    if (!writeDraft(draftKey, drafts)) setError('This browser cannot keep drafts after leaving this page. Save each drill before leaving.');
  }, [draftKey, drafts]);
  useEffect(() => {
    if (!session?.startedAt || session.status !== 'in_progress') return undefined;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session?.startedAt, session?.status]);
  const activeDrill = session?.drills[activeIndex];
  const result = formResult(drafts[activeDrill?.id] || activeDrill?.result);
  const completedCount = useMemo(() => session?.drills.filter((drill) => drill.result.completed).length || 0, [session]);
  const elapsedSeconds = session?.startedAt ? Math.max(0, Math.floor((clockNow - new Date(session.startedAt).getTime()) / 1000)) : 0;
  function setResult(value) { setDrafts((current) => ({ ...current, [activeDrill.id]: value })); }
  function chooseDrill(index) { if (!busy.current) { setActiveIndex(index); setError(''); } }
  async function cancelWorkout() {
    if (busy.current || !window.confirm('Cancel this workout? Its recorded results and local drafts will be deleted.')) return;
    busy.current = true; setCancelling(true); setError('');
    try {
      await api('/sessions/' + sessionId, { method: 'DELETE' });
      removeDraft(draftKey); navigate('/today', { replace: true });
    } catch (failure) {
      if (failure.status === 404) { removeDraft(draftKey); navigate('/today', { replace: true }); }
      else setError(failure.message);
    } finally { busy.current = false; setCancelling(false); }
  }
  async function saveResult(event) {
    event.preventDefault();
    if (busy.current) return;
    const index = activeIndex;
    const drillId = activeDrill.id;
    const finishing = index === session.drills.length - 1 && event.nativeEvent.submitter?.value !== 'save-progress';
    if (finishing && Object.keys(drafts).some((id) => Number(id) !== drillId && session.drills.some((drill) => drill.id === Number(id)))) {
      setError('Save your edited drills before finishing. Drafts are marked in the drill list.'); return;
    }
    const finished = session.drills.filter((drill) => drill.id === drillId ? result.completed : drill.result.completed).length;
    if (finishing && finished < session.drills.length && !window.confirm('Finish with ' + finished + ' of ' + session.drills.length + ' drills completed? The other drills will remain incomplete.')) return;
    busy.current = true; setSaving(true); setError('');
    try {
      if (finishing) {
        await api('/sessions/' + sessionId + '/complete', { method: 'POST', body: JSON.stringify({ finalResult: { drillId, result } }) });
        removeDraft(draftKey); navigate('/summary/' + sessionId); return;
      }
      const data = await api('/sessions/' + sessionId + '/drills/' + drillId, { method: 'PATCH', body: JSON.stringify(result) });
      setSession((current) => ({ ...current, drills: current.drills.map((drill) => drill.id === drillId ? { ...drill, result: data.result } : drill) }));
      setDrafts((current) => withoutDraft(current, drillId));
      setActiveIndex(Math.min(index + 1, session.drills.length - 1));
    } catch (failure) {
      setError(failure.message);
      if (!failure.status || failure.status >= 500 || failure.status === 409) {
        try {
          const data = await api('/sessions/' + sessionId);
          if (data.session.status === 'completed') { removeDraft(draftKey); navigate('/summary/' + sessionId); }
          else setSession(data.session);
        } catch { /* Keep the draft and original error for a safe retry. */ }
      }
    } finally { busy.current = false; setSaving(false); }
  }

  if (!session && !error) return <LoadingScreen label="Opening your workout" />;
  if (!session) return <div className="page"><ErrorNotice message={error} /><Button onClick={() => setLoadAttempt((count) => count + 1)}>Retry opening workout</Button></div>;

  return (
    <div className="page workout-page">
      <header className="workout-header">
        <div>
          <span className="eyebrow">Active workout</span>
          <h1>{session.title}</h1>
          <div className="session-timing" aria-label="Whole workout timing">
            <div>
              <span>Started</span>
              <strong>{formatWorkoutTime(session.startedAt)}</strong>
            </div>
            <div>
              <span>Elapsed</span>
              <strong className="session-clock">{formatElapsedClock(elapsedSeconds)}</strong>
            </div>
          </div>
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
            <button key={drill.id} type="button" disabled={saving || cancelling} aria-current={index === activeIndex ? 'step' : undefined} onClick={() => chooseDrill(index)}>
              <DrillListItem drill={drill} active={index === activeIndex} completed={drill.result.completed} />
              {drafts[drill.id] && <span className="draft-label">Unsaved draft</span>}
            </button>
          ))}
        </aside>

        <section className="active-drill-panel">
          <div className="active-drill-copy">
            <span className="pill">{activeDrill.category}</span>
            <p className="drill-step">Drill {activeIndex + 1} of {session.drills.length}</p>
            <h2>{activeDrill.name}</h2>
            <DrillInstructions instructions={activeDrill.instructions} dark />
            <div className="active-drill-targets">
              {activeDrill.targetMakes !== null && <span><strong>Makes</strong>{activeDrill.targetMakes}</span>}
              {activeDrill.targetAttempts !== null && <span><strong>Attempts</strong>{activeDrill.targetAttempts}</span>}
              {activeDrill.targetRepetitions !== null && <span><strong>Rounds</strong>{activeDrill.targetRepetitions}</span>}
              {activeDrill.targetSeconds && <span><strong>Time guide</strong>{Math.round(activeDrill.targetSeconds / 60)} min</span>}
              {activeDrill.equipment && <span><strong>Equipment</strong>{activeDrill.equipment}</span>}
            </div>
          </div>
          <p className="field-hint">Edited results stay in this browser tab until saved, cancelled, or logged out.</p>
          <DrillResultForm
            shooting={activeDrill.targetAttempts != null}
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
