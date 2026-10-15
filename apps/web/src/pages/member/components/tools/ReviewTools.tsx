import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alignment, fillTemplate, fmtDate, habitConsistency, isoDate, now, wheelCompare, type Rec, type Lesson } from '@shift/core';
import { useAction, usePublicList, useSettings, useSingleton } from '@/data';
import { Radar } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { Art } from '@/ui/Art';
import { AutosaveIndicator, Button, Loading, Modal, Ring, Slider, useAutosave, useToast } from '@/ui/kit';
import { latestGoal, wheelBounds } from '../blueprint';
import { lessonCtx, useMine } from '../useJourney';
import { Leaf, SectionTitle, tone } from '../ui';
import { arr, type ToolProps } from './types';

const ROSE = '#d29b94';
const DEEP = '#2e3b32';

/** Celebrate cards (lesson.celebrate). */
export function Celebrate({ lesson }: { lesson: Rec<Lesson> }) {
  if (!lesson.celebrate.length) return null;
  return (
    <section className="stack gap-16" aria-labelledby="celebrate">
      <SectionTitle icon="trophy" id="celebrate" title="Celebrate Your Progress" />
      <ul className="m-reminders">
        {lesson.celebrate.map((c, i) => (
          <li key={i}>
            <Icon name={c.icon} size={26} />
            <strong>{c.title}</strong>
            <span className="body-sm muted">{c.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GoalProgressModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value, open]);
  return (
    <Modal open={open} onClose={onClose} title="Update goal progress" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => { onSave(v); onClose(); }}>Save progress</Button></>}>
      <div className="stack gap-16" style={{ alignItems: 'center' }}>
        <Ring pct={v} size={120} stroke={10} />
        <div style={{ width: '100%' }}><Slider label="How far along are you?" value={v} onChange={setV} min={0} max={100} step={5} lowLabel="Just starting" highLabel="Goal reached" /></div>
      </div>
    </Modal>
  );
}

/** Look How Far You've Come: review goal / priorities / habits, re-rate the wheel, see progress, celebrate. */
export function JourneyReview({ j, lesson }: ToolProps) {
  const areas = usePublicList('wheelAreas').data;
  const scores = useMine('wheelScores').data;
  const goals = useMine('goals').data;
  const habits = useMine('habits').data;
  const checks = useMine('habitChecks').data;
  const settings = useSettings();
  const tpl = useSingleton('blueprint');
  const saveWheel = useAction('saveWheel');
  const saveGoal = useAction('saveGoal');
  const toast = useToast();
  const cfg = lesson.tool.config as { rerateTitle?: string; progressTitle?: string; progressSubtitle?: string };
  const ctx = lessonCtx(lesson.id);
  const [current, setCurrent] = useState<Record<string, number> | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [status, trigger] = useAutosave<Record<string, number>>((v) => saveWheel.mutateAsync({ context: ctx, scores: v }));
  const bounds = scores ? wheelBounds(scores) : null;
  const start = bounds?.start && bounds.start.context !== ctx ? bounds.start : bounds?.sorted.find((s) => s.context !== ctx) ?? null;
  const mineNow = scores?.find((s) => s.context === ctx) ?? null;
  useEffect(() => {
    if (current || !scores) return;
    setCurrent({ ...(mineNow?.scores ?? bounds?.latest?.scores ?? start?.scores ?? {}) });
  }, [scores, current, mineNow, bounds, start]);
  if (!areas || !scores || !goals || !habits || !checks || !settings || !current) return <Loading h={400} />;

  const goal = latestGoal(goals);
  const prioLesson = j.lessons.find((l) => l.tool.kind === 'wheel-priorities');
  const prioIds = arr(prioLesson ? j.workFor(lessonCtx(prioLesson.id))?.tool?.priorities : []);
  const goalLesson = j.lessons.find((l) => (l.tool.config as { savesGoal?: boolean }).savesGoal);
  const habitLesson = j.lessons.find((l) => l.tool.kind === 'habit-builder');
  const progressLesson = j.lessons.find((l) => l.tool.kind === 'habit-progress');
  const rows = wheelCompare(areas, start?.scores, current);
  const consistency = habitConsistency(habits, checks);
  const p3 = tpl?.pages.find((p) => p.key === 'p3');
  const sub = (key: string, vars: Record<string, number>) => fillTemplate(p3?.sections.find((s) => s.key === key)?.subtitle ?? '', vars);
  const title = (key: string) => p3?.sections.find((s) => s.key === key)?.title ?? '';
  const { min, max } = settings.wheel;
  const setScore = (id: string, v: number) => {
    const next = { ...current, [id]: v };
    setCurrent(next);
    trigger(next);
  };
  const chg = (c: number | null) => (c === null ? '—' : c > 0 ? `+${c}` : String(c));

  return (
    <div className="stack gap-32">
      <section className="stack gap-16" aria-label={lesson.tool.title}>
        <div className="m-review3">
          <div className="m-box stack gap-12">
            <div className="row between gap-8"><span className="row gap-8"><Icon name="flag" size={18} /><strong>Your SMART Goal</strong></span>{goalLesson && <Link className="m-edit" to={`/app/lesson/${goalLesson.id}?step=3`}>Edit</Link>}</div>
            {goal ? (
              <>
                <blockquote className="m-bigquote">“{goal.statement}”</blockquote>
                <span className="body-sm muted">Set on {fmtDate(goal.setOn)}</span>
              </>
            ) : <p className="body-sm muted">No goal saved yet.</p>}
          </div>
          <div className="m-box stack gap-12">
            <div className="row between gap-8"><span className="row gap-8"><Icon name="sprout" size={18} /><strong>Your Top 3 Priority Areas</strong></span>{prioLesson && <Link className="m-edit" to={`/app/lesson/${prioLesson.id}?step=3`}>Edit</Link>}</div>
            <ol className="m-top3">
              {prioIds.map((id, i) => {
                const a = areas.find((x) => x.id === id);
                return a ? <li key={id}><span className="num">{i + 1}</span><span className={`m-area-ic ${tone(a.color)}`} aria-hidden="true"><Icon name={a.icon} size={16} /></span>{a.name}</li> : null;
              })}
              {!prioIds.length && <li className="body-sm muted">No priority areas chosen yet.</li>}
            </ol>
          </div>
          <div className="m-box stack gap-12">
            <div className="row between gap-8"><span className="row gap-8"><Icon name="list" size={18} /><strong>Your Habits</strong></span>{habitLesson && <Link className="m-edit" to={`/app/lesson/${habitLesson.id}?step=3`}>Edit</Link>}</div>
            <ul className="m-habitlist">
              {habits.map((h) => <li key={h.id}><Icon name={h.icon} size={16} /><span className="grow">{h.name}</span><span className="body-sm muted">{h.frequency}</span></li>)}
              {!habits.length && <li className="body-sm muted">No habits yet.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="stack gap-16" aria-labelledby="rr">
        <SectionTitle icon="refresh" id="rr" title={cfg.rerateTitle ?? ''} sub={lesson.tool.description} aside={<AutosaveIndicator status={status} />} />
        <div className="m-rerate">
          <div className="stack gap-12">
            <div className="m-legend">
              <span><i style={{ background: ROSE }} />When you started{start && <small>{fmtDate(start.date)}</small>}</span>
              <span><i style={{ background: DEEP }} />Today<small>{fmtDate(mineNow?.date ?? isoDate(now()))}</small></span>
            </div>
            <Radar axes={areas.map((a) => ({ id: a.id, label: a.name }))} max={max} size={300} series={[
              ...(start ? [{ label: 'When you started', values: start.scores, color: ROSE, fill: 'rgba(210,155,148,.18)' }] : []),
              { label: 'Today', values: current, color: DEEP, fill: 'rgba(148,165,140,.25)' },
            ]} />
          </div>
          <div className="m-box">
            <div className="scroll-x">
              <table className="table m-rerate-table">
                <thead><tr><th scope="col">Area</th><th scope="col"><span className="sr-only">Today's score</span></th><th scope="col">Start</th><th scope="col">Now</th><th scope="col">Change</th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const a = areas.find((x) => x.id === r.areaId)!;
                    return (
                      <tr key={r.areaId}>
                        <th scope="row"><span className="row gap-8"><Icon name={a.icon} size={16} /><span className="body-sm">{a.name}</span></span></th>
                        <td style={{ minWidth: 90, width: '40%' }}><input type="range" className="range" min={min} max={max} value={current[r.areaId] ?? min} aria-label={`${a.name} today`} onChange={(e) => setScore(r.areaId, Number(e.target.value))} /></td>
                        <td><span className="m-score">{r.start ?? '—'}</span></td>
                        <td><span className="m-score now">{r.now ?? '—'}</span></td>
                        <td><span className={`m-change ${r.change !== null && r.change < 0 ? 'neg' : 'pos'}`}>{chg(r.change)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="stack gap-16" aria-labelledby="sp">
        <SectionTitle icon="chart" id="sp" title={cfg.progressTitle ?? ''} sub={cfg.progressSubtitle} />
        <div className="m-review3">
          <div className="m-box stack gap-12">
            <strong className="row gap-8"><Icon name="target" size={18} />{title('goal')}</strong>
            <div className="row gap-16">
              <Ring pct={goal?.progress ?? 0} size={104} stroke={10} />
              <div className="stack gap-8">
                <p className="body-sm muted">{sub('goal', { goal: goal?.progress ?? 0 })}</p>
                {goal && <Button size="sm" variant="soft" arrow onClick={() => setGoalOpen(true)}>Update Progress</Button>}
              </div>
            </div>
          </div>
          <div className="m-box stack gap-12">
            <strong className="row gap-8"><Icon name="chart" size={18} />{title('habits')}</strong>
            <div className="row gap-16">
              <Ring pct={consistency} size={104} stroke={10} />
              <div className="stack gap-8">
                <p className="body-sm muted">{sub('habits', { habits: consistency })}</p>
                {progressLesson && <Button size="sm" variant="soft" arrow to={`/app/lesson/${progressLesson.id}?step=3`}>View Habit Details</Button>}
              </div>
            </div>
          </div>
          <div className="m-box stack gap-12">
            <strong className="row gap-8"><Icon name="sprout" size={18} />Priority Areas Growth</strong>
            <ul className="m-growth">
              {prioIds.map((id) => {
                const r = rows.find((x) => x.areaId === id);
                const a = areas.find((x) => x.id === id);
                if (!r || !a) return null;
                return (
                  <li key={id}>
                    <Icon name={a.icon} size={16} />
                    <span className="body-sm grow">{a.name}</span>
                    <span className="m-growbar" aria-hidden="true">
                      <span className="start" style={{ width: `${((r.start ?? 0) / max) * 100}%` }} />
                      <span className="now" style={{ left: `${((Math.min(r.start ?? 0, r.now ?? 0)) / max) * 100}%`, width: `${(Math.abs((r.now ?? 0) - (r.start ?? 0)) / max) * 100}%` }} />
                    </span>
                    <span className={`m-change ${r.change !== null && r.change < 0 ? 'neg' : 'pos'}`}>{chg(r.change)}</span>
                  </li>
                );
              })}
              {!prioIds.length && <li className="body-sm muted">Choose your priority areas to see their growth.</li>}
            </ul>
          </div>
        </div>
      </section>

      <Celebrate lesson={lesson} />

      {goal && (
        <GoalProgressModal open={goalOpen} onClose={() => setGoalOpen(false)} value={goal.progress} onSave={(v) => saveGoal.mutate({ id: goal.id, goal: { progress: v, statement: goal.statement } }, { onSuccess: () => toast('Goal progress updated'), onError: (e) => toast(e.message, true) })} />
      )}
    </div>
  );
}

/** Become Your Future Self: revisit statement + qualities, re-rate each quality Then → Now, alignment rings. */
export function FutureSelfRerate({ j, lesson }: ToolProps) {
  const cards = useMine('cards').data;
  const settings = useSettings();
  const saveCard = useAction('saveCard');
  const cfg = lesson.tool.config as { revisitTitle?: string; revisitSubtitle?: string; progressTitle?: string; progressSubtitle?: string; celebrateTitle?: string; celebrateText?: string };
  const [qualities, setQualities] = useState<NonNullable<typeof cards>[number]['qualities'] | null>(null);
  const card = cards?.[0] ?? null;
  const [status, trigger] = useAutosave<NonNullable<typeof qualities>>((q) => saveCard.mutateAsync({ card: { qualities: q } }));
  useEffect(() => {
    if (!qualities && card) setQualities(card.qualities.map((q) => ({ ...q })));
  }, [card, qualities]);
  if (!cards || !settings) return <Loading h={400} />;
  const fsLesson = j.lessons.find((l) => (l.tool.config as { savesCard?: boolean }).savesCard);
  if (!card || !qualities) {
    return (
      <div className="card-soft card-pad-lg stack gap-12" style={{ alignItems: 'flex-start' }}>
        <p className="muted">Create your Future Self card first, then come back to re-rate yourself.</p>
        {fsLesson && <Button to={`/app/lesson/${fsLesson.id}?step=3`} arrow>{fsLesson.title}</Button>}
      </div>
    );
  }
  const qs = settings.qualityScale;
  const a = alignment(qualities, qs.max);
  const thenDate = qualities[0]?.thenDate;
  const nowDate = qualities.reduce((d, q) => (q.nowDate > d ? q.nowDate : d), qualities[0]?.nowDate ?? isoDate(now()));
  const setNow = (i: number, v: number) => {
    const next = qualities.map((q, k) => (k === i ? { ...q, now: v, nowDate: isoDate(now()) } : q));
    setQualities(next);
    trigger(next);
  };
  const stage = j.stages.find((s) => s.id === lesson.stageId);
  return (
    <div className="stack gap-32">
      <section className="stack gap-16" aria-labelledby="revisit">
        <SectionTitle icon="leaf" id="revisit" title={cfg.revisitTitle ?? ''} sub={cfg.revisitSubtitle} aside={fsLesson && <Button size="sm" variant="ghost" to={`/app/lesson/${fsLesson.id}?step=3`}>Edit my Future Self</Button>} />
        <div className="m-revisit">
          <figure className="m-statement">
            <Leaf className="m-statement-leaf" size={56} />
            <blockquote className="serif italic">“{card.statement}”</blockquote>
          </figure>
          <ul className="m-qualities">
            {qualities.map((q) => (
              <li key={q.name}>
                <span className="icon-circle sm" aria-hidden="true"><Icon name={q.icon} size={16} /></span>
                <span className="stack"><strong>{q.name}</strong>{q.description && <span className="body-sm muted">{q.description}</span>}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="stack gap-16" aria-label="Re-rate each quality">
        <div className="row" style={{ justifyContent: 'flex-end' }}><AutosaveIndicator status={status} /></div>
        <div className="m-rerate4">
          {qualities.map((q, i) => (
            <div key={q.name} className="m-box stack gap-12">
              <strong className="row gap-8"><span className="icon-circle sm" aria-hidden="true"><Icon name={q.icon} size={16} /></span>{q.name}</strong>
              <div className="m-thennow">
                <span className="stack" style={{ alignItems: 'center' }}><small className="muted">Then{q.thenDate ? ` (${fmtDate(q.thenDate)})` : ''}</small><span className="m-score then">{q.then}</span></span>
                <Icon name="arrow-right" size={18} />
                <span className="stack" style={{ alignItems: 'center' }}><small className="muted">Now</small><span className="m-score now">{q.now}</span></span>
              </div>
              <Slider label={<span className="sr-only">{q.name} now</span>} value={q.now} onChange={(v) => setNow(i, v)} min={qs.min} max={qs.max} lowLabel={qs.lowLabel} highLabel={qs.highLabel} />
            </div>
          ))}
        </div>
      </section>

      <section className="stack gap-16" aria-labelledby="align">
        <SectionTitle icon="chart" id="align" title={cfg.progressTitle ?? ''} sub={cfg.progressSubtitle} />
        <div className="m-align">
          <div className="m-box m-align-rings">
            <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
              <Ring pct={a.then} size={110} stroke={10} color={ROSE} />
              <span className="body-sm">When you started</span>
              {thenDate && <span className="body-sm muted">{fmtDate(thenDate)}</span>}
            </div>
            <Icon name="arrow-right" size={22} />
            <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
              <Ring pct={a.now} size={110} stroke={10} />
              <span className="body-sm">Today</span>
              <span className="body-sm muted">{fmtDate(nowDate)}</span>
            </div>
          </div>
          <div className="m-box m-box-sage stack gap-8">
            <span className="row gap-8 serif m-big"><Icon name="arrow-up-right" size={30} />{a.delta >= 0 ? '+' : ''}{a.delta}%</span>
            <strong className="h4">{cfg.celebrateTitle}</strong>
            <p className="body-sm muted">{cfg.celebrateText}</p>
          </div>
          <Art src={lesson.image} quote={stage?.quote} quotePos="bl" quoteSize={30} className="rounded-lg m-align-art" />
        </div>
      </section>
    </div>
  );
}
