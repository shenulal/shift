import { Fragment, useRef, useState } from 'react';
import { addDays, DAY_LETTERS, DAY_SHORT, firstHabitWeek, fmtWeekRange, overallWeek, type ColorKey, type Habit, type Lesson, type Rec } from '@shift/core';
import { useAction } from '@/data';
import { Icon } from '@/ui/Icon';
import { Button, Confirm, Loading, Ring, useToast } from '@/ui/kit';
import { HabitGrid, useHabitWeek, WeekNav, weekNumber } from '../HabitPlanner';
import { useMine } from '../useJourney';
import { SectionTitle, tone } from '../ui';
import type { ToolProps } from './types';

const HABIT_STYLES: { icon: string; color: ColorKey }[] = [
  { icon: 'bolt', color: 'peach' }, { icon: 'drop', color: 'blue' }, { icon: 'book', color: 'rose' }, { icon: 'moon', color: 'lavender' }, { icon: 'leaf', color: 'green' }, { icon: 'heart', color: 'blush' },
];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
type Draft = { name: string; frequency: string; days: number[]; trigger: string; makeEasy: string; reward: string };
const EMPTY: Draft = { name: '', frequency: '', days: [], trigger: '', makeEasy: '', reward: '' };

/** "Helpful Reminders" cards from the lesson. */
export function Reminders({ lesson, num }: { lesson: Rec<Lesson>; num?: number }) {
  if (!lesson.reminders.length) return null;
  return (
    <section className="stack gap-16" aria-labelledby="reminders">
      <SectionTitle icon="leaf" num={num} title="Helpful Reminders" id="reminders" />
      <ul className="m-reminders">
        {lesson.reminders.map((r, i) => (
          <li key={i}>
            <Icon name={r.icon} size={26} />
            <strong>{r.title}</strong>
            <span className="body-sm muted">{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 5-step habit builder → saveHabit, then the weekly planner grid. */
export function HabitBuilder({ lesson }: ToolProps) {
  const habits = useMine('habits').data;
  const checks = useMine('habitChecks').data;
  const saveHabit = useAction('saveHabit');
  const deleteHabit = useAction('deleteHabit');
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Rec<Habit> | null>(null);
  const [monday, setMonday] = useHabitWeek(habits, checks);
  const top = useRef<HTMLDivElement>(null);
  const freqOptions = ((lesson.tool.config as { frequencyOptions?: string[] }).frequencyOptions) ?? [];
  const set = (k: keyof Draft, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));
  const setFrequency = (f: string) => setDraft((d) => ({ ...d, frequency: f, days: f === freqOptions[0] ? ALL_DAYS : d.days }));
  const toggleDay = (i: number) => setDraft((d) => ({ ...d, days: d.days.includes(i) ? d.days.filter((x) => x !== i) : [...d.days, i].sort() }));

  const submit = async () => {
    if (!draft.name.trim()) return toast(`Please fill in "${lesson.tool.fields[0]?.label ?? 'My Habit'}"`, true);
    if (!draft.days.length) return toast('Choose at least one day', true);
    const style = HABIT_STYLES[(habits?.length ?? 0) % HABIT_STYLES.length];
    const existing = habits?.find((h) => h.id === editing);
    try {
      await saveHabit.mutateAsync({ id: editing ?? undefined, habit: { ...draft, frequency: draft.frequency || freqOptions[0] || '', detail: existing?.name === draft.name ? existing.detail : draft.frequency, icon: existing?.icon ?? style.icon, color: existing?.color ?? style.color } });
      toast(editing ? 'Habit updated' : 'Added to your weekly planner');
      setDraft(EMPTY);
      setEditing(null);
    } catch (e) {
      toast((e as Error).message, true);
    }
  };
  const edit = (h: Rec<Habit>) => {
    setEditing(h.id);
    setDraft({ name: h.name, frequency: h.frequency, days: h.days, trigger: h.trigger, makeEasy: h.makeEasy, reward: h.reward });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fields = lesson.tool.fields;
  return (
    <div className="stack gap-32">
      <div ref={top} className="stack gap-16">
        <ol className="m-builder">
          {fields.map((f, i) => (
            <Fragment key={f.id}>
              <li className={`m-builder-step ${tone(f.color)}`}>
                <div className="row gap-12">
                  <span className="m-builder-n" aria-hidden="true">{i + 1}</span>
                  <Icon name={f.icon ?? 'leaf'} size={26} />
                </div>
                <label className="h4" htmlFor={`hb-${f.id}`}>{f.label}</label>
                {f.helper && <p className="body-sm muted">{f.helper}</p>}
                {f.id === 'frequency' ? (
                  <>
                    <select id={`hb-${f.id}`} className="select" value={draft.frequency} onChange={(e) => setFrequency(e.target.value)}>
                      <option value="">{f.placeholder ?? 'Select an option'}</option>
                      {freqOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <div className="stack gap-4">
                      <span className="body-sm muted">Choose your days:</span>
                      <div className="m-daypick" role="group" aria-label="Choose your days">
                        {DAY_LETTERS.map((l, d) => (
                          <button key={d} type="button" aria-pressed={draft.days.includes(d)} aria-label={DAY_SHORT[d]} className={draft.days.includes(d) ? 'on' : ''} onClick={() => toggleDay(d)}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <textarea id={`hb-${f.id}`} className="textarea" rows={2} placeholder={f.placeholder} value={draft[f.id as keyof Draft] as string} onChange={(e) => set(f.id as keyof Draft, e.target.value)} />
                )}
              </li>
              {i < fields.length - 1 && <li className="m-builder-arrow" aria-hidden="true"><Icon name="arrow-right" size={18} /></li>}
            </Fragment>
          ))}
        </ol>
        <div className="wrap-row gap-12" style={{ justifyContent: 'flex-end' }}>
          {editing && <Button variant="ghost" onClick={() => { setEditing(null); setDraft(EMPTY); }}>Cancel edit</Button>}
          <Button onClick={submit} arrow disabled={saveHabit.isPending}>{editing ? 'Save habit' : lesson.tool.saveLabel}</Button>
        </div>
      </div>

      <section className="stack gap-16" aria-labelledby="planner-title">
        <SectionTitle icon="chart" id="planner-title" title="My Weekly Habit Planner" sub={lesson.nextStep.helper} aside={<WeekNav monday={monday} onChange={setMonday} />} />
        {!habits || !checks ? <Loading /> : habits.length ? (
          <HabitGrid habits={habits} checks={checks} monday={monday} mode="planner" onEdit={edit} onDelete={setToDelete} />
        ) : (
          <p className="muted body-sm card-soft card-pad-sm">Your habits will appear here once you add them above.</p>
        )}
      </section>

      <Reminders lesson={lesson} />

      <Confirm
        open={!!toDelete}
        title="Delete this habit?"
        body={`"${toDelete?.name}" and all of its check-ins will be removed.`}
        confirmLabel="Delete habit"
        danger
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteHabit.mutate({ id: toDelete.id }, { onSuccess: () => toast('Habit deleted'), onError: (e) => toast(e.message, true) })}
      />
    </div>
  );
}

/** Momentum: this week's completion per habit + 4 weekly rings and the running average. */
export function HabitProgressTool({ lesson }: ToolProps) {
  const habits = useMine('habits').data;
  const checks = useMine('habitChecks').data;
  const [monday, setMonday] = useHabitWeek(habits, checks);
  const cfg = lesson.tool.config as { overallTitle?: string; overallSubtitle?: string; weeks?: number };
  if (!habits || !checks) return <Loading />;
  if (!habits.length) return <p className="muted card-soft card-pad-sm">Add a habit in the previous lesson to see your progress here.</p>;
  const n = weekNumber(checks, monday);
  const first = firstHabitWeek(checks) ?? monday;
  const weeks = Array.from({ length: cfg.weeks ?? 4 }, (_, i) => {
    const m = addDays(first, i * 7);
    return { m, ...overallWeek(habits, checks, m) };
  });
  const started = weeks.filter((w) => w.started);
  const planned = started.reduce((s, w) => s + w.planned, 0);
  const done = started.reduce((s, w) => s + w.done, 0);
  const avg = planned ? Math.round((done / planned) * 100) : 0;
  return (
    <div className="stack gap-32">
      <section className="stack gap-16">
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <WeekNav monday={monday} onChange={setMonday} label={`Week ${n}: ${fmtWeekRange(monday)}`} />
        </div>
        <HabitGrid habits={habits} checks={checks} monday={monday} mode="progress" />
      </section>
      <section className="stack gap-16" aria-labelledby="overall">
        <SectionTitle icon="chart" id="overall" title={cfg.overallTitle ?? ''} sub={cfg.overallSubtitle} />
        <div className="m-weeks">
          {weeks.map((w, i) => {
            const sel = w.m.getTime() === monday.getTime();
            return (
              <button key={i} type="button" className={`m-week ${sel ? 'on' : ''}`} aria-pressed={sel} onClick={() => setMonday(w.m)}>
                <strong>Week {i + 1}</strong>
                <Ring pct={w.started ? w.pct : 0} size={76} stroke={8} label={`${w.started ? w.pct : 0}%`} />
                <span className="body-sm muted">{w.started ? `${w.done} of ${w.planned} planned days` : 'Not yet started'}</span>
              </button>
            );
          })}
          <div className="m-week-avg">
            <span className="icon-circle" aria-hidden="true"><Icon name="chart" size={22} /></span>
            <div className="stack gap-4">
              <span className="serif m-big">{avg}%</span>
              <strong>Average Completion</strong>
              <span className="body-sm muted">{done} of {planned} planned days completed</span>
            </div>
          </div>
        </div>
      </section>
      <Reminders lesson={lesson} />
    </div>
  );
}
