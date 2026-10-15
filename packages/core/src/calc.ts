import type { Habit, HabitCheck, Lesson, Meta, Rec, Settings, Work, WheelArea } from './types';

// ───────────────────────────────────────────── clock
let todayOverride: string | null = null;
/** Pin "today" (used by the demo so seeded schedules line up). */
export function setToday(iso: string | null) {
  todayOverride = iso;
}
export function now(): Date {
  return todayOverride ? new Date(todayOverride) : new Date();
}

// ───────────────────────────────────────────── dates
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function parseDate(s: string): Date {
  // YYYY-MM-DD → local midnight; full ISO → as given
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** Monday of the week containing `d` (local). */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  return addDays(x, -dow);
}
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function fmtDay(d: Date | string) {
  const x = typeof d === 'string' ? parseDate(d) : d;
  return `${DAY_SHORT[(x.getDay() + 6) % 7]} ${x.getDate()} ${MONTHS[x.getMonth()]}`;
}
export function fmtDate(d: Date | string) {
  const x = typeof d === 'string' ? parseDate(d) : d;
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}
export function fmtTime(d: Date | string) {
  const x = typeof d === 'string' ? parseDate(d) : d;
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
}
export function fmtWeekRange(monday: Date) {
  const sun = addDays(monday, 6);
  return `${monday.getDate()} – ${sun.getDate()} ${MONTHS_LONG[sun.getMonth()]} ${sun.getFullYear()}`;
}

// ───────────────────────────────────────────── money & templates
export function formatPrice(amount: number | null | undefined, currency = 'AED'): string | null {
  if (amount === null || amount === undefined) return null;
  if (amount === 0) return 'FREE';
  return `${currency} ${amount.toLocaleString('en-US')}`;
}
export function formatCompactMoney(amount: number, currency = 'AED') {
  return amount >= 1000 ? `${currency} ${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${currency} ${amount}`;
}
/** Replace {var} tokens. Unknown tokens are left untouched. */
export function fillTemplate(text: string, vars: Record<string, string | number | null | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

// ───────────────────────────────────────────── habits
export interface DayCell { date: string; dow: number; planned: boolean; status: 'done' | 'missed' | null }
export interface HabitWeek { habitId: string; planned: number; done: number; pct: number; days: DayCell[] }

export function habitWeek(habit: Rec<Habit>, checks: HabitCheck[], monday: Date): HabitWeek {
  const days: DayCell[] = [];
  let planned = 0;
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const date = isoDate(addDays(monday, i));
    const c = checks.find((x) => x.habitId === habit.id && x.date === date);
    const isPlanned = habit.days.includes(i);
    if (isPlanned) planned++;
    if (isPlanned && c?.status === 'done') done++;
    days.push({ date, dow: i, planned: isPlanned, status: c?.status ?? null });
  }
  return { habitId: habit.id, planned, done, pct: planned ? Math.round((done / planned) * 100) : 0, days };
}

export function overallWeek(habits: Rec<Habit>[], checks: HabitCheck[], monday: Date) {
  const weeks = habits.map((h) => habitWeek(h, checks, monday));
  const planned = weeks.reduce((s, w) => s + w.planned, 0);
  const done = weeks.reduce((s, w) => s + w.done, 0);
  const started = checks.some((c) => {
    const d = parseDate(c.date);
    return d >= monday && d < addDays(monday, 7);
  });
  return { planned, done, pct: planned ? Math.round((done / planned) * 100) : 0, started };
}

/** First Monday that has any check-in (start of the habit programme). */
export function firstHabitWeek(checks: HabitCheck[]): Date | null {
  if (!checks.length) return null;
  const min = checks.map((c) => c.date).sort()[0];
  return weekStart(parseDate(min));
}
/** Latest Monday with a check-in. */
export function latestHabitWeek(checks: HabitCheck[]): Date | null {
  if (!checks.length) return null;
  const max = checks.map((c) => c.date).sort().slice(-1)[0];
  return weekStart(parseDate(max));
}

/** Habit consistency across every started week (used by Look How Far + Blueprint). */
export function habitConsistency(habits: Rec<Habit>[], checks: HabitCheck[]): number {
  const first = firstHabitWeek(checks);
  const last = latestHabitWeek(checks);
  if (!first || !last) return 0;
  let planned = 0;
  let done = 0;
  for (let m = first; m <= last; m = addDays(m, 7)) {
    const w = overallWeek(habits, checks, m);
    planned += w.planned;
    done += w.done;
  }
  return planned ? Math.round((done / planned) * 100) : 0;
}

// ───────────────────────────────────────────── wheel & qualities
export interface WheelRow { areaId: string; name: string; start: number | null; now: number | null; change: number | null }
export function wheelCompare(areas: Rec<WheelArea>[], start: Record<string, number> | undefined, current: Record<string, number> | undefined): WheelRow[] {
  return areas.map((a) => {
    const s = start?.[a.id] ?? null;
    const n = current?.[a.id] ?? null;
    return { areaId: a.id, name: a.name, start: s, now: n, change: s !== null && n !== null ? n - s : null };
  });
}

export function alignment(qualities: { then: number; now: number }[], max = 5) {
  if (!qualities.length) return { then: 0, now: 0, delta: 0 };
  const avg = (k: 'then' | 'now') => qualities.reduce((s, q) => s + q[k], 0) / qualities.length;
  const then = Math.round((avg('then') / max) * 100);
  const nowPct = Math.round((avg('now') / max) * 100);
  return { then, now: nowPct, delta: nowPct - then };
}

// ───────────────────────────────────────────── journey progress
export function lessonContext(lessonId: string) {
  return `lesson:${lessonId}`;
}
export function journeyProgress(lessons: Rec<Lesson>[], work: Rec<Work>[], allowed?: Set<string>) {
  const list = allowed ? lessons.filter((l) => allowed.has(l.id)) : lessons;
  const done = list.filter((l) => work.some((w) => w.context === lessonContext(l.id) && w.completed));
  return { total: list.length, completed: done.length, pct: list.length ? Math.round((done.length / list.length) * 100) : 0, completedIds: new Set(done.map((l) => l.id)) };
}

/** Lessons in journey order (stage sort, then lesson order). */
export function orderedLessons<L extends Rec<Lesson>>(lessons: L[], stages: (Meta & { id: string })[]): L[] {
  const stageIdx = new Map(stages.map((s, i) => [s.id, s.sort ?? i]));
  return lessons.slice().sort((a, b) => (stageIdx.get(a.stageId) ?? 0) - (stageIdx.get(b.stageId) ?? 0) || a.order - b.order || a.sort - b.sort);
}

/** Count words in a free-text answer (reflection word counter). */
export const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function stepLabels(settings: Settings | undefined) {
  return settings?.journeySteps ?? [];
}
