import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../lib/auth.js';

export const workoutsRouter = Router();

workoutsRouter.use(requireAuth);

workoutsRouter.get('/today', asyncHandler(async (_req, res) => {
  const workoutResult = await pool.query(
    `SELECT id, slug, title, focus, description, estimated_minutes, difficulty
     FROM workouts
     WHERE is_active = TRUE
     ORDER BY id
     LIMIT 1`,
  );

  if (!workoutResult.rows[0]) {
    return res.status(404).json({ error: 'No workout is scheduled today.' });
  }

  const workout = workoutResult.rows[0];
  const drillsResult = await pool.query(
    `SELECT d.id, d.slug, d.name, d.category, d.instructions,
            d.target_makes, d.target_attempts, d.target_repetitions,
            d.target_seconds, wd.position
     FROM workout_drills wd
     JOIN drills d ON d.id = wd.drill_id
     WHERE wd.workout_id = $1
     ORDER BY wd.position`,
    [workout.id],
  );

  return res.json({
    workout: {
      id: Number(workout.id),
      slug: workout.slug,
      title: workout.title,
      focus: workout.focus,
      description: workout.description,
      estimatedMinutes: workout.estimated_minutes,
      difficulty: workout.difficulty,
      drills: drillsResult.rows.map((drill) => ({
        id: Number(drill.id),
        slug: drill.slug,
        name: drill.name,
        category: drill.category,
        instructions: drill.instructions,
        position: drill.position,
        targetMakes: drill.target_makes,
        targetAttempts: drill.target_attempts,
        targetRepetitions: drill.target_repetitions,
        targetSeconds: drill.target_seconds,
      })),
    },
  });
}));

