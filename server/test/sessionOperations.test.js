import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionOperations } from '../lib/sessionOperations.js';

function fixture(session, handler = () => ({ rows: [] })) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('FROM workout_sessions') && sql.includes('FOR UPDATE')) return { rows: session ? [session] : [] };
      return handler(sql, params);
    },
    release() { calls.push({ sql: 'RELEASE' }); },
  };
  return { calls, operations: sessionOperations({ connect: async () => client }) };
}
test('completed sessions reject late result edits without writing', async () => {
  const { operations, calls } = fixture({ id: 5, status: 'completed' });
  await assert.rejects(operations.save(1, 5, 2, { completed: true }), (error) => error.status === 409);
  assert.ok(calls.some(({ sql }) => sql.includes('FOR UPDATE')));
  assert.equal(calls.some(({ sql }) => sql.includes('INSERT')), false);
  assert.deepEqual(calls.slice(-2).map(({ sql }) => sql), ['ROLLBACK', 'RELEASE']);
});
test('completion retries never rewrite the completed timestamp', async () => {
  const { operations, calls } = fixture({ id: 5, status: 'completed' });
  assert.deepEqual(await operations.complete(1, 5, { drillId: 2, result: {} }), { sessionId: 5 });
  assert.equal(calls.some(({ sql }) => sql.includes('UPDATE workout_sessions') || sql.includes('INSERT')), false);
});
test('ownership miss rolls back; cancellation cannot delete a completed session', async () => {
  const missing = fixture(null);
  await assert.rejects(missing.operations.cancel(8, 5), (error) => error.status === 404);
  assert.deepEqual(missing.calls.find(({ sql }) => sql.includes('FOR UPDATE')).params, [5, 8]);
  const completed = fixture({ id: 5, status: 'completed' });
  await assert.rejects(completed.operations.cancel(1, 5), (error) => error.status === 409);
  assert.equal(completed.calls.some(({ sql }) => sql.startsWith('DELETE')), false);
});
test('invalid result data is rejected before connecting', async () => {
  let connected = false;
  const operations = sessionOperations({ connect: async () => { connected = true; throw new Error('Unexpected database access'); } });
  await assert.rejects(operations.save(1, 5, 2, { makes: 2 }), (error) => error.status === 400);
  assert.equal(connected, false);
});
test('final drill save and completion commit together', async () => {
  const { operations, calls } = fixture({ id: 5, status: 'in_progress' }, (sql) => {
    if (sql.includes('FROM session_drills')) return { rows: [{}] };
    if (sql.includes('INSERT INTO drill_results')) return { rows: [{ time_seconds: null }] };
    if (sql.includes('COUNT(*)')) return { rows: [{ count: 1 }] };
    return { rows: [] };
  });
  await operations.complete(1, 5, { drillId: 2, result: { completed: true, makes: 1, attempts: 2 } });
  const order = calls.map(({ sql }) => sql);
  assert.ok(order.findIndex((sql) => sql.includes('INSERT INTO drill_results')) < order.findIndex((sql) => sql.includes('UPDATE workout_sessions')));
  assert.deepEqual(order.slice(-2), ['COMMIT', 'RELEASE']);
});
