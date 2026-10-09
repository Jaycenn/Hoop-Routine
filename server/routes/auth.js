import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { COOKIE_NAME } from '../lib/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { transaction } from '../lib/transaction.js';
import { rateLimit } from '../lib/rateLimit.js';
import { cleanEmail, isValidEmail, validatePasswordConfirmation, validateNewPassword, objectBody, ValidationError } from '../lib/validation.js';

export function createAuthRouter(pool, auth) {
  const router = Router();
  const attempts = rateLimit({ limit: 30, windowMs: 15 * 60 * 1000 });
  const accounts = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000, key: (req) => cleanEmail(req.body?.email) || req.ip });
  const registrations = rateLimit({ limit: 10, windowMs: 60 * 60 * 1000 });
  const publicUser = (row) => ({ id: Number(row.id), name: row.display_name, email: row.email });

  router.post('/register', registrations, asyncHandler(async (req, res) => {
    const body = objectBody(req.body);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = cleanEmail(body.email);
    if (name.length < 2 || name.length > 80) throw new ValidationError('Name must contain between 2 and 80 characters.');
    if (!isValidEmail(email) || email.length > 255) throw new ValidationError('Enter a valid email address.');
    validateNewPassword(body.password);
    validatePasswordConfirmation(body.password, body.confirmPassword);
    const hash = await bcrypt.hash(body.password, 12);
    try {
      const result = await transaction(pool, async (client) => {
        const { rows } = await client.query('INSERT INTO users (display_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, display_name, email', [name, email, hash]);
        return { user: publicUser(rows[0]), token: await auth.issue(client, rows[0]) };
      });
      auth.setCookie(res, result.token);
      res.status(201).json({ user: result.user });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'An account already uses that email address.' });
      throw error;
    }
  }));
  router.post('/login', attempts, accounts, asyncHandler(async (req, res) => {
    const body = objectBody(req.body);
    const email = cleanEmail(body.email);
    // Existing long passwords still work; only new passwords use the 72-byte policy.
    if (!isValidEmail(email) || email.length > 255 || typeof body.password !== 'string' || !body.password || body.password.length > 128) {
      throw new ValidationError('Enter your email address and password.');
    }
    const { rows } = await pool.query('SELECT id, display_name, email, password_hash FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(body.password, user.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const token = await transaction(pool, (client) => auth.issue(client, user));
    auth.setCookie(res, token);
    res.json({ user: publicUser(user) });
  }));
  router.get('/me', auth.requireAuth, (req, res) => res.json({ user: req.user }));
  router.post('/logout', asyncHandler(async (req, res) => {
    await auth.revoke(req.cookies?.[COOKIE_NAME]);
    auth.clearCookie(res);
    res.status(204).end();
  }));
  return router;
}
