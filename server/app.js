import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { createAuth } from './lib/auth.js';
import { createAuthRouter } from './routes/auth.js';
import { createProgressRouter } from './routes/progress.js';
import { createSessionsRouter } from './routes/sessions.js';
import { createWorkoutsRouter } from './routes/workouts.js';
import { httpError } from './lib/transaction.js';

export function createApp({ pool, config, logger = console }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({ 'X-Request-ID': req.requestId, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' });
    next();
  });
  app.use(cors({ credentials: true, origin(origin, callback) {
    callback(!origin || config.allowedOrigins.includes(origin) ? null : httpError(403, 'Origin is not allowed.'), true);
  } }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use('/api', (req, _res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-length'] !== '0'
        && req.headers['content-length'] && !req.is('application/json')) return next(httpError(415, 'Send application/json.'));
    next();
  });
  const auth = createAuth(pool, config);
  app.get('/api/health', async (_req, res, next) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch (error) { next(error); }
  });
  app.use('/api/auth', createAuthRouter(pool, auth));
  app.use('/api/workouts', createWorkoutsRouter(pool, auth.requireAuth));
  app.use('/api/sessions', createSessionsRouter(pool, auth.requireAuth));
  app.use('/api/progress', createProgressRouter(pool, auth.requireAuth));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
  app.use((error, req, res, _next) => {
    let status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
    if (['ECONNREFUSED', 'ETIMEDOUT', '57P01', '53300', '57014'].includes(error.code)) status = 503;
    if (status >= 500) logger.error('API request failed', { requestId: req.requestId, code: error.code || 'UNKNOWN' });
    const message = error.type === 'entity.parse.failed' ? 'Send valid JSON.'
      : status >= 500 ? 'The service is temporarily unavailable. Please try again.' : error.message;
    res.status(status).json({ error: message, requestId: req.requestId });
  });
  return app;
}
