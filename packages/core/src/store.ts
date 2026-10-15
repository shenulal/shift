import type { CollectionMap, CollectionName, RecOf } from './collections';
import type { Meta } from './types';

export type Where<C extends CollectionName> = Partial<Record<keyof CollectionMap[C] | keyof Meta, unknown>>;
export interface ListOptions<C extends CollectionName> {
  where?: Where<C>;
  /** Include inactive records (admin views). Defaults to true at store level. */
  includeInactive?: boolean;
}
export type Draft<C extends CollectionName> = CollectionMap[C] & Partial<Meta>;
export type Patch<C extends CollectionName> = Partial<CollectionMap[C]> & Partial<Pick<Meta, 'active' | 'sort' | 'ownerId'>>;

/**
 * Persistence port. Implemented by:
 *  - MemoryStore (this package) — tests and the in-browser demo
 *  - PgStore (apps/api) — PostgreSQL via Drizzle
 * All business actions in ./actions are written against this interface only.
 */
export interface Store {
  list<C extends CollectionName>(col: C, opts?: ListOptions<C>): Promise<RecOf<C>[]>;
  get<C extends CollectionName>(col: C, id: string): Promise<RecOf<C> | null>;
  insert<C extends CollectionName>(col: C, data: Draft<C>): Promise<RecOf<C>>;
  update<C extends CollectionName>(col: C, id: string, patch: Patch<C>): Promise<RecOf<C>>;
  remove(col: CollectionName, id: string): Promise<void>;
  reorder(col: CollectionName, ids: string[]): Promise<void>;
}

export const nowIso = () => new Date().toISOString();

let counter = 0;
export function newId(prefix = 'r'): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function matches(rec: Record<string, unknown>, where?: Record<string, unknown>): boolean {
  if (!where) return true;
  return Object.entries(where).every(([k, v]) => {
    if (v === undefined) return true;
    if (Array.isArray(v)) return v.includes(rec[k]);
    return rec[k] === v;
  });
}

export const bySort = (a: Meta, b: Meta) => a.sort - b.sort || a.createdAt.localeCompare(b.createdAt);

export type StoreData = { [C in CollectionName]?: RecOf<C>[] };

/** Simple in-memory store; `onChange` lets the browser demo persist to localStorage. */
export class MemoryStore implements Store {
  data: StoreData;
  onChange?: (data: StoreData) => void;
  constructor(initial: StoreData = {}, onChange?: (data: StoreData) => void) {
    this.data = initial;
    this.onChange = onChange;
  }
  private rows<C extends CollectionName>(col: C): RecOf<C>[] {
    if (!this.data[col]) (this.data as Record<string, unknown>)[col] = [];
    return this.data[col] as RecOf<C>[];
  }
  private changed() {
    this.onChange?.(this.data);
  }
  async list<C extends CollectionName>(col: C, opts: ListOptions<C> = {}): Promise<RecOf<C>[]> {
    const inc = opts.includeInactive ?? true;
    return this.rows(col)
      .filter((r) => (inc || r.active) && matches(r as unknown as Record<string, unknown>, opts.where as Record<string, unknown>))
      .slice()
      .sort(bySort)
      .map((r) => structuredClone(r));
  }
  async get<C extends CollectionName>(col: C, id: string) {
    const r = this.rows(col).find((x) => x.id === id);
    return r ? structuredClone(r) : null;
  }
  async insert<C extends CollectionName>(col: C, data: Draft<C>) {
    const rows = this.rows(col);
    const t = nowIso();
    const rec = {
      ...structuredClone(data),
      id: data.id ?? newId(col.slice(0, 3)),
      sort: data.sort ?? (rows.reduce((mx, r) => Math.max(mx, r.sort), 0) + 1),
      active: data.active ?? true,
      ownerId: data.ownerId ?? null,
      createdAt: data.createdAt ?? t,
      updatedAt: data.updatedAt ?? t,
    } as RecOf<C>;
    if (rows.some((r) => r.id === rec.id)) throw new Error(`Duplicate id ${rec.id} in ${col}`);
    rows.push(rec);
    this.changed();
    return structuredClone(rec);
  }
  async update<C extends CollectionName>(col: C, id: string, patch: Patch<C>) {
    const rows = this.rows(col);
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`Not found: ${col}/${id}`);
    const { id: _ignore, createdAt: _c, ...rest } = patch as Record<string, unknown>;
    rows[i] = { ...rows[i], ...structuredClone(rest), updatedAt: nowIso() } as RecOf<C>;
    this.changed();
    return structuredClone(rows[i]);
  }
  async remove(col: CollectionName, id: string) {
    const rows = this.rows(col) as { id: string }[];
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) rows.splice(i, 1);
    this.changed();
  }
  async reorder(col: CollectionName, ids: string[]) {
    const rows = this.rows(col) as Meta[];
    ids.forEach((id, idx) => {
      const r = rows.find((x) => x.id === id);
      if (r) r.sort = idx + 1;
    });
    this.changed();
  }
}
