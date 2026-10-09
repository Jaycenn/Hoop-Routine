import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { asyncHandler } from './asyncHandler.js';

export const COOKIE_NAME = 'hoop_session';
export function createAuth(pool, config) {
  const cookie = { httpOnly: true, secure: config.production, sameSite: config.sameSite, path: '/' };
  function payload(token) {
    const value = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: 'hooproutine', audience: 'hooproutine-web' });
    if (!Number.isSafeInteger(Number(value.sub)) || Number(value.sub) < 1 || typeof value.jti !== 'string'
        || !/^[0-9a-f-]{36}$/i.test(value.jti)) throw new Error('Invalid session claims.');
    return value;
  }
  return {
    clearCookie(res) { res.clearCookie(COOKIE_NAME, cookie); },
    setCookie(res, token) { res.cookie(COOKIE_NAME, token, { ...cookie, maxAge: 7 * 24 * 60 * 60 * 1000 }); },
    async issue(client, user) {
      const id = randomUUID();
      const token = jwt.sign({}, config.secret, { subject: String(user.id), jwtid: id,
        expiresIn: '7d', algorithm: 'HS256', issuer: 'hooproutine', audience: 'hooproutine-web' });
      await client.query("INSERT INTO auth_sessions (id, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')", [id, user.id]);
      await client.query('DELETE FROM auth_sessions WHERE expires_at <= NOW()');
      return token;
    },
    requireAuth: asyncHandler(async (req, res, next) => {
      let claims;
      try { claims = payload(req.cookies?.[COOKIE_NAME]); }
      catch {
        res.clearCookie(COOKIE_NAME, cookie);
        return res.status(401).json({ error: 'Please log in to continue.' });
      }
      // Database outages propagate as service errors, not as expired authentication.
      const { rows } = await pool.query(
        `SELECT u.id, u.display_name, u.email FROM auth_sessions a JOIN users u ON u.id = a.user_id
         WHERE a.id = $1 AND a.user_id = $2 AND a.expires_at > NOW()`, [claims.jti, claims.sub],
      );
      if (!rows[0]) {
        res.clearCookie(COOKIE_NAME, cookie);
        return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
      }
      req.user = { id: Number(rows[0].id), name: rows[0].display_name, email: rows[0].email };
      req.authSessionId = claims.jti;
      next();
    }),
    async revoke(token) {
      let claims;
      try { claims = payload(token); } catch { return; }
      await pool.query('DELETE FROM auth_sessions WHERE id = $1 AND user_id = $2', [claims.jti, claims.sub]);
    },
  };
}
