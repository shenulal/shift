import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { inject } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { DEMO_TODAY, setToday } from '@shift/core';
import { buildApp, type BuildOptions } from '../src/app';
import { loadConfig } from '../src/config';
import { createDb, createPool, runMigrations, type Db } from '../src/db/client';
import { PgStore } from '../src/db/store';
import { seedDatabase } from '../src/seed';

export const ADMIN_PW = 'admin-pass-123';
export const CLIENT_PW = 'client-pass-123';

export interface TestDb {
  url: string;
  pool: pg.Pool;
  db: Db;
  store: PgStore;
  close(): Promise<void>;
}

/** A fresh, migrated database inside the shared test cluster. */
export async function createTestDb(): Promise<TestDb> {
  const base = inject('pgUrl');
  const name = `t_${randomBytes(6).toString('hex')}`;
  const admin = new pg.Client({ connectionString: base });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();
  const url = base.replace(/\/[^/]*$/, `/${name}`);
  const pool = createPool(url, 5);
  const db = createDb(pool);
  await runMigrations(db);
  return {
    url,
    pool,
    db,
    store: new PgStore(db),
    async close() {
      await pool.end();
      const c = new pg.Client({ connectionString: base });
      await c.connect();
      await c.query(`drop database if exists ${name} with (force)`);
      await c.end();
    },
  };
}

export async function seedDemo(store: PgStore) {
  setToday(DEMO_TODAY);
  return seedDatabase(store, { demo: true, reset: true, adminPassword: ADMIN_PW, clientPassword: CLIENT_PW, rounds: 4 });
}

export async function makeApp(t: TestDb, overrides: Partial<BuildOptions> = {}, env: Record<string, string> = {}): Promise<FastifyInstance> {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: t.url,
    COOKIE_SECRET: 'test-cookie-secret-0123456789abcdefghijkl',
    UPLOAD_DIR: mkdtempSync(path.join(inject('tmpRoot'), 'uploads-')),
    DEMO_TODAY,
    ...env,
  });
  const app = await buildApp({ config, pool: t.pool, emailWorker: false, mailer: null, rateLimits: { login: 1000, register: 1000, actions: 10000, uploads: 1000 }, ...overrides });
  await app.ready();
  return app;
}

/** Log in and return the Cookie header to send on later requests. */
export async function login(app: FastifyInstance, email: string, password: string): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });
  if (res.statusCode !== 200) throw new Error(`login failed ${res.statusCode}: ${res.body}`);
  const c = res.cookies.find((x) => x.name === 'sid');
  if (!c) throw new Error('no sid cookie');
  return `sid=${c.value}`;
}

export const json = <T = any>(res: { body: string }) => JSON.parse(res.body) as T;
