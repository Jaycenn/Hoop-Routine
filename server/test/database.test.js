import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { applyMigrations } from '../db/migrate.js';
import { databaseConfig } from '../lib/config.js';
import { sessionOperations } from '../lib/sessionOperations.js';
import { createApp } from '../app.js';
import { appConfig } from '../lib/config.js';
import { createAuth } from '../lib/auth.js';
import { once } from 'node:events';

// Never loads .env. Opt in only with a separately created, disposable LOCAL database.
const enabled = process.env.RUN_DATABASE_TESTS === '1';
test('PostgreSQL migrations, seed, snapshots, constraints, and concurrent session lifecycle', {
  skip: !enabled ? 'Requires explicit RUN_DATABASE_TESTS=1 and a disposable local hooproutine_test database.' : false,
}, async (t) => {
  const url = new URL(process.env.TEST_DATABASE_URL || '');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Tests require a local database.');
  assert.equal(url.pathname, '/hooproutine_test', 'Refusing a non-test database.');
  const schema = 'hooproutine_test_' + randomUUID().replaceAll('-', '');
  const config = databaseConfig({ DATABASE_URL: url.toString(), DATABASE_SSL: 'false' });
  const admin = new pg.Pool(config);
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ ...config, options: `-c search_path=${schema}` });
  t.after(async () => { await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); });
  await applyMigrations(pool, { initialize: true, seed: true });
  assert.deepEqual(await applyMigrations(pool), []);
  const user = (await pool.query("INSERT INTO users(display_name,email,password_hash) VALUES ('Test Player','player@example.invalid','test-only') RETURNING id")).rows[0].id;
  const workout = (await pool.query('SELECT id FROM workouts ORDER BY id LIMIT 1')).rows[0].id;
  const service = sessionOperations(pool);
  const starts = await Promise.all(Array.from({ length: 5 }, () => service.start(Number(user), Number(workout))));
  assert.equal(new Set(starts.map((row) => row.sessionId)).size, 1);
  const sessionId = starts[0].sessionId;
  const drill = (await pool.query('SELECT drill_id, instructions FROM session_drills WHERE session_id=$1 ORDER BY position LIMIT 1', [sessionId])).rows[0];
  await assert.rejects(service.save(Number(user) + 1, sessionId, drill.drill_id, { completed: true }), (error) => error.status === 404);
  await assert.rejects(pool.query('INSERT INTO drill_results(session_id,drill_id,makes) VALUES($1,$2,10)', [sessionId, drill.drill_id]), (error) => error.code === '23514');
  await service.save(Number(user), sessionId, drill.drill_id, { makes: 1, attempts: 2, completed: true });
  await Promise.all(Array.from({ length: 4 }, () => service.complete(Number(user), sessionId)));
  const first = (await pool.query('SELECT completed_at FROM workout_sessions WHERE id=$1', [sessionId])).rows[0].completed_at;
  await service.complete(Number(user), sessionId);
  assert.equal((await pool.query('SELECT completed_at FROM workout_sessions WHERE id=$1', [sessionId])).rows[0].completed_at.getTime(), first.getTime());
  await assert.rejects(service.cancel(Number(user), sessionId), (error) => error.status === 409);
  await assert.rejects(service.save(Number(user), sessionId, drill.drill_id, { completed: true }), (error) => error.status === 409);
  await pool.query("UPDATE drills SET instructions='changed definition' WHERE id=$1", [drill.drill_id]);
  assert.equal((await pool.query('SELECT instructions FROM session_drills WHERE session_id=$1 AND drill_id=$2', [sessionId, drill.drill_id])).rows[0].instructions, drill.instructions);

  const appSettings = appConfig({ JWT_SECRET: 'disposable-database-test-key-not-for-real-use-123' });
  const token = await createAuth(pool, appSettings).issue(pool, { id: user });
  const server = createApp({ pool, config: appSettings, logger: { error() {} } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, method = 'GET', body) => fetch(base + path, { method,
    headers: { Cookie: `hoop_session=${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    const ids = (await pool.query('SELECT id FROM drills ORDER BY id DESC')).rows.map((row) => Number(row.id));
    const input = { title: 'All drills test', drillIds: ids, requestId: randomUUID() };
    const created = await request('/workouts/custom', 'POST', input);
    assert.equal(created.status, 201);
    const custom = (await created.json()).workout;
    assert.equal(custom.focus.length, 147); assert.equal(custom.estimatedMinutes, 377);
    assert.deepEqual(custom.drills.map((row) => row.id), ids);
    const retried = await request('/workouts/custom', 'POST', input);
    assert.equal((await retried.json()).workout.id, custom.id);
    const history = await request('/sessions');
    assert.equal(history.status, 200);
    assert.equal((await history.json()).sessions[0].id, sessionId);
    const progress = await request('/progress');
    assert.equal(progress.status, 200);
    assert.equal((await progress.json()).progress.totalWorkouts, 1);
  } finally {
    await new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); });
  }
});
