import fs from 'node:fs/promises';
import { pool } from './pool.js';

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error('Usage: node db/run.js <file.sql> [more.sql]');
  process.exitCode = 1;
} else {
  try {
    for (const file of files) {
      const sql = await fs.readFile(file, 'utf8');
      await pool.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await pool.end();
  }
}

