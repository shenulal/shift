import { and, asc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { ActionError, COLLECTIONS, OWNER_FIELD, newId, type CollectionName, type Draft, type ListOptions, type Patch, type RecOf, type Store, type StoreData } from '@shift/core';
import type { Db } from './client';
import { TABLES, type CollectionTable } from './schema';

type Row = CollectionTable['$inferSelect'];
type AnyRec = Record<string, unknown>;

const META_KEYS = new Set(['id', 'sort', 'active', 'ownerId', 'createdAt', 'updatedAt']);
const isPlainObject = (v: unknown): v is AnyRec => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Split a record into meta columns and the jsonb `data` payload. */
function splitMeta(input: AnyRec): { meta: AnyRec; data: AnyRec } {
  const meta: AnyRec = {};
  const data: AnyRec = {};
  for (const [k, v] of Object.entries(input)) (META_KEYS.has(k) ? meta : data)[k] = v;
  return { meta, data };
}

function toDate(v: unknown, fallback: Date): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' && !Number.isNaN(Date.parse(v))) return new Date(v);
  return fallback;
}

const FALSE = sql`false`;

/** Map a Postgres unique violation to a 409 the API can show. */
function rethrow(err: unknown, col: CollectionName, id?: string): never {
  // drizzle wraps driver errors in DrizzleQueryError (with the pg error as `cause`).
  const raw = err as { code?: string; cause?: unknown };
  const e = (raw?.code ? raw : (raw?.cause as typeof raw | undefined) ?? raw) as { code?: string; constraint?: string };
  if (e?.code === '23505') {
    if (e.constraint?.endsWith('_email_uq')) throw new ActionError('A user with this email already exists', 409);
    throw new ActionError(`Duplicate id ${id ?? ''} in ${col}`.replace('  ', ' '), 409);
  }
  throw err;
}

/**
 * core `Store` over PostgreSQL. One table per collection; domain fields live in `data` (jsonb), meta fields in columns.
 * Behaviour mirrors core's MemoryStore (see test/store.contract.ts, which runs against both).
 */
export class PgStore implements Store {
  constructor(readonly db: Db) {}

  table(col: CollectionName): CollectionTable {
    const t = TABLES[col];
    if (!t || !Object.prototype.hasOwnProperty.call(COLLECTIONS, col)) throw new ActionError(`Unknown collection ${String(col)}`, 404);
    return t;
  }

  toRec<C extends CollectionName>(row: Row): RecOf<C> {
    return {
      ...(row.data as AnyRec),
      id: row.id,
      sort: row.sort,
      active: row.active,
      ownerId: row.ownerId ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as unknown as RecOf<C>;
  }

  /** Same semantics as core `matches()`: undefined = ignore, array = IN, otherwise strict equality. */
  conditions(t: CollectionTable, where?: AnyRec): SQL[] {
    const out: SQL[] = [];
    if (!where) return out;
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;
      if (META_KEYS.has(key)) out.push(this.metaCondition(t, key, value));
      else if (Array.isArray(value)) {
        if (!value.length) out.push(FALSE);
        else out.push(or(...value.map((v) => sql`${t.data} @> ${JSON.stringify({ [key]: v ?? null })}::jsonb`))!);
      } else out.push(sql`${t.data} @> ${JSON.stringify({ [key]: value })}::jsonb`);
    }
    return out;
  }

  private metaCondition(t: CollectionTable, key: string, value: unknown): SQL {
    const values = Array.isArray(value) ? value : [value];
    if (!values.length) return FALSE;
    const column = { id: t.id, sort: t.sort, active: t.active, ownerId: t.ownerId, createdAt: t.createdAt, updatedAt: t.updatedAt }[key as 'id'];
    const valid = (v: unknown) => {
      switch (key) {
        case 'sort': return typeof v === 'number' && Number.isInteger(v);
        case 'active': return typeof v === 'boolean';
        case 'createdAt': case 'updatedAt': return typeof v === 'string' && !Number.isNaN(Date.parse(v));
        default: return typeof v === 'string';
      }
    };
    const parts: SQL[] = [];
    if (values.some((v) => v === null)) parts.push(isNull(column));
    const vals = values.filter((v) => v !== null && valid(v)).map((v) => (key === 'createdAt' || key === 'updatedAt' ? new Date(v as string) : v));
    if (vals.length) parts.push(vals.length === 1 ? eq(column, vals[0] as never) : inArray(column, vals as never[]));
    if (!parts.length) return FALSE;
    return parts.length === 1 ? parts[0] : or(...parts)!;
  }

  async list<C extends CollectionName>(col: C, opts: ListOptions<C> = {}): Promise<RecOf<C>[]> {
    const t = this.table(col);
    const conds = this.conditions(t, opts.where as AnyRec | undefined);
    if (opts.includeInactive === false) conds.push(eq(t.active, true));
    const rows = await this.db.select().from(t).where(conds.length ? and(...conds) : undefined).orderBy(asc(t.sort), asc(t.createdAt), asc(t.id));
    return rows.map((r) => this.toRec<C>(r));
  }

  async get<C extends CollectionName>(col: C, id: string): Promise<RecOf<C> | null> {
    if (typeof id !== 'string') return null;
    const t = this.table(col);
    const [row] = await this.db.select().from(t).where(eq(t.id, id)).limit(1);
    return row ? this.toRec<C>(row) : null;
  }

  async insert<C extends CollectionName>(col: C, draft: Draft<C>): Promise<RecOf<C>> {
    const t = this.table(col);
    const { meta, data } = splitMeta(draft as unknown as AnyRec);
    const now = new Date();
    const ownerField = OWNER_FIELD[col];
    const id = typeof meta.id === 'string' && meta.id ? meta.id : newId(col.slice(0, 3));
    const ownerId = (meta.ownerId as string | null | undefined) ?? (ownerField ? (data[ownerField] as string | null | undefined) ?? null : null);
    try {
      const [row] = await this.db
        .insert(t)
        .values({
          id,
          sort: typeof meta.sort === 'number' ? meta.sort : sql`(select coalesce(max(${t.sort}), 0) + 1 from ${t})`,
          active: typeof meta.active === 'boolean' ? meta.active : true,
          ownerId,
          data: sql`${JSON.stringify(data)}::jsonb`,
          createdAt: toDate(meta.createdAt, now),
          updatedAt: toDate(meta.updatedAt, now),
        })
        .returning();
      return this.toRec<C>(row);
    } catch (err) {
      rethrow(err, col, id);
    }
  }

  async update<C extends CollectionName>(col: C, id: string, patch: Patch<C>): Promise<RecOf<C>> {
    const t = this.table(col);
    const { meta, data } = splitMeta(patch as unknown as AnyRec);
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof meta.sort === 'number') set.sort = meta.sort;
    if (typeof meta.active === 'boolean') set.active = meta.active;
    const ownerField = OWNER_FIELD[col];
    if (meta.ownerId !== undefined) set.ownerId = meta.ownerId ?? null;
    else if (ownerField && data[ownerField] !== undefined) set.ownerId = data[ownerField] ?? null;

    // Shallow merge like `{ ...existing, ...patch }`; keys explicitly patched to `undefined` are removed.
    const removed = Object.keys(data).filter((k) => data[k] === undefined);
    const present = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    if (removed.length || Object.keys(present).length) {
      const base = removed.length ? sql`(${t.data} - ARRAY[${sql.join(removed.map((k) => sql`${k}`), sql`, `)}]::text[])` : sql`${t.data}`;
      set.data = sql`${base} || ${JSON.stringify(present)}::jsonb`;
    }
    try {
      const [row] = await this.db.update(t).set(set).where(eq(t.id, id)).returning();
      if (!row) throw new ActionError(`Not found: ${col}/${id}`, 404);
      return this.toRec<C>(row);
    } catch (err) {
      rethrow(err, col, id);
    }
  }

  async remove(col: CollectionName, id: string): Promise<void> {
    const t = this.table(col);
    await this.db.delete(t).where(eq(t.id, id));
  }

  async reorder(col: CollectionName, ids: string[]): Promise<void> {
    const t = this.table(col);
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        if (typeof ids[i] !== 'string') continue;
        await tx.update(t).set({ sort: i + 1 }).where(eq(t.id, ids[i]));
      }
    });
  }

  // ───────────────────────────── API-only helpers (not part of core's Store port)

  /** Write fully-formed records (seed data). `overwrite` replaces existing rows with the same id; otherwise they are left alone. */
  async upsertMany<C extends CollectionName>(col: C, recs: RecOf<C>[], mode: 'insert-missing' | 'overwrite' = 'insert-missing'): Promise<number> {
    if (!recs.length) return 0;
    const t = this.table(col);
    const now = new Date();
    const values = recs.map((r) => {
      const { meta, data } = splitMeta(r as unknown as AnyRec);
      const ownerField = OWNER_FIELD[col];
      return {
        id: String(meta.id),
        sort: typeof meta.sort === 'number' ? meta.sort : 0,
        active: meta.active !== false,
        ownerId: (meta.ownerId as string | null | undefined) ?? (ownerField ? (data[ownerField] as string | null) ?? null : null),
        data,
        createdAt: toDate(meta.createdAt, now),
        updatedAt: toDate(meta.updatedAt, now),
      };
    });
    const q = this.db.insert(t).values(values);
    const res =
      mode === 'overwrite'
        ? await q.onConflictDoUpdate({ target: t.id, set: { sort: sql`excluded.sort`, active: sql`excluded.active`, ownerId: sql`excluded.owner_id`, data: sql`excluded.data`, updatedAt: sql`excluded.updated_at` } }).returning({ id: t.id })
        : await q.onConflictDoNothing({ target: t.id }).returning({ id: t.id });
    return res.length;
  }

  /** Seed a whole StoreData snapshot. Returns rows written per collection. */
  async load(data: StoreData, mode: 'insert-missing' | 'overwrite' = 'insert-missing'): Promise<Record<string, number>> {
    const out: Record<string, number> = {};
    for (const [col, recs] of Object.entries(data) as [CollectionName, RecOf<CollectionName>[]][]) {
      if (recs?.length) out[col] = await this.upsertMany(col, recs, mode);
    }
    return out;
  }

  /** Delete every collection row and session (seed --reset, tests). */
  async truncateAll(): Promise<void> {
    const names = [...Object.keys(TABLES).map((c) => TABLES[c as CollectionName]), null];
    await this.db.execute(sql`truncate table ${sql.join(names.filter(Boolean).map((t) => t!), sql`, `)}, sessions`);
  }

  /**
   * Run `fn` only if no other process holds the same advisory lock (multi-instance safe background jobs).
   * Returns false when the lock was busy.
   */
  async withAdvisoryLock(key: number, fn: () => Promise<void>): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const res = await tx.execute<{ ok: boolean }>(sql`select pg_try_advisory_xact_lock(${key}) as ok`);
      if (!res.rows[0]?.ok) return false;
      await fn();
      return true;
    });
  }
}
