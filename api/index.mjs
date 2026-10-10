import { createApp } from '../server/app.js';
import { createPool } from '../server/db/pool.js';
import { appConfig } from '../server/lib/config.js';

const config = appConfig();
const pool = createPool();

export default createApp({ pool, config });
