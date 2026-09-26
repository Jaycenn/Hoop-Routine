import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { pool } from './db/pool.js';
import { authRouter } from './routes/auth.js';
import { progressRouter } from './routes/progress.js';
import { sessionsRouter } from './routes/sessions.js';
import { workoutsRouter } from './routes/workouts.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/progress', progressRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on the server.' : error.message,
  });
});

const server = app.listen(port, () => {
  console.log(`HoopRoutine API listening on http://localhost:${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Closing HoopRoutine API.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
