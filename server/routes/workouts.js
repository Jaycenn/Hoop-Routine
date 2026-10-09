import { createHash, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { cleanWorkoutTitle, normalizeDrillIds, objectBody, positiveId, requestKey } from '../lib/validation.js';
import { transaction, httpError } from '../lib/transaction.js';
import { workoutMetadata } from '../lib/workoutMetadata.js';

export function createWorkoutsRouter(pool, requireAuth) {
  const workoutsRouter = Router();

  workoutsRouter.use(requireAuth);

  function serializeDrill(drill) {
    return {
      id: Number(drill.id),
      slug: drill.slug,
      name: drill.name,
      category: drill.category,
      trainingType: drill.training_type,
      equipment: drill.equipment,
      instructions: drill.instructions,
      position: drill.position === undefined ? undefined : Number(drill.position),
      targetMakes: drill.target_makes,
      targetAttempts: drill.target_attempts,
      targetRepetitions: drill.target_repetitions,
      targetSeconds: drill.target_seconds,
    };
  }

  async function loadWorkouts(userId, workoutId = null, database = pool) {
    const values = [userId];
    let workoutFilter = '';
    if (workoutId !== null) {
      values.push(workoutId);
      workoutFilter = `AND w.id = $${values.length}`;
    }

    const workoutResult = await database.query(
      `SELECT w.id, w.slug, w.title, w.focus, w.description, w.estimated_minutes,
              w.difficulty, w.training_type, w.equipment, w.source,
              w.owner_user_id, w.created_at
       FROM workouts w
       WHERE (w.is_active = TRUE OR ${workoutId !== null ? 'TRUE' : 'FALSE'})
         AND (w.owner_user_id IS NULL OR w.owner_user_id = $1)
         ${workoutFilter}
       ORDER BY CASE WHEN w.slug = 'complete-guard-workout' THEN 0
                     WHEN w.source = 'preset' THEN 1 ELSE 2 END,
                w.created_at DESC,
                w.id`,
      values,
    );

    if (workoutResult.rows.length === 0) return [];

    const workoutIds = workoutResult.rows.map((row) => row.id);
    const drillResult = await database.query(
      `SELECT wd.workout_id, wd.position, d.id, d.slug, d.name, d.category,
              d.training_type, d.equipment, d.instructions, d.target_makes, d.target_attempts,
              d.target_repetitions, d.target_seconds
       FROM workout_drills wd
       JOIN drills d ON d.id = wd.drill_id
       WHERE wd.workout_id = ANY($1::bigint[])
       ORDER BY wd.workout_id, wd.position`,
      [workoutIds],
    );

    const drillsByWorkout = new Map();
    for (const drill of drillResult.rows) {
      const key = String(drill.workout_id);
      const list = drillsByWorkout.get(key) || [];
      list.push(serializeDrill(drill));
      drillsByWorkout.set(key, list);
    }

    return workoutResult.rows.map((workout) => ({
      id: Number(workout.id),
      slug: workout.slug,
      title: workout.title,
      focus: workout.focus,
      description: workout.description,
      estimatedMinutes: workout.estimated_minutes,
      difficulty: workout.difficulty,
      trainingType: workout.training_type,
      equipment: workout.equipment,
      source: workout.source,
      canDelete: workout.source === 'custom' && Number(workout.owner_user_id) === Number(userId),
      drills: drillsByWorkout.get(String(workout.id)) || [],
    }));
  }

  const parseWorkoutId = (value) => positiveId(value, 'Workout');

  async function insertCustomWorkout(client, userId, title, drillIds, key, fingerprint, previousId) {
    const drillResult = await client.query(
      `SELECT id, category, training_type, target_seconds, equipment
       FROM drills
       WHERE id = ANY($1::bigint[])`,
      [drillIds],
    );

    if (drillResult.rows.length !== drillIds.length) {
      const error = new Error('One or more selected drills no longer exist.');
      error.status = 400;
      throw error;
    }

    const drillById = new Map(drillResult.rows.map((row) => [Number(row.id), row]));
    const orderedDrills = drillIds.map((id) => drillById.get(id));
    const { focus, estimatedMinutes, trainingType, equipment } = workoutMetadata(orderedDrills);
    const slug = `custom-${userId}-${randomUUID().slice(0, 12)}`;

    const workoutResult = await client.query(
      `INSERT INTO workouts
         (slug, title, focus, description, estimated_minutes, difficulty,
          training_type, equipment, source, owner_user_id, request_key, request_fingerprint, replaces_workout_id)
       VALUES ($1, $2, $3, $4, $5, 'Intermediate', $6, $7, 'custom', $8, $9, $10, $11)
       RETURNING id`,
      [
        slug,
        title,
        focus,
        'A custom workout built from your selected drills.',
        estimatedMinutes,
        trainingType,
        equipment,
        userId, key, fingerprint, previousId,
      ],
    );
    const workoutId = workoutResult.rows[0].id;

    await client.query(
      `INSERT INTO workout_drills (workout_id, drill_id, position)
       SELECT $1, selected.drill_id, selected.position::int
       FROM UNNEST($2::bigint[]) WITH ORDINALITY AS selected(drill_id, position)`,
      [workoutId, drillIds],
    );
    return workoutId;
  }

  workoutsRouter.get('/', asyncHandler(async (req, res) => {
    const workouts = await loadWorkouts(req.user.id);
    return res.json({ workouts });
  }));

  workoutsRouter.get('/today', asyncHandler(async (req, res) => {
    const workouts = await loadWorkouts(req.user.id);
    const workout = workouts.find((item) => item.slug === 'complete-guard-workout') || workouts[0];
    if (!workout) {
      return res.status(404).json({ error: 'No workout is available today.' });
    }
    return res.json({ workout });
  }));

  workoutsRouter.get('/drills', asyncHandler(async (_req, res) => {
    const result = await pool.query(
      `SELECT id, slug, name, category, training_type, equipment, instructions, target_makes,
              target_attempts, target_repetitions, target_seconds
       FROM drills
       ORDER BY CASE WHEN category = 'Warm-up' THEN 0 ELSE 1 END, category, name`,
    );
    return res.json({ drills: result.rows.map(serializeDrill) });
  }));

  async function saveCustom(req, res, previousId = null) {
    const body = objectBody(req.body);
    const title = cleanWorkoutTitle(body.title);
    const drillIds = normalizeDrillIds(body.drillIds);
    const key = requestKey(body.requestId);
    const fingerprint = createHash('sha256').update(JSON.stringify({ title, drillIds, previousId })).digest('hex');
    const workout = await transaction(pool, async (client) => {
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
      const replay = await client.query('SELECT id, request_fingerprint FROM workouts WHERE owner_user_id = $1 AND request_key = $2', [req.user.id, key]);
      if (replay.rows[0]) {
        if (replay.rows[0].request_fingerprint !== fingerprint) throw httpError(409, 'This request ID was used for different changes.');
        return (await loadWorkouts(req.user.id, replay.rows[0].id, client))[0];
      }
      if (previousId) {
        const previous = await client.query("SELECT id FROM workouts WHERE id = $1 AND owner_user_id = $2 AND source = 'custom' AND is_active = TRUE FOR UPDATE", [previousId, req.user.id]);
        if (!previous.rows[0]) throw httpError(404, 'Custom workout not found. Refresh your workout list.');
      }
      const workoutId = await insertCustomWorkout(client, req.user.id, title, drillIds, key, fingerprint, previousId);
      if (previousId) await client.query('UPDATE workouts SET is_active = FALSE WHERE id = $1', [previousId]);
      return (await loadWorkouts(req.user.id, workoutId, client))[0];
    });
    res.status(previousId ? 200 : 201).json({ workout, replacedWorkoutId: previousId });
  }
  workoutsRouter.post('/custom', asyncHandler((req, res) => saveCustom(req, res)));
  workoutsRouter.put('/:workoutId', asyncHandler((req, res) => saveCustom(req, res, parseWorkoutId(req.params.workoutId))));

  workoutsRouter.delete('/:workoutId', asyncHandler(async (req, res) => {
    const workoutId = parseWorkoutId(req.params.workoutId);

    const result = await pool.query(
      `UPDATE workouts
       SET is_active = FALSE
       WHERE id = $1 AND owner_user_id = $2 AND source = 'custom' AND is_active = TRUE
       RETURNING id`,
      [workoutId, req.user.id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Custom workout not found.' });
    }
    return res.status(204).send();
  }));

  return workoutsRouter;
}
