import { createApp } from './app.js';
import { createPool } from './db/pool.js';
import { appConfig } from './lib/config.js';

const config = appConfig();
const pool = createPool();
const app = createApp({ pool, config });
const server = app.listen(config.port, () => console.log(`HoopRoutine API listening on port ${config.port}`));
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.on('error', (error) => { console.error('HTTP server failed', { code: error.code }); process.exitCode = 1; pool.end(); });
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 15000);
  deadline.unref();
  server.close(async () => {
    try { await pool.end(); clearTimeout(deadline); }
    catch { process.exitCode = 1; }
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
