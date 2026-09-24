import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../lib/auth.js';
import { optionalNonNegativeInteger, ValidationError } from '../lib/validation.js';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

function normalizeResultBody(body) {
  const makes = optionalNonNegativeInteger(body.makes, 'Makes');
  const attempts = optionalNonNegativeInteger(body.attempts, 'Attempts');
  const repetitions = optionalNonNegativeInteger(body.repetitions, 'Repetitions');
  const timeSeconds = optionalNonNegativeInteger(body.timeSeconds, 'Time');
  const completed = body.completed === true;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (makes !== null && attempts !== null && makes > attempts) {
    throw new ValidationError('Makes cannot be greater than attempts.');
  }
  if (notes.length > 500) {
    throw new ValidationError('Notes cannot exceed 500 characters.');
  }

  return { makes, attempts, repetitions, timeSeconds, completed, notes };
}

async function ownedSession(sessionId, userId) {
  const result = await pool.query(
    `SELECT s.id, s.user_id, s.workout_id, s.status, s.started_at,
            s.completed_at, s.total_seconds, w.title, w.focus
     FROM workout_sessions s
     JOIN workouts w ON w.id = s.workout_id
     WHERE s.id = $1 AND s.user_id = $2`,
    [sessionId, userId],
  );
  return result.rows[0];
}

async function sessionDetails(sessionId, userId) {
  const session = await ownedSession(sessionId, userId);
  if (!session) return null;

  const drills = await pool.query(
    `SELECT d.id, d.name, d.category, d.instructions, wd.position,
            d.target_makes, d.target_attempts, d.target_repetitions, d.target_seconds,
            r.makes, r.attempts, r.repetitions, r.time_seconds,
            COALESCE(r.completed, FALSE) AS completed, COALESCE(r.notes, '') AS notes
     FROM workout_drills wd
     JOIN drills d ON d.id = wd.drill_id
     LEFT JOIN drill_results r ON r.session_id = $1 AND r.drill_id = d.id
     WHERE wd.workout_id = $2
     ORDER BY wd.position`,
    [sessionId, session.workout_id],
  );

  return {
    id: Number(session.id),
    workoutId: Number(session.workout_id),
    title: session.title,
    focus: session.focus,
    status: session.status,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    totalSeconds: session.total_seconds,
    drills: drills.rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      category: row.category,
      instructions: row.instructions,
      position: row.position,
      targetMakes: row.target_makes,
      targetAttempts: row.target_attempts,
      targetRepetitions: row.target_repetitions,
      targetSeconds: row.target_seconds,
      result: {
        makes: row.makes,
        attempts: row.attempts,
        repetitions: row.repetitions,
        timeSeconds: row.time_seconds,
        completed: row.completed,
        notes: row.notes,
      },
    })),
  };
}

sessionsRouter.post('/', asyncHandler(async (req, res) => {
  const workoutId = Number(req.body.workoutId);
  if (!Number.isInteger(workoutId) || workoutId <= 0) {
    throw new ValidationError('Choose a valid workout.');
  }

  const workout = await pool.query(
    'SELECT id FROM workouts WHERE id = $1 AND is_active = TRUE',
    [workoutId],
  );
  if (!workout.rows[0]) {
    return res.status(404).json({ error: 'Workout not found.' });
  }

  const existing = await pool.query(
    `SELECT id FROM workout_sessions
     WHERE user_id = $1 AND workout_id = $2 AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    [req.user.id, workoutId],
  );
  if (existing.rows[0]) {
    return res.status(200).json({ sessionId: Number(existing.rows[0].id), resumed: true });
  }

  const result = await pool.query(
    `INSERT INTO workout_sessions (user_id, workout_id)
     VALUES ($1, $2)
     RETURNING id`,
    [req.user.id, workoutId],
  );
  return res.status(201).json({ sessionId: Number(result.rows[0].id), resumed: false });
}));

sessionsRouter.get('/:sessionId', asyncHandler(async (req, res) => {
  const session = await sessionDetails(req.params.sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Workout session not found.' });
  return res.json({ session });
}));

sessionsRouter.patch('/:sessionId/drills/:drillId', asyncHandler(async (req, res) => {
  const session = await ownedSession(req.params.sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Workout session not found.' });
  if (session.status === 'completed') {
    return res.status(409).json({ error: 'Completed workouts cannot be edited.' });
  }

  const drill = await pool.query(
    `SELECT 1 FROM workout_drills
     WHERE workout_id = $1 AND drill_id = $2`,
    [session.workout_id, req.params.drillId],
  );
  if (!drill.rows[0]) {
    return res.status(404).json({ error: 'Drill is not part of this workout.' });
  }

  const value = normalizeResultBody(req.body);
  const result = await pool.query(
    `INSERT INTO drill_results
       (session_id, drill_id, makes, attempts, repetitions, time_seconds, completed, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (session_id, drill_id) DO UPDATE SET
       makes = EXCLUDED.makes,
       attempts = EXCLUDED.attempts,
       repetitions = EXCLUDED.repetitions,
       time_seconds = EXCLUDED.time_seconds,
       completed = EXCLUDED.completed,
       notes = EXCLUDED.notes,
       updated_at = NOW()
     RETURNING makes, attempts, repetitions, time_seconds, completed, notes`,
    [
      session.id,
      req.params.drillId,
      value.makes,
      value.attempts,
      value.repetitions,
      value.timeSeconds,
      value.completed,
      value.notes,
    ],
  );

  const row = result.rows[0];
  return res.json({
    result: {
      makes: row.makes,
      attempts: row.attempts,
      repetitions: row.repetitions,
      timeSeconds: row.time_seconds,
      completed: row.completed,
      notes: row.notes,
    },
  });
}));

sessionsRouter.post('/:sessionId/complete', asyncHandler(async (req, res) => {
  const session = await ownedSession(req.params.sessionId, req.user.id);
  if (!session) return res.status(404).json({ error: 'Workout session not found.' });
  if (session.status === 'completed') {
    return res.json({ sessionId: Number(session.id) });
  }

  const resultCount = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM drill_results
     WHERE session_id = $1 AND completed = TRUE`,
    [session.id],
  );
  if (resultCount.rows[0].count === 0) {
    throw new ValidationError('Complete at least one drill before finishing the workout.');
  }

  await pool.query(
    `UPDATE workout_sessions
     SET status = 'completed',
         completed_at = NOW(),
         total_seconds = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)))::int)
     WHERE id = $1`,
    [session.id],
  );
  return res.json({ sessionId: Number(session.id) });
}));
