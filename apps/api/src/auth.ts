import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt, lt, ne } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ActionError, isAdmin, publicUser, type Actor, type Rec, type User } from '@shift/core';
import type { Db } from './db/client';
import { sessions } from './db/schema';
import type { PgStore } from './db/store';

export const SESSION_COOKIE = 'sid';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything beyond 72 bytes — reject instead of silently truncating

declare module 'fastify' {
  interface FastifyRequest {
    /** The signed-in user (password hash stripped) or null for visitors. Resolved once per request. */
    actor: Actor;
    /** sha256 id of the current session, if any. */
    sessionId: string | null;
  }
}

// ───────────────────────────────────────────── passwords

export function bcryptRounds(): number {
  const n = Number(process.env.BCRYPT_ROUNDS ?? 12);
  return Number.isInteger(n) && n >= 4 && n <= 15 ? n : 12;
}

export function validatePassword(pw: unknown): string {
  if (typeof pw !== 'string' || pw.length < PASSWORD_MIN) throw new ActionError(`Password must be at least ${PASSWORD_MIN} characters`);
  if (Buffer.byteLength(pw, 'utf8') > PASSWORD_MAX_BYTES) throw new ActionError('Password is too long (max 72 bytes)');
  return pw;
}

export const hashPassword = (pw: string, rounds = bcryptRounds()) => bcrypt.hash(pw, rounds);

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hash('not-a-real-password', bcryptRounds()));

export async function verifyPassword(pw: string, hash: string | undefined | null): Promise<boolean> {
  if (!hash) {
    await bcrypt.compare(pw, await getDummyHash());
    return false;
  }
  return bcrypt.compare(pw, hash);
}

// ───────────────────────────────────────────── sessions

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(db: Db, userId: string, userAgent?: string): Promise<{ token: string; id: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt, userAgent: userAgent?.slice(0, 300) ?? null });
  return { token, id, expiresAt };
}

export async function findSession(db: Db, token: string) {
  const [row] = await db.select().from(sessions).where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  return row ?? null;
}

export async function deleteSession(db: Db, id: string) {
  await db.delete(sessions).where(eq(sessions.id, id));
}

/** Sign the user out everywhere (optionally keeping the current session). */
export async function deleteUserSessions(db: Db, userId: string, exceptId?: string | null) {
  await db.delete(sessions).where(exceptId ? and(eq(sessions.userId, userId), ne(sessions.id, exceptId)) : eq(sessions.userId, userId));
}

export async function purgeExpiredSessions(db: Db) {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// ───────────────────────────────────────────── fastify wiring

export interface AuthOptions {
  db: Db;
  store: PgStore;
  secureCookies: boolean;
  loginRateLimit: number;
  registerRateLimit: number;
}

function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date, secure: boolean) {
  reply.setCookie(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', secure, signed: true, expires: expiresAt });
}

function clearSessionCookie(reply: FastifyReply, secure: boolean) {
  reply.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure, signed: true });
}

const body = (req: FastifyRequest) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? (req.body as Record<string, unknown>) : {});
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

/** Resolves `request.actor` from the session cookie and registers the /api/auth routes. */
export async function authPlugin(app: FastifyInstance, opts: AuthOptions) {
  const { db, store, secureCookies } = opts;

  app.decorateRequest('actor', null);
  app.decorateRequest('sessionId', null);

  app.addHook('onRequest', async (req) => {
    req.actor = null;
    req.sessionId = null;
    const raw = req.cookies?.[SESSION_COOKIE];
    if (!raw) return;
    const unsigned = req.unsignCookie(raw);
    if (!unsigned.valid || !unsigned.value) return;
    const session = await findSession(db, unsigned.value);
    if (!session) return;
    const user = await store.get('users', session.userId);
    if (!user || user.active === false) return;
    req.actor = publicUser(user) as Rec<User>;
    req.sessionId = session.id;
  });

  app.post('/api/auth/login', { config: { rateLimit: { max: opts.loginRateLimit, timeWindow: '1 minute' } } }, async (req, reply) => {
    const b = body(req);
    const email = str(b.email).toLowerCase();
    const password = typeof b.password === 'string' ? b.password : '';
    if (!email || !password) throw new ActionError('Email and password are required');
    const [user] = email.length <= 254 ? await store.list('users', { where: { email } }) : [];
    const ok = await verifyPassword(password, user?.passwordHash);
    if (!user || !ok || user.active === false) throw new ActionError('Incorrect email or password', 401);
    if (req.sessionId) await deleteSession(db, req.sessionId); // rotate on login
    const s = await createSession(db, user.id, req.headers['user-agent']);
    setSessionCookie(reply, s.token, s.expiresAt, secureCookies);
    return { user: publicUser(user) };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    if (req.sessionId) await deleteSession(db, req.sessionId);
    clearSessionCookie(reply, secureCookies);
    return reply.status(204).send();
  });

  app.get('/api/auth/me', async (req, reply) => {
    reply.header('Cache-Control', 'no-store');
    return { user: req.actor };
  });

  /** Self-registration creates a client account and signs it in. */
  app.post('/api/auth/register', { config: { rateLimit: { max: opts.registerRateLimit, timeWindow: '1 minute' } } }, async (req, reply) => {
    const b = body(req);
    const name = str(b.name).slice(0, 120);
    const email = str(b.email).toLowerCase();
    if (!name) throw new ActionError('Name is required');
    if (!isEmail(email)) throw new ActionError('Please enter a valid email address');
    const password = validatePassword(b.password);
    const [exists] = await store.list('users', { where: { email } });
    // Never let registration claim an existing account (including passwordless accounts the coach created).
    if (exists) throw new ActionError('An account with this email already exists — please sign in', 409);
    const initials = name.split(/\s+/).map((s) => s[0] ?? '').join('').slice(0, 2).toUpperCase() || 'S';
    const user = await store.insert('users', {
      name, email, role: 'client', initials, avatarColor: 'sage', journeyAccess: false, toolkitIds: [], passwordHash: await hashPassword(password),
    });
    const s = await createSession(db, user.id, req.headers['user-agent']);
    setSessionCookie(reply, s.token, s.expiresAt, secureCookies);
    return reply.status(201).send({ user: publicUser(user) });
  });

  /**
   * Change a password.
   *  - Own password: { currentPassword, newPassword } — other sessions are signed out.
   *  - Admin setting a client's password (e.g. after createClient): { userId, newPassword }.
   */
  app.post('/api/auth/password', { config: { rateLimit: { max: opts.loginRateLimit, timeWindow: '1 minute' } } }, async (req) => {
    const actor = req.actor;
    if (!actor) throw new ActionError('Please sign in', 401);
    const b = body(req);
    const newPassword = validatePassword(b.newPassword ?? b.password);
    const targetId = str(b.userId) || actor.id;
    if (targetId !== actor.id) {
      if (!isAdmin(actor)) throw new ActionError('Not allowed', 403);
      const target = await store.get('users', targetId);
      if (!target) throw new ActionError('User not found', 404);
      await store.update('users', targetId, { passwordHash: await hashPassword(newPassword) });
      await deleteUserSessions(db, targetId);
      return { ok: true };
    }
    const me = await store.get('users', actor.id);
    const current = typeof b.currentPassword === 'string' ? b.currentPassword : '';
    if (!me || !(await verifyPassword(current, me.passwordHash))) throw new ActionError('Your current password is incorrect', 400);
    await store.update('users', actor.id, { passwordHash: await hashPassword(newPassword) });
    await deleteUserSessions(db, actor.id, req.sessionId);
    return { ok: true };
  });
}
