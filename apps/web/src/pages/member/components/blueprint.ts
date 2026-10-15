import { alignment, fmtDate, habitConsistency, now, type BlueprintTemplate, type ColorKey, type Rec, type WheelArea, type WheelScore } from '@shift/core';
import { usePublicList, useSettings, useSingleton } from '@/data';
import { lessonCtx, stageCtx, useJourney, useMine, type Journey } from './useJourney';

/** Shape of the overrides the person saves on the t3 "Review & Complete" cards (work.tool of the blueprint lesson). */
export interface BlueprintOverrides {
  futureSelf?: { statement: string; qualities: string[] };
  values?: { values: string[]; priorities: string[] };
  learnings?: Record<string, string[]>;
  works?: Record<string, string[]>;
  commitment?: string;
}

export interface BlueprintData {
  tpl: Rec<BlueprintTemplate>;
  section: (page: string, key: string) => { title: string; subtitle: string };
  page: (key: string) => BlueprintTemplate['pages'][number] | undefined;
  name: string;
  date: string;
  statement: string;
  allQualities: { name: string; icon: string; description: string }[];
  qualities: { name: string; icon: string; description: string }[];
  values: string[];
  valueOptions: string[];
  topCount: number;
  priorities: { id: string; name: string; icon: string; color: ColorKey }[];
  learnings: { stageId: string; letter: string; name: string; subtitle: string; bullets: string[]; image: string; color: ColorKey }[];
  goalPct: number;
  goalStatement: string;
  habitsPct: number;
  align: { then: number; now: number; delta: number };
  areas: Rec<WheelArea>[];
  wheelStart: Rec<WheelScore> | null;
  wheelNow: Rec<WheelScore> | null;
  works: { key: string; title: string; items: string[]; suggestions: string[] }[];
  commitment: string;
  blueprintLessonId: string | null;
}

/** Loads every record the blueprint draws from. */
export function useBlueprintInputs() {
  const j = useJourney();
  const cards = useMine('cards').data;
  const goals = useMine('goals').data;
  const habits = useMine('habits').data;
  const checks = useMine('habitChecks').data;
  const scores = useMine('wheelScores').data;
  const areas = usePublicList('wheelAreas').data;
  const tpl = useSingleton('blueprint');
  const settings = useSettings();
  const ready = j.ready && !!cards && !!goals && !!habits && !!checks && !!scores && !!areas && !!tpl && !!settings;
  return { ready, j, cards: cards ?? [], goals: goals ?? [], habits: habits ?? [], checks: checks ?? [], scores: scores ?? [], areas: areas ?? [], tpl, qualityMax: settings?.qualityScale.max ?? 5 };
}
export type BlueprintInputs = ReturnType<typeof useBlueprintInputs>;

const byDate = <T extends { date: string; createdAt: string }>(a: T, b: T) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);

/** Earliest and latest Wheel of Life ratings for the person. */
export function wheelBounds(scores: Rec<WheelScore>[]) {
  const sorted = scores.filter((s) => Object.keys(s.scores ?? {}).length).slice().sort(byDate);
  const start = sorted[0] ?? null;
  const latest = sorted.length > 1 ? sorted[sorted.length - 1] : null;
  return { start, latest, sorted };
}

export function latestGoal<T extends { setOn: string; updatedAt: string }>(goals: T[]) {
  return goals.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.setOn.localeCompare(a.setOn))[0] ?? null;
}

const nonEmpty = (xs: unknown[]) => xs.filter((x): x is string => typeof x === 'string' && !!x.trim());

/** First reflections saved for a stage: its stage reflection, then each lesson's reflections in order. */
export function stageReflectionBullets(j: Journey, stageId: string, count = 2) {
  const out: string[] = [];
  const st = j.workFor(stageCtx(stageId));
  out.push(...nonEmpty(Object.values(st?.reflections ?? {})));
  for (const l of j.byStage[stageId] ?? []) {
    const w = j.workFor(lessonCtx(l.id));
    out.push(...nonEmpty(l.reflections.map((q) => w?.reflections?.[q.id])));
  }
  // Fall back to next-step commitments and the last answer of each form tool (e.g. "My Intention").
  for (const l of j.byStage[stageId] ?? []) {
    if (out.length >= count) break;
    const w = j.workFor(lessonCtx(l.id));
    out.push(...nonEmpty([w?.nextStep?.text]));
    const last = l.tool.kind === 'form' ? l.tool.fields[l.tool.fields.length - 1] : undefined;
    if (last) out.push(...nonEmpty([w?.tool?.[last.id]]));
  }
  return Array.from(new Set(out)).slice(0, count);
}

/** Pure builder: master template + dynamic records (+ the person's edits) → everything the blueprint shows. */
export function computeBlueprint(inp: BlueprintInputs, overridesIn?: BlueprintOverrides): BlueprintData | null {
  const { j, tpl } = inp;
  if (!inp.ready || !tpl) return null;
  const bpLesson = j.lessons.find((l) => l.tool.kind === 'blueprint') ?? null;
  const overrides: BlueprintOverrides = overridesIn ?? ((bpLesson ? j.workFor(lessonCtx(bpLesson.id))?.tool : undefined) as BlueprintOverrides | undefined) ?? {};
  const card = inp.cards[0] ?? null;
  const goal = latestGoal(inp.goals);
  const valuesLesson = j.lessons.find((l) => l.tool.kind === 'values');
  const valuesWork = valuesLesson ? j.workFor(lessonCtx(valuesLesson.id))?.tool : undefined;
  const prioLesson = j.lessons.find((l) => l.tool.kind === 'wheel-priorities');
  const prioWork = prioLesson ? j.workFor(lessonCtx(prioLesson.id))?.tool : undefined;
  const allQualities = (card?.qualities ?? []).map((q) => ({ name: q.name, icon: q.icon, description: q.description }));
  const chosenQ = overrides.futureSelf?.qualities;
  const areaById = new Map(inp.areas.map((a) => [a.id, a]));
  const prioIds = overrides.values?.priorities ?? ((prioWork?.priorities as string[] | undefined) ?? []);
  const { start, latest } = wheelBounds(inp.scores);
  const learnSections = tpl.pages.find((p) => p.key === 'p2')?.sections ?? [];
  const worksSections = tpl.pages.find((p) => p.key === 'p4')?.sections ?? [];
  const section = (page: string, key: string) => {
    const s = tpl.pages.find((p) => p.key === page)?.sections.find((x) => x.key === key);
    return { title: s?.title ?? '', subtitle: s?.subtitle ?? '' };
  };
  const valueCfg = (valuesLesson?.tool.config ?? {}) as { values?: string[]; topCount?: number };
  return {
    tpl,
    section,
    page: (key) => tpl.pages.find((p) => p.key === key),
    name: j.user?.name ?? '',
    date: fmtDate(now()),
    statement: overrides.futureSelf?.statement ?? card?.statement ?? '',
    allQualities,
    qualities: chosenQ ? allQualities.filter((q) => chosenQ.includes(q.name)) : allQualities,
    values: overrides.values?.values ?? ((valuesWork?.top as string[] | undefined) ?? []),
    valueOptions: valueCfg.values ?? [],
    topCount: valueCfg.topCount ?? 5,
    priorities: prioIds.map((id) => areaById.get(id)).filter((a): a is Rec<WheelArea> => !!a).map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color })),
    learnings: j.stages
      .map((s) => {
        const sec = learnSections.find((x) => x.key === s.id);
        return { stageId: s.id, letter: s.letter, name: sec?.title || s.name, subtitle: sec?.subtitle ?? '', bullets: overrides.learnings?.[s.id] ?? stageReflectionBullets(j, s.id), image: s.image, color: s.color };
      }),
    goalPct: goal?.progress ?? 0,
    goalStatement: goal?.statement ?? '',
    habitsPct: habitConsistency(inp.habits, inp.checks),
    align: alignment(card?.qualities ?? [], inp.qualityMax),
    areas: inp.areas,
    wheelStart: start,
    wheelNow: latest,
    works: worksSections
      .filter((s) => tpl.toolSuggestions[s.key])
      .map((s) => ({ key: s.key, title: s.title, suggestions: tpl.toolSuggestions[s.key] ?? [], items: overrides.works?.[s.key] ?? tpl.toolSuggestions[s.key] ?? [] })),
    commitment: overrides.commitment ?? tpl.commitmentDefault,
    blueprintLessonId: bpLesson?.id ?? null,
  };
}

export function useBlueprint(overrides?: BlueprintOverrides) {
  const inp = useBlueprintInputs();
  const data = computeBlueprint(inp, overrides);
  return { inp, data };
}
