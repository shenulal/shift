import { sql } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  ACTIONS, ActionError, COLLECTIONS, OWNER_FIELD, createRecord, deleteRecord, getRecord, isAdmin, listRecords, reorderRecords, runAction, updateRecord,
  type Actor, type ActionName, type CollectionName, type Ctx,
} from '@shift/core';
import type { PgStore } from './db/store';
import { sniffUpload, type FileStorage } from './storage';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

export function collectionParam(col: string): CollectionName {
  if (!has(COLLECTIONS, col)) throw new ActionError(`Unknown collection ${col}`, 404);
  return col as CollectionName;
}

/** Fields nobody may write through generic CRUD (secrets) and fields only the admin may set. */
const NEVER_WRITABLE = ['passwordHash'];
const ADMIN_ONLY_FIELDS = ['ownerId', 'role', 'id', 'createdAt', 'updatedAt'];

/**
 * Clean a CRUD body before it reaches core:
 *  - `passwordHash` is always removed (passwords change only via /api/auth/password);
 *  - non-admins cannot set ownerId / role / ids / timestamps, and cannot move a record to another owner on update
 *    (core's updateRecord only checks ownership of the existing record — see report).
 */
export function sanitizeWrite(actor: Actor, col: CollectionName, body: unknown, mode: 'create' | 'update'): Record<string, unknown> {
  if (!isPlainObject(body)) throw new ActionError('Request body must be a JSON object');
  const out: Record<string, unknown> = { ...body };
  for (const k of NEVER_WRITABLE) delete out[k];
  if (!isAdmin(actor)) {
    for (const k of ADMIN_ONLY_FIELDS) delete out[k];
    const ownerField = OWNER_FIELD[col];
    if (mode === 'update' && ownerField) delete out[ownerField];
  }
  return out;
}

export function parseWhere(raw: unknown): Record<string, unknown> | undefined {
  if (raw === undefined || raw === '') return undefined;
  if (typeof raw !== 'string' || raw.length > 4000) throw new ActionError('Invalid where parameter');
  let where: unknown;
  try {
    where = JSON.parse(raw);
  } catch {
    throw new ActionError('where must be JSON');
  }
  if (!isPlainObject(where)) throw new ActionError('where must be a JSON object');
  if (has(where, 'passwordHash')) throw new ActionError('Cannot filter on passwordHash');
  return where;
}

/** Recursively drop `passwordHash` from anything we send (defence in depth — core already strips users). */
export function stripSecrets(v: unknown, depth = 0): unknown {
  if (depth > 12 || v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) v[i] = stripSecrets(v[i], depth + 1);
    return v;
  }
  if (has(v, 'passwordHash')) delete (v as Record<string, unknown>).passwordHash;
  for (const k of Object.keys(v)) (v as Record<string, unknown>)[k] = stripSecrets((v as Record<string, unknown>)[k], depth + 1);
  return v;
}

export interface RouteOptions {
  store: PgStore;
  storage: FileStorage;
  actionRateLimit: number;
  uploadRateLimit: number;
}

export async function apiRoutes(app: FastifyInstance, opts: RouteOptions) {
  const { store } = opts;
  const ctx = (req: FastifyRequest): Ctx => ({ store, actor: req.actor });

  app.get('/api/health', async (_req, reply) => {
    reply.header('Cache-Control', 'no-store');
    try {
      await store.db.execute(sql`select 1`);
      return { ok: true, db: 'up', time: new Date().toISOString() };
    } catch {
      return reply.status(503).send({ ok: false, db: 'down' });
    }
  });

  // ── generic, permission-checked CRUD (rules live in core/crud.ts + permissions.ts)
  app.get<{ Params: { col: string }; Querystring: { where?: string } }>('/api/c/:col', async (req) => {
    const col = collectionParam(req.params.col);
    return listRecords(ctx(req), col, parseWhere(req.query.where));
  });

  app.get<{ Params: { col: string; id: string } }>('/api/c/:col/:id', async (req) => {
    const col = collectionParam(req.params.col);
    return getRecord(ctx(req), col, req.params.id);
  });

  app.post<{ Params: { col: string } }>('/api/c/:col', async (req, reply) => {
    const col = collectionParam(req.params.col);
    const rec = await createRecord(ctx(req), col, sanitizeWrite(req.actor, col, req.body, 'create') as never);
    return reply.status(201).send(rec);
  });

  app.patch<{ Params: { col: string; id: string } }>('/api/c/:col/:id', async (req) => {
    const col = collectionParam(req.params.col);
    return updateRecord(ctx(req), col, req.params.id, sanitizeWrite(req.actor, col, req.body, 'update') as never);
  });

  app.delete<{ Params: { col: string; id: string } }>('/api/c/:col/:id', async (req, reply) => {
    const col = collectionParam(req.params.col);
    await deleteRecord(ctx(req), col, req.params.id);
    return reply.status(204).send();
  });

  app.post<{ Params: { col: string } }>('/api/c/:col/reorder', async (req, reply) => {
    const col = collectionParam(req.params.col);
    const ids = isPlainObject(req.body) ? req.body.ids : undefined;
    if (!Array.isArray(ids) || ids.length > 5000 || !ids.every((x) => typeof x === 'string')) throw new ActionError('ids must be an array of record ids');
    await reorderRecords(ctx(req), col, ids as string[]);
    return reply.status(204).send();
  });

  // ── business actions (core/actions.ts) — access level enforced by core's runAction
  app.post<{ Params: { name: string } }>('/api/actions/:name', { config: { rateLimit: { max: opts.actionRateLimit, timeWindow: '1 minute' } } }, async (req) => {
    const name = req.params.name;
    if (!has(ACTIONS, name)) throw new ActionError(`Unknown action ${name}`, 404);
    const payload = req.body ?? {};
    if (!isPlainObject(payload)) throw new ActionError('Request body must be a JSON object');
    const result = await runAction(name as ActionName, ctx(req), payload as never);
    return result ?? null;
  });

  // ── uploads (admin only): images / PDF ≤ 10 MB, type checked by magic bytes
  app.post('/api/uploads', { config: { rateLimit: { max: opts.uploadRateLimit, timeWindow: '1 minute' } } }, async (req, reply) => {
    if (!req.actor) throw new ActionError('Please sign in', 401);
    if (!isAdmin(req.actor)) throw new ActionError('Admin only', 403);
    if (!req.isMultipart()) throw new ActionError('Expected multipart/form-data with a "file" field', 415);
    const file = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 } });
    if (!file) throw new ActionError('No file uploaded');
    const body = await file.toBuffer(); // throws 413 when over the limit
    const type = sniffUpload(file.mimetype, body);
    if (!type) throw new ActionError('Only PNG, JPEG, GIF, WebP images and PDF files can be uploaded', 415);
    const saved = await opts.storage.put({ body, contentType: type.contentType, ext: type.ext });
    req.log.info({ key: saved.key, bytes: body.length, by: req.actor.id }, 'file uploaded');
    return reply.status(201).send({ url: saved.url });
  });
}
