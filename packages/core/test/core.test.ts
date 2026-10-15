import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryStore, fullSeed, runAction, listRecords, deleteRecord, updateRecord, setToday, DEMO_TODAY, habitWeek, overallWeek, alignment, weekStart, parseDate, adminOverview, usageOf, type Rec, type User } from '../src';

let store: MemoryStore;
let admin: Rec<User>;
let sarah: Rec<User>;
beforeEach(async () => {
  setToday(DEMO_TODAY);
  store = new MemoryStore(fullSeed());
  admin = (await store.get('users', 'edel'))!;
  sarah = (await store.get('users', 'sarah'))!;
});

describe('seed', () => {
  it('has 5 stages and 15 lessons, 3 per stage', async () => {
    const stages = await store.list('stages');
    const lessons = await store.list('lessons');
    expect(stages).toHaveLength(5);
    expect(lessons).toHaveLength(15);
    for (const s of stages) expect(lessons.filter((l) => l.stageId === s.id)).toHaveLength(3);
  });
  it('plan coverage references real lessons', async () => {
    const ids = new Set((await store.list('lessons')).map((l) => l.id));
    for (const p of await store.list('plans')) for (const ls of Object.values(p.coverage)) for (const id of ls) expect(ids.has(id)).toBe(true);
  });
  it('wheel scores only use configured areas', async () => {
    const areas = new Set((await store.list('wheelAreas')).map((a) => a.id));
    for (const w of await store.list('wheelScores')) for (const k of Object.keys(w.scores)) expect(areas.has(k)).toBe(true);
  });
});

describe('calculations', () => {
  it('computes the week-3 habit rates from the designs', async () => {
    const habits = await store.list('habits');
    const checks = await store.list('habitChecks');
    const monday = weekStart(parseDate('2026-09-14'));
    const rate = (id: string) => habitWeek(habits.find((h) => h.id === id)!, checks, monday).pct;
    expect(rate('hb-water')).toBe(100);
    expect(rate('hb-read')).toBe(75);
    expect(rate('hb-sleep')).toBe(86);
    expect(overallWeek(habits, checks, monday).planned).toBe(21);
  });
  it('future self alignment matches 45% → 80%', async () => {
    const [card] = await store.list('cards');
    expect(alignment(card.qualities, 5)).toEqual({ then: 45, now: 80, delta: 35 });
  });
});

describe('permissions & master/dynamic separation', () => {
  it('hides inactive master items from the public but not from admin', async () => {
    await updateRecord({ store, actor: admin }, 'toolkits', 'calm', { active: false });
    expect((await listRecords({ store, actor: null }, 'toolkits')).map((t) => t.id)).not.toContain('calm');
    expect((await listRecords({ store, actor: admin }, 'toolkits')).map((t) => t.id)).toContain('calm');
  });
  it('a renamed plan is what the public reads', async () => {
    await updateRecord({ store, actor: admin }, 'plans', 'momentum', { name: 'Momentum Plus', price: 2500 });
    const plans = await listRecords({ store, actor: null }, 'plans');
    expect(plans.find((p) => p.id === 'momentum')).toMatchObject({ name: 'Momentum Plus', price: 2500 });
  });
  it('clients cannot edit master data or see other clients', async () => {
    await expect(updateRecord({ store, actor: sarah }, 'plans', 'momentum', { name: 'x' })).rejects.toThrow();
    const work = await listRecords({ store, actor: { ...sarah, id: 'aisha' } as Rec<User> }, 'work');
    expect(work.every((w) => w.userId === 'aisha')).toBe(true);
    await expect(listRecords({ store, actor: sarah }, 'leads')).rejects.toThrow();
  });
  it('users never leak password hashes', async () => {
    await store.update('users', 'sarah', { passwordHash: 'secret' });
    const [u] = await listRecords({ store, actor: sarah }, 'users');
    expect(u).not.toHaveProperty('passwordHash');
  });
  it('reports usage before delete', async () => {
    expect((await usageOf(store, 'plans', 'momentum')).count).toBe(1);
    await deleteRecord({ store, actor: admin }, 'faqs', 'fq1');
    expect(await store.get('faqs', 'fq1')).toBeNull();
  });
});

describe('actions', () => {
  it('enquiry creates a lead, submission and confirmation email', async () => {
    await runAction('submitEnquiry', { store, actor: null }, { data: { name: 'Hana Test', email: 'hana@example.com', phone: '501234567', location: 'Dubai', support: ['Life transitions'], goal: 'Clarity', source: 'LinkedIn' } });
    const lead = (await store.list('leads')).find((l) => l.email === 'hana@example.com');
    expect(lead?.source).toBe('linkedin');
    const mail = (await store.list('outbox')).find((o) => o.to === 'hana@example.com');
    expect(mail?.subject).toBe('Thank you for your enquiry');
    expect(mail?.body).toContain('Hi Hana');
  });
  it('rejects an enquiry with missing required fields', async () => {
    await expect(runAction('submitEnquiry', { store, actor: null }, { data: { email: 'x@y.z' } })).rejects.toThrow(/required/);
  });
  it('habit check cycles done → missed → empty', async () => {
    const ctx = { store, actor: sarah };
    expect((await runAction('toggleHabitCheck', ctx, { habitId: 'hb-move', date: '2026-09-28' })).status).toBe('done');
    expect((await runAction('toggleHabitCheck', ctx, { habitId: 'hb-move', date: '2026-09-28' })).status).toBe('missed');
    expect((await runAction('toggleHabitCheck', ctx, { habitId: 'hb-move', date: '2026-09-28' })).status).toBe(null);
  });
  it('saveWork merges reflections', async () => {
    const ctx = { store, actor: sarah };
    await runAction('saveWork', ctx, { context: 'lesson:f3', patch: { reflections: { r2: 'Busy week' } } });
    const [w] = await store.list('work', { where: { userId: 'sarah', context: 'lesson:f3' } });
    expect(w.reflections).toEqual({ r1: 'I kept my sleep routine almost every night.', r2: 'Busy week' });
  });
  it('admin overview matches the dashboard summary', async () => {
    const o = await adminOverview(store);
    expect(o.activeClients).toBe(3);
    expect(o.callsThisWeek).toBe(1);
    expect(o.thisWeek.length).toBeGreaterThanOrEqual(4);
  });
  it('admin-only actions are protected', async () => {
    await expect(runAction('overview', { store, actor: sarah }, {} as never)).rejects.toThrow(/Admin/);
  });
});
