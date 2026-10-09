import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { applyMigrations } from '../db/migrate.js';
import { applySeed } from '../db/run.js';
import { inspectMigrations, loadMigrations } from '../db/maintenance.js';

// No URL, data directory, network connection, private .env, or persistent database.
async function fixture(t, { legacy = false } = {}) {
  const db = new PGlite();
  t.after(() => db.close());
  const calls = [];
  const query = async (sql, params) => {
    calls.push(sql);
    const result = params ? await db.query(sql, params) : (await db.exec(sql)).at(-1);
    return { rows: result?.rows || [], rowCount: result?.affectedRows ?? result?.rows?.length ?? 0 };
  };
  const pool = { query, connect: async () => ({ query, release() {} }) };
  if (legacy) {
    await db.exec(await fs.readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
    await db.exec(`
      INSERT INTO users(display_name,email,password_hash) VALUES ('Fixture athlete','athlete@example.invalid','fictional hash');
      INSERT INTO workouts(slug,title,focus,description,estimated_minutes,difficulty,source,owner_user_id,equipment,is_active) VALUES
        ('complete-guard-workout','Customized preset','Original focus','Keep this description',19,'Beginner','preset',NULL,'Keep preset equipment',FALSE),
        ('extra-local-preset','Extra preset','Other','Keep extra preset',7,'Beginner','preset',NULL,'Keep extra equipment',TRUE),
        ('custom-fixture','Personal routine','Custom focus','Keep custom metadata',9,'Advanced','custom',1,'Keep custom equipment',TRUE);
      INSERT INTO drills(slug,name,category,instructions,equipment,target_makes,target_attempts,target_seconds) VALUES
        ('form-shooting','Personal drill name','Shooting','Original instructions','Old equipment',4,10,90),
        ('extra-local-drill','Extra drill','Warm-up','Keep extra instructions','Own equipment',NULL,NULL,60);
      INSERT INTO workout_drills VALUES (1,1,3),(2,2,1),(3,1,1),(3,2,2);
      INSERT INTO workout_sessions(user_id,workout_id,status,completed_at,total_seconds) VALUES
        (1,1,'in_progress',NULL,NULL),(1,3,'completed',NOW(),120);
      INSERT INTO drill_results(session_id,drill_id,makes,attempts,completed,notes) VALUES
        (1,1,2,4,FALSE,'Keep active result'),(2,1,3,4,TRUE,'Keep finished result');
    `);
  }
  return { db, pool, calls, query };
}

async function protectedRecords(db) {
  const statements = {
    users: 'SELECT * FROM users ORDER BY id',
    workouts: 'SELECT * FROM workouts WHERE id <= 3 ORDER BY id',
    assignments: 'SELECT * FROM workout_drills WHERE workout_id <= 3 ORDER BY workout_id,position',
    sessions: 'SELECT id,user_id,workout_id,status,started_at,completed_at,total_seconds FROM workout_sessions ORDER BY id',
    results: 'SELECT * FROM drill_results ORDER BY id',
  };
  const records = {};
  for (const [name, sql] of Object.entries(statements)) records[name] = (await db.query(sql)).rows;
  // Migration adds only nullable retry/version columns to existing workout records.
  records.workouts = records.workouts.map(({ request_key, request_fingerprint, replaces_workout_id, ...row }) => row);
  return records;
}

test('fresh in-memory initialization creates the catalog and repeated upgrades preserve all rows', async (t) => {
  const { db, pool } = await fixture(t);
  assert.deepEqual(await applyMigrations(pool, { initialize: true, seed: true }), ['001_integrity_and_sessions.sql']);
  for (const [table, expected] of [['workouts',16],['drills',46],['workout_drills',86]]) {
    assert.equal((await db.query(`SELECT COUNT(*)::int AS n FROM ${table}`)).rows[0].n, expected);
  }
  const before = (await db.query('SELECT * FROM workouts ORDER BY id')).rows;
  assert.deepEqual(await applyMigrations(pool), []);
  await applySeed(pool);
  await applySeed(pool);
  assert.deepEqual((await db.query('SELECT * FROM workouts ORDER BY id')).rows, before);
  assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM workout_drills')).rows[0].n, 86);
  assert.equal((await inspectMigrations(pool))[0].status, 'applied');
});

test('legacy users, custom metadata, edited and extra presets, sessions and results survive upgrade and reseeding', async (t) => {
  const { db, pool } = await fixture(t, { legacy: true });
  const before = await protectedRecords(db);
  await applyMigrations(pool);
  assert.deepEqual(await protectedRecords(db), before);
  const snapshots = (await db.query('SELECT * FROM session_drills ORDER BY session_id,position')).rows;
  assert.equal(snapshots.length, 3);
  await applySeed(pool);
  await applySeed(pool);
  assert.deepEqual(await protectedRecords(db), before);
  assert.deepEqual((await db.query('SELECT * FROM session_drills ORDER BY session_id,position')).rows, snapshots);
  const drill = (await db.query('SELECT * FROM drills WHERE id=1')).rows[0];
  assert.match(drill.instructions, /Workload:/);
  assert.equal(drill.name, 'Personal drill name');
  assert.equal(drill.target_makes, 4);
  assert.equal(drill.target_attempts, 10);
  assert.equal(drill.target_seconds, 90);
});

test('owned slug collisions abort the seed and preserve ownership and the full transaction', async (t) => {
  const { db, pool } = await fixture(t, { legacy: true });
  await applyMigrations(pool);
  await db.query("UPDATE workouts SET slug='shooters-touch' WHERE id=3");
  const before = await protectedRecords(db);
  await assert.rejects(applySeed(pool), /preset slug belongs/);
  assert.deepEqual(await protectedRecords(db), before);
  assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM workouts')).rows[0].n, 3);
  assert.equal((await db.query("SELECT to_regclass('pg_temp.hooproutine_seed_workouts') AS stage")).rows[0].stage, null);
});

test('a late seed failure rolls back inserted catalog rows and instruction updates', async (t) => {
  const { db, pool, query } = await fixture(t, { legacy: true });
  await applyMigrations(pool);
  const before = await protectedRecords(db);
  const drills = (await db.query('SELECT * FROM drills ORDER BY id')).rows;
  const failedPool = { connect: async () => ({ release() {}, async query(sql, params) {
    const result = await query(sql, params);
    if (sql.includes('CREATE TEMP TABLE hooproutine_seed_workouts')) throw new Error('Injected failure before commit');
    return result;
  } }) };
  await assert.rejects(applySeed(failedPool), /Injected failure/);
  assert.deepEqual(await protectedRecords(db), before);
  assert.deepEqual((await db.query('SELECT * FROM drills ORDER BY id')).rows, drills);
  await applySeed(pool); // Stage tables and connection state must allow a clean retry.
});

test('duplicate legacy active sessions stop migration without deleting or merging records', async (t) => {
  const { db, pool } = await fixture(t, { legacy: true });
  await db.query('INSERT INTO workout_sessions(user_id,workout_id) VALUES (1,1)');
  const before = await protectedRecords(db);
  await assert.rejects(applyMigrations(pool), /Duplicate active sessions/);
  assert.deepEqual(await protectedRecords(db), before);
  assert.equal((await db.query("SELECT to_regclass('schema_migrations') AS ledger")).rows[0].ledger, null);
});

test('legacy incomplete measurements are retained, with constraints guarding new writes', async (t) => {
  const { db, pool } = await fixture(t, { legacy: true });
  await db.query('UPDATE drill_results SET attempts=NULL WHERE id=1');
  const before = await protectedRecords(db);
  await applyMigrations(pool);
  assert.deepEqual(await protectedRecords(db), before);
  await assert.rejects(db.query('INSERT INTO drill_results(session_id,drill_id,makes) VALUES(2,2,4)'), /results_attempts_valid/);
});

test('status is read-only; pending, changed, or unknown migration history blocks seed operations', async (t) => {
  const { db, pool, calls } = await fixture(t);
  assert.equal((await inspectMigrations(pool))[0].status, 'pending');
  assert.ok(calls.every((sql) => sql.startsWith('SELECT')));
  assert.equal((await db.query("SELECT to_regclass('schema_migrations') AS ledger")).rows[0].ledger, null);
  await assert.rejects(applySeed(pool), /reviewed migrations/);
  await applyMigrations(pool, { initialize: true });
  const [file] = await loadMigrations();
  await db.query('UPDATE schema_migrations SET checksum=$1', [file.acceptedHashes[1]]);
  assert.deepEqual(await applyMigrations(pool), []); // Legacy CRLF checksums remain valid.
  await db.query("UPDATE schema_migrations SET checksum='changed'");
  await assert.rejects(applySeed(pool), /history differs/);
  await assert.rejects(applyMigrations(pool), /history differs/);
  await db.query('UPDATE schema_migrations SET checksum=$1', [file.hash]);
  await db.query("INSERT INTO schema_migrations(name,checksum) VALUES('999_unknown.sql','unknown')");
  await assert.rejects(applySeed(pool), /history differs/);
  assert.equal((await db.query('SELECT COUNT(*)::int AS n FROM workouts')).rows[0].n, 0);
});
