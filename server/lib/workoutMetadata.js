export function workoutMetadata(drills) {
  const categories = [...new Set(drills.map((drill) => drill.category))];
  const types = [...new Set(drills.map((drill) => drill.training_type))];
  const equipment = [...new Set(drills.map((drill) => drill.equipment).filter(Boolean))];
  return {
    focus: categories.join(', '),
    estimatedMinutes: Math.max(1, Math.ceil(drills.reduce((total, drill) => total + (drill.target_seconds ?? 300), 0) / 60)),
    trainingType: types.length === 1 ? types[0] : 'mixed',
    equipment: equipment.join('; ') || 'Equipment not specified; review the drill instructions.',
  };
}
