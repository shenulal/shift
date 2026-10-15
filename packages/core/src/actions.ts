import { COLLECTIONS, type CollectionName, type RecOf } from './collections';
import { fillTemplate, fmtDay, fmtTime, formatPrice, isoDate, now, parseDate, weekStart, addDays } from './calc';
import { isAdmin, publicUser, type Actor } from './permissions';
import type { Store } from './store';
import type * as T from './types';

export class ActionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface Ctx { store: Store; actor: Actor }
type Access = 'public' | 'client' | 'admin';
interface ActionDef<P = any, R = any> { access: Access; run: (ctx: Ctx, payload: P) => Promise<R> }
const def = <P, R>(access: Access, run: (ctx: Ctx, payload: P) => Promise<R>): ActionDef<P, R> => ({ access, run });

const required = (v: unknown, name: string) => {
  if (v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length)) throw new ActionError(`${name} is required`);
};
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const me = (ctx: Ctx) => {
  if (!ctx.actor) throw new ActionError('Please sign in', 401);
  return ctx.actor;
};
/** Clients act on themselves; the admin may pass userId to act on a client's behalf. */
const targetUser = (ctx: Ctx, userId?: string) => (isAdmin(ctx.actor) && userId ? userId : me(ctx).id);

async function singleton<C extends 'settings' | 'branding' | 'freeTool' | 'blueprint'>(store: Store, col: C): Promise<RecOf<C>> {
  const [first] = await store.list(col);
  if (!first) throw new ActionError(`${col} not configured`, 500);
  return first;
}

// ───────────────────────────────────────────── email outbox
export async function sendTemplate(store: Store, key: string, to: string, vars: Record<string, string | number | null | undefined>) {
  const [tpl] = await store.list('emails', { where: { key } });
  if (!tpl || !tpl.active) return null;
  const settings = await singleton(store, 'settings');
  const all = { booking_link: settings.discoveryCall.bookingUrl, portal_link: `https://${settings.website}/app`, ...vars };
  return store.insert('outbox', {
    templateKey: key,
    to,
    subject: fillTemplate(tpl.subject, all),
    body: fillTemplate(tpl.body, all),
    status: 'queued',
    sentAt: now().toISOString(),
  });
}

async function event(store: Store, type: T.AnalyticsEvent['type'], source = 'direct') {
  await store.insert('events', { type, source, at: now().toISOString() });
}

async function findOrCreateLead(store: Store, data: Partial<T.Lead> & { email: string; name?: string }) {
  const [existing] = await store.list('leads', { where: { email: data.email.toLowerCase() } });
  if (existing) return store.update('leads', existing.id, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== '')) as Partial<T.Lead>);
  return store.insert('leads', {
    name: data.name || data.email.split('@')[0],
    email: data.email.toLowerCase(),
    phone: data.phone ?? '',
    location: data.location ?? '',
    source: data.source ?? 'direct',
    stageId: data.stageId ?? 'ps-free',
    intake: null,
    wheel: data.wheel ?? null,
    agreement: null,
    nextStep: data.nextStep ?? 'Weekly letter',
    supportAreas: data.supportAreas ?? [],
    goal: data.goal ?? '',
    userId: null,
  });
}

async function sourceIdFromLabel(store: Store, label: string | undefined) {
  if (!label) return 'direct';
  const sources = await store.list('leadSources');
  const hit = sources.find((s) => s.name.toLowerCase() === label.toLowerCase() || s.id === label.toLowerCase());
  return hit?.id ?? 'direct';
}

// ───────────────────────────────────────────── usage counts (delete warnings)
export async function usageOf(store: Store, col: CollectionName, id: string): Promise<{ count: number; label: string }> {
  const n = (count: number, label: string) => ({ count, label });
  switch (col) {
    case 'plans': {
      const e = await store.list('enrollments', { where: { planId: id } });
      return n(e.length, `${e.length} client${e.length === 1 ? '' : 's'} enrolled`);
    }
    case 'toolkits': {
      const u = (await store.list('users')).filter((x) => x.toolkitIds.includes(id));
      const p = await store.list('purchases', { where: { refId: id } });
      return n(Math.max(u.length, p.length), `${p.length} purchase${p.length === 1 ? '' : 's'}`);
    }
    case 'lessons': {
      const w = await store.list('work', { where: { context: `lesson:${id}` } });
      const users = new Set(w.map((x) => x.userId));
      return n(users.size, `${users.size} client${users.size === 1 ? '' : 's'} with saved work`);
    }
    case 'stages': {
      const l = await store.list('lessons', { where: { stageId: id } });
      return n(l.length, `${l.length} lesson${l.length === 1 ? '' : 's'} in this stage`);
    }
    case 'wheelAreas': {
      const w = (await store.list('wheelScores')).filter((s) => s.scores[id] !== undefined);
      const users = new Set(w.map((x) => x.userId ?? x.leadId));
      return n(users.size, `${users.size} people have scores for this area`);
    }
    case 'freeQuestions': {
      const s = (await store.list('freeToolSubmissions')).filter((x) => x.answers[id] !== undefined);
      return n(s.length, `${s.length} saved answer${s.length === 1 ? '' : 's'}`);
    }
    case 'forms': {
      const f = await store.get('forms', id);
      const s = f ? await store.list('submissions', { where: { formKey: f.key } }) : [];
      return n(s.length, `${s.length} submission${s.length === 1 ? '' : 's'}`);
    }
    case 'emails': {
      const e = await store.get('emails', id);
      const o = e ? await store.list('outbox', { where: { templateKey: e.key } }) : [];
      return n(o.length, `${o.length} email${o.length === 1 ? '' : 's'} sent`);
    }
    case 'pipelineStages': {
      const l = await store.list('leads', { where: { stageId: id } });
      return n(l.length, `${l.length} lead${l.length === 1 ? '' : 's'} at this stage`);
    }
    case 'leadSources': {
      const l = await store.list('leads', { where: { source: id } });
      return n(l.length, `${l.length} lead${l.length === 1 ? '' : 's'} from this source`);
    }
    case 'journeyStages': {
      const p = await store.list('pipelineStages', { where: { journeyStageId: id } });
      return n(p.length, `${p.length} pipeline stage${p.length === 1 ? '' : 's'} linked`);
    }
    case 'checkpoints': {
      const w = await store.list('work', { where: { context: `checkpoint:${id}` } });
      return n(w.length, `${w.length} client entr${w.length === 1 ? 'y' : 'ies'}`);
    }
    default:
      return n(0, '');
  }
}

// ───────────────────────────────────────────── admin overview
export async function adminOverview(store: Store) {
  const [enrollments, plans, leads, bookings, submissions, analytics] = await Promise.all([
    store.list('enrollments'), store.list('plans'), store.list('leads'), store.list('bookings'), store.list('submissions'), store.list('analytics'),
  ]);
  const active = enrollments.filter((e) => e.status === 'active');
  const byPlan = plans.map((p) => ({ plan: p, count: active.filter((e) => e.planId === p.id).length })).filter((x) => x.count);
  const today = now();
  const monday = weekStart(today);
  const sunday = addDays(monday, 7);
  const thisWeek = bookings.filter((b) => {
    const d = new Date(b.when);
    return d >= monday && d < sunday && b.status !== 'cancelled';
  }).sort((a, b) => a.when.localeCompare(b.when));
  const intakeAwaiting = submissions.filter((s) => s.formKey === 'intake' && s.status !== 'reviewed').length + leads.filter((l) => l.intake && !submissions.some((s) => s.leadId === l.id && s.formKey === 'intake')).length;
  const callsThisWeek = thisWeek.filter((b) => b.kind === 'discovery').length;
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const snap = analytics.find((a) => a.month === month) ?? analytics.slice().sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
  return {
    activeClients: active.length,
    byPlan: byPlan.map((x) => `${x.count} ${x.plan.name}`).join(' · '),
    intakeAwaiting,
    callsThisWeek,
    joinedThisMonth: snap?.emailListThisMonth ?? 0,
    thisWeek: thisWeek.map((b) => ({ ...b, whenLabel: b.allDay ? fmtDay(new Date(b.when)) : `${fmtDay(new Date(b.when))} · ${fmtTime(new Date(b.when))}` })),
    snapshot: snap,
  };
}

// ───────────────────────────────────────────── registry
export const ACTIONS = {
  // ── public
  submitEnquiry: def('public', async ({ store }, p: { data: Record<string, unknown> }) => {
    const d = p.data;
    const [form] = await store.list('forms', { where: { key: 'enquiry' } });
    for (const field of form?.fields ?? []) if (field.required) required(d[field.id], field.label);
    const email = String(d.email ?? '').trim();
    if (!isEmail(email)) throw new ActionError('Please enter a valid email address');
    const source = await sourceIdFromLabel(store, d.source as string);
    const lead = await findOrCreateLead(store, {
      name: String(d.name ?? ''), email, phone: String(d.phone ?? ''), location: String(d.location ?? ''), source,
      stageId: 'ps-enquiry', nextStep: 'Book discovery call', supportAreas: (d.support as string[]) ?? [], goal: String(d.goal ?? ''),
    });
    const submission = await store.insert('submissions', { formKey: 'enquiry', userId: null, leadId: lead.id, data: d, status: 'received', submittedAt: now().toISOString() });
    await sendTemplate(store, 'enquiry-confirmation', email, { name: String(d.name ?? '').split(' ')[0] || 'there' });
    await event(store, 'email', source);
    return { leadId: lead.id, submissionId: submission.id };
  }),

  submitFreeTool: def('public', async ({ store, actor }, p: { email?: string; answers: Record<string, string | string[]>; plan: Record<string, string>; scores: Record<string, number>; source?: string }) => {
    let leadId: string | null = null;
    if (p.email) {
      if (!isEmail(p.email)) throw new ActionError('Please enter a valid email address');
      const lead = await findOrCreateLead(store, { email: p.email, source: await sourceIdFromLabel(store, p.source), wheel: 'done', stageId: 'ps-free', nextStep: 'Weekly letter' });
      leadId = lead.id;
      await event(store, 'email', p.source);
    }
    await store.insert('freeToolSubmissions', { leadId, email: p.email ?? '', answers: p.answers, plan: p.plan, scores: p.scores });
    await store.insert('wheelScores', { userId: actor?.id ?? null, leadId, context: 'free-tool', date: isoDate(now()), scores: p.scores, ownerId: actor?.id ?? null });
    await event(store, 'tool-complete', p.source);
    return { leadId };
  }),

  bookDiscovery: def('public', async ({ store }, p: { name: string; email: string; when: string; source?: string }) => {
    required(p.name, 'Name');
    required(p.email, 'Email');
    required(p.when, 'Time');
    if (!isEmail(p.email)) throw new ActionError('Please enter a valid email address');
    const lead = await findOrCreateLead(store, { name: p.name, email: p.email, stageId: 'ps-call', source: await sourceIdFromLabel(store, p.source) });
    const d = new Date(p.when);
    await store.update('leads', lead.id, { stageId: 'ps-call', nextStep: `Call · ${fmtDay(d)}` });
    const booking = await store.insert('bookings', { when: d.toISOString(), allDay: false, title: 'Discovery call', whoLabel: `${p.name} (${lead.source})`, userId: null, leadId: lead.id, kind: 'discovery', status: lead.intake === 'received' ? 'confirmed' : 'intake-pending' });
    await sendTemplate(store, 'discovery-confirmation', p.email, { name: p.name.split(' ')[0], next_session: `${fmtDay(d)} · ${fmtTime(d)}` });
    await event(store, 'call-booked', lead.source);
    return { bookingId: booking.id };
  }),

  /** Self-paced purchases (toolkit / bundle / journey). Payment provider integration is behind PaymentProvider in the API. */
  purchase: def('public', async ({ store, actor }, p: { kind: 'toolkit' | 'bundle' | 'journey'; refId?: string; email?: string; method?: string }) => {
    const settings = await singleton(store, 'settings');
    let amount = 0;
    let label = '';
    if (p.kind === 'toolkit') {
      const tk = p.refId ? await store.get('toolkits', p.refId) : null;
      if (!tk || !tk.active) throw new ActionError('Toolkit not available', 404);
      amount = tk.price;
      label = `${tk.name} Toolkit`;
    } else {
      const [prod] = await store.list('products', { where: { kind: p.kind } });
      if (!prod || !prod.active) throw new ActionError('Product not available', 404);
      if (prod.price === null) throw new ActionError('This product is not priced yet — please enquire', 409);
      amount = prod.price;
      label = p.kind === 'bundle' ? 'Complete Guided SHIFT Toolkit Collection' : prod.name;
    }
    const email = actor?.email ?? p.email ?? '';
    if (!isEmail(email)) throw new ActionError('Please enter a valid email address');
    const purchase = await store.insert('purchases', { userId: actor?.id ?? null, email, kind: p.kind, refId: p.refId ?? p.kind, label, amount, currency: settings.currency, status: 'paid', method: p.method ?? 'card', date: isoDate(now()), ownerId: actor?.id ?? null });
    if (actor) {
      const user = await store.get('users', actor.id);
      if (user) {
        const toolkits = await store.list('toolkits');
        const toolkitIds = p.kind === 'bundle' ? toolkits.map((t) => t.id) : p.kind === 'toolkit' ? Array.from(new Set([...user.toolkitIds, p.refId!])) : user.toolkitIds;
        await store.update('users', user.id, { toolkitIds, journeyAccess: user.journeyAccess || p.kind === 'journey' });
      }
    } else {
      await findOrCreateLead(store, { email, stageId: 'ps-toolkit', nextStep: 'Journey week 3 email' });
    }
    await sendTemplate(store, 'payment-confirmation', email, { name: actor?.name ?? 'there', package: label, amount: formatPrice(amount, settings.currency) });
    await event(store, 'purchase');
    return { purchaseId: purchase.id };
  }),

  trackEvent: def('public', async ({ store }, p: { type: T.AnalyticsEvent['type']; source?: string }) => {
    await event(store, p.type, p.source);
    return { ok: true };
  }),

  // ── client
  enrol: def('client', async (ctx, p: { planId: string; method?: string; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const plan = await store.get('plans', p.planId);
    if (!plan || !plan.active) throw new ActionError('Package not available', 404);
    const settings = await singleton(store, 'settings');
    const user = await store.get('users', userId);
    if (!user) throw new ActionError('User not found', 404);
    const existing = (await store.list('enrollments', { where: { userId } })).find((e) => e.status !== 'completed');
    const enrollment = existing
      ? await store.update('enrollments', existing.id, { planId: plan.id, status: 'active' })
      : await store.insert('enrollments', { userId, planId: plan.id, status: 'active', startDate: isoDate(now()), sessionsCompleted: 0, nextSession: null, focusAreas: [], forms: { intake: false, signed: false }, emailMasked: `${user.email.split('@')[0]}@…`, ownerId: userId });
    if (plan.price !== null) {
      await store.insert('purchases', { userId, email: user.email, kind: 'package', refId: plan.id, label: `${plan.name} package`, amount: plan.price, currency: settings.currency, status: p.method === 'bank' ? 'pending' : 'paid', method: p.method ?? 'card', date: isoDate(now()), ownerId: userId });
    }
    const [lead] = await store.list('leads', { where: { email: user.email } });
    if (lead) await store.update('leads', lead.id, { stageId: 'ps-enrolled', nextStep: 'Send onboarding forms', userId });
    await sendTemplate(store, 'payment-confirmation', user.email, { name: user.name.split(' ')[0], package: plan.name, amount: formatPrice(plan.price, settings.currency) ?? 'price on enquiry' });
    await sendTemplate(store, 'welcome', user.email, { name: user.name.split(' ')[0], package: plan.name, sessions: plan.sessions });
    await event(store, 'client');
    return { enrollmentId: enrollment.id };
  }),

  saveWork: def('client', async (ctx, p: { context: string; patch: Partial<T.Work>; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const [existing] = await store.list('work', { where: { userId, context: p.context } });
    const { userId: _u, context: _c, ...patch } = p.patch;
    if (patch.completed && !existing?.completed) patch.completedAt = now().toISOString();
    if (existing) {
      const merged: Partial<T.Work> = {
        ...patch,
        reflections: { ...existing.reflections, ...(patch.reflections ?? {}) },
        tool: { ...existing.tool, ...(patch.tool ?? {}) },
        nextStep: { ...existing.nextStep, ...(patch.nextStep ?? {}) },
        step: Math.max(existing.step, patch.step ?? 0),
      };
      return store.update('work', existing.id, merged);
    }
    return store.insert('work', {
      userId, context: p.context, step: patch.step ?? 1, completed: patch.completed ?? false, completedAt: patch.completedAt ?? null, videoSeconds: patch.videoSeconds ?? 0,
      reflections: patch.reflections ?? {}, tool: patch.tool ?? {}, nextStep: patch.nextStep ?? { text: '' }, ownerId: userId,
    });
  }),

  saveWheel: def('client', async (ctx, p: { context: string; scores: Record<string, number>; userId?: string; date?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const date = p.date ?? isoDate(now());
    const [existing] = await store.list('wheelScores', { where: { userId, context: p.context } });
    if (existing) return store.update('wheelScores', existing.id, { scores: p.scores, date });
    return store.insert('wheelScores', { userId, leadId: null, context: p.context, date, scores: p.scores, ownerId: userId });
  }),

  saveHabit: def('client', async (ctx, p: { id?: string; habit: Partial<T.Habit>; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    required(p.habit.name, 'Habit');
    const days = p.habit.days ?? [];
    const detail = p.habit.detail || `${p.habit.frequency ?? ''}`;
    if (p.id) {
      const h = await store.get('habits', p.id);
      if (!h || h.userId !== userId) throw new ActionError('Habit not found', 404);
      return store.update('habits', p.id, { ...p.habit, days, detail });
    }
    return store.insert('habits', {
      userId, name: p.habit.name!, detail, frequency: p.habit.frequency ?? 'Daily', days, trigger: p.habit.trigger ?? '', makeEasy: p.habit.makeEasy ?? '', reward: p.habit.reward ?? '',
      icon: p.habit.icon ?? 'leaf', color: p.habit.color ?? 'sage', ownerId: userId,
    });
  }),

  deleteHabit: def('client', async (ctx, p: { id: string }) => {
    const h = await ctx.store.get('habits', p.id);
    if (!h || (!isAdmin(ctx.actor) && h.userId !== me(ctx).id)) throw new ActionError('Habit not found', 404);
    for (const c of await ctx.store.list('habitChecks', { where: { habitId: p.id } })) await ctx.store.remove('habitChecks', c.id);
    await ctx.store.remove('habits', p.id);
    return { ok: true };
  }),

  /** Cycles a day: empty → done → missed → empty. */
  toggleHabitCheck: def('client', async (ctx, p: { habitId: string; date: string; status?: 'done' | 'missed' | null; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const h = await store.get('habits', p.habitId);
    if (!h || h.userId !== userId) throw new ActionError('Habit not found', 404);
    const [existing] = await store.list('habitChecks', { where: { habitId: p.habitId, date: p.date } });
    const next = p.status !== undefined ? p.status : !existing ? 'done' : existing.status === 'done' ? 'missed' : null;
    if (!next) {
      if (existing) await store.remove('habitChecks', existing.id);
      return { status: null };
    }
    if (existing) await store.update('habitChecks', existing.id, { status: next });
    else await store.insert('habitChecks', { userId, habitId: p.habitId, date: p.date, status: next, ownerId: userId });
    return { status: next };
  }),

  saveGoal: def('client', async (ctx, p: { id?: string; goal: Partial<T.Goal>; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const g = p.goal;
    const statement = g.statement || [g.timeBound, g.specific && `I will ${g.specific.charAt(0).toLowerCase()}${g.specific.slice(1)}`, g.measurable && `(${g.measurable})`].filter(Boolean).join(', ').replace(', (', ' (');
    const data = { ...g, statement };
    if (p.id) return store.update('goals', p.id, data);
    const [latest] = (await store.list('goals', { where: { userId } })).reverse();
    if (latest && !p.goal.setOn) return store.update('goals', latest.id, data);
    return store.insert('goals', {
      userId, intention: g.intention ?? '', specific: g.specific ?? '', measurable: g.measurable ?? '', achievable: g.achievable ?? '', relevant: g.relevant ?? '', timeBound: g.timeBound ?? '',
      statement, why: g.why ?? g.relevant ?? '', values: g.values ?? [], futureSelf: g.futureSelf ?? '', timeline: g.timeline ?? g.timeBound ?? '', firstStep: g.firstStep ?? '', progress: g.progress ?? 0, setOn: g.setOn ?? isoDate(now()), ownerId: userId,
    });
  }),

  saveCard: def('client', async (ctx, p: { card: Partial<T.FutureSelfCard>; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const [existing] = await store.list('cards', { where: { userId } });
    if (existing) return store.update('cards', existing.id, p.card);
    const words = (p.card.become ?? '').split(/[,·•]/).map((s) => s.trim()).filter(Boolean);
    return store.insert('cards', {
      userId, statement: p.card.statement ?? '', see: p.card.see ?? '', become: p.card.become ?? '', live: p.card.live ?? '', choose: p.card.choose ?? '', today: p.card.today ?? '',
      commitments: p.card.commitments ?? [p.card.live, p.card.choose, p.card.today].filter(Boolean) as string[],
      qualities: p.card.qualities ?? words.slice(0, 5).map((name) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), description: '', icon: 'leaf', then: 2, now: 2, thenDate: isoDate(now()), nowDate: isoDate(now()) })),
      ownerId: userId,
    });
  }),

  submitForm: def('client', async (ctx, p: { formKey: T.FormKey; data: Record<string, unknown>; userId?: string; draft?: boolean }) => {
    const userId = targetUser(ctx, p.userId);
    const { store } = ctx;
    const [form] = await store.list('forms', { where: { key: p.formKey } });
    if (!form || !form.active) throw new ActionError('Form not available', 404);
    if (form.audience === 'coach' && !isAdmin(ctx.actor)) throw new ActionError('Not allowed', 403);
    if (!p.draft) for (const f of form.fields) if (f.required) required(p.data[f.id], f.label);
    const [existing] = await store.list('submissions', { where: { userId, formKey: p.formKey } });
    const status: T.FormSubmission['status'] = p.draft ? 'in-progress' : 'received';
    const sub = existing && form.audience !== 'coach'
      ? await store.update('submissions', existing.id, { data: p.data, status, submittedAt: now().toISOString() })
      : await store.insert('submissions', { formKey: p.formKey, userId, leadId: null, data: p.data, status, submittedAt: now().toISOString(), ownerId: userId });
    if (!p.draft && (p.formKey === 'intake' || p.formKey === 'agreement')) {
      const [en] = await store.list('enrollments', { where: { userId } });
      if (en) await store.update('enrollments', en.id, { forms: { ...en.forms, [p.formKey === 'intake' ? 'intake' : 'signed']: true } });
      if (p.formKey === 'intake' && p.data.wheel && typeof p.data.wheel === 'object') {
        await ACTIONS.saveWheel.run(ctx, { context: 'intake', scores: p.data.wheel as Record<string, number>, userId });
      }
    }
    return sub;
  }),

  saveNote: def('client', async (ctx, p: { kind: T.Note['kind']; title: string; body: string; userId?: string }) => {
    const userId = targetUser(ctx, p.userId);
    if ((p.kind === 'session' || p.kind === 'call') && !isAdmin(ctx.actor)) throw new ActionError('Not allowed', 403);
    required(p.body, 'Note');
    return ctx.store.insert('notes', { userId, kind: p.kind, title: p.title, body: p.body, date: isoDate(now()), ownerId: userId });
  }),

  // ── admin
  duplicate: def('admin', async ({ store }, p: { col: CollectionName; id: string }) => {
    const rec = await store.get(p.col, p.id);
    if (!rec) throw new ActionError('Not found', 404);
    const { id: _i, createdAt: _c, updatedAt: _u, sort: _s, ...data } = rec as unknown as Record<string, unknown>;
    const titleField = COLLECTIONS[p.col].titleField;
    if (typeof data[titleField] === 'string') data[titleField] = `${data[titleField]} (copy)`;
    if (typeof data.key === 'string') data.key = `${data.key}-copy`;
    if (typeof data.slug === 'string') data.slug = `${data.slug}-copy`;
    data.active = false;
    return store.insert(p.col, data as never);
  }),

  usage: def('admin', async ({ store }, p: { col: CollectionName; id: string }) => usageOf(store, p.col, p.id)),

  overview: def('admin', async ({ store }) => adminOverview(store)),

  moveLead: def('admin', async ({ store }, p: { leadId: string; stageId: string; sendEmail?: boolean }) => {
    const lead = await store.get('leads', p.leadId);
    const stage = await store.get('pipelineStages', p.stageId);
    if (!lead || !stage) throw new ActionError('Not found', 404);
    const updated = await store.update('leads', lead.id, { stageId: stage.id, nextStep: stage.defaultNextStep });
    if (p.sendEmail && stage.emailKey) await sendTemplate(store, stage.emailKey, lead.email, { name: lead.name.split(' ')[0] });
    return updated;
  }),

  triggerEmail: def('admin', async ({ store }, p: { templateKey: string; to: string; vars?: Record<string, string> }) => {
    const out = await sendTemplate(store, p.templateKey, p.to, p.vars ?? {});
    if (!out) throw new ActionError('Template is inactive or missing');
    return out;
  }),

  assignPackage: def('admin', async (ctx, p: { userId: string; planId: string; sessionsCompleted?: number; nextSession?: string | null; focusAreas?: T.Enrollment['focusAreas'] }) => {
    const { store } = ctx;
    const [en] = await store.list('enrollments', { where: { userId: p.userId } });
    const patch: Partial<T.Enrollment> = { planId: p.planId };
    if (p.sessionsCompleted !== undefined) patch.sessionsCompleted = p.sessionsCompleted;
    if (p.nextSession !== undefined) patch.nextSession = p.nextSession;
    if (p.focusAreas) patch.focusAreas = p.focusAreas;
    if (en) return store.update('enrollments', en.id, patch);
    const user = await store.get('users', p.userId);
    if (!user) throw new ActionError('User not found', 404);
    return store.insert('enrollments', { userId: p.userId, planId: p.planId, status: 'active', startDate: isoDate(now()), sessionsCompleted: p.sessionsCompleted ?? 0, nextSession: p.nextSession ?? null, focusAreas: p.focusAreas ?? [], forms: { intake: false, signed: false }, emailMasked: `${user.email.split('@')[0]}@…`, ownerId: p.userId });
  }),

  resetProgress: def('admin', async ({ store }, p: { userId: string; scope: 'journey' | 'all' }) => {
    const cols: CollectionName[] = p.scope === 'all' ? ['work', 'wheelScores', 'habits', 'habitChecks', 'goals', 'cards'] : ['work'];
    let removed = 0;
    for (const col of cols) {
      for (const r of await store.list(col, { where: { userId: p.userId } as never })) {
        await store.remove(col, r.id);
        removed++;
      }
    }
    return { removed };
  }),

  createClient: def('admin', async ({ store }, p: { name: string; email: string; planId?: string; leadId?: string }) => {
    required(p.name, 'Name');
    if (!isEmail(p.email ?? '')) throw new ActionError('Please enter a valid email address');
    const [exists] = await store.list('users', { where: { email: p.email.toLowerCase() } });
    if (exists) throw new ActionError('A user with this email already exists', 409);
    const initials = p.name.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
    const user = await store.insert('users', { name: p.name, email: p.email.toLowerCase(), role: 'client', initials, avatarColor: 'sage', journeyAccess: false, toolkitIds: [] });
    if (p.leadId) await store.update('leads', p.leadId, { userId: user.id, stageId: 'ps-enrolled' });
    if (p.planId) await ACTIONS.assignPackage.run({ store, actor: null }, { userId: user.id, planId: p.planId });
    return publicUser(user);
  }),
} satisfies Record<string, ActionDef>;

export type ActionName = keyof typeof ACTIONS;
export type ActionPayload<N extends ActionName> = Parameters<(typeof ACTIONS)[N]['run']>[1];
export type ActionResult<N extends ActionName> = Awaited<ReturnType<(typeof ACTIONS)[N]['run']>>;

/** Run an action with access checks — shared by the API route and the in-browser demo client. */
export async function runAction<N extends ActionName>(name: N, ctx: Ctx, payload: ActionPayload<N>): Promise<ActionResult<N>> {
  const action = ACTIONS[name] as ActionDef | undefined;
  if (!action) throw new ActionError(`Unknown action ${String(name)}`, 404);
  if (action.access === 'client' && !ctx.actor) throw new ActionError('Please sign in', 401);
  if (action.access === 'admin' && !isAdmin(ctx.actor)) throw new ActionError('Admin only', 403);
  return action.run(ctx, payload);
}

export { parseDate };
