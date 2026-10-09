import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPool } from './pool.js';
import { loadMigrations, maintenanceTransaction, inspectMigrations, assertMigrationStatus, reportMaintenanceFailure } from './maintenance.js';

export async function applyMigrations(pool, { initialize = false, reset = false, seed = false } = {}) {
  if (reset && process.env.CONFIRM_DATABASE_RESET !== 'DELETE_ALL_HOOPROUTINE_DATA') throw new Error('Reset requires explicit CONFIRM_DATABASE_RESET.');
  const migrations = await loadMigrations();
  const resetSql = reset ? await fs.readFile(new URL('./reset.sql', import.meta.url), 'utf8') : null;
  const schemaSql = initialize ? await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8') : null;
  const seedSql = seed ? await fs.readFile(new URL('./seed.sql', import.meta.url), 'utf8') : null;
  return maintenanceTransaction(pool, async (client) => {
    if (resetSql) await client.query(resetSql);
    if (schemaSql) await client.query(schemaSql);
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const status = await inspectMigrations(client, migrations);
    assertMigrationStatus(status);
    const applied = new Set(status.filter((row) => row.status === 'applied').map((row) => row.name));
    const completed = [];
    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        continue;
      }
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [migration.name, migration.hash]);
      completed.push(migration.name);
    }
    if (seedSql) await client.query(seedSql);
    return completed;
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  let pool;
  try {
    const flags = process.argv.slice(2);
    if (flags.some((flag) => !['--init', '--reset', '--seed', '--status'].includes(flag))
        || (flags.includes('--status') && flags.length !== 1)) throw new Error('Use --status alone, or the reviewed --init/--seed/--reset options.');
    pool = createPool(process.env, console, { maintenance: true });
    if (flags.includes('--status')) console.table(await inspectMigrations(pool));
    else console.log('Applied migrations:', await applyMigrations(pool, { initialize: flags.includes('--init'), reset: flags.includes('--reset'), seed: flags.includes('--seed') }));
  } catch (error) {
    reportMaintenanceFailure(error);
    process.exitCode = 1;
  } finally { if (pool) await pool.end(); }
}
