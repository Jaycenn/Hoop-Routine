export async function transaction(pool, work) {
  const client = await pool.connect();
  let phase = 'begin';
  let discard;
  try {
    await client.query('BEGIN');
    phase = 'work';
    const result = await work(client);
    phase = 'commit';
    await client.query('COMMIT');
    return result;
  } catch (error) {
    error.transactionPhase = phase;
    // A lost COMMIT acknowledgement must not be reported as a confirmed rollback.
    if (phase === 'commit') error.commitOutcomeUnknown = true;
    if (phase !== 'work' || /timeout|connection|socket/i.test(error.message || '')
        || /^08/.test(error.code || '') || ['ECONNRESET', 'EPIPE', '57P01'].includes(error.code)) discard = error;
    try { await client.query('ROLLBACK'); }
    catch { error.rollbackFailed = true; discard = error; }
    throw error;
  } finally {
    client.release(discard);
  }
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
