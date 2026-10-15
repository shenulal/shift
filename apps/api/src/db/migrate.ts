/** `npm run db:push` / `npm run db:migrate` — create or upgrade the schema. Safe to run on every deploy. */
import { databaseUrlFromEnv, loadDotEnv } from '../config';
import { createDb, createPool, runMigrations } from './client';

loadDotEnv();
const pool = createPool(databaseUrlFromEnv(), 1);
try {
  await runMigrations(createDb(pool));
  console.log('[db] schema is up to date');
} catch (err) {
  console.error('[db] migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
