import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPool } from './pool.js';
import { loadMigrations, maintenanceTransaction, inspectMigrations, assertMigrationStatus, reportMaintenanceFailure } from './maintenance.js';

export async function applySeed(pool) {
  const sql = await fs.readFile(new URL('./seed.sql', import.meta.url), 'utf8');
  const migrations = await loadMigrations();
  return maintenanceTransaction(pool, async (client) => {
    assertMigrationStatus(await inspectMigrations(client, migrations), { requireCurrent: true });
    await client.query(sql);
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  let pool;
  try {
    const files = process.argv.slice(2);
    if (files.length !== 1 || path.resolve(files[0]) !== fileURLToPath(new URL('./seed.sql', import.meta.url))) {
      throw new Error('This runner accepts only db/seed.sql. Use the migration runner for reviewed schema changes.');
    }
    pool = createPool(process.env, console, { maintenance: true });
    await applySeed(pool);
    console.log('Seed applied. Existing workout metadata and drill assignments were preserved.');
  } catch (error) {
    reportMaintenanceFailure(error);
    process.exitCode = 1;
  } finally { if (pool) await pool.end(); }
}
