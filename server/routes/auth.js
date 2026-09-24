import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool.js';
import {
  clearSessionCookie,
  createSessionToken,
  requireAuth,
  setSessionCookie,
} from '../lib/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { cleanEmail, isValidEmail, ValidationError } from '../lib/validation.js';

export const authRouter = Router();

function publicUser(row) {
  return { id: Number(row.id), name: row.display_name, email: row.email };
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = cleanEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (name.length < 2 || name.length > 80) {
    throw new ValidationError('Name must contain between 2 and 80 characters.');
  }
  if (!isValidEmail(email) || email.length > 255) {
    throw new ValidationError('Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new ValidationError('Password must contain between 8 and 128 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      `INSERT INTO users (display_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, display_name, email`,
      [name, email, passwordHash],
    );
    const user = result.rows[0];
    setSessionCookie(res, createSessionToken(user));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account already uses that email address.' });
    }
    throw error;
  }
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const email = cleanEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email) || !password) {
    throw new ValidationError('Enter your email address and password.');
  }

  const result = await pool.query(
    `SELECT id, display_name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email],
  );
  const user = result.rows[0];
  const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  setSessionCookie(res, createSessionToken(user));
  return res.json({ user: publicUser(user) });
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, display_name, email FROM users WHERE id = $1',
    [req.user.id],
  );
  if (!result.rows[0]) {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Account not found.' });
  }
  return res.json({ user: publicUser(result.rows[0]) });
}));

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

