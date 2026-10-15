/**
 * `npm run db:seed [-- --reset] [-- --overwrite]`
 *
 *  - Always loads core's masterSeed() (the coach-editable content from the designs).
 *  - SEED_DEMO=true also loads demoSeed() (sample clients, leads, schedule, analytics).
 *  - Idempotent: by default existing rows (same id) are left untouched, so the coach's edits survive re-running the seed
 *    on every deploy. `--overwrite` upserts seed rows over existing ones; `--reset` truncates every table first.
 *  - Seeded users get passwords from SEED_ADMIN_PASSWORD / SEED_CLIENT_PASSWORD (only users without a password yet,
 *    unless --reset). Without demo data an admin account is created from settings.adminAccount.
 */
import { fileURLToPath } from 'node:url';
import { masterSeed, demoSeed, type RecOf, type StoreData } from '@shift/core';
import { databaseUrlFromEnv, loadDotEnv } from './config';
import { createDb, createPool, runMigrations } from './db/client';
import { PgStore } from './db/store';
import { hashPassword } from './auth';

export interface SeedOptions {
  demo: boolean;
  reset?: boolean;
  overwrite?: boolean;
  adminPassword: string;
  clientPassword: string;
  /** bcrypt cost (tests use a low value). */
  rounds?: number;
}

export interface SeedReport {
  written: Record<string, number>;
  passwords: { email: string; role: string; password: string }[];
}

export async function seedDatabase(store: PgStore, opts: SeedOptions): Promise<SeedReport> {
  if (opts.reset) await store.truncateAll();
  const mode = opts.overwrite ? 'overwrite' : 'insert-missing';
  const written: Record<string, number> = {};
  const add = (w: Record<string, number>) => Object.entries(w).forEach(([k, n]) => n && (written[k] = (written[k] ?? 0) + n));

  add(await store.load(masterSeed(), mode));

  if (opts.demo) {
    const demo: StoreData = demoSeed();
    // Skip demo users whose email already belongs to someone else (e.g. the admin created by a non-demo seed).
    const existing = await store.list('users');
    demo.users = (demo.users ?? []).filter((u) => !existing.some((e) => e.id !== u.id && e.email.toLowerCase() === u.email.toLowerCase()));
    add(await store.load(demo, mode));
  } else {
    const [settings] = await store.list('settings');
    const account = settings?.adminAccount;
    if (account?.email && !(await store.list('users', { where: { email: account.email.toLowerCase() } })).length) {
      const t = new Date().toISOString();
      const admin = {
        id: 'admin', sort: 1, active: true, ownerId: null, createdAt: t, updatedAt: t,
        name: account.name, email: account.email.toLowerCase(), role: 'admin', initials: account.name.slice(0, 1).toUpperCase(),
        avatarColor: 'deep', journeyAccess: true, toolkitIds: [],
      } as unknown as RecOf<'users'>;
      add({ users: await store.upsertMany('users', [admin]) });
    }
  }

  // Passwords for users that don't have one yet.
  const passwords: SeedReport['passwords'] = [];
  for (const u of await store.list('users')) {
    if (u.passwordHash) continue;
    const password = u.role === 'admin' ? opts.adminPassword : opts.clientPassword;
    await store.update('users', u.id, { passwordHash: await hashPassword(password, opts.rounds) });
    passwords.push({ email: u.email, role: u.role, password });
  }
  return { written, passwords };
}

// ── CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  loadDotEnv();
  const args = new Set(process.argv.slice(2));
  const pool = createPool(databaseUrlFromEnv(), 2);
  try {
    const db = createDb(pool);
    await runMigrations(db);
    const store = new PgStore(db);
    const report = await seedDatabase(store, {
      demo: process.env.SEED_DEMO === 'true',
      reset: args.has('--reset'),
      overwrite: args.has('--overwrite'),
      adminPassword: process.env.SEED_ADMIN_PASSWORD || 'shift-admin-2026',
      clientPassword: process.env.SEED_CLIENT_PASSWORD || 'shift-client-2026',
    });
    const total = Object.values(report.written).reduce((a, b) => a + b, 0);
    console.log(`[seed] ${args.has('--reset') ? 'reset + ' : ''}${process.env.SEED_DEMO === 'true' ? 'master + demo' : 'master'} data: ${total} rows written` + (total ? ` (${Object.entries(report.written).map(([k, n]) => `${k} ${n}`).join(', ')})` : ' (everything already present)'));
    if (report.passwords.length) {
      console.log('[seed] passwords set for users without one:');
      for (const p of report.passwords) console.log(`         ${p.role.padEnd(6)} ${p.email.padEnd(32)} ${p.password}`);
      if (process.env.NODE_ENV === 'production') console.log('[seed] change these passwords after first sign-in (POST /api/auth/password).');
    } else console.log('[seed] all users already have passwords (unchanged)');
  } catch (err) {
    console.error('[seed] failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
