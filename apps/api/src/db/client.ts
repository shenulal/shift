import path from 'node:path';
import pg from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { API_ROOT } from '../config';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema>;

export const MIGRATIONS_DIR = path.join(API_ROOT, 'drizzle');

export function createPool(databaseUrl: string, max = 10): pg.Pool {
  const pool = new pg.Pool({ connectionString: databaseUrl, max, idleTimeoutMillis: 30_000 });
  // An idle client erroring (e.g. the DB restarted) must not crash the process.
  pool.on('error', (err) => console.error('[db] idle client error:', err.message));
  return pool;
}

export function createDb(pool: pg.Pool): Db {
  return drizzle(pool, { schema });
}

/** Apply pending SQL migrations from ./drizzle (idempotent; tracked in drizzle.__drizzle_migrations). */
export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}
