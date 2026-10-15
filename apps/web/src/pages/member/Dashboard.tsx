import { Link, NavLink, useSearchParams } from 'react-router-dom';
import { alignment, fmtDate, habitConsistency, now, type FutureSelfCard, type Lesson, type Rec } from '@shift/core';
import { useBranding, usePublicList, useSettings } from '@/data';
import { Radar } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { Art } from '@/ui/Art';
import { Button, Empty, ProgressBar, Ring, Tabs } from '@/ui/kit';
import { FutureSelfCardView, SmartGoalCard } from './components/Cards';
import { wheelBounds } from './components/blueprint';
import { QuoteCard, PageLoading, StatusGlyph, tone } from './components/ui';
import { firstName, greeting, lessonCtx, stageCtx, toolName, useJourney, useMine, type Journey } from './components/useJourney';
import { arr, obj, str } from './components/tools/types';
import './member.css';

/** Dashboard copy that isn't part of master data (structural labels from the "My Journey" design). */
const COPY = {
  title: 'My Journey',
  subtitle: 'Small steps. Meaningful progress.',
  greetingLine: 'A brighter you is possible.',
  resources: 'Resources completed',
  reflections: 'Reflections saved',
  goals: 'Goals in progress',
};

type Tab = 'overview' | 'reflections' | 'goals' | 'cards' | 'progress';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reflections', label: 'Reflections' },
  { id: 'goals', label: 'Goals' },
  { id: 'cards', label: 'Saved Cards' },
  { id: 'progress', label: 'Progress' },
];

function countReflections(j: Journey) {
  return j.work.reduce((n, w) => n + Object.values(w.reflections ?? {}).filter((v) => typeof v === 'string' && v.trim()).length, 0);
}

export default function Dashboard() {
  const j = useJourney();
  const [sp, setSp] = useSearchParams();
  const branding = useBranding();
  const cards = useMine('cards').data;
  const goals = useMine('goals').data;
  if (!j.ready || !cards || !goals) return <PageLoading />;
  const tab = (TABS.find((t) => t.id === sp.get('tab'))?.id ?? 'overview') as Tab;
  const fsLesson = j.lessons.find((l) => (l.tool.config as { savesCard?: boolean }).savesCard);

  return (
    <div className="wrap m-page m-dash">
      <aside className="m-dside" aria-label="My journey stages">
        <NavLink to="/app" end className="m-dside-link current"><span className="icon-circle sm sage" aria-hidden="true"><Icon name="sun" size={16} /></span><span><strong>{COPY.title}</strong></span></NavLink>
        {j.stages.map((s, i) => {
          const p = j.stageProgress(s.id);
          return (
            <NavLink key={s.id} to={`/app/stage/${s.id}`} className="m-dside-link">
              <span className={`num ${p.total && p.done === p.total ? 'sage' : ''}`} aria-hidden="true">{p.total && p.done === p.total ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="grow"><strong>{s.name}</strong><small>{p.done}/{p.total} lessons · {s.tagline}</small></span>
            </NavLink>
          );
        })}
        <hr className="divider" style={{ margin: '8px 0' }} />
        {j.enrolment && <NavLink to="/app/portal" className="m-dside-link"><Icon name="calendar" size={18} /><span>My coaching portal</span></NavLink>}
        <NavLink to="/app/blueprint" className="m-dside-link"><Icon name="doc" size={18} /><span>My SHIFT Blueprint</span></NavLink>
        <NavLink to="/app/tools" className="m-dside-link"><Icon name="wrench" size={18} /><span>My Tools</span></NavLink>
        {branding?.taglines.small && <QuoteCard quote={branding.taglines.small} tone="cream" className="m-side-quote" />}
      </aside>

      <main className="stack gap-20" style={{ minWidth: 0 }}>
        <div className="m-dash-head">
          <div className="stack gap-4" style={{ justifyContent: 'center' }}>
            <h1 className="h1">{COPY.title}</h1>
            <p className="muted">{COPY.subtitle}</p>
          </div>
          <div className="m-greet">
            <p className="m-greet-text">{greeting(now())}, {firstName(j.user?.name)}.<br />{COPY.greetingLine}</p>
            <Art src="leaves" className="m-greet-art" />
          </div>
        </div>
        {j.enrolment && (
          <div className="m-banner" style={{ padding: '12px 18px' }}>
            <Icon name="calendar" size={20} />
            <span className="grow body-sm" style={{ flex: '1 1 220px' }}>{j.plan ? `${j.plan.name} · ${j.enrolment.sessionsCompleted} of ${j.plan.sessions} sessions completed` : 'Your coaching portal'}{j.enrolment.nextSession ? ` · Next session ${fmtDate(j.enrolment.nextSession)}` : ''}</span>
            <Button size="sm" variant="ghost" to="/app/portal" arrow>Open my 1:1 portal</Button>
          </div>
        )}
        <Tabs tabs={TABS} value={tab} onChange={(t) => setSp(t === 'overview' ? {} : { tab: t })} />
        <div role="tabpanel" className="fade-in" key={tab}>
          {tab === 'overview' && <Overview j={j} card={cards[0] ?? null} goals={goals.length} fsLessonId={fsLesson?.id} setTab={(t) => setSp({ tab: t })} />}
          {tab === 'reflections' && <Reflections j={j} />}
          {tab === 'goals' && <Goals j={j} />}
          {tab === 'cards' && <SavedCards j={j} />}
          {tab === 'progress' && <Progress j={j} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ j, card, goals, fsLessonId, setTab }: { j: Journey; card: Rec<FutureSelfCard> | null; goals: number; fsLessonId?: string; setTab: (t: Tab) => void }) {
  const next = j.nextLesson;
  const fsLesson = j.lessons.find((l) => l.id === fsLessonId);
  const chooseField = fsLesson?.tool.fields.find((f) => f.id === 'choose');
  const question = chooseField?.helper ? `${chooseField.helper.split('?')[0]}?` : '';
  const nextMeta = next ? j.meta(next) : null;
  const nextWork = next ? j.workFor(lessonCtx(next.id)) : undefined;
  return (
    <div className="stack gap-20">
      {card ? (
        <FutureSelfCardView card={card} image={fsLesson?.nextStep.image || 'coast'} quote={fsLesson?.nextStep.imageQuote} editTo={fsLesson ? `/app/lesson/${fsLesson.id}?step=3` : undefined} />
      ) : fsLesson && j.canAccess(fsLesson) ? (
        <div className="card stack gap-12" style={{ alignItems: 'flex-start' }}>
          <h2 className="h4">My Future Self</h2>
          <p className="muted body-sm">{fsLesson.subtitle}</p>
          <Button to={`/app/lesson/${fsLesson.id}`} arrow>{fsLesson.title}</Button>
        </div>
      ) : null}

      {next && nextMeta?.stage && (
        <section className={`card m-continue ${tone(nextMeta.stage.color)}`} aria-labelledby="continue-h" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <Art src={next.image} className="rounded" style={{ width: 120, height: 90, flex: 'none' }} />
          <div className="grow stack gap-4" style={{ flex: '1 1 240px' }}>
            <span className="kicker">Continue where you left off</span>
            <h2 className="h4" id="continue-h">{next.title}</h2>
            <span className="body-sm muted">{nextMeta.stage.name} · Lesson {nextMeta.index + 1} of {nextMeta.total}{nextWork?.step ? ` · ${j.steps[Math.min(3, Math.max(0, nextWork.step - 1))]?.label}` : ''}</span>
          </div>
          <Button arrow to={`/app/lesson/${next.id}${nextWork?.step ? `?step=${Math.min(4, nextWork.step)}` : ''}`}>{nextWork ? 'Continue Lesson' : 'Start Lesson'}</Button>
        </section>
      )}

      <section className="card stack gap-12" aria-labelledby="prog-h">
        <div className="row between gap-8">
          <h2 className="h4" id="prog-h">My Progress</h2>
          <button type="button" className="link body-sm" onClick={() => setTab('progress')}>View all →</button>
        </div>
        <div className="m-stats">
          <div className="m-stat"><span className="icon-circle sm sage" aria-hidden="true"><Icon name="chart" size={16} /></span><span className="serif">{j.progress.completed}</span><span className="body-sm muted">{COPY.resources}</span></div>
          <div className="m-stat"><span className="icon-circle sm" aria-hidden="true"><Icon name="heart" size={16} /></span><span className="serif">{countReflections(j)}</span><span className="body-sm muted">{COPY.reflections}</span></div>
          <div className="m-stat"><span className="icon-circle sm cream" aria-hidden="true"><Icon name="star" size={16} /></span><span className="serif">{goals}</span><span className="body-sm muted">{COPY.goals}</span></div>
          {question && <QuoteCard quote={`“${question}”`} tone="cream" />}
        </div>
      </section>

      <section className="stack gap-12" aria-labelledby="map-h">
        <div className="row between gap-8 wrap-row">
          <h2 className="h4" id="map-h">Your SHIFT Journey</h2>
          <span className="m-inline-progress body-sm muted"><ProgressBar pct={j.progress.pct} /> {j.progress.pct}%</span>
        </div>
        <div className="m-map">
          {j.stages.map((s) => (
            <div key={s.id} className={`m-map-stage ${tone(s.color)}`}>
              <Link to={`/app/stage/${s.id}`} className="row gap-8" style={{ textDecoration: 'none' }}><span className="m-letter-sm">{s.letter}</span><strong>{s.name}</strong></Link>
              <ol>
                {(j.byStage[s.id] ?? []).map((l) => {
                  const st = j.status(l);
                  const open = st !== 'locked' && st !== 'no-access';
                  return (
                    <li key={l.id}>
                      {open ? <Link to={`/app/lesson/${l.id}`}><StatusGlyph status={st} />{l.title}</Link> : <span className="m-map-item muted"><StatusGlyph status={st} />{l.title}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Reflections({ j }: { j: Journey }) {
  const groups: { key: string; title: string; sub: string; to: string; items: { q: string; a: string }[] }[] = [];
  for (const s of j.stages) {
    for (const l of j.byStage[s.id] ?? []) {
      const w = j.workFor(lessonCtx(l.id));
      const items = l.reflections.map((q) => ({ q: q.prompt, a: str(w?.reflections?.[q.id]) })).filter((x) => x.a.trim());
      if (w?.nextStep?.text?.trim()) items.push({ q: l.nextStep.prompt, a: w.nextStep.text });
      if (items.length) groups.push({ key: l.id, title: l.title, sub: s.name, to: `/app/lesson/${l.id}?step=2`, items });
    }
    const sw = j.workFor(stageCtx(s.id));
    const sItems = s.reflection.questions.map((q) => ({ q: q.prompt, a: str(sw?.reflections?.[q.id]) })).filter((x) => x.a.trim());
    if (sItems.length) groups.push({ key: `stage-${s.id}`, title: s.reflection.title, sub: s.name, to: `/app/stage/${s.id}/reflection`, items: sItems });
  }
  if (!groups.length) return <Empty icon="chat" title="No reflections yet">Your answers from each lesson will be gathered here.</Empty>;
  return (
    <div className="stack gap-24">
      {groups.map((g) => (
        <section key={g.key} className="m-refl-group" aria-labelledby={`rg-${g.key}`}>
          <div className="row between gap-8">
            <div className="stack"><span className="label-caps muted">{g.sub}</span><h2 className="h4" id={`rg-${g.key}`}>{g.title}</h2></div>
            <Link to={g.to} className="m-edit">Edit</Link>
          </div>
          {g.items.map((x, i) => (
            <div key={i} className="m-refl-item"><span className="body-sm muted">{x.q}</span><blockquote>{x.a}</blockquote></div>
          ))}
        </section>
      ))}
    </div>
  );
}

function Goals({ j }: { j: Journey }) {
  const goals = useMine('goals').data ?? [];
  const areas = usePublicList('wheelAreas').data ?? [];
  const goalLesson = j.lessons.find((l) => (l.tool.config as { savesGoal?: boolean }).savesGoal);
  const prioLesson = j.lessons.find((l) => l.tool.kind === 'wheel-priorities');
  const intentionLessonId = (goalLesson?.tool.config as { intentionFrom?: string } | undefined)?.intentionFrom;
  const prioTool = prioLesson ? j.workFor(lessonCtx(prioLesson.id))?.tool : undefined;
  const prios = arr(prioTool?.priorities).map((id) => areas.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
  const intention = str(intentionLessonId ? j.workFor(lessonCtx(intentionLessonId))?.tool?.intention : '') || goals[0]?.intention || '';
  const valuesLesson = j.lessons.find((l) => l.tool.kind === 'values');
  const values = arr(valuesLesson ? j.workFor(lessonCtx(valuesLesson.id))?.tool?.top : []);
  const explore = obj<Record<string, Record<string, string>>>(prioTool?.explore);
  return (
    <div className="stack gap-20">
      {intention && (
        <section className="m-intention">
          <span className="icon-circle" aria-hidden="true"><Icon name="target" size={22} /></span>
          <div className="grow stack gap-4">
            <strong>My Intention</strong>
            <p className="serif italic" style={{ fontSize: 18 }}>{intention}</p>
          </div>
          {intentionLessonId && <Link className="m-edit" to={`/app/lesson/${intentionLessonId}?step=3`}>Edit</Link>}
        </section>
      )}
      {goals.length ? goals.map((g) => <SmartGoalCard key={g.id} goal={g} editTo={goalLesson ? `/app/lesson/${goalLesson.id}?step=3` : undefined} />) : (
        <Empty icon="target" title="No goals yet">{goalLesson && <Link to={`/app/lesson/${goalLesson.id}`} className="link">{goalLesson.tool.title}</Link>}</Empty>
      )}
      <div className="m-review3">
        <section className="m-box stack gap-12" aria-labelledby="pa-h">
          <div className="row between gap-8"><h2 className="h4" id="pa-h">My Priority Areas</h2>{prioLesson && <Link className="m-edit" to={`/app/lesson/${prioLesson.id}?step=3`}>Edit</Link>}</div>
          <ol className="m-top3">
            {prios.map((a, i) => (
              <li key={a.id} style={{ alignItems: 'flex-start' }}>
                <span className="num">{i + 1}</span>
                <span className="stack"><span className="row gap-8"><Icon name={a.icon} size={16} />{a.name}{str(prioTool?.mainFocus) === a.id && <span className="pill pill-sage">Main focus</span>}</span>{explore[a.id]?.want && <span className="body-sm muted">{explore[a.id].want}</span>}</span>
              </li>
            ))}
            {!prios.length && <li className="body-sm muted">Not chosen yet.</li>}
          </ol>
        </section>
        <section className="m-box stack gap-12" aria-labelledby="cv-h">
          <div className="row between gap-8"><h2 className="h4" id="cv-h">My Core Values</h2>{valuesLesson && <Link className="m-edit" to={`/app/lesson/${valuesLesson.id}?step=3`}>Edit</Link>}</div>
          <div className="m-chips">{values.length ? values.map((v) => <span key={v} className="m-chip on">{v}</span>) : <span className="body-sm muted">Not chosen yet.</span>}</div>
        </section>
      </div>
    </div>
  );
}

/** Short summary of a lesson's saved tool answers (Saved Cards tab). */
function ToolSummary({ lesson, tool }: { lesson: Rec<Lesson>; tool: Record<string, unknown> }) {
  const areas = usePublicList('wheelAreas').data ?? [];
  const rows: { label: string; value: string }[] = [];
  const val = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : str(v));
  if (lesson.tool.kind === 'values') rows.push({ label: 'Top values', value: arr(tool.top).join(' · ') });
  else if (lesson.tool.kind === 'wheel-priorities') rows.push({ label: lesson.nextStep.prompt, value: arr(tool.priorities).map((id) => areas.find((a) => a.id === id)?.name ?? id).join(' · ') });
  else if (lesson.tool.kind === 'form') {
    for (const f of [...lesson.tool.fields, ...(lesson.tool.worksheet?.fields ?? [])]) if (val(tool[f.id])) rows.push({ label: f.label, value: val(tool[f.id]) });
  }
  const shown = rows.filter((r) => r.value);
  if (!shown.length) return null;
  return (
    <section className="m-box stack gap-8" aria-label={toolName(lesson)}>
      <div className="row between gap-8">
        <div className="stack"><span className="label-caps muted">{lesson.title}</span><strong className="serif h4">{toolName(lesson)}</strong></div>
        <Link className="m-edit" to={`/app/lesson/${lesson.id}?step=3`}>Edit</Link>
      </div>
      <dl className="stack gap-4" style={{ margin: 0 }}>
        {shown.map((r) => <div key={r.label}><dt className="body-sm muted">{r.label}</dt><dd className="body-sm" style={{ margin: 0 }}>{r.value}</dd></div>)}
      </dl>
    </section>
  );
}

function SavedCards({ j }: { j: Journey }) {
  const cards = useMine('cards').data ?? [];
  const fsLesson = j.lessons.find((l) => (l.tool.config as { savesCard?: boolean }).savesCard);
  const lessonsWithTools = j.lessons.filter((l) => !(l.tool.config as { savesCard?: boolean }).savesCard && !(l.tool.config as { savesGoal?: boolean }).savesGoal && ['form', 'values', 'wheel-priorities'].includes(l.tool.kind));
  const summaries = lessonsWithTools.map((l) => ({ l, tool: j.workFor(lessonCtx(l.id))?.tool ?? {} })).filter((x) => Object.keys(x.tool).length);
  return (
    <div className="stack gap-20">
      {cards[0] ? <FutureSelfCardView card={cards[0]} image={fsLesson?.nextStep.image || 'coast'} quote={fsLesson?.nextStep.imageQuote} editTo={fsLesson ? `/app/lesson/${fsLesson.id}?step=3` : undefined} /> : null}
      <div className="m-review3">
        {summaries.map(({ l, tool }) => <ToolSummary key={l.id} lesson={l} tool={tool} />)}
      </div>
      {!cards[0] && !summaries.length && <Empty icon="doc" title="No saved cards yet">The tools you complete in each lesson are saved here.</Empty>}
    </div>
  );
}

function Progress({ j }: { j: Journey }) {
  const habits = useMine('habits').data ?? [];
  const checks = useMine('habitChecks').data ?? [];
  const scores = useMine('wheelScores').data ?? [];
  const cards = useMine('cards').data ?? [];
  const areas = usePublicList('wheelAreas').data ?? [];
  const settings = useSettings();
  const consistency = habitConsistency(habits, checks);
  const a = alignment(cards[0]?.qualities ?? [], settings?.qualityScale.max ?? 5);
  const { start, latest } = wheelBounds(scores);
  return (
    <div className="stack gap-20">
      <div className="m-review3">
        <div className="m-box stack" style={{ alignItems: 'center', gap: 10 }}>
          <strong>Journey progress</strong>
          <Ring pct={j.progress.pct} size={112} stroke={10} />
          <span className="body-sm muted">{j.progress.completed} of {j.progress.total} lessons completed</span>
        </div>
        <div className="m-box stack" style={{ alignItems: 'center', gap: 10 }}>
          <strong>Habit consistency</strong>
          <Ring pct={consistency} size={112} stroke={10} color="#6e7d69" />
          <span className="body-sm muted">{habits.length} habit{habits.length === 1 ? '' : 's'} tracked</span>
        </div>
        <div className="m-box stack" style={{ alignItems: 'center', gap: 10 }}>
          <strong>Future Self alignment</strong>
          <Ring pct={a.now} size={112} stroke={10} color="#b07a74" />
          <span className="body-sm muted">{a.delta >= 0 ? '+' : ''}{a.delta}% since you started</span>
        </div>
      </div>
      <section className="m-box stack gap-12" aria-labelledby="wheel-h">
        <h2 className="h4" id="wheel-h">Wheel of Life</h2>
        {start ? (
          <>
            <div className="m-legend">
              <span><i style={{ background: '#d29b94' }} />When you started<small>{fmtDate(start.date)}</small></span>
              {latest && <span><i style={{ background: '#2e3b32' }} />Latest<small>{fmtDate(latest.date)}</small></span>}
            </div>
            <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
              <Radar axes={areas.map((x) => ({ id: x.id, label: x.name }))} max={settings?.wheel.max ?? 10} size={300} series={[
                { label: 'When you started', values: start.scores, color: '#d29b94', fill: 'rgba(210,155,148,.15)' },
                ...(latest ? [{ label: 'Latest', values: latest.scores, color: '#2e3b32', fill: 'rgba(148,165,140,.25)' }] : []),
              ]} />
            </div>
          </>
        ) : <p className="body-sm muted">Rate your Wheel of Life in the journey to see it here.</p>}
      </section>
    </div>
  );
}
