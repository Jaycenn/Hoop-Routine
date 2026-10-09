import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { transaction } from '../lib/transaction.js';

const digest = (text) => createHash('sha256').update(text).digest('hex');
export async function loadMigrations() {
  const folder = new URL('./migrations/', import.meta.url);
  const names = (await fs.readdir(folder)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  return Promise.all(names.map(async (name) => {
    const sql = (await fs.readFile(new URL(name, folder), 'utf8')).replace(/\r\n/g, '\n');
    // Accept old runner hashes with either checkout line ending; all new hashes use LF.
    return { name, sql, hash: digest(sql), acceptedHashes: [digest(sql), digest(sql.replace(/\n/g, '\r\n'))] };
  }));
}

export async function maintenanceTransaction(pool, work) {
  return transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('hooproutine-migrations', 0))");
    return work(client);
  });
}

export async function inspectMigrations(database, migrations = null) {
  const files = migrations || await loadMigrations();
  const { rows: existence } = await database.query("SELECT to_regclass('schema_migrations') AS ledger");
  const rows = existence[0]?.ledger ? (await database.query('SELECT name, checksum FROM schema_migrations')).rows : [];
  const applied = new Map(rows.map((row) => [row.name, row.checksum]));
  return [
    ...files.map((file) => ({ name: file.name, status: !applied.has(file.name) ? 'pending'
      : file.acceptedHashes.includes(applied.get(file.name)) ? 'applied' : 'checksum_mismatch' })),
    ...rows.filter((row) => !files.some((file) => file.name === row.name)).map((row) => ({ name: row.name, status: 'unknown_to_this_checkout' })),
  ];
}

export function assertMigrationStatus(status, { requireCurrent = false } = {}) {
  if (status.some((row) => !['pending', 'applied'].includes(row.status))) {
    throw new Error('Migration history differs from this checkout. Inspect db:status; do not edit applied migrations or retry blindly.');
  }
  if (requireCurrent && status.some((row) => row.status !== 'applied')) {
    throw new Error('Apply and verify all reviewed migrations before seeding.');
  }
}

export function reportMaintenanceFailure(error, logger = console) {
  logger.error('Database maintenance failed.', { code: error.code || 'MAINTENANCE_ERROR', phase: error.transactionPhase || 'setup' });
  if (error.commitOutcomeUnknown) logger.error('COMMIT outcome is unknown. Run db:status and inspect data before deciding whether to retry.');
  else if (error.rollbackFailed) logger.error('Rollback could not be confirmed; the connection was discarded. Inspect database state before retrying.');
  else if (error.transactionPhase) logger.error('The transaction was rolled back. Resolve the cause before retrying.');
  // SQL error details may contain row values or credentials; never dump the error object.
  if (!error.code && !error.commitOutcomeUnknown && !error.rollbackFailed && error.transactionPhase !== 'begin') {
    logger.error(error.message);
  }
}
