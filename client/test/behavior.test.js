import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/api.js';
import { formResult, withoutDraft, readDraft, writeDraft, shootingTotals } from '../src/drafts.js';
import { targetText } from '../src/targets.js';

test('switching drill drafts and saving one preserves the other edits', () => {
  const drafts = { 1: formResult({ makes: 3, attempts: 4 }), 2: formResult({ notes: 'Keep elbow aligned' }) };
  const saved = withoutDraft(drafts, 1);
  assert.equal(saved[2].notes, 'Keep elbow aligned');
  assert.equal(saved[1], undefined);
  assert.equal(drafts[1].makes, 3);
});
test('draft storage handles unavailable or malformed browser data', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(writeDraft('test', { title: 'My routine' }, storage), true);
  assert.deepEqual(readDraft('test', {}, storage), { title: 'My routine' });
  values.set('test', 'broken json');
  assert.deepEqual(readDraft('test', {}, storage), {});
  assert.equal(writeDraft('test', {}, { setItem() { throw new Error('quota'); } }), false);
});
test('legacy makes without attempts do not inflate summary accuracy', () => {
  const stats = shootingTotals([{ result: { makes: 20, attempts: null } }, { result: { makes: 0, attempts: 10 } }]);
  assert.equal(stats.makes, 0); assert.equal(stats.attempts, 10);
  assert.match(targetText({ targetRepetitions: 3 }), /3 rounds/);
});
test('API rejects malformed successful responses', async () => {
  const unreadable = createApiClient({ fetchImpl: async () => new Response('not json') });
  await assert.rejects(unreadable('/workouts'), /unreadable/);
  const missing = createApiClient({ fetchImpl: async () => Response.json({}) });
  await assert.rejects(missing('/sessions/1'), /unexpected/);
  await assert.rejects(missing('/sessions/1/drills/2', { method: 'PATCH' }), /unexpected/);
  const empty = createApiClient({ fetchImpl: async () => new Response(null, { status: 204 }) });
  await assert.rejects(empty('/workouts'), /unexpected empty/);
});
test('expired authorization is reported centrally, login rejection is not', async () => {
  let expired = 0;
  const api = createApiClient({ unauthorized: () => expired++, fetchImpl: async () => Response.json({ error: 'Login required' }, { status: 401 }) });
  await assert.rejects(api('/sessions'), (error) => error.status === 401);
  await assert.rejects(api('/auth/login', { method: 'POST' }));
  assert.equal(expired, 1);
});
test('API preserves custom headers and aborts stalled requests', async () => {
  let options;
  const api = createApiClient({ fetchImpl: async (_url, supplied) => { options = supplied; return new Response(null, { status: 204 }); } });
  await api('/auth/logout', { method: 'POST', body: '{}', headers: { 'X-Test': 'yes' } });
  assert.equal(options.headers['Content-Type'], 'application/json'); assert.equal(options.headers['X-Test'], 'yes');
  const slow = createApiClient({ timeoutMs: 5, fetchImpl: (_url, supplied) => new Promise((_resolve, reject) => supplied.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))) });
  await assert.rejects(slow('/workouts'), /timed out/);
});
