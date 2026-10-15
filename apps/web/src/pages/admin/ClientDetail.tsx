import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  DAY_SHORT, addDays, fmtDate, fmtWeekRange, formatPrice, habitWeek, journeyProgress, latestHabitWeek, now, orderedLessons, weekStart,
  type Enrollment, type FieldDef, type Rec, type Work,
} from '@shift/core';
import { useAction, useCrud, useList, useRecord, useSettings } from '@/data';
import { Button, Confirm, Empty, Loading, ProgressBar, Select, Tabs, TextArea, TextInput, useToast } from '@/ui/kit';
import { Radar } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { AdminSection, DateTimeField, Dash, NumberField, Switch, TonePill } from './components/controls';
import { KeyValue, PlanPill, SubmissionsList, fmtWhen } from './components/shared';
import { COLOR_HEX, errMsg, humanise } from './components/util';

type TabId = 'overview' | 'wheel' | 'reflections' | 'goals' | 'habits' | 'journey' | 'notes' | 'submissions' | 'purchases';
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'wheel', label: 'Wheel' },
  { id: 'reflections', label: 'Reflections' },
  { id: 'goals', label: 'Goals' },
  { id: 'habits', label: 'Habits' },
  { id: 'journey', label: 'Journey progress' },
  { id: 'notes', label: 'Notes' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'purchases', label: 'Purchases' },
];

/** Render any saved answer value (strings, lists, nested maps) readably. */
function Answer({ v }: { v: unknown }): JSX.Element {
  if (v === null || v === undefined || v === '') return <Dash />;
  if (Array.isArray(v)) return <span>{v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(', ') || '—'}</span>;
  if (typeof v === 'object') {
    return (
      <div className="stack gap-4">
        {Object.entries(v as Record<string, unknown>).map(([k, x]) => (
          <div key={k} className="body-sm"><span className="muted">{humanise(k)}:</span> <Answer v={x} /></div>
        ))}
      </div>
    );
  }
  if (typeof v === 'boolean') return <span>{v ? 'Yes' : 'No'}</span>;
  return <span className="pre-line">{String(v)}</span>;
}

// ───────────────────────────────────────── Overview tab: enrolment editor
function EnrolmentEditor({ userId, enrollment }: { userId: string; enrollment: Rec<Enrollment> | undefined }) {
  const plans = useList('plans').data ?? [];
  const assign = useAction('assignPackage');
  const toast = useToast();
  const [planId, setPlanId] = useState(enrollment?.planId ?? '');
  const [done, setDone] = useState(enrollment?.sessionsCompleted ?? 0);
  const [next, setNext] = useState<string | null>(enrollment?.nextSession ?? null);
  const [focus, setFocus] = useState<Enrollment['focusAreas']>(enrollment?.focusAreas ?? []);
  useEffect(() => {
    setPlanId(enrollment?.planId ?? '');
    setDone(enrollment?.sessionsCompleted ?? 0);
    setNext(enrollment?.nextSession ?? null);
    setFocus(enrollment?.focusAreas ?? []);
  }, [enrollment?.id, enrollment?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const plan = plans.find((p) => p.id === planId);
  const max = plan?.sessions ?? 99;
  const save = async () => {
    if (!planId) return toast('Choose a package first', true);
    try {
      await assign.mutateAsync({ userId, planId, sessionsCompleted: done, nextSession: next, focusAreas: focus.filter((f) => f.label.trim()) });
      toast('Enrolment saved');
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <div className="adm-card stack gap-16">
      <h3 className="h4">Package &amp; sessions</h3>
      <div className="adm-form-grid">
        <Select label="Package" value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.sessions} sessions${p.active ? '' : ' (inactive)'}` }))} placeholder="Choose a package" />
        <div className="field">
          <span className="field-label" id="sess-l">Sessions completed</span>
          <div className="adm-stepper-n" role="group" aria-labelledby="sess-l">
            <button type="button" aria-label="One fewer session" onClick={() => setDone((d) => Math.max(0, d - 1))}><Icon name="minus" size={16} /></button>
            <output aria-live="polite">{done}/{plan?.sessions ?? '–'}</output>
            <button type="button" aria-label="One more session" onClick={() => setDone((d) => Math.min(max, d + 1))}><Icon name="plus" size={16} /></button>
          </div>
        </div>
        <DateTimeField label="Next session" value={next} onChange={setNext} />
      </div>
      <fieldset className="adm-fieldset">
        <legend>Focus areas (shown on My Clients)</legend>
        <div className="stack gap-8">
          {focus.map((f, i) => (
            <div key={i} className="row gap-8" style={{ alignItems: 'flex-end' }}>
              <div className="grow"><TextInput label={`Area ${i + 1}`} value={f.label} onChange={(v) => setFocus(focus.map((x, j) => (j === i ? { ...x, label: v } : x)))} /></div>
              <div style={{ width: 120 }}><NumberField label="Score /10" value={f.score} nullable min={1} max={10} onChange={(v) => setFocus(focus.map((x, j) => (j === i ? { ...x, score: v } : x)))} /></div>
              <button type="button" className="adm-mini danger" style={{ marginBottom: 8 }} aria-label={`Remove focus area ${i + 1}`} onClick={() => setFocus(focus.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-ghost btn-sm adm-add" onClick={() => setFocus([...focus, { label: '', score: null }])}><Icon name="plus" size={16} /> Add focus area</button>
      </fieldset>
      <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
        <Button onClick={() => void save()} disabled={assign.isPending}>{assign.isPending ? 'Saving…' : enrollment ? 'Save enrolment' : 'Assign package'}</Button>
      </div>
    </div>
  );
}

function OverviewTab({ userId }: { userId: string }) {
  const user = useRecord('users', userId).data;
  const enrollment = useList('enrollments', { userId }).data?.[0];
  const toolkits = useList('toolkits').data ?? [];
  const crud = useCrud('users');
  const reset = useAction('resetProgress');
  const toast = useToast();
  const [confirm, setConfirm] = useState<'journey' | 'all' | null>(null);
  if (!user) return <Loading />;
  const runReset = async (scope: 'journey' | 'all') => {
    try {
      const r = await reset.mutateAsync({ userId, scope });
      toast(`Progress reset — ${r.removed} record${r.removed === 1 ? '' : 's'} removed`);
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <div className="adm-grid-2">
      <EnrolmentEditor userId={userId} enrollment={enrollment} />
      <div className="stack gap-20">
        <div className="adm-card stack gap-12">
          <h3 className="h4">Forms</h3>
          <div className="wrap-row gap-8">
            <TonePill tone={enrollment?.forms.intake ? 'sage' : 'rose'}>{enrollment?.forms.intake ? 'Intake ✓' : 'Intake pending'}</TonePill>
            <TonePill tone={enrollment?.forms.signed ? 'sage' : 'rose'}>{enrollment?.forms.signed ? 'Agreement signed ✓' : 'Agreement not signed'}</TonePill>
          </div>
          <p className="body-sm muted">Answers are under the Submissions tab.</p>
        </div>
        <div className="adm-card stack gap-12">
          <h3 className="h4">Access</h3>
          <dl className="adm-dl">
            <KeyValue label="Email">{user.email}</KeyValue>
            {user.phone && <KeyValue label="Phone">{user.phone}</KeyValue>}
            {user.location && <KeyValue label="Location">{user.location}</KeyValue>}
            <KeyValue label="Started">{enrollment ? fmtDate(enrollment.startDate) : '—'}</KeyValue>
            <KeyValue label="Toolkits">{user.toolkitIds.map((id) => toolkits.find((t) => t.id === id)?.name ?? id).join(', ') || '—'}</KeyValue>
          </dl>
          <Switch label="Self-paced SHIFT Journey access" checked={user.journeyAccess} onChange={(v) => crud.update.mutateAsync({ id: user.id, patch: { journeyAccess: v } }).then(() => toast(v ? 'Journey access granted' : 'Journey access removed'), (e) => toast(errMsg(e), true))} />
        </div>
        <div className="adm-card stack gap-12">
          <h3 className="h4">Reset progress</h3>
          <p className="body-sm muted">Clears saved lesson work so the client can start again. "Everything" also clears Wheel scores, habits, goals and their Future Self card.</p>
          <div className="wrap-row gap-8">
            <Button variant="ghost" size="sm" onClick={() => setConfirm('journey')}>Reset journey work</Button>
            <Button variant="danger" size="sm" onClick={() => setConfirm('all')}>Reset everything</Button>
          </div>
        </div>
      </div>
      <Confirm
        open={!!confirm}
        title={confirm === 'all' ? 'Reset all progress?' : 'Reset journey progress?'}
        body={confirm === 'all' ? `This permanently deletes ${user.name}'s lesson work, Wheel scores, habits, check-ins, goals and Future Self card.` : `This permanently deletes ${user.name}'s saved lesson, stage and checkpoint work.`}
        confirmLabel="Reset"
        danger
        onConfirm={() => confirm && void runReset(confirm)}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}

// ───────────────────────────────────────── other tabs
function useContextLabel() {
  const lessons = useList('lessons').data ?? [];
  const checkpoints = useList('checkpoints').data ?? [];
  const stages = useList('stages').data ?? [];
  return (ctx: string) => {
    const [kind, id] = ctx.split(':');
    if (kind === 'lesson') return lessons.find((l) => l.id === id)?.title ?? ctx;
    if (kind === 'checkpoint') return checkpoints.find((c) => c.id === id)?.title ?? ctx;
    if (kind === 'stage') return `${stages.find((s) => s.id === id)?.name ?? id} reflection`;
    return humanise(ctx);
  };
}

function WheelTab({ userId }: { userId: string }) {
  const scores = (useList('wheelScores', { userId }).data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const areas = useList('wheelAreas').data ?? [];
  const label = useContextLabel();
  const settings = useSettings();
  if (!scores.length) return <Empty icon="circle-half" title="No Wheel of Life scores yet" />;
  const first = scores[0];
  const latest = scores[scores.length - 1];
  return (
    <div className="stack gap-24">
      <div className="adm-grid-2">
        <div className="adm-card">
          <Radar
            axes={areas.map((a) => ({ id: a.id, label: a.name }))}
            max={settings?.wheel.max ?? 10}
            series={[
              { label: `Start · ${fmtDate(first.date)}`, values: first.scores, color: '#b07a74' },
              ...(latest !== first ? [{ label: `Latest · ${fmtDate(latest.date)}`, values: latest.scores, color: '#2e3b32', fill: 'rgba(148,159,142,.25)' }] : []),
            ]}
          />
          <div className="wrap-row gap-16 body-sm" style={{ justifyContent: 'center' }}>
            <span className="row gap-8"><span style={{ width: 14, height: 3, background: '#b07a74' }} aria-hidden /> Start ({label(first.context)})</span>
            {latest !== first && <span className="row gap-8"><span style={{ width: 14, height: 3, background: '#2e3b32' }} aria-hidden /> Latest ({label(latest.context)})</span>}
          </div>
        </div>
        <div className="scroll-x">
          <table className="table adm-table">
            <thead>
              <tr>
                <th scope="col">Area</th>
                {scores.map((s) => <th key={s.id} scope="col" title={label(s.context)}>{fmtDate(s.date).replace(/ \d{4}$/, '')}</th>)}
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => {
                const ch = latest.scores[a.id] !== undefined && first.scores[a.id] !== undefined ? latest.scores[a.id] - first.scores[a.id] : null;
                return (
                  <tr key={a.id}>
                    <td className="nowrap">{a.short || a.name}</td>
                    {scores.map((s) => <td key={s.id}>{s.scores[a.id] ?? '–'}</td>)}
                    <td className="nowrap">{ch === null ? '–' : ch > 0 ? `▲ ${ch}` : ch < 0 ? `▼ ${-ch}` : '0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="body-sm muted" style={{ marginTop: 8 }}>{scores.map((s) => `${fmtDate(s.date)}: ${label(s.context)}`).join(' · ')}</p>
        </div>
      </div>
    </div>
  );
}

function WorkBlock({ title, sub, work, questions, fields }: { title: ReactNode; sub?: ReactNode; work: Rec<Work>; questions: { id: string; prompt: string }[]; fields: FieldDef[] }) {
  const toolEntries = Object.entries(work.tool ?? {});
  const labelOf = (k: string) => fields.find((f) => f.id === k)?.label ?? humanise(k);
  return (
    <div className="adm-card stack gap-12">
      <div className="row between gap-12" style={{ flexWrap: 'wrap' }}>
        <div className="stack">
          <strong style={{ fontWeight: 500 }}>{title}</strong>
          {sub && <span className="body-sm muted">{sub}</span>}
        </div>
        <TonePill tone={work.completed ? 'sage' : 'peach'}>{work.completed ? `Done ${work.completedAt ? fmtDate(work.completedAt.slice(0, 10)) : ''}` : `Step ${work.step} of 4`}</TonePill>
      </div>
      {Object.keys(work.reflections ?? {}).length > 0 && (
        <dl className="adm-dl">
          {Object.entries(work.reflections).map(([k, v]) => <KeyValue key={k} label={questions.find((q) => q.id === k)?.prompt ?? humanise(k)}><Answer v={v} /></KeyValue>)}
        </dl>
      )}
      {toolEntries.length > 0 && (
        <>
          <div className="label-caps muted">Tool</div>
          <dl className="adm-dl">{toolEntries.map(([k, v]) => <KeyValue key={k} label={labelOf(k)}><Answer v={v} /></KeyValue>)}</dl>
        </>
      )}
      {work.nextStep?.text && <div className="adm-note"><Icon name="arrow-right" size={16} /><span><strong>Next step:</strong> {work.nextStep.text}</span></div>}
    </div>
  );
}

function ReflectionsTab({ userId }: { userId: string }) {
  const work = useList('work', { userId }).data;
  const stages = useList('stages').data ?? [];
  const lessons = useList('lessons').data ?? [];
  const checkpoints = useList('checkpoints').data ?? [];
  if (!work) return <Loading />;
  if (!work.length) return <Empty icon="pencil" title="No reflections saved yet" />;
  const byCtx = new Map(work.map((w) => [w.context, w]));
  const cpWork = checkpoints.filter((c) => byCtx.has(`checkpoint:${c.id}`));
  return (
    <div className="stack gap-32">
      {stages.map((s) => {
        const ls = lessons.filter((l) => l.stageId === s.id && byCtx.has(`lesson:${l.id}`)).sort((a, b) => a.order - b.order);
        const sw = byCtx.get(`stage:${s.id}`);
        if (!ls.length && !sw) return null;
        return (
          <section key={s.id} className="stack gap-12" aria-label={s.name}>
            <h3 className="h4 row gap-8"><span className="adm-tree-letter">{s.letter}</span>{s.name}</h3>
            {ls.map((l) => <WorkBlock key={l.id} title={l.title} sub={`Lesson ${l.order}`} work={byCtx.get(`lesson:${l.id}`)!} questions={l.reflections} fields={[...l.tool.fields, ...(l.tool.worksheet?.fields ?? [])]} />)}
            {sw && <WorkBlock title={s.reflection.title} sub="Stage reflection" work={sw} questions={s.reflection.questions} fields={[]} />}
          </section>
        );
      })}
      {cpWork.length > 0 && (
        <section className="stack gap-12" aria-label="Checkpoints">
          <h3 className="h4">Checkpoints</h3>
          {cpWork.map((c) => <WorkBlock key={c.id} title={c.title} sub={`After session ${c.sessionNumber}`} work={byCtx.get(`checkpoint:${c.id}`)!} questions={[]} fields={[]} />)}
        </section>
      )}
    </div>
  );
}

function GoalsTab({ userId }: { userId: string }) {
  const goals = useList('goals', { userId }).data ?? [];
  const cards = useList('cards', { userId }).data ?? [];
  const work = useList('work', { userId }).data ?? [];
  const lessons = useList('lessons').data ?? [];
  const areas = useList('wheelAreas').data ?? [];
  const prioLesson = lessons.find((l) => l.tool.kind === 'wheel-priorities');
  const prio = prioLesson ? work.find((w) => w.context === `lesson:${prioLesson.id}`)?.tool : undefined;
  const priorities = (prio?.priorities as string[] | undefined) ?? [];
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? id;
  const card = cards[0];
  if (!goals.length && !card && !priorities.length) return <Empty icon="target" title="No goals saved yet" />;
  return (
    <div className="adm-grid-2">
      <div className="stack gap-16">
        {goals.map((g) => (
          <div key={g.id} className="adm-card stack gap-12">
            <div className="label-caps muted">Goal · set {fmtDate(g.setOn)}</div>
            <p className="serif" style={{ fontSize: 19, color: 'var(--ink)' }}>{g.statement || '—'}</p>
            <div className="adm-progress"><ProgressBar pct={g.progress} /><span className="body-sm">{g.progress}% towards the goal</span></div>
            <dl className="adm-dl">
              {g.intention && <KeyValue label="Intention">{g.intention}</KeyValue>}
              <KeyValue label="Specific">{g.specific || '—'}</KeyValue>
              <KeyValue label="Measurable">{g.measurable || '—'}</KeyValue>
              <KeyValue label="Achievable">{g.achievable || '—'}</KeyValue>
              <KeyValue label="Relevant">{g.relevant || '—'}</KeyValue>
              <KeyValue label="Time-bound">{g.timeBound || '—'}</KeyValue>
              <KeyValue label="Why">{g.why || '—'}</KeyValue>
              <KeyValue label="Values">{g.values.join(', ') || '—'}</KeyValue>
              <KeyValue label="Timeline">{g.timeline || '—'}</KeyValue>
              <KeyValue label="First step">{g.firstStep || '—'}</KeyValue>
            </dl>
          </div>
        ))}
        {priorities.length > 0 && (
          <div className="adm-card stack gap-8">
            <div className="label-caps muted">Top priority areas</div>
            <ol className="bullets">{priorities.map((p) => <li key={p}>{areaName(p)}{prio?.mainFocus === p ? ' — main focus' : ''}</li>)}</ol>
            {typeof prio?.mainWhy === 'string' && <p className="body-sm muted">{prio.mainWhy}</p>}
          </div>
        )}
      </div>
      {card && (
        <div className="adm-card stack gap-12" style={{ background: 'var(--sage-tint)' }}>
          <div className="label-caps muted">Future Self card</div>
          <p className="serif" style={{ fontSize: 20, color: 'var(--ink)' }}>{card.statement}</p>
          <dl className="adm-dl">
            <KeyValue label="I see">{card.see || '—'}</KeyValue>
            <KeyValue label="I'm becoming">{card.become || '—'}</KeyValue>
            <KeyValue label="I live">{card.live || '—'}</KeyValue>
            <KeyValue label="I choose">{card.choose || '—'}</KeyValue>
            <KeyValue label="Today">{card.today || '—'}</KeyValue>
          </dl>
          {card.qualities.length > 0 && (
            <div className="stack gap-8">
              <div className="label-caps muted">Qualities (then → now)</div>
              {card.qualities.map((q) => (
                <div key={q.name} className="row between body-sm"><span className="row gap-8"><Icon name={q.icon} size={16} />{q.name}</span><span>{q.then} → <strong>{q.now}</strong></span></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HabitsTab({ userId }: { userId: string }) {
  const habits = useList('habits', { userId }).data;
  const checks = useList('habitChecks', { userId }).data ?? [];
  if (!habits) return <Loading />;
  if (!habits.length) return <Empty icon="refresh" title="No habits yet" />;
  const anchor = latestHabitWeek(checks) ?? weekStart(now());
  const weeks = [3, 2, 1, 0].map((n) => addDays(anchor, -7 * n));
  return (
    <div className="stack gap-24">
      <div className="adm-grid-3">
        {habits.map((h) => (
          <div key={h.id} className="adm-card stack gap-8">
            <div className="row gap-8"><span className="icon-circle sm" style={{ background: COLOR_HEX[h.color] }}><Icon name={h.icon} size={16} /></span><strong style={{ fontWeight: 500 }}>{h.name}</strong></div>
            <div className="body-sm muted">{h.detail} · {h.days.map((d) => DAY_SHORT[d]).join(', ')}</div>
            <dl className="adm-dl">
              <KeyValue label="Trigger">{h.trigger || '—'}</KeyValue>
              <KeyValue label="Make it easy">{h.makeEasy || '—'}</KeyValue>
              <KeyValue label="Reward">{h.reward || '—'}</KeyValue>
            </dl>
          </div>
        ))}
      </div>
      {weeks.map((m) => {
        const rows = habits.map((h) => habitWeek(h, checks, m));
        const planned = rows.reduce((s, r) => s + r.planned, 0);
        const done = rows.reduce((s, r) => s + r.done, 0);
        return (
          <div key={m.toISOString()} className="adm-card stack gap-8">
            <div className="row between"><strong style={{ fontWeight: 500 }}>{fmtWeekRange(m)}</strong><span className="body-sm muted">{planned ? Math.round((done / planned) * 100) : 0}% · {done}/{planned} planned days</span></div>
            <div className="scroll-x">
              <div className="adm-week-grid" role="table" aria-label={`Habits ${fmtWeekRange(m)}`}>
                <span role="columnheader" />
                {DAY_SHORT.map((d) => <span key={d} role="columnheader" className="adm-day-head">{d}</span>)}
                {habits.map((h, i) => (
                  <div key={h.id} role="row" style={{ display: 'contents' }}>
                    <span role="rowheader" className="body-sm adm-ellipsis">{h.name}</span>
                    {rows[i].days.map((c) => (
                      <span key={c.date} role="cell" className={`adm-day ${c.planned ? 'planned' : ''} ${c.status ?? ''}`} aria-label={`${h.name} ${c.date}: ${c.status ?? (c.planned ? 'planned' : 'not planned')}`}>
                        {c.status === 'done' ? <Icon name="check" size={13} /> : c.status === 'missed' ? <Icon name="x" size={13} /> : ''}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JourneyTab({ userId }: { userId: string }) {
  const lessons = useList('lessons').data ?? [];
  const stages = useList('stages').data ?? [];
  const work = useList('work', { userId }).data ?? [];
  const enrollment = useList('enrollments', { userId }).data?.[0];
  const plan = useList('plans').data?.find((p) => p.id === enrollment?.planId);
  const ordered = orderedLessons(lessons, stages);
  const covered = new Set(plan ? Object.values(plan.coverage).flat() : []);
  const prog = journeyProgress(ordered, work);
  return (
    <div className="stack gap-16">
      <div className="adm-progress" style={{ maxWidth: 420 }}><ProgressBar pct={prog.pct} /><span className="body-sm">{prog.completed} of {prog.total} lessons complete ({prog.pct}%)</span></div>
      <div className="adm-card">
        {ordered.map((l, i) => {
          const w = work.find((x) => x.context === `lesson:${l.id}`);
          const st = stages.find((s) => s.id === l.stageId);
          return (
            <div key={l.id} className="adm-lesson-row">
              <span className="adm-tree-n">{i + 1}</span>
              <span className="adm-tree-letter">{st?.letter}</span>
              <span className="grow">{l.title}{!l.active && <span className="faint body-sm"> · inactive</span>}</span>
              {plan && <TonePill tone={covered.has(l.id) ? 'sage' : 'beige'}>{covered.has(l.id) ? `In ${plan.name}` : 'Not in package'}</TonePill>}
              <TonePill tone={w?.completed ? 'deep' : w ? 'peach' : 'beige'}>{w?.completed ? 'Done ✓' : w ? `Step ${w.step} of 4` : 'Not started'}</TonePill>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotesTab({ userId }: { userId: string }) {
  const notes = (useList('notes', { userId }).data ?? []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const save = useAction('saveNote');
  const toast = useToast();
  const [kind, setKind] = useState<'session' | 'call'>('session');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const submit = async () => {
    try {
      await save.mutateAsync({ userId, kind, title: title || (kind === 'session' ? 'Session notes' : 'Call notes'), body });
      setTitle('');
      setBody('');
      toast('Note saved');
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <div className="adm-grid-2">
      <div className="adm-card stack gap-12">
        <h3 className="h4">Add a note</h3>
        <p className="body-sm muted">Session and call notes are private to you — never shown to the client.</p>
        <Select label="Type" value={kind} onChange={(v) => setKind((v || 'session') as 'session' | 'call')} options={[{ value: 'session', label: 'Session notes' }, { value: 'call', label: 'Call notes' }]} placeholder="Choose a type" />
        <TextInput label="Title" value={title} onChange={setTitle} placeholder="e.g. Session 6 — boundaries practice" />
        <TextArea label="Key insight, actions, next steps" value={body} onChange={setBody} rows={6} required />
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button onClick={() => void submit()} disabled={!body.trim() || save.isPending}>Save note</Button></div>
      </div>
      <div className="stack gap-12">
        {!notes.length && <Empty icon="doc" title="No notes yet" />}
        {notes.map((n) => (
          <div key={n.id} className="adm-card stack gap-8">
            <div className="row between gap-8" style={{ flexWrap: 'wrap' }}>
              <strong style={{ fontWeight: 500 }}>{n.title || humanise(n.kind)}</strong>
              <span className="row gap-8"><TonePill tone={n.kind === 'session' || n.kind === 'call' ? 'deep' : 'blush'}>{n.kind === 'shift-note' ? 'Client SHIFT note' : n.kind === 'marker' ? 'Client marker' : `${n.kind} notes`}</TonePill><span className="body-sm muted">{fmtDate(n.date)}</span></span>
            </div>
            <p className="body-sm pre-line">{n.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PurchasesTab({ userId }: { userId: string }) {
  const purchases = useList('purchases', { userId }).data;
  if (!purchases) return <Loading />;
  if (!purchases.length) return <Empty icon="card" title="No purchases yet" />;
  return (
    <div className="scroll-x">
      <table className="table adm-table">
        <thead><tr><th scope="col">Date</th><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Method</th><th scope="col">Status</th></tr></thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id}>
              <td className="nowrap">{fmtDate(p.date)}</td>
              <td>{p.label}</td>
              <td className="nowrap">{formatPrice(p.amount, p.currency)}</td>
              <td>{humanise(p.method)}</td>
              <td><TonePill tone={p.status === 'paid' ? 'sage' : p.status === 'pending' ? 'peach' : 'rose'}>{p.status}</TonePill></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubmissionsTab({ userId, email }: { userId: string; email: string }) {
  const lead = useList('leads').data?.find((l) => l.userId === userId || l.email === email);
  return (
    <div className="stack gap-24">
      <SubmissionsList userId={userId} />
      {lead && (
        <AdminSection title="Before they became a client" sub={`Forms submitted as a lead (${lead.name}).`} id="lead-subs">
          <SubmissionsList leadId={lead.id} />
        </AdminSection>
      )}
    </div>
  );
}

/** /admin/clients/:userId — one client's full record. */
export default function ClientDetail() {
  const { userId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) || 'overview';
  const userQ = useRecord('users', userId);
  const user = userQ.data;
  const enrollment = useList('enrollments', { userId }).data?.[0];
  const plan = useList('plans').data?.find((p) => p.id === enrollment?.planId);
  const nextLabel = useMemo(() => (enrollment?.nextSession ? fmtWhen(enrollment.nextSession) : null), [enrollment?.nextSession]);
  return (
    <AdminShell
      tab="clients"
      kicker={<Link to="/admin/clients" style={{ color: 'inherit', textDecoration: 'none' }}>← My clients</Link>}
      title={user?.name ?? (userQ.isError ? 'Client not found' : 'Client')}
      sub={user ? <p className="adm-band-sub">{user.email}{plan ? ` · ${plan.name} package` : ''}{enrollment ? ` · ${enrollment.sessionsCompleted}/${plan?.sessions ?? '–'} sessions` : ''}{nextLabel ? ` · next session ${nextLabel}` : ''}</p> : undefined}
      actions={user && <Button variant="light" size="sm" to={`/admin/preview?user=${user.id}`} icon="eye">Preview their portal</Button>}
    >
      {userQ.isLoading ? (
        <Loading />
      ) : !user ? (
        <Empty icon="user" title="This client could not be found"><Link to="/admin/clients">Back to My Clients</Link></Empty>
      ) : (
        <>
          <div className="adm-client-head">
            <span className="adm-avatar" style={{ background: COLOR_HEX[user.avatarColor] ?? '#b07a74', color: ['deep', 'charcoal', 'sage', 'taupe'].includes(user.avatarColor) ? '#fff' : 'var(--ink)' }} aria-hidden>{user.initials}</span>
            <div className="stack gap-4">
              <strong className="serif" style={{ fontSize: 22, fontWeight: 500, color: 'var(--ink)' }}>{user.name}</strong>
              <span className="row gap-8 body-sm muted" style={{ flexWrap: 'wrap' }}>{user.email} {plan ? <PlanPill plan={plan} /> : <TonePill tone="beige">No package</TonePill>}</span>
            </div>
          </div>
          <div>
            <Tabs tabs={TABS} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />
            <div style={{ marginTop: 24 }}>
              {tab === 'overview' && <OverviewTab userId={userId} />}
              {tab === 'wheel' && <WheelTab userId={userId} />}
              {tab === 'reflections' && <ReflectionsTab userId={userId} />}
              {tab === 'goals' && <GoalsTab userId={userId} />}
              {tab === 'habits' && <HabitsTab userId={userId} />}
              {tab === 'journey' && <JourneyTab userId={userId} />}
              {tab === 'notes' && <NotesTab userId={userId} />}
              {tab === 'submissions' && <SubmissionsTab userId={userId} email={user.email} />}
              {tab === 'purchases' && <PurchasesTab userId={userId} />}
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
