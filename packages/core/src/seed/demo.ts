/**
 * Sample DYNAMIC data — the clients, leads, schedule, analytics and member journey shown in the designs.
 * Dates follow the 2026 calendar; the demo clock is set to Monday 28 Sep 2026 (see clock.ts).
 */
import type * as T from '../types';

type Seed<X> = Record<string, X>;

export const DEMO_TODAY = '2026-09-28T08:30:00+04:00';

export const users: Seed<T.User> = {
  edel: { name: 'Edel', email: 'edel@shiftwithedel.com', role: 'admin', initials: 'E', avatarColor: 'deep', journeyAccess: true, toolkitIds: [] },
  sarah: { name: 'Sarah K.', email: 'sarah.k@example.com', role: 'client', initials: 'S', avatarColor: 'rose', phone: '+971 50 000 0001', location: 'Dubai', journeyAccess: true, toolkitIds: ['calm'] },
  aisha: { name: 'Aisha R.', email: 'aisha.r@example.com', role: 'client', initials: 'A', avatarColor: 'taupe', phone: '+971 50 000 0002', location: 'Abu Dhabi', journeyAccess: false, toolkitIds: [] },
  mariam: { name: 'Mariam D.', email: 'mariam.d@example.com', role: 'client', initials: 'M', avatarColor: 'sage', phone: '+971 50 000 0003', location: 'Sharjah', journeyAccess: false, toolkitIds: [] },
};

export const enrollments: Seed<T.Enrollment> = {
  'en-sarah': { userId: 'sarah', planId: 'momentum', status: 'active', startDate: '2026-07-06', sessionsCompleted: 5, nextSession: '2026-09-28T10:00:00+04:00', focusAreas: [{ label: 'Boundaries', score: 4 }, { label: 'Switching off', score: 5 }], forms: { intake: true, signed: true }, emailMasked: 'sarah.k@…' },
  'en-aisha': { userId: 'aisha', planId: 'foundation', status: 'active', startDate: '2026-09-14', sessionsCompleted: 1, nextSession: '2026-09-30T18:00:00+04:00', focusAreas: [{ label: 'Confidence', score: 3 }, { label: 'Career', score: 6 }], forms: { intake: true, signed: true }, emailMasked: 'aisha.r@…' },
  'en-mariam': { userId: 'mariam', planId: 'transform', status: 'active', startDate: '2026-04-06', sessionsCompleted: 11, nextSession: '2026-10-02T11:00:00+04:00', focusAreas: [{ label: 'Emotional wellbeing', score: null }, { label: 'Relationships', score: null }], forms: { intake: true, signed: true }, emailMasked: 'mariam.d@…' },
};

export const leads: Seed<T.Lead> = {
  layla: { name: 'Layla H.', email: 'layla.h@example.com', phone: '+971 55 000 0101', location: 'Dubai', source: 'instagram', stageId: 'ps-call', intake: 'received', wheel: 'done', agreement: null, nextStep: 'Call · Thu 1 Oct', supportAreas: ['Stress & overwhelm'], goal: 'Feel calmer at work and switch off in the evenings.', userId: null },
  noor: { name: 'Noor A.', email: 'noor.a@example.com', phone: '+971 55 000 0102', location: 'Abu Dhabi', source: 'tiktok', stageId: 'ps-intake', intake: 'in-progress', wheel: null, agreement: null, nextStep: 'Nudge email', supportAreas: ['Confidence & self-belief'], goal: 'Build confidence for a career change.', userId: null },
  elena: { name: 'Elena P.', email: 'elena.p@example.com', phone: '', location: 'Dubai', source: 'youtube', stageId: 'ps-toolkit', intake: null, wheel: null, agreement: null, nextStep: 'Journey week 3 email', supportAreas: [], goal: '', userId: null },
  jasmine: { name: 'Jasmine W.', email: 'jasmine.w@example.com', phone: '', location: 'Outside UAE', source: 'linkedin', stageId: 'ps-free', intake: null, wheel: null, agreement: null, nextStep: 'Weekly letter', supportAreas: [], goal: '', userId: null },
};

export const bookings: Seed<T.Booking> = {
  'bk-1': { when: '2026-09-28T10:00:00+04:00', allDay: false, title: '1:1 Session 6 — boundaries practice review', whoLabel: 'Sarah K.', userId: 'sarah', leadId: null, kind: 'session', status: 'confirmed' },
  'bk-2': { when: '2026-09-30T18:00:00+04:00', allDay: false, title: '1:1 Session 2 — Wheel of Life mapping', whoLabel: 'Aisha R.', userId: 'aisha', leadId: null, kind: 'session', status: 'confirmed' },
  'bk-3': { when: '2026-10-01T12:30:00+04:00', allDay: false, title: 'Discovery call', whoLabel: 'New lead (Instagram)', userId: null, leadId: 'layla', kind: 'discovery', status: 'intake-pending' },
  'bk-4': { when: '2026-10-02T11:00:00+04:00', allDay: false, title: '1:1 Session 12 — Momentum over motivation', whoLabel: 'Mariam D.', userId: 'mariam', leadId: null, kind: 'session', status: 'confirmed' },
  'bk-5': { when: '2026-10-04T08:00:00+04:00', allDay: true, title: 'Weekly SHIFT Letter — "The pause-before-yes"', whoLabel: '1,284 subscribers', userId: null, leadId: null, kind: 'letter', status: 'scheduled' },
};

export const purchases: Seed<T.Purchase> = {
  'pu-1': { userId: 'sarah', email: 'sarah.k@example.com', kind: 'toolkit', refId: 'calm', label: 'Calm Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'card', date: '2026-09-03' },
  'pu-2': { userId: null, email: 'elena.p@example.com', kind: 'toolkit', refId: 'overthinking', label: 'Overthinking Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'card', date: '2026-09-05' },
  'pu-3': { userId: null, email: 'buyer3@example.com', kind: 'toolkit', refId: 'confidence', label: 'Confidence Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'card', date: '2026-09-11' },
  'pu-4': { userId: null, email: 'buyer4@example.com', kind: 'toolkit', refId: 'calm', label: 'Calm Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'link', date: '2026-09-14' },
  'pu-5': { userId: null, email: 'buyer5@example.com', kind: 'toolkit', refId: 'boundaries', label: 'Boundaries Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'card', date: '2026-09-19' },
  'pu-6': { userId: null, email: 'buyer6@example.com', kind: 'toolkit', refId: 'momentum', label: 'Momentum Toolkit', amount: 79, currency: 'AED', status: 'paid', method: 'card', date: '2026-09-24' },
};

export const submissions: Seed<T.FormSubmission> = {
  'sb-1': { formKey: 'enquiry', userId: null, leadId: 'layla', data: { name: 'Layla H.', email: 'layla.h@example.com', support: ['Stress & overwhelm'], goal: 'Feel calmer at work and switch off in the evenings.', source: 'Instagram' }, status: 'reviewed', submittedAt: '2026-09-22T09:12:00+04:00' },
  'sb-2': { formKey: 'intake', userId: null, leadId: 'layla', data: { goals: 'Switch off after work and stop overthinking.', challenges: 'Long days, always on my phone.' }, status: 'received', submittedAt: '2026-09-25T20:05:00+04:00' },
  'sb-3': { formKey: 'intake', userId: null, leadId: 'noor', data: { goals: 'Build confidence for a career change.' }, status: 'in-progress', submittedAt: '2026-09-26T13:40:00+04:00' },
  'sb-4': { formKey: 'intake', userId: 'sarah', leadId: null, data: { goals: 'Set better boundaries at work and switch off in the evenings.' }, status: 'reviewed', submittedAt: '2026-07-02T19:00:00+04:00' },
  'sb-5': { formKey: 'agreement', userId: 'sarah', leadId: null, data: { consent: true, signature: 'Sarah K.' }, status: 'reviewed', submittedAt: '2026-07-03T10:00:00+04:00' },
};

export const outbox: Seed<T.OutboxEmail> = {
  'ob-1': { templateKey: 'enquiry-confirmation', to: 'layla.h@example.com', subject: 'Thank you for your enquiry', body: 'Hi Layla, Thank you for reaching out to SHIFT…', status: 'logged', sentAt: '2026-09-22T09:12:30+04:00' },
  'ob-2': { templateKey: 'nudge', to: 'noor.a@example.com', subject: 'Your intake form is waiting for you', body: 'Hi Noor, Just a gentle nudge…', status: 'queued', sentAt: '2026-09-28T09:00:00+04:00' },
};

export const notes: Seed<T.Note> = {
  'nt-1': { userId: 'sarah', kind: 'session', title: 'Session 5 — boundaries', body: 'Key insight: saying yes to protect others’ comfort. Action: pause-before-yes at work. Next: practise review.', date: '2026-09-21' },
};

export const freeToolSubmissions: Seed<T.FreeToolSubmission> = {
  'ft-1': { leadId: 'layla', email: 'layla.h@example.com', answers: { q1: 'Work takes up everything.', q6: 'Phone off at 9pm.' }, plan: {}, scores: { health: 5, relationships: 6, career: 7, finances: 6, growth: 4, fun: 3, environment: 6, meaning: 5 } },
  'ft-2': { leadId: 'jasmine', email: 'jasmine.w@example.com', answers: {}, plan: {}, scores: {} },
};

export const wheelScores: Seed<T.WheelScore> = {
  'ws-sarah-start': { userId: 'sarah', leadId: null, context: 'free-tool', date: '2026-09-06', scores: { health: 4, career: 5, finances: 4, growth: 5, relationships: 6, fun: 4, environment: 5, meaning: 4 } },
  'ws-sarah-i2': { userId: 'sarah', leadId: null, context: 'lesson:i2', date: '2026-09-10', scores: { health: 7, relationships: 5, career: 6, finances: 4, growth: 8, fun: 6, environment: 5, meaning: 7 } },
  'ws-sarah-now': { userId: 'sarah', leadId: null, context: 'lesson:t1', date: '2026-09-20', scores: { health: 7, career: 8, finances: 3, growth: 8, relationships: 8, fun: 6, environment: 4, meaning: 7 } },
  'ws-aisha': { userId: 'aisha', leadId: null, context: 'intake', date: '2026-09-14', scores: { health: 6, career: 6, finances: 5, growth: 5, relationships: 6, fun: 5, environment: 6, meaning: 4 } },
  'ws-mariam-start': { userId: 'mariam', leadId: null, context: 'intake', date: '2026-04-06', scores: { health: 5, career: 6, finances: 6, growth: 4, relationships: 3, fun: 4, environment: 6, meaning: 4 } },
  'ws-mariam-cp': { userId: 'mariam', leadId: null, context: 'checkpoint:cp-f', date: '2026-08-31', scores: { health: 6, career: 7, finances: 6, growth: 7, relationships: 6, fun: 5, environment: 6, meaning: 6 } },
};

export const habits: Seed<T.Habit> = {
  'hb-move': { userId: 'sarah', name: 'Move My Body', detail: '20 minutes (3 days/week)', frequency: '3 days per week', days: [0, 2, 4], trigger: 'After work', makeEasy: 'Lay out my workout clothes the night before', reward: 'Feeling more energised', icon: 'bolt', color: 'peach' },
  'hb-water': { userId: 'sarah', name: 'Drink More Water', detail: 'Daily', frequency: 'Daily', days: [0, 1, 2, 3, 4, 5, 6], trigger: 'With every meal', makeEasy: 'Keep a bottle on my desk', reward: 'Feeling fresher', icon: 'drop', color: 'blue' },
  'hb-read': { userId: 'sarah', name: 'Read', detail: '15 minutes (4 days/week)', frequency: '4 days per week', days: [0, 1, 2, 3], trigger: 'After dinner', makeEasy: 'Book on my pillow', reward: 'A calm end to the day', icon: 'book', color: 'rose' },
  'hb-sleep': { userId: 'sarah', name: 'Better Sleep Routine', detail: 'In bed by 10:30pm (Daily)', frequency: 'Daily', days: [0, 1, 2, 3, 4, 5, 6], trigger: 'Phone on charge at 10pm', makeEasy: 'Alarm reminder at 10pm', reward: 'Waking up rested', icon: 'moon', color: 'lavender' },
};

/** Week grid helper: Monday date + per-day status string ('d' done, 'm' missed, '.' none). */
function week(monday: number, month: 8 | 9, rows: Record<string, string>): Seed<T.HabitCheck> {
  const out: Seed<T.HabitCheck> = {};
  for (const [habitId, pattern] of Object.entries(rows)) {
    [...pattern].forEach((c, i) => {
      if (c === '.') return;
      const date = new Date(Date.UTC(2026, month - 1, monday + i)).toISOString().slice(0, 10);
      out[`hc-${habitId}-${date}`] = { userId: 'sarah', habitId, date, status: c === 'd' ? 'done' : 'missed' };
    });
  }
  return out;
}

export const habitChecks: Seed<T.HabitCheck> = {
  // Week 1: 31 Aug – 6 Sep
  ...week(31, 8, { 'hb-move': 'd.m.d..', 'hb-water': 'ddmddmd', 'hb-read': 'dmd....', 'hb-sleep': 'ddmdmdd' }),
  // Week 2: 7 – 13 Sep
  ...week(7 + 31, 8, { 'hb-move': 'd.d.m..', 'hb-water': 'dddmddd', 'hb-read': 'ddmd...', 'hb-sleep': 'dddmddm' }),
  // Week 3: 14 – 20 Sep (as shown in the designs)
  ...week(14 + 31, 8, { 'hb-move': 'd.d.d..', 'hb-water': 'ddddddd', 'hb-read': 'dmdd.d.', 'hb-sleep': 'dddddmd' }),
};

export const goals: Seed<T.Goal> = {
  'gl-sarah': {
    userId: 'sarah',
    intention: 'I intend to create more balance between my work and personal life.',
    specific: 'Walk for 30 minutes after work', measurable: '30 minutes, 3 times per week', achievable: 'Yes — very realistic', relevant: 'It supports my health, energy and work-life balance.', timeBound: 'For the next 4 weeks',
    statement: 'For the next 4 weeks, I will walk for 30 minutes after work every Monday, Wednesday and Friday.',
    why: 'It supports my health, energy and work-life balance.',
    values: ['Health', 'Balance', 'Freedom'],
    futureSelf: 'A healthier, more balanced and energised me.',
    timeline: '4 weeks (6 Sep – 3 Oct 2026)',
    firstStep: 'Prepare my walking clothes on Sunday evening.',
    progress: 70,
    setOn: '2026-09-06',
  },
};

export const cards: Seed<T.FutureSelfCard> = {
  'cd-sarah': {
    userId: 'sarah',
    statement: 'A calmer, healthier, more confident and intentional me.',
    see: 'One year from now I wake up rested, walk by the sea before work and feel calm in my day.',
    become: 'Calm, Confident, Healthy, Intentional',
    live: 'I prioritise my wellbeing, health, relationships and personal growth. I make time for movement, rest and the people who matter to me.',
    choose: "START walking after work. CONTINUE my reading. LET GO of waiting for perfect conditions.",
    today: 'Prepare my running clothes tonight and go for a 20-minute walk tomorrow morning.',
    commitments: [
      'I prioritise my wellbeing, health, relationships and personal growth.',
      'I make time for movement, rest and the people who matter to me.',
      "I'm letting go of waiting for perfect conditions before I begin.",
      'My commitment today is to prepare my running clothes tonight and go for a 20-minute walk tomorrow morning.',
    ],
    qualities: [
      { name: 'Calm', description: 'More present and less reactive', icon: 'leaf', then: 2, now: 4, thenDate: '2026-09-06', nowDate: '2026-09-20' },
      { name: 'Confident', description: 'Believing in myself', icon: 'heart', then: 2, now: 3, thenDate: '2026-09-06', nowDate: '2026-09-20' },
      { name: 'Healthy', description: 'Strong and energetic', icon: 'dumbbell', then: 3, now: 5, thenDate: '2026-09-06', nowDate: '2026-09-20' },
      { name: 'Intentional', description: 'Living in alignment with my values', icon: 'sun', then: 2, now: 4, thenDate: '2026-09-06', nowDate: '2026-09-20' },
    ],
  },
};

const done = (context: string, at: string, extra: Partial<T.Work> = {}): T.Work => ({
  userId: 'sarah', context, step: 4, completed: true, completedAt: at, videoSeconds: 0, reflections: {}, tool: {}, nextStep: { text: '' }, ...extra,
});

export const work: Seed<T.Work> = {
  'wk-s1': done('lesson:s1', '2026-08-31T19:00:00+04:00', { reflections: { r1: 'I jump to the worst-case story when someone does not reply.' }, tool: { happened: "I didn't get a reply to my message.", think: "They're ignoring me.", feel: 'Anxious, frustrated.', do: 'Checked my phone multiple times.' } }),
  'wk-s2': done('lesson:s2', '2026-09-01T19:00:00+04:00', { reflections: { r1: 'Health, family and feeling free in my time.', r2: 'Calm evenings and time outdoors.' }, tool: { picked: ['Health', 'Balance', 'Calm', 'Contribution', 'Growth', 'Relationships', 'Freedom', 'Purpose'], top: ['Health', 'Balance', 'Connection', 'Freedom', 'Growth'], meanings: { Health: 'Energy to enjoy my life.', Balance: 'Work does not take everything.' } }, nextStep: { text: 'I will use my value of health to guide what I say yes to this week.' } }),
  'wk-s3': done('lesson:s3', '2026-09-02T19:00:00+04:00', { reflections: { r1: 'Scrolling my phone in bed.' }, tool: { habit: 'Checking my phone before bed', cue: 'Getting into bed', routine: 'Scrolling for 30+ minutes', reward: 'Switching off from the day', next: 'Read 15 minutes instead' } }),
  'wk-h1': done('lesson:h1', '2026-09-04T19:00:00+04:00', { reflections: { r1: 'Tight shoulders and a fast heartbeat.' }, tool: { noticing: ['Tension', 'Fast heartbeat'], feeling: ['Overwhelmed', 'Stressed'], need: ['A pause', 'Movement'] } }),
  'wk-h2': done('lesson:h2', '2026-09-05T19:00:00+04:00', { reflections: { r1: 'Replying to emails late at night.' } }),
  'wk-h3': done('lesson:h3', '2026-09-06T19:00:00+04:00', { reflections: { r1: 'Anxiety.' } }),
  'wk-i1': done('lesson:i1', '2026-09-08T19:00:00+04:00', { tool: { see: 'One year from now I wake up rested, walk by the sea before work and feel calm in my day.', become: 'Calm, Confident, Healthy, Intentional', live: 'I prioritise my wellbeing… I make time for movement and rest…', choose: 'START walking. CONTINUE reading. LET GO of perfect conditions.', today: 'Prepare my running clothes tonight.' } }),
  'wk-i2': done('lesson:i2', '2026-09-10T19:00:00+04:00', { tool: { priorities: ['relationships', 'growth', 'meaning'], mainFocus: 'growth', mainWhy: 'I choose to focus on this because it will have the biggest positive impact on my wellbeing and future self.', explore: { relationships: { now: 'I feel connected to a few close people but want more quality time.', want: 'Deeper, more consistent connection with the people who matter most.', why: 'Meaningful relationships bring me happiness, support and balance.', progress: 'Spending intentional time each week with family and friends.' } } }, nextStep: { text: '', checklist: { '0': true, '1': true, '2': true } } }),
  'wk-i3': done('lesson:i3', '2026-09-12T19:00:00+04:00', { tool: { wish: 'More balance between work and home.', vision: 'Evenings that feel like mine.', why: 'I want energy for the people I love.', intention: 'I intend to create more balance between my work and personal life.' } }),
  'wk-f1': done('lesson:f1', '2026-09-06T20:00:00+04:00'),
  'wk-f2': done('lesson:f2', '2026-08-31T20:00:00+04:00'),
  'wk-f3': { userId: 'sarah', context: 'lesson:f3', step: 2, completed: false, completedAt: null, videoSeconds: 140, reflections: { r1: 'I kept my sleep routine almost every night.' }, tool: {}, nextStep: { text: '' } },
  'wk-t1': { userId: 'sarah', context: 'lesson:t1', step: 1, completed: false, completedAt: null, videoSeconds: 0, reflections: {}, tool: {}, nextStep: { text: '' } },
};

export const analytics: Seed<T.AnalyticsSnapshot> = {
  '2026-09': {
    month: '2026-09',
    monthLabel: 'September 2026',
    siteVisits: 6412,
    siteVisitsDelta: 22,
    toolCompletions: 1138,
    toolCompletionsNote: 'Q1 (overthinking) leads',
    emails: 352,
    emailRate: 31,
    calls: 14,
    callsToClients: 5,
    emailListThisMonth: 214,
    emailListDelta: 38,
    revenue: 4100,
    revenueNote: '6 toolkits · 1 Journey · 1 package',
    freeToolEmailRate: 31,
    freeToolNote: 'Powerful Questions converting best',
    sources: [
      { name: 'Instagram', visits: 1842, emailRate: 5.8 },
      { name: 'TikTok', visits: 1144, emailRate: 4.1 },
      { name: 'YouTube', visits: 628, emailRate: 7.9 },
      { name: 'LinkedIn', visits: 404, emailRate: 9.4 },
      { name: 'Direct / other', visits: 252, emailRate: 3.1 },
    ],
    funnel: [
      { stage: 'Viewed a free tool', people: 3204, conversion: '—', best: 'Instagram' },
      { stage: 'Completed a Powerful Question', people: 1138, conversion: '36%', best: 'Instagram' },
      { stage: 'Gave their email', people: 352, conversion: '31%', best: 'LinkedIn (highest rate)' },
      { stage: 'Bought a toolkit / Journey', people: 21, conversion: '6%', best: 'YouTube' },
      { stage: 'Booked a discovery call', people: 14, conversion: '—', best: 'LinkedIn' },
      { stage: 'Became 1:1 clients', people: 5, conversion: '36% of calls', best: 'LinkedIn' },
    ],
    insight: 'Insight worth acting on: Instagram brings the volume, but LinkedIn converts to 1:1 at nearly double the rate — consider posting your self-leadership content there too.',
  },
};

