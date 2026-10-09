import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { objectBody, positiveId } from '../lib/validation.js';
import { sessionOperations } from '../lib/sessionOperations.js';

export function createSessionsRouter(pool, requireAuth) {
  const router = Router();
  const operations = sessionOperations(pool);
  router.use(requireAuth);

  router.post('/', asyncHandler(async (req, res) => {
    const result = await operations.start(req.user.id, objectBody(req.body).workoutId);
    res.status(result.resumed ? 200 : 201).json(result);
  }));

  router.get('/', asyncHandler(async (req, res) => {
    const before = req.query.before === undefined ? null : positiveId(req.query.before, 'History cursor');
    const { rows } = await pool.query(
      `SELECT s.*, COUNT(r.id)::int AS recorded_drills,
              COUNT(r.id) FILTER (WHERE r.completed)::int AS completed_drills,
              COALESCE(SUM(r.makes) FILTER (WHERE r.attempts IS NOT NULL), 0)::float8 AS makes,
              COALESCE(SUM(r.attempts), 0)::float8 AS attempts
       FROM (SELECT * FROM workout_sessions WHERE user_id = $1 AND ($2::bigint IS NULL OR id < $2)
             ORDER BY id DESC LIMIT 31) s
       LEFT JOIN drill_results r ON r.session_id = s.id
       GROUP BY s.id, s.user_id, s.workout_id, s.status, s.started_at, s.completed_at, s.total_seconds, s.title, s.focus
       ORDER BY s.id DESC`, [req.user.id, before],
    );
    const page = rows.slice(0, 30);
    res.json({ sessions: page.map((row) => ({
      id: Number(row.id), title: row.title, focus: row.focus, status: row.status,
      startedAt: row.started_at, completedAt: row.completed_at, totalSeconds: row.total_seconds,
      recordedDrills: row.recorded_drills, completedDrills: row.completed_drills,
      makes: row.makes, attempts: row.attempts,
      accuracy: row.attempts > 0 ? Math.round(row.makes / row.attempts * 100) : null,
    })), nextCursor: rows.length > 30 ? String(page.at(-1).id) : null });
  }));

  router.get('/:sessionId', asyncHandler(async (req, res) => {
    const sessionId = positiveId(req.params.sessionId, 'Session');
    const { rows } = await pool.query('SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2', [sessionId, req.user.id]);
    const session = rows[0];
    if (!session) return res.status(404).json({ error: 'Workout session not found.' });
    const { rows: drills } = await pool.query(
      `SELECT d.*, r.makes, r.attempts, r.repetitions, r.time_seconds,
              COALESCE(r.completed, FALSE) AS completed, COALESCE(r.notes, '') AS notes
       FROM session_drills d LEFT JOIN drill_results r ON r.session_id = d.session_id AND r.drill_id = d.drill_id
       WHERE d.session_id = $1 ORDER BY d.position`, [sessionId],
    );
    res.json({ session: {
      id: Number(session.id), workoutId: Number(session.workout_id), title: session.title, focus: session.focus,
      status: session.status, startedAt: session.started_at, completedAt: session.completed_at, totalSeconds: session.total_seconds,
      drills: drills.map((row) => ({
        id: Number(row.drill_id), name: row.name, category: row.category, instructions: row.instructions,
        equipment: row.equipment, position: row.position, targetMakes: row.target_makes,
        targetAttempts: row.target_attempts, targetRepetitions: row.target_repetitions, targetSeconds: row.target_seconds,
        result: { makes: row.makes ?? null, attempts: row.attempts ?? null, repetitions: row.repetitions ?? null,
          timeSeconds: row.time_seconds ?? null, completed: row.completed, notes: row.notes },
      })),
    } });
  }));

  router.patch('/:sessionId/drills/:drillId', asyncHandler(async (req, res) => {
    res.json({ result: await operations.save(req.user.id, req.params.sessionId, req.params.drillId, req.body) });
  }));
  router.post('/:sessionId/complete', asyncHandler(async (req, res) => {
    const body = req.body === undefined ? {} : objectBody(req.body);
    res.json(await operations.complete(req.user.id, req.params.sessionId, body.finalResult || null));
  }));
  router.delete('/:sessionId', asyncHandler(async (req, res) => {
    await operations.cancel(req.user.id, req.params.sessionId);
    res.status(204).end();
  }));
  return router;
}
