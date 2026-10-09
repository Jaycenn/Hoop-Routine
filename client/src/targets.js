export function targetText(drill) {
  const parts = [];
  if (drill.targetMakes != null) parts.push(`${drill.targetMakes} makes`);
  if (drill.targetAttempts != null) parts.push(`${drill.targetAttempts} attempts`);
  if (drill.targetRepetitions != null) parts.push(`${drill.targetRepetitions} rounds`);
  if (drill.targetSeconds) parts.push(`about ${Math.ceil(drill.targetSeconds / 60)} min`);
  return parts.join(' · ') || 'Complete with controlled form';
}
