import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COLLECTIONS, MemoryStore, fullSeed } from '@shift/core';
import { TABLES, tableName } from '../src/db/schema';
import { createTestDb, type TestDb } from './helpers';
import { storeContract } from './store.contract';

storeContract('MemoryStore', {
  empty: async () => new MemoryStore(),
  seeded: async () => new MemoryStore(fullSeed()),
});

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t?.close();
});

storeContract('PgStore', {
  empty: async () => {
    await t.store.truncateAll();
    return t.store;
  },
  seeded: async () => {
    await t.store.truncateAll();
    await t.store.load(fullSeed());
    return t.store;
  },
});

describe('schema', () => {
  it('has exactly one c_<snake_case> table per core collection', () => {
    expect(Object.keys(TABLES).sort()).toEqual(Object.keys(COLLECTIONS).sort());
    expect(tableName('wheelAreas')).toBe('c_wheel_areas');
    expect(tableName('freeToolSubmissions')).toBe('c_free_tool_submissions');
  });

  it('migrations created every table', async () => {
    const res = await t.pool.query<{ table_name: string }>(`select table_name from information_schema.tables where table_schema = 'public'`);
    const names = new Set(res.rows.map((r) => r.table_name));
    for (const col of Object.keys(COLLECTIONS)) expect(names.has(tableName(col))).toBe(true);
    expect(names.has('sessions')).toBe(true);
  });

  it('PgStore derives ownerId from the owner field and keeps it in sync', async () => {
    await t.store.truncateAll();
    const w = await t.store.insert('work', { userId: 'u9', context: 'lesson:a', step: 1, completed: false, completedAt: null, videoSeconds: 0, reflections: {}, tool: {}, nextStep: { text: '' } } as never);
    expect(w.ownerId).toBe('u9');
    const moved = await t.store.update('work', w.id, { userId: 'u10' } as never);
    expect(moved.ownerId).toBe('u10');
  });

  it('PgStore enforces unique user emails (case-insensitive)', async () => {
    await t.store.truncateAll();
    await t.store.insert('users', { name: 'A', email: 'a@x.com', role: 'client', initials: 'A', avatarColor: 'sage', journeyAccess: false, toolkitIds: [] } as never);
    await expect(t.store.insert('users', { name: 'B', email: 'A@X.com', role: 'client', initials: 'B', avatarColor: 'sage', journeyAccess: false, toolkitIds: [] } as never)).rejects.toThrow(/already exists/);
  });
});
