import { useMemo } from 'react';
import { orderedLessons, type CollectionName, type Lesson, type Rec, type RecOf, type Stage, type Work } from '@shift/core';
import { useAuth, useList, usePublicList, useSettings } from '@/data';

type OwnedCol = 'work' | 'habits' | 'habitChecks' | 'goals' | 'cards' | 'wheelScores' | 'notes' | 'submissions' | 'enrollments' | 'bookings' | 'purchases';

/**
 * The signed-in user's own records in a dynamic collection.
 * Clients are owner-scoped by the API already; the admin sees everyone's rows, so we always filter to "me".
 */
export function useMine<C extends OwnedCol>(col: C) {
  const { user } = useAuth();
  const q = useList(col as CollectionName as C);
  const data = useMemo(() => (q.data as RecOf<C>[] | undefined)?.filter((r) => (r as unknown as { userId: string | null }).userId === user?.id), [q.data, user?.id]);
  return { ...q, data };
}

export type LessonStatus = 'completed' | 'in-progress' | 'available' | 'locked' | 'no-access';

export const lessonCtx = (id: string) => `lesson:${id}`;
export const stageCtx = (id: string) => `stage:${id}`;

/** Generic tool names ("The Tool", "Apply the Tool") read better as their subtitle in lists. */
export function toolName(l: Lesson) {
  return /^(the tool|apply the tool)$/i.test(l.tool.title.trim()) && l.tool.subtitle ? l.tool.subtitle : l.tool.title;
}

/**
 * Loads everything the member journey needs (stages, lessons, my work, enrolment + plan, settings)
 * and derives access, sequential unlock and progress.
 */
export function useJourney() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const stagesQ = usePublicList('stages');
  const lessonsQ = usePublicList('lessons');
  const workQ = useMine('work');
  const enrolQ = useMine('enrollments');
  const plansQ = usePublicList('plans');
  const settings = useSettings();

  return useMemo(() => {
    const ready = !authLoading && !!user && !!stagesQ.data && !!lessonsQ.data && !!workQ.data && !!enrolQ.data && !!plansQ.data && !!settings;
    const stages = (stagesQ.data ?? []).slice().sort((a, b) => a.sort - b.sort);
    const stageIds = new Set(stages.map((s) => s.id));
    const lessons = orderedLessons((lessonsQ.data ?? []).filter((l) => stageIds.has(l.stageId)), stages);
    const byStage: Record<string, Rec<Lesson>[]> = {};
    for (const s of stages) byStage[s.id] = [];
    for (const l of lessons) byStage[l.stageId].push(l);
    const work = workQ.data ?? [];
    const workFor = (ctx: string): Rec<Work> | undefined => work.find((w) => w.context === ctx);
    const enrolments = enrolQ.data ?? [];
    const enrolment = enrolments.find((e) => e.status === 'active') ?? enrolments.find((e) => e.status === 'pending') ?? enrolments[0] ?? null;
    const plan = enrolment ? (plansQ.data ?? []).find((p) => p.id === enrolment.planId) ?? null : null;
    const covered = new Set<string>(plan ? Object.values(plan.coverage ?? {}).flat() : []);
    const journeyAccess = !!user?.journeyAccess;
    const hasJourney = isAdmin || journeyAccess || covered.size > 0;

    const canAccess = (l: Rec<Lesson>) => isAdmin || journeyAccess || covered.has(l.id);
    const isDone = (id: string) => !!workFor(lessonCtx(id))?.completed;
    const isUnlocked = (l: Rec<Lesson>) => {
      if (!canAccess(l)) return false;
      if (isAdmin || !journeyAccess) return true; // coach-led sessions are opened by the plan, not by order
      const inStage = byStage[l.stageId] ?? [];
      if (inStage[0]?.id === l.id) return true;
      const idx = lessons.findIndex((x) => x.id === l.id);
      const prev = lessons[idx - 1];
      return !prev || isDone(prev.id);
    };
    const status = (l: Rec<Lesson>): LessonStatus => {
      if (!canAccess(l)) return 'no-access';
      if (isDone(l.id)) return 'completed';
      if (!isUnlocked(l)) return 'locked';
      const w = workFor(lessonCtx(l.id));
      return w && (w.step > 1 || Object.values(w.reflections ?? {}).some(Boolean) || Object.keys(w.tool ?? {}).length) ? 'in-progress' : 'available';
    };
    const accessible = lessons.filter(canAccess);
    const completedCount = accessible.filter((l) => isDone(l.id)).length;
    const progress = { total: accessible.length, completed: completedCount, pct: accessible.length ? Math.round((completedCount / accessible.length) * 100) : 0 };
    const stageProgress = (sid: string) => {
      const ls = (byStage[sid] ?? []).filter(canAccess);
      const done = ls.filter((l) => isDone(l.id)).length;
      return { done, total: ls.length, pct: ls.length ? Math.round((done / ls.length) * 100) : 0 };
    };
    const inProgress = accessible.find((l) => status(l) === 'in-progress');
    const nextLesson = inProgress ?? accessible.find((l) => status(l) === 'available') ?? null;
    const meta = (l: Rec<Lesson>) => {
      const stage = stages.find((s) => s.id === l.stageId) as Rec<Stage> | undefined;
      const inStage = byStage[l.stageId] ?? [];
      return { stage, stageIndex: stages.findIndex((s) => s.id === l.stageId), index: inStage.findIndex((x) => x.id === l.id), total: inStage.length, inStage };
    };
    /** Where to go after completing a lesson: next lesson in the stage, else the stage reflection. */
    const afterLesson = (l: Rec<Lesson>) => {
      const { inStage, index } = meta(l);
      const next = inStage[index + 1];
      if (next && canAccess(next)) return `/app/lesson/${next.id}`;
      return `/app/stage/${l.stageId}/reflection`;
    };
    const stageNextRoute = (sid: string) => {
      const ls = byStage[sid] ?? [];
      const target = ls.find((l) => ['in-progress', 'available'].includes(status(l))) ?? ls.find((l) => canAccess(l));
      return target ? `/app/lesson/${target.id}` : `/app/stage/${sid}`;
    };
    return {
      ready, user, isAdmin, settings, steps: settings?.journeySteps ?? [], stages, lessons, byStage, work, workFor, enrolment, plan, covered,
      journeyAccess, hasJourney, canAccess, isDone, isUnlocked, status, progress, stageProgress, nextLesson, meta, afterLesson, stageNextRoute,
    };
  }, [authLoading, user, isAdmin, stagesQ.data, lessonsQ.data, workQ.data, enrolQ.data, plansQ.data, settings]);
}

export type Journey = ReturnType<typeof useJourney>;

/** "Good morning / afternoon / evening" from the demo-aware clock. */
export function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
export const firstName = (name?: string) => (name ?? '').split(/\s+/)[0] ?? '';
