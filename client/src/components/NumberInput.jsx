export function NumberInput({ label, hint, ...props }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input type="number" min="0" inputMode="numeric" {...props} />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

