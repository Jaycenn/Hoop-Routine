import { Button } from './Button.jsx';
import { ErrorNotice } from './ErrorNotice.jsx';
import { NumberInput } from './NumberInput.jsx';

export function DrillResultForm({ value, onChange, onSubmit, saving, error, isLast, shooting = true }) {
  function set(field, nextValue) {
    onChange({ ...value, [field]: nextValue });
  }

  return (
    <form className="result-form" onSubmit={onSubmit}>
      <fieldset className="result-fields" disabled={saving}>
      <div className="result-grid">
        {(shooting || value.makes !== '' || value.attempts !== '') && <>
          <NumberInput label="Makes" value={value.makes} onChange={(event) => set('makes', event.target.value)} placeholder="0" />
          <NumberInput label="Attempts" value={value.attempts} onChange={(event) => set('attempts', event.target.value)} placeholder="0" />
        </>}
        {(!shooting || value.repetitions !== '') && <NumberInput label="Rounds completed" value={value.repetitions} onChange={(event) => set('repetitions', event.target.value)} placeholder="0" />}
      </div>

      <label className="check-field">
        <input
          type="checkbox"
          checked={value.completed}
          onChange={(event) => set('completed', event.target.checked)}
        />
        <span>
          <strong>Completed</strong>
          <small>Check when you finish. You can save a partial result and return later.</small>
        </span>
      </label>

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          value={value.notes}
          onChange={(event) => set('notes', event.target.value)}
          maxLength="500"
          rows="4"
          placeholder="What felt good? What needs work?"
        />
        <span className="field-hint">{value.notes.length}/500</span>
      </label>

      <ErrorNotice message={error} />
      {isLast && <Button type="submit" value="save-progress" variant="secondary" disabled={saving}>Save progress without finishing</Button>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : isLast ? 'Finish workout' : 'Save and continue'}
      </Button>
      </fieldset>
    </form>
  );
}

