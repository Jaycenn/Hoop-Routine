import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { appConfig, databaseConfig } from '../lib/config.js';
import { transaction } from '../lib/transaction.js';
import { workoutMetadata } from '../lib/workoutMetadata.js';
import { rateLimit } from '../lib/rateLimit.js';

test('whole seeded library retains its focus and full duration', async () => {
  const sql = await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8');
  const section = sql.slice(sql.indexOf('INSERT INTO hooproutine_seed_drills'), sql.indexOf('UPDATE hooproutine_seed_drills AS drill'));
  const pattern = /\('([^']+)', '([^']+)', '([^']+)',\s*E?'(?:[^']|'')*',\s*(NULL|\d+),\s*(NULL|\d+),\s*(NULL|\d+),\s*(\d+)\)/g;
  const drills = [...section.matchAll(pattern)].map((m) => ({ category: m[3], target_seconds: Number(m[7]), training_type: 'on_court' }));
  assert.equal(drills.length, 46);
  const metadata = workoutMetadata(drills);
  assert.equal(metadata.focus.length, 147);
  assert.equal(metadata.estimatedMinutes, 377);
});

test('every seeded drill has one authoritative guide, a workload, and equipment', async () => {
  const sql = await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8');
  const guides = [...sql.matchAll(/E'1\.[\s\S]*?Workload:[\s\S]*?Recording:[^']*'/g)];
  assert.equal(guides.length, 46);
  assert.equal((sql.match(/AS guide\(slug, instructions\)/g) || []).length, 0);
  const equipment = sql.slice(sql.indexOf('UPDATE hooproutine_seed_drills AS drill'), sql.indexOf('INSERT INTO hooproutine_seed_assignments'));
  assert.equal([...equipment.matchAll(/\('[^']+', '(?:on_court|off_court|recovery)', '[^']+'\)/g)].length, 46);
});

test('configuration rejects template secrets and insecure cookie combinations', () => {
  assert.throws(() => appConfig({ JWT_SECRET: 'replace-with-at-least-32-random-characters' }));
  assert.throws(() => appConfig({ JWT_SECRET: 'a'.repeat(40), COOKIE_SAME_SITE: 'none' }));
  assert.throws(() => appConfig({ JWT_SECRET: 'a'.repeat(40), NODE_ENV: 'production', CORS_ORIGINS: 'http://example.com' }));
  assert.equal(appConfig({ JWT_SECRET: 'a'.repeat(40) }).port, 3001);
});

test('connection URL cannot disable certificate verification for remote databases', () => {
  const result = databaseConfig({ DATABASE_URL: 'postgres://test:test@db.example.com/test?sslmode=require', DATABASE_SSL: 'true' });
  assert.equal(result.ssl.rejectUnauthorized, true);
  assert.equal(new URL(result.connectionString).searchParams.has('sslmode'), false);
  assert.throws(() => databaseConfig({ DATABASE_URL: 'postgres://test:test@db.example.com/test?sslmode=disable' }));
});

test('transactions roll back and release on failure; successful operations commit', async () => {
  const calls = [];
  const pool = { connect: async () => ({ query: async (sql) => calls.push(sql), release: () => calls.push('RELEASE') }) };
  await assert.rejects(transaction(pool, async () => { throw new Error('failed'); }), /failed/);
  assert.deepEqual(calls, ['BEGIN', 'ROLLBACK', 'RELEASE']);
  calls.length = 0;
  assert.equal(await transaction(pool, async () => 12), 12);
  assert.deepEqual(calls, ['BEGIN', 'COMMIT', 'RELEASE']);
});

test('rate limiting blocks repeated attempts and allows a later window', () => {
  let time = 1000;
  let accepted = 0;
  let status;
  const limiter = rateLimit({ limit: 2, windowMs: 100, now: () => time });
  const res = { set() {}, status(code) { status = code; return this; }, json() {} };
  for (let i = 0; i < 3; i++) limiter({ ip: '127.0.0.1' }, res, () => accepted++);
  assert.equal(accepted, 2); assert.equal(status, 429);
  time = 1100;
  limiter({ ip: '127.0.0.1' }, res, () => accepted++);
  assert.equal(accepted, 3);
});
