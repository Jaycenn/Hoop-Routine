INSERT INTO workouts (slug, title, focus, description, estimated_minutes, difficulty)
VALUES (
  'complete-guard-workout',
  'Complete Guard Workout',
  'Shooting, finishing, ball handling, and conditioning',
  'A balanced session that develops game-ready guard skills from warm-up through conditioning.',
  45,
  'Intermediate'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  focus = EXCLUDED.focus,
  description = EXCLUDED.description,
  estimated_minutes = EXCLUDED.estimated_minutes,
  difficulty = EXCLUDED.difficulty,
  is_active = TRUE;

INSERT INTO drills
  (slug, name, category, instructions, target_makes, target_attempts, target_repetitions, target_seconds)
VALUES
  ('dynamic-court-warmup', 'Dynamic Court Warm-up', 'Warm-up',
   'Complete two light jogging laps, then perform high knees, defensive slides, and walking lunges.',
   NULL, NULL, 2, 480),
  ('form-shooting', 'Form Shooting', 'Shooting',
   'Shoot close to the basket. Hold the follow-through and focus on balance and a straight release.',
   20, 30, NULL, 600),
  ('mikans', 'Mikan Finishing', 'Layups',
   'Alternate right- and left-hand finishes without letting the ball drop below your shoulders.',
   20, 30, NULL, 420),
  ('two-ball-control', 'Two-ball Control', 'Ball Handling',
   'Perform simultaneous, alternating, and high-low pounds while keeping your eyes forward.',
   NULL, NULL, 3, 480),
  ('baseline-suicides', 'Baseline Suicides', 'Conditioning',
   'Sprint baseline to free throw, half court, opposite free throw, and opposite baseline. Return after each line.',
   NULL, NULL, 3, 600)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  instructions = EXCLUDED.instructions,
  target_makes = EXCLUDED.target_makes,
  target_attempts = EXCLUDED.target_attempts,
  target_repetitions = EXCLUDED.target_repetitions,
  target_seconds = EXCLUDED.target_seconds;

INSERT INTO workout_drills (workout_id, drill_id, position)
SELECT w.id, d.id, seeded.position
FROM workouts w
JOIN (
  VALUES
    ('dynamic-court-warmup', 1),
    ('form-shooting', 2),
    ('mikans', 3),
    ('two-ball-control', 4),
    ('baseline-suicides', 5)
) AS seeded(drill_slug, position) ON TRUE
JOIN drills d ON d.slug = seeded.drill_slug
WHERE w.slug = 'complete-guard-workout'
ON CONFLICT (workout_id, drill_id) DO UPDATE SET position = EXCLUDED.position;

