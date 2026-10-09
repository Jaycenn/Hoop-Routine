import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/Button.jsx';
import { CustomWorkoutBuilder } from '../components/CustomWorkoutBuilder.jsx';
import { ErrorNotice } from '../components/ErrorNotice.jsx';
import { LoadingScreen } from '../components/LoadingScreen.jsx';
import { WorkoutGuideItem } from '../components/WorkoutGuideItem.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const workoutFilters = [
  { value: 'all', label: 'All' },
  { value: 'on_court', label: 'On court' },
  { value: 'off_court', label: 'Off court' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'mixed', label: 'Mixed' },
];

function trainingTypeLabel(value) {
  return workoutFilters.find((filter) => filter.value === value)?.label || 'Workout';
}

export function TodayPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState(null);
  const [drills, setDrills] = useState([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [workoutFilter, setWorkoutFilter] = useState('all');
  const [expandedDrillId, setExpandedDrillId] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [builderSaving, setBuilderSaving] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setError('');
    Promise.all([api('/workouts'), api('/workouts/drills')])
      .then(([workoutData, drillData]) => {
        if (!active) return;
        setWorkouts(workoutData.workouts);
        setDrills(drillData.drills);
        setSelectedWorkoutId(workoutData.workouts[0]?.id || null);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const visibleWorkouts = useMemo(
    () => workouts?.filter(
      (workout) => workoutFilter === 'all' || workout.trainingType === workoutFilter,
    ) || [],
    [workoutFilter, workouts],
  );

  const selectedWorkout = useMemo(
    () => visibleWorkouts.find((workout) => workout.id === selectedWorkoutId) || visibleWorkouts[0],
    [selectedWorkoutId, visibleWorkouts],
  );

  useEffect(() => {
    setExpandedDrillId(null);
  }, [selectedWorkout?.id]);

  async function startWorkout() {
    if (!selectedWorkout) return;
    setStarting(true);
    setError('');
    try {
      const data = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ workoutId: selectedWorkout.id }),
      });
      navigate(`/workout/${data.sessionId}`);
    } catch (requestError) {
      setError(requestError.message);
      setStarting(false);
    }
  }

  function closeBuilder() {
    setShowBuilder(false);
    setEditingWorkout(null);
  }

  function handleCustomSaved(workout, replacedWorkoutId) {
    setWorkouts((current) => (
      replacedWorkoutId
        ? current.map((item) => (item.id === replacedWorkoutId ? workout : item))
        : [...current, workout]
    ));
    setSelectedWorkoutId(workout.id);
    setWorkoutFilter('all');
    closeBuilder();
    setError('');
  }

  function editCustomWorkout() {
    if (!selectedWorkout?.canDelete) return;
    setEditingWorkout(selectedWorkout);
    setShowBuilder(true);
    setError('');
  }

  async function deleteCustomWorkout() {
    if (!selectedWorkout?.canDelete) return;
    const confirmed = window.confirm(
      `Delete “${selectedWorkout.title}” from your saved routines? Previous workout history will remain.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    try {
      await api(`/workouts/${selectedWorkout.id}`, { method: 'DELETE' });
      setWorkouts((current) => current.filter((workout) => workout.id !== selectedWorkout.id));
      setSelectedWorkoutId(workouts.find((workout) => workout.id !== selectedWorkout.id)?.id || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!workouts && !error) return <LoadingScreen label="Loading your workout choices" />;

  return (
    <div className="page page--today">
      <header className="page-heading page-heading--choices">
        <span className="eyebrow">Good day, {user?.name?.split(' ')[0]}</span>
        <h1>Choose today’s work.</h1>
        <p>Pick a focused plan or build a routine that is completely yours.</p>
      </header>

      <ErrorNotice message={error} />
      {error && !workouts && <Button onClick={() => setLoadAttempt((count) => count + 1)}>Retry loading workouts</Button>}

      {workouts && (
        <section className="workout-planner" aria-label="Choose and preview a workout">
          <aside className="planner-sidebar">
            <div className="planner-sidebar-heading">
              <div>
                <span className="eyebrow">Training options</span>
                <h2>Your workouts</h2>
              </div>
              <span>{visibleWorkouts.length}</span>
            </div>

            <div className="planner-filters" aria-label="Filter workouts by training type">
              {workoutFilters.map((filter) => (
                <button
                  type="button" disabled={builderSaving || starting || deleting}
                  className={workoutFilter === filter.value ? 'planner-filter--active' : ''}
                  aria-pressed={workoutFilter === filter.value}
                  key={filter.value}
                  onClick={() => {
                    setWorkoutFilter(filter.value);
                    setShowBuilder(false);
                    setEditingWorkout(null);
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="planner-options" role="group" aria-label="Workout options">
              {visibleWorkouts.map((workout) => {
                const selected = !showBuilder && selectedWorkout?.id === workout.id;
                return (
                  <button
                    type="button" disabled={builderSaving || starting || deleting}

                    aria-pressed={selected}
                    aria-controls="workout-planner-content"
                    className={`planner-option ${selected ? 'planner-option--active' : ''}`}
                    key={workout.id}
                    onClick={() => {
                      setSelectedWorkoutId(workout.id);
                      setShowBuilder(false);
                      setEditingWorkout(null);
                      setExpandedDrillId(null);
                    }}
                  >
                    <span>
                      {workout.source === 'custom' ? 'My routine' : trainingTypeLabel(workout.trainingType)}
                    </span>
                    <strong>{workout.title}</strong>
                    <small>{workout.drills.length} drills · {workout.estimatedMinutes} min</small>
                  </button>
                );
              })}
              {visibleWorkouts.length === 0 && (
                <p className="planner-empty">No workouts are available in this group yet.</p>
              )}
            </div>

            <button
              type="button" disabled={builderSaving || starting || deleting}
              aria-pressed={showBuilder && !editingWorkout}
              aria-controls="workout-planner-content"
              className={`planner-build ${showBuilder && !editingWorkout ? 'planner-build--active' : ''}`}
              onClick={() => {
                setEditingWorkout(null);
                setShowBuilder(true);
              }}
            >
              <span aria-hidden="true">＋</span>
              <span><strong>Build your own</strong><small>Choose a few drills or use them all</small></span>
            </button>
          </aside>

          <div className="planner-content" id="workout-planner-content" role="region" aria-label="Workout details">
            {showBuilder ? (
              <CustomWorkoutBuilder
                key={editingWorkout?.id || 'new-custom-workout'}
                drills={drills}
                workout={editingWorkout}
                onCancel={closeBuilder}
                onSaved={handleCustomSaved}
                onBusyChange={setBuilderSaving}
              />
            ) : selectedWorkout ? (
              <div className="planner-preview">
                <section className="workout-hero planner-hero">
                  <div className="workout-hero-top">
                    <span className="pill">
                      {trainingTypeLabel(selectedWorkout.trainingType)}
                    </span>
                    <span>{selectedWorkout.source === 'custom' ? 'Custom' : selectedWorkout.difficulty}</span>
                  </div>
                  <div>
                    <span className="eyebrow eyebrow--light">{selectedWorkout.focus}</span>
                    <h2>{selectedWorkout.title}</h2>
                    <p>{selectedWorkout.description}</p>
                    <p className="workout-equipment">
                      <strong>Equipment:</strong> {selectedWorkout.equipment || 'Check the drill instructions.'}
                    </p>
                  </div>
                  <div>
                    <div className="workout-meta">
                      <div><strong>{selectedWorkout.estimatedMinutes}</strong><span>Minutes</span></div>
                      <div><strong>{selectedWorkout.drills.length}</strong><span>Drills</span></div>
                    </div>
                    <div className="hero-actions">
                      <Button className="hero-button" onClick={startWorkout} disabled={starting || deleting}>
                        {starting ? 'Preparing…' : 'Start workout'}
                      </Button>
                      {selectedWorkout.canDelete && (
                        <>
                          <button
                            type="button" disabled={builderSaving || starting || deleting}
                            className="hero-edit"
                            onClick={editCustomWorkout}
                                                      >
                            Edit routine
                          </button>
                          <button
                            type="button" disabled={builderSaving || starting || deleting}
                            className="hero-delete"
                            onClick={deleteCustomWorkout}
                                                      >
                            {deleting ? 'Deleting…' : 'Delete routine'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </section>

                <section className="drill-panel planner-drills" aria-labelledby="drill-list-title">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">The plan</span>
                      <h2 id="drill-list-title">Workout drills</h2>
                      <p>Select a drill to see instructions before you begin.</p>
                    </div>
                    <span className="section-count">{selectedWorkout.drills.length} total</span>
                  </div>
                  <div className="drill-list">
                    {selectedWorkout.drills.map((drill) => (
                      <WorkoutGuideItem
                        key={drill.id}
                        drill={drill}
                        expanded={expandedDrillId === drill.id}
                        onToggle={() => setExpandedDrillId((current) => (
                          current === drill.id ? null : drill.id
                        ))}
                      />
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
