import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../lib/auth.js';

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.get('/', asyncHandler(async (req, res) => {
  const totalsResult = await pool.query(
    `WITH session_totals AS (
       SELECT COUNT(*)::int AS total_workouts,
              COALESCE(SUM(total_seconds), 0)::int AS total_seconds
       FROM workout_sessions
       WHERE user_id = $1 AND status = 'completed'
     ), result_totals AS (
       SELECT COUNT(r.id) FILTER (WHERE r.completed)::int AS completed_drills,
              COALESCE(SUM(r.makes), 0)::int AS makes,
              COALESCE(SUM(r.attempts), 0)::int AS attempts
       FROM workout_sessions s
       LEFT JOIN drill_results r ON r.session_id = s.id
       WHERE s.user_id = $1 AND s.status = 'completed'
     )
     SELECT * FROM session_totals CROSS JOIN result_totals`,
    [req.user.id],
  );

  const recentResult = await pool.query(
    `SELECT s.id, s.completed_at,
            COALESCE(SUM(r.makes), 0)::int AS makes,
            COALESCE(SUM(r.attempts), 0)::int AS attempts
     FROM workout_sessions s
     LEFT JOIN drill_results r ON r.session_id = s.id
     WHERE s.user_id = $1 AND s.status = 'completed'
     GROUP BY s.id
     ORDER BY s.completed_at DESC
     LIMIT 8`,
    [req.user.id],
  );

  const categoryResult = await pool.query(
    `SELECT d.category,
            COALESCE(SUM(r.makes), 0)::int AS makes,
            COALESCE(SUM(r.attempts), 0)::int AS attempts,
            COUNT(r.id) FILTER (WHERE r.completed)::int AS completed
     FROM drill_results r
     JOIN workout_sessions s ON s.id = r.session_id
     JOIN drills d ON d.id = r.drill_id
     WHERE s.user_id = $1 AND s.status = 'completed'
     GROUP BY d.category
     ORDER BY d.category`,
    [req.user.id],
  );

  const totals = totalsResult.rows[0];
  return res.json({
    progress: {
      totalWorkouts: totals.total_workouts,
      completedDrills: totals.completed_drills,
      totalMinutes: Math.round(totals.total_seconds / 60),
      makes: totals.makes,
      attempts: totals.attempts,
      accuracy: totals.attempts > 0 ? Math.round((totals.makes / totals.attempts) * 100) : null,
      recentSessions: recentResult.rows.reverse().map((row) => ({
        id: Number(row.id),
        date: row.completed_at,
        makes: row.makes,
        attempts: row.attempts,
        accuracy: row.attempts > 0 ? Math.round((row.makes / row.attempts) * 100) : null,
      })),
      categories: categoryResult.rows.map((row) => ({
        category: row.category,
        makes: row.makes,
        attempts: row.attempts,
        completed: row.completed,
        accuracy: row.attempts > 0 ? Math.round((row.makes / row.attempts) * 100) : null,
      })),
    },
  });
}));
