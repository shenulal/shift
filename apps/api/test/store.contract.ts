/**
 * Behavioural contract for core's `Store` port. Run against MemoryStore (the reference) and PgStore so the API behaves
 * exactly like the in-browser demo.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_TODAY, adminOverview, runAction, setToday, type Rec, type Store, type User } from '@shift/core';

export interface StoreFactory {
  /** A store with no data. */
  empty(): Promise<Store>;
  /** A store loaded with core's fullSeed(). */
  seeded(): Promise<Store>;
}

const faq = (question: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({ question, answer: `A: ${question}`, ...extra });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function storeContract(name: string, factory: StoreFactory) {
  describe(`Store contract — ${name}`, () => {
    let store: Store;
    beforeEach(async () => {
      store = await factory.empty();
    });

    it('insert assigns id, increasing sort, active=true and ISO timestamps', async () => {
      const a = await store.insert('faqs', faq('One') as never);
      const b = await store.insert('faqs', faq('Two') as never);
      expect(a.id).toMatch(/^faq_/);
      expect(a.id).not.toBe(b.id);
      expect(a.sort).toBe(1);
      expect(b.sort).toBe(2);
      expect(a.active).toBe(true);
      expect(new Date(a.createdAt).toISOString()).toBe(a.createdAt);
      expect(a.updatedAt).toBe(a.createdAt);
      expect(a).toMatchObject({ question: 'One', answer: 'A: One' });
    });

    it('insert keeps explicit id, sort, active, ownerId and timestamps', async () => {
      const r = await store.insert('faqs', { ...faq('X'), id: 'fq-x', sort: 10, active: false, ownerId: 'u1', createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:05.000Z' } as never);
      expect(r).toMatchObject({ id: 'fq-x', sort: 10, active: false, ownerId: 'u1', createdAt: '2026-01-02T03:04:05.000Z' });
      const next = await store.insert('faqs', faq('Y') as never);
      expect(next.sort).toBe(11);
      expect(await store.get('faqs', 'fq-x')).toEqual(r);
    });

    it('rejects a duplicate id', async () => {
      await store.insert('faqs', { ...faq('X'), id: 'dup' } as never);
      await expect(store.insert('faqs', { ...faq('Y'), id: 'dup' } as never)).rejects.toThrow(/Duplicate/);
    });

    it('get returns null for unknown ids and independent copies', async () => {
      expect(await store.get('faqs', 'nope')).toBeNull();
      const r = await store.insert('work', { userId: 'u1', context: 'lesson:a', step: 1, completed: false, completedAt: null, videoSeconds: 0, reflections: { r1: 'hi' }, tool: {}, nextStep: { text: '' } } as never);
      const got = (await store.get('work', r.id))!;
      got.reflections.r1 = 'mutated';
      expect((await store.get('work', r.id))!.reflections.r1).toBe('hi');
    });

    it('round-trips nested JSON exactly', async () => {
      const tool = { list: [1, 'two', { three: [true, null] }], nested: { deep: { emoji: 'café ✓ — “quotes”' } }, zero: 0, f: false };
      const r = await store.insert('work', { userId: 'u1', context: 'lesson:b', step: 2, completed: true, completedAt: null, videoSeconds: 12.5, reflections: {}, tool, nextStep: { text: 'x', checklist: { a: true } } } as never);
      const got = (await store.get('work', r.id))!;
      expect(got.tool).toEqual(tool);
      expect(got.videoSeconds).toBe(12.5);
      expect(got.nextStep).toEqual({ text: 'x', checklist: { a: true } });
    });

    it('list orders by sort then createdAt', async () => {
      await store.insert('faqs', { ...faq('C'), sort: 3 } as never);
      await store.insert('faqs', { ...faq('A'), sort: 1 } as never);
      await store.insert('faqs', { ...faq('B1'), sort: 2, createdAt: '2026-01-02T00:00:00.000Z' } as never);
      await store.insert('faqs', { ...faq('B0'), sort: 2, createdAt: '2026-01-01T00:00:00.000Z' } as never);
      expect((await store.list('faqs')).map((f) => f.question)).toEqual(['A', 'B0', 'B1', 'C']);
    });

    it('list where: equality, arrays mean IN, meta fields, null, undefined ignored, empty array matches nothing', async () => {
      const mk = (userId: string | null, context: string, extra: Record<string, unknown> = {}) =>
        store.insert('work', { userId, context, step: 1, completed: false, completedAt: null, videoSeconds: 0, reflections: {}, tool: {}, nextStep: { text: '' }, ...extra } as never);
      const a = await mk('u1', 'lesson:a');
      const b = await mk('u1', 'lesson:b', { completed: true, step: 4 });
      const c = await mk('u2', 'lesson:a');
      const d = await mk(null, 'lesson:z');
      const ids = async (where: Record<string, unknown>) => (await store.list('work', { where: where as never })).map((r) => r.id).sort();
      expect(await ids({ userId: 'u1' })).toEqual([a.id, b.id].sort());
      expect(await ids({ userId: 'u1', context: 'lesson:a' })).toEqual([a.id]);
      expect(await ids({ context: ['lesson:a', 'lesson:z'] })).toEqual([a.id, c.id, d.id].sort());
      expect(await ids({ completed: true, step: 4 })).toEqual([b.id]);
      expect(await ids({ step: '4' })).toEqual([]); // strict equality, no type coercion
      expect(await ids({ userId: null })).toEqual([d.id]);
      expect(await ids({ userId: undefined, context: 'lesson:b' })).toEqual([b.id]);
      expect(await ids({ userId: [] })).toEqual([]);
      expect(await ids({ id: c.id })).toEqual([c.id]);
      expect(await ids({ id: [a.id, d.id] })).toEqual([a.id, d.id].sort());
      expect(await ids({ nonexistent: 'x' })).toEqual([]);
    });

    it('includeInactive: false hides inactive records (default includes them)', async () => {
      await store.insert('faqs', faq('On') as never);
      await store.insert('faqs', { ...faq('Off'), active: false } as never);
      expect(await store.list('faqs')).toHaveLength(2);
      expect((await store.list('faqs', { includeInactive: false })).map((f) => f.question)).toEqual(['On']);
      expect((await store.list('faqs', { where: { active: false } as never })).map((f) => f.question)).toEqual(['Off']);
    });

    it('update shallow-merges, keeps id/createdAt, bumps updatedAt, handles meta fields', async () => {
      const r = await store.insert('work', { userId: 'u1', context: 'lesson:a', step: 1, completed: false, completedAt: null, videoSeconds: 0, reflections: { r1: 'one', r2: 'two' }, tool: {}, nextStep: { text: '' } } as never);
      await sleep(5);
      const u = await store.update('work', r.id, { step: 3, reflections: { r2: 'TWO' }, id: 'hijack', createdAt: '2000-01-01T00:00:00.000Z', active: false, sort: 42 } as never);
      expect(u.id).toBe(r.id);
      expect(u.createdAt).toBe(r.createdAt);
      expect(u.updatedAt > r.updatedAt).toBe(true);
      expect(u.step).toBe(3);
      expect(u.reflections).toEqual({ r2: 'TWO' }); // shallow: nested objects are replaced
      expect(u.context).toBe('lesson:a');
      expect(u.active).toBe(false);
      expect(u.sort).toBe(42);
      expect(await store.get('work', r.id)).toEqual(u);
      expect(await store.get('work', 'hijack')).toBeNull();
    });

    it('update of an unknown id rejects', async () => {
      await expect(store.update('faqs', 'nope', { question: 'x' } as never)).rejects.toThrow();
    });

    it('remove deletes (and ignores unknown ids)', async () => {
      const r = await store.insert('faqs', faq('Gone') as never);
      await store.remove('faqs', r.id);
      await store.remove('faqs', 'never-existed');
      expect(await store.get('faqs', r.id)).toBeNull();
      expect(await store.list('faqs')).toHaveLength(0);
    });

    it('reorder assigns sort 1..n in the given order and ignores unknown ids', async () => {
      const a = await store.insert('faqs', faq('A') as never);
      const b = await store.insert('faqs', faq('B') as never);
      const c = await store.insert('faqs', faq('C') as never);
      await store.reorder('faqs', [c.id, 'ghost', a.id, b.id]);
      const rows = await store.list('faqs');
      expect(rows.map((r) => r.question)).toEqual(['C', 'A', 'B']);
      expect(rows.map((r) => r.sort)).toEqual([1, 3, 4]);
    });

    describe('core actions behave the same on this store', () => {
      let seeded: Store;
      let sarah: Rec<User>;
      beforeEach(async () => {
        setToday(DEMO_TODAY);
        seeded = await factory.seeded();
        sarah = (await seeded.get('users', 'sarah'))!;
      });

      it('seed counts', async () => {
        expect(await seeded.list('stages')).toHaveLength(5);
        expect(await seeded.list('lessons')).toHaveLength(15);
        expect((await seeded.list('users')).map((u) => u.id).sort()).toEqual(['aisha', 'edel', 'mariam', 'sarah']);
      });

      it('submitEnquiry creates a lead, a submission and a queued email', async () => {
        await runAction('submitEnquiry', { store: seeded, actor: null }, { data: { name: 'Hana Test', email: 'Hana@Example.com', phone: '501234567', location: 'Dubai', support: ['Life transitions'], goal: 'Clarity', source: 'LinkedIn' } });
        const [lead] = await seeded.list('leads', { where: { email: 'hana@example.com' } });
        expect(lead).toMatchObject({ source: 'linkedin', stageId: 'ps-enquiry' });
        const [mail] = await seeded.list('outbox', { where: { to: 'Hana@Example.com' } });
        expect(mail).toMatchObject({ subject: 'Thank you for your enquiry', status: 'queued' });
      });

      it('saveWork merges reflections and keeps the max step', async () => {
        const ctx = { store: seeded, actor: sarah };
        await runAction('saveWork', ctx, { context: 'lesson:f3', patch: { reflections: { r2: 'Busy week' }, step: 1 } });
        const [w] = await seeded.list('work', { where: { userId: 'sarah', context: 'lesson:f3' } });
        expect(w.reflections).toEqual({ r1: 'I kept my sleep routine almost every night.', r2: 'Busy week' });
        expect(w.step).toBeGreaterThanOrEqual(1);
      });

      it('habit check cycles done → missed → empty', async () => {
        const ctx = { store: seeded, actor: sarah };
        const cycle = [];
        for (let i = 0; i < 3; i++) cycle.push((await runAction('toggleHabitCheck', ctx, { habitId: 'hb-move', date: '2026-09-28' })).status);
        expect(cycle).toEqual(['done', 'missed', null]);
      });

      it('admin overview matches the dashboard', async () => {
        const o = await adminOverview(seeded);
        expect(o.activeClients).toBe(3);
        expect(o.callsThisWeek).toBe(1);
      });
    });
  });
}
