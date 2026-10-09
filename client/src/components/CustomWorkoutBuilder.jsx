import { targetText } from '../targets.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { readDraft, writeDraft, removeDraft, newRequestId } from '../drafts.js';
import { useUnsavedWarning } from './useUnsavedWarning.js';
import { api } from '../api.js';
import { Button } from './Button.jsx';
import { ErrorNotice } from './ErrorNotice.jsx';

const drillFilters = [
  { value: 'all', label: 'All drills' },
  { value: 'on_court', label: 'On court' },
  { value: 'off_court', label: 'Off court' },
  { value: 'recovery', label: 'Recovery' },
];


export function CustomWorkoutBuilder({ drills, workout = null, onCancel, onSaved, onBusyChange }) {
  const { user } = useAuth();
  const draftKey = `hooproutine:draft:builder:${user.id}:${workout?.id || 'new'}`;
  const [saved] = useState(() => readDraft(draftKey, {}));
  const isEditing = Boolean(workout);
  const [title, setTitle] = useState(typeof saved?.title === 'string' ? saved.title : workout?.title || '');
  const [selectedIds, setSelectedIds] = useState(
    Array.isArray(saved?.selectedIds) ? saved.selectedIds.filter((id) => drills.some((drill) => drill.id === id)) : workout?.drills.map((drill) => drill.id) || [],
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [drillFilter, setDrillFilter] = useState('all');
  const pending = useRef(saved?.pending || null);
  const busy = useRef(false);
  const dirty = title !== (workout?.title || '') || JSON.stringify(selectedIds) !== JSON.stringify(workout?.drills.map((drill) => drill.id) || []);
  useUnsavedWarning(dirty);
  useEffect(() => {
    if (!writeDraft(draftKey, { title, selectedIds, pending: pending.current })) setError('Draft storage is unavailable. Keep this page open until saved.');
  }, [draftKey, title, selectedIds]);

  const drillById = useMemo(
    () => new Map(drills.map((drill) => [drill.id, drill])),
    [drills],
  );
  const selectedDrills = selectedIds.map((id) => drillById.get(id)).filter(Boolean);
  const visibleDrills = useMemo(
    () => drills.filter(
      (drill) => drillFilter === 'all' || drill.trainingType === drillFilter,
    ),
    [drillFilter, drills],
  );
  const categories = useMemo(() => {
    const grouped = new Map();
    for (const drill of visibleDrills) {
      const list = grouped.get(drill.category) || [];
      list.push(drill);
      grouped.set(drill.category, list);
    }
    return [...grouped.entries()];
  }, [visibleDrills]);

  function toggleDrill(drillId) {
    setError('');
    setSelectedIds((current) => {
      if (current.includes(drillId)) return current.filter((id) => id !== drillId);
      return [...current, drillId];
    });
  }

  function selectAllDrills() {
    setError('');
    setSelectedIds(drills.map((drill) => drill.id));
  }

  function clearDrills() {
    setError('');
    setSelectedIds([]);
  }

  function moveDrill(index, direction) {
    setSelectedIds((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function createWorkout(event) {
    event.preventDefault();
    if (busy.current) return;
    if (selectedIds.length === 0) {
      setError('Choose at least one drill.');
      return;
    }

    const payload = JSON.stringify({ title, drillIds: selectedIds });
    if (pending.current?.payload !== payload) pending.current = { payload, requestId: newRequestId() };
    writeDraft(draftKey, { title, selectedIds, pending: pending.current });
    busy.current = true;
    setSaving(true);
    onBusyChange?.(true);
    setError('');
    try {
      const data = await api(isEditing ? `/workouts/${workout.id}` : '/workouts/custom', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({ title, drillIds: selectedIds, requestId: pending.current.requestId }),
      });
      removeDraft(draftKey);
      onSaved(data.workout, workout?.id || null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      busy.current = false;
      setSaving(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section className="custom-builder" aria-labelledby="custom-builder-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{isEditing ? 'Edit custom workout' : 'Custom workout'}</span>
          <h2 id="custom-builder-title">{isEditing ? 'Customize your saved session' : 'Build your own session'}</h2>
          <p>Choose as many drills as you want, or select the entire library, then arrange your training order.</p>
        </div>
        <button type="button" className="text-button" disabled={saving} onClick={onCancel}>Close builder</button>
      </div>

      <form className="builder-form" onSubmit={createWorkout}>
        <fieldset className="builder-fields" disabled={saving}>
        <p className="field-hint">Your draft is kept in this browser tab when you switch routines.</p>
        <label className="field">
          <span className="field-label">Workout name</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Saturday Shooting"
            maxLength="80"
            minLength="3"
            required
          />
          <span className="field-hint">Use a name between 3 and 80 characters.</span>
        </label>

        <div className="builder-columns">
          <div className="drill-library">
            <div className="builder-subheading">
              <h3>Drill library</h3>
              <div className="builder-selection-actions">
                <span>{selectedIds.length} of {drills.length} selected</span>
                <button type="button" className="text-button" onClick={selectAllDrills}>Select all</button>
                {selectedIds.length > 0 && (
                  <button type="button" className="text-button" onClick={clearDrills}>Clear</button>
                )}
              </div>
            </div>
            <div className="builder-filters" aria-label="Filter drills by training type">
              {drillFilters.map((filter) => (
                <button
                  type="button"
                  className={drillFilter === filter.value ? 'builder-filter--active' : ''}
                  aria-pressed={drillFilter === filter.value}
                  key={filter.value}
                  onClick={() => setDrillFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {categories.map(([category, categoryDrills]) => (
              <fieldset className="drill-category" key={category}>
                <legend>{category}</legend>
                <div className="library-grid">
                  {categoryDrills.map((drill) => {
                    const selected = selectedIds.includes(drill.id);
                    return (
                      <label className={`library-drill ${selected ? 'library-drill--selected' : ''}`} key={drill.id}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDrill(drill.id)}
                        />
                        <span>
                          <strong>{drill.name}</strong>
                          <small>{targetText(drill)}</small>
                          {drill.equipment && (
                            <small className="library-equipment">Equipment: {drill.equipment}</small>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          <aside className="selected-plan" aria-label="Selected drill order">
            <div className="builder-subheading">
              <h3>Your order</h3>
              <span>{selectedDrills.length} drills</span>
            </div>
            {selectedDrills.length === 0 ? (
              <p className="builder-empty">Select drills from the library to build your plan.</p>
            ) : (
              <ol>
                {selectedDrills.map((drill, index) => (
                  <li key={drill.id}>
                    <span className="selected-position">{String(index + 1).padStart(2, '0')}</span>
                    <span className="selected-copy">
                      <strong>{drill.name}</strong>
                      <small>{drill.category}</small>
                    </span>
                    <span className="order-buttons">
                      <button
                        type="button"
                        onClick={() => moveDrill(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${drill.name} earlier`}
                      >↑</button>
                      <button
                        type="button"
                        onClick={() => moveDrill(index, 1)}
                        disabled={index === selectedDrills.length - 1}
                        aria-label={`Move ${drill.name} later`}
                      >↓</button>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>

        <ErrorNotice message={error} />
        <div className="builder-actions">
          <Button type="submit" disabled={saving || selectedIds.length === 0}>
            {saving ? 'Saving routine…' : isEditing ? 'Save changes' : 'Save custom workout'}
          </Button>
          <button type="button" className="text-button" onClick={onCancel}>Close and keep draft</button>
        </div>
        </fieldset>
      </form>
    </section>
  );
}
