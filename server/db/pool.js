import pg from 'pg';
import { databaseConfig, maintenanceConfig } from '../lib/config.js';

export function createPool(env = process.env, logger = console, { maintenance = false } = {}) {
  const pool = new pg.Pool(maintenance ? maintenanceConfig(env) : databaseConfig(env));
  pool.on('error', (error) => logger.error('PostgreSQL idle connection failed', { code: error.code || 'UNKNOWN' }));
  return pool;
}

