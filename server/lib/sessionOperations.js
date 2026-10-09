import { transaction, httpError } from './transaction.js';
import { normalizeResultBody, positiveId, ValidationError } from './validation.js';

export function sessionOperations(pool) {
  async function locked(client, sessionId, userId) {
    const { rows } = await client.query(
      'SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [positiveId(sessionId, 'Session'), userId],
    );
    if (!rows[0]) throw httpError(404, 'Workout session not found.');
    return rows[0];
  }

  async function writeResult(client, session, drillId, input) {
    if (session.status !== 'in_progress') throw httpError(409, 'Completed workouts cannot be edited.');
    const value = normalizeResultBody(input);
    const drill = await client.query('SELECT 1 FROM session_drills WHERE session_id = $1 AND drill_id = $2', [session.id, positiveId(drillId, 'Drill')]);
    if (!drill.rows.length) throw httpError(404, 'Drill is not part of this workout.');
    const { rows } = await client.query(
      `INSERT INTO drill_results (session_id, drill_id, makes, attempts, repetitions, time_seconds, completed, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (session_id, drill_id) DO UPDATE SET
         makes = EXCLUDED.makes, attempts = EXCLUDED.attempts, repetitions = EXCLUDED.repetitions,
         time_seconds = EXCLUDED.time_seconds, completed = EXCLUDED.completed, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING makes, attempts, repetitions, time_seconds, completed, notes`,
      [session.id, drillId, value.makes, value.attempts, value.repetitions, value.timeSeconds, value.completed, value.notes],
    );
    return { ...value, timeSeconds: rows[0].time_seconds };
  }

  return {
    async start(userId, inputId) {
      const workoutId = positiveId(inputId, 'Workout');
      return transaction(pool, async (client) => {
        // Serializes starts per player, including duplicate requests from multiple devices.
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const { rows: workouts } = await client.query(
          `SELECT id, title, focus FROM workouts WHERE id = $1 AND is_active = TRUE
           AND (owner_user_id IS NULL OR owner_user_id = $2) FOR SHARE`, [workoutId, userId],
        );
        if (!workouts[0]) throw httpError(404, 'Workout not found.');
        const { rows: existing } = await client.query(
          "SELECT id FROM workout_sessions WHERE user_id = $1 AND workout_id = $2 AND status = 'in_progress'", [userId, workoutId],
        );
        if (existing[0]) return { sessionId: Number(existing[0].id), resumed: true };
        const { rows } = await client.query(
          'INSERT INTO workout_sessions (user_id, workout_id, title, focus) VALUES ($1, $2, $3, $4) RETURNING id',
          [userId, workoutId, workouts[0].title, workouts[0].focus],
        );
        const sessionId = rows[0].id;
        const snapshots = await client.query(
          `INSERT INTO session_drills
           SELECT $1, d.id, wd.position, d.name, d.category, d.instructions, d.equipment,
                  d.target_makes, d.target_attempts, d.target_repetitions, d.target_seconds
           FROM workout_drills wd JOIN drills d ON d.id = wd.drill_id WHERE wd.workout_id = $2`, [sessionId, workoutId],
        );
        if (!snapshots.rowCount) throw httpError(409, 'This workout has no drills. Choose another routine.');
        return { sessionId: Number(sessionId), resumed: false };
      });
    },
    async save(userId, sessionId, drillId, input) {
      // Validate before acquiring a database connection as well as inside writeResult.
      normalizeResultBody(input);
      return transaction(pool, async (client) => writeResult(client, await locked(client, sessionId, userId), drillId, input));
    },
    async complete(userId, sessionId, finalResult = null) {
      return transaction(pool, async (client) => {
        const session = await locked(client, sessionId, userId);
        if (session.status === 'completed') return { sessionId: Number(session.id) };
        if (finalResult) await writeResult(client, session, finalResult.drillId, finalResult.result);
        const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM drill_results WHERE session_id = $1 AND completed = TRUE', [session.id]);
        if (!rows[0].count) throw new ValidationError('Complete at least one drill before finishing the workout.');
        await client.query(
          `UPDATE workout_sessions SET status = 'completed', completed_at = NOW(),
           total_seconds = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - started_at)))::int)
           WHERE id = $1 AND user_id = $2 AND status = 'in_progress'`, [session.id, userId],
        );
        return { sessionId: Number(session.id) };
      });
    },
    async cancel(userId, sessionId) {
      return transaction(pool, async (client) => {
        const session = await locked(client, sessionId, userId);
        if (session.status !== 'in_progress') throw httpError(409, 'Completed workouts cannot be cancelled.');
        await client.query("DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2 AND status = 'in_progress'", [session.id, userId]);
      });
    },
  };
}
