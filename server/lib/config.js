function integer(value, fallback, min, max, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) throw new Error(`Invalid ${name}.`);
  return parsed;
}

export function databaseConfig(env = process.env) {
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error('Set a valid PostgreSQL DATABASE_URL.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL must use PostgreSQL.');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const mode = url.searchParams.get('sslmode');
  if (env.DATABASE_SSL && !['true', 'false'].includes(env.DATABASE_SSL)) throw new Error('DATABASE_SSL must be true or false.');
  const encrypted = env.DATABASE_SSL === 'true' || (mode && mode !== 'disable') || !local;
  if (!local && (env.DATABASE_SSL === 'false' || mode === 'disable')) {
    throw new Error('Remote PostgreSQL connections require verified TLS. Set DATABASE_SSL=true.');
  }
  // URL SSL options must not override certificate verification below.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'sslpassword', 'ssl', 'uselibpqcompat']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: encrypted ? { rejectUnauthorized: true, ...(env.DATABASE_CA ? { ca: env.DATABASE_CA } : {}) } : false,
    max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
    statement_timeout: 10000, query_timeout: 12000,
  };
}

export function maintenanceConfig(env = process.env) {
  const config = databaseConfig(env);
  const url = new URL(config.connectionString);
  // Maintenance budgets cannot be silently overridden by URL query parameters.
  for (const key of ['statement_timeout', 'query_timeout', 'lock_timeout', 'idle_in_transaction_session_timeout']) url.searchParams.delete(key);
  return { ...config, connectionString: url.toString(), max: 1, connectionTimeoutMillis: 15000,
    statement_timeout: integer(env.MIGRATION_STATEMENT_TIMEOUT_MS, 60000, 1000, 900000, 'MIGRATION_STATEMENT_TIMEOUT_MS'),
    lock_timeout: integer(env.MIGRATION_LOCK_TIMEOUT_MS, 5000, 100, 60000, 'MIGRATION_LOCK_TIMEOUT_MS'),
    idle_in_transaction_session_timeout: 120000,
    // Let PostgreSQL cancel a timed-out statement before queuing ROLLBACK.
    // A client timer on a multi-statement SQL file can otherwise expire mid-file.
    query_timeout: 0 };
}

export function appConfig(env = process.env) {
  const secret = env.JWT_SECRET || '';
  if (secret.length < 32 || /replace|your[-_ ]?secret|change[-_ ]?me/i.test(secret)) {
    throw new Error('JWT_SECRET must be a private random value of at least 32 characters, not a template.');
  }
  const production = env.NODE_ENV === 'production';
  const sameSite = (env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite) || (sameSite === 'none' && !production)) {
    throw new Error('COOKIE_SAME_SITE must be lax/strict, or none with production HTTPS.');
  }
  if (production && !env.CORS_ORIGINS) throw new Error('Set explicit HTTPS CORS_ORIGINS in production.');
  const allowedOrigins = (env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((v) => v.trim()).filter(Boolean);
  if (!allowedOrigins.length) throw new Error('Configure at least one allowed frontend origin.');
  for (const origin of allowedOrigins) {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new Error('Invalid CORS_ORIGINS.'); }
    if (parsed.origin !== origin || !['http:', 'https:'].includes(parsed.protocol)
        || (production && parsed.protocol !== 'https:')) throw new Error('CORS_ORIGINS must contain exact origins; production requires HTTPS.');
  }
  return { secret, production, sameSite, allowedOrigins,
    port: integer(env.PORT, 3001, 1, 65535, 'PORT'),
    trustProxy: integer(env.TRUST_PROXY_HOPS, 0, 0, 5, 'TRUST_PROXY_HOPS') };
}
