import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../app.js';
import { appConfig } from '../lib/config.js';
import { createAuth } from '../lib/auth.js';

test('HTTP middleware, authentication, authorization failure, and safe errors', async (t) => {
  const config = appConfig({ JWT_SECRET: 'test-only-key-not-used-by-real-accounts-123456' });
  let unavailable = false;
  let revoked = false;
  const pool = { async query(sql, params) {
    if (unavailable) throw Object.assign(new Error('private connection details'), { code: 'ECONNREFUSED' });
    if (sql.includes('FROM auth_sessions a')) return { rows: revoked ? [] : [{ id: 1, display_name: 'Test Player', email: 'player@example.invalid' }] };
    if (sql.includes('DELETE FROM auth_sessions WHERE id')) revoked = true;
    if (sql.includes('FROM workout_sessions')) assert.equal(params[1], 1);
    return { rows: [] };
  } };
  const auth = createAuth(pool, config);
  const token = await auth.issue(pool, { id: 1 });
  const app = createApp({ pool, config, logger: { error() {} } });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  assert.equal((await fetch(base + '/health')).status, 200);
  assert.equal((await fetch(base + '/workouts')).status, 401);
  assert.equal((await fetch(base + '/sessions/9', { headers: { Cookie: `hoop_session=${token}` } })).status, 404);
  assert.equal((await fetch(base + '/sessions/not-an-id', { headers: { Cookie: `hoop_session=${token}` } })).status, 400);
  assert.equal((await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
  assert.equal((await fetch(base + '/health', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
  assert.equal((await fetch(base + '/auth/logout', { method: 'POST', headers: { Cookie: `hoop_session=${token}` } })).status, 204);
  assert.equal((await fetch(base + '/auth/me', { headers: { Cookie: `hoop_session=${token}` } })).status, 401);
  unavailable = true;
  const failed = await fetch(base + '/health');
  assert.equal(failed.status, 503);
  assert.equal((await failed.text()).includes('private connection details'), false);
});

test('registration, password verification, and logout with an isolated authentication store', async (t) => {
  const config = appConfig({ JWT_SECRET: 'second-test-only-secret-not-for-production-12345' });
  const users = new Map();
  const sessions = new Map();
  const pool = {
    async connect() { return { query: this.query.bind(this), release() {} }; },
    async query(sql, values = []) {
      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rows: [] };
      if (sql.startsWith('INSERT INTO users')) {
        if (users.has(values[1])) throw Object.assign(new Error('duplicate'), { code: '23505' });
        const user = { id: users.size + 1, display_name: values[0], email: values[1], password_hash: values[2] };
        users.set(user.email, user); return { rows: [user] };
      }
      if (sql.startsWith('INSERT INTO auth_sessions')) { sessions.set(values[0], Number(values[1])); return { rows: [] }; }
      if (sql.startsWith('DELETE FROM auth_sessions WHERE expires_at')) return { rows: [] };
      if (sql.startsWith('DELETE FROM auth_sessions WHERE id')) { sessions.delete(values[0]); return { rows: [] }; }
      if (sql.includes('FROM users WHERE email')) return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
      if (sql.includes('FROM auth_sessions a')) return { rows: [...users.values()].filter((user) => user.id === sessions.get(values[0]) && user.id === Number(values[1])) };
      throw new Error('Unexpected fixture query');
    },
  };
  const server = createApp({ pool, config, logger: { error() {} } }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const credentials = { name: 'Test Player', email: 'player@example.invalid', password: 'test-password-123', confirmPassword: 'test-password-123' };
  const registered = await post('/register', credentials);
  assert.equal(registered.status, 201);
  assert.equal((await registered.json()).user.email, credentials.email);
  assert.notEqual(users.get(credentials.email).password_hash, credentials.password);
  const cookie = registered.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(base + '/me', { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await post('/register', credentials)).status, 409);
  assert.equal((await post('/login', { email: credentials.email, password: 'wrong-password' })).status, 401);
  assert.equal((await post('/login', credentials)).status, 200);
  assert.equal((await fetch(base + '/logout', { method: 'POST', headers: { Cookie: cookie } })).status, 204);
  assert.equal((await fetch(base + '/me', { headers: { Cookie: cookie } })).status, 401);
});
