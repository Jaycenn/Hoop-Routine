import test from 'node:test';
import assert from 'node:assert/strict';
import { transaction } from '../lib/transaction.js';
import { databaseConfig, maintenanceConfig } from '../lib/config.js';
import { maintenanceTransaction, reportMaintenanceFailure } from '../db/maintenance.js';

function fake(failures = {}) {
  const calls = []; const released = [];
  return { calls, released, pool: { connect: async () => ({
    async query(sql) { calls.push(sql); if (failures[sql]) throw failures[sql]; return { rows: [] }; },
    release(error) { released.push(error); },
  }) } };
}

test('maintenance has separate bounded server timeouts without a client timer cutting off SQL files', () => {
  const env = { DATABASE_URL: 'postgres://fixture:fixture@localhost/test?query_timeout=1&statement_timeout=0' };
  const config = maintenanceConfig(env);
  assert.equal(config.statement_timeout, 60000);
  assert.equal(config.lock_timeout, 5000);
  assert.equal(config.query_timeout, 0);
  assert.equal(config.max, 1);
  assert.equal(new URL(config.connectionString).searchParams.has('query_timeout'), false);
  assert.equal(databaseConfig(env).query_timeout, 12000);
  assert.throws(() => maintenanceConfig({ ...env, MIGRATION_STATEMENT_TIMEOUT_MS: '0' }));
});

test('normal SQL failures roll back once and release a usable connection', async () => {
  const source = Object.assign(new Error('constraint rejected'), { code: '23514' });
  const f = fake({ WORK: source });
  await assert.rejects(transaction(f.pool, (client) => client.query('WORK')), (error) => error === source && !error.commitOutcomeUnknown);
  assert.deepEqual(f.calls, ['BEGIN','WORK','ROLLBACK']);
  assert.equal(f.released.length, 1);
  assert.equal(f.released[0], undefined);
});

test('rollback failure preserves the original error and discards the connection', async () => {
  const source = new Error('original failure');
  const f = fake({ WORK: source, ROLLBACK: new Error('connection lost') });
  await assert.rejects(transaction(f.pool, (client) => client.query('WORK')), (error) => error === source && error.rollbackFailed);
  assert.equal(f.released[0], source);
});

test('lost commit acknowledgement is uncertain, discards the connection, and never retries the work', async () => {
  const source = Object.assign(new Error('connection lost'), { code: 'ECONNRESET' });
  const f = fake({ COMMIT: source }); let runs = 0;
  await assert.rejects(transaction(f.pool, async () => { runs++; }), (error) => error === source && error.commitOutcomeUnknown);
  assert.equal(runs, 1);
  assert.equal(f.released[0], source);
  const messages = [];
  reportMaintenanceFailure(source, { error: (...args) => messages.push(args.join(' ')) });
  assert.ok(messages.some((message) => message.includes('outcome is unknown')));
  assert.ok(!messages.some((message) => message.includes('was rolled back')));
});

test('a failed BEGIN never starts work and a maintenance lock failure also rolls back', async () => {
  const f = fake({ BEGIN: new Error('connection terminated') });
  await assert.rejects(transaction(f.pool, async () => assert.fail('Work must not run')));
  assert.ok(f.released[0]);
  const lock = "SELECT pg_advisory_xact_lock(hashtextextended('hooproutine-migrations', 0))";
  const blocked = fake({ [lock]: Object.assign(new Error('lock blocked'), { code: '55P03' }) });
  await assert.rejects(maintenanceTransaction(blocked.pool, async () => assert.fail('Work must not run')));
  assert.deepEqual(blocked.calls, ['BEGIN',lock,'ROLLBACK']);
});
