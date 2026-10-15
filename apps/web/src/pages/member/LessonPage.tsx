import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Lesson, Rec } from '@shift/core';
import { useAction, useQueryClient } from '@/data';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { AutosaveIndicator, Button, Empty, IconButton, Pill, Stepper, VideoPlayer, useAutosave, useToast } from '@/ui/kit';
import { SmartGoalCard } from './components/Cards';
import { WorksheetModal } from './components/Print';
import { StageSidebar } from './components/StageSidebar';
import { BlueprintTool } from './components/tools/BlueprintTool';
import { FormTool } from './components/tools/FormTool';
import { HabitBuilder, HabitProgressTool } from './components/tools/HabitTools';
import { FutureSelfRerate, JourneyReview } from './components/tools/ReviewTools';
import type { ToolProps } from './components/tools/types';
import { ValuesTool } from './components/tools/ValuesTool';
import { PrioritiesNext, WheelPriorities, WheelReflect } from './components/tools/WheelPriorities';
import { latestGoal } from './components/blueprint';
import { MetaRow, PageLoading, QuestionField, QuoteCard, StepHead, LockedPanel, Leaf } from './components/ui';
import { lessonCtx, stageCtx, useJourney, useMine, type Journey } from './components/useJourney';
import { useWorkDraft, type WorkDraft } from './components/useWorkDraft';
import './member.css';

const cap = (s: string) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : s);

export default function LessonPage() {
  const { lessonId } = useParams();
  const j = useJourney();
  if (!j.ready) return <PageLoading />;
  const lesson = j.lessons.find((l) => l.id === lessonId);
  if (!lesson) {
    return (
      <div className="wrap section-sm">
        <Empty icon="compass" title="We couldn't find that lesson">
          <Link to="/app/journey" className="link">Back to The SHIFT Journey</Link>
        </Empty>
      </div>
    );
  }
  const { stage, inStage, index } = j.meta(lesson);
  if (!stage) return <PageLoading />;
  const gate = !j.canAccess(lesson) ? 'no-access' : !j.isUnlocked(lesson) ? 'locked' : null;
  if (gate) {
    const prev = j.lessons[j.lessons.findIndex((l) => l.id === lesson.id) - 1];
    return (
      <div className="wrap m-page m-lesson">
        <StageSidebar j={j} stage={stage} currentLessonId={lesson.id} />
        <main className="m-main">
          {gate === 'no-access' ? (
            <LockedPanel title={lesson.title} body={<p>This lesson is part of The SHIFT Journey and 1:1 coaching. Explore the Journey to unlock every lesson, or talk to us about coaching.</p>} />
          ) : (
            <LockedPanel
              title={lesson.title}
              body={<p>Lessons open one at a time so each step builds on the last. Complete “{prev?.title}” to unlock this lesson.</p>}
              actions={<div className="wrap-row gap-12" style={{ justifyContent: 'center' }}>{prev && <Button to={`/app/lesson/${prev.id}`} arrow>Go to {prev.title}</Button>}<Button to={`/app/stage/${stage.id}`} variant="ghost">Back to {stage.name}</Button></div>}
            />
          )}
        </main>
      </div>
    );
  }
  return <LessonView key={lesson.id} j={j} lesson={lesson} index={index} total={inStage.length} />;
}

function LessonView({ j, lesson, index, total }: { j: Journey; lesson: Rec<Lesson>; index: number; total: number }) {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const ctx = lessonCtx(lesson.id);
  const work = j.workFor(ctx);
  const wd = useWorkDraft(ctx, work, j.ready);
  const [sheet, setSheet] = useState(false);
  const stage = j.stages.find((s) => s.id === lesson.stageId)!;
  const stageNo = j.stages.findIndex((s) => s.id === stage.id) + 1;
  const raw = Number(sp.get('step'));
  const step = raw >= 1 && raw <= 4 ? raw : 0;
  const steps = j.steps;
  const reached = work?.completed ? 4 : work?.step ?? 0;
  const kicker = `Lesson ${index + 1} of ${total}`;

  const goStep = useCallback((n: number) => {
    setSp(n ? { step: String(n) } : {}, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (n > (work?.step ?? 0)) void wd.commit({ step: n }).catch(() => undefined);
  }, [setSp, work?.step, wd]);

  const complete = async () => {
    try {
      await wd.commit({ completed: true, step: 4 });
      await qc.invalidateQueries({ queryKey: ['c'] });
      toast(`“${lesson.title}” complete — lovely work.`);
      nav(j.afterLesson(lesson));
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  const neighbours = { prev: j.lessons[j.lessons.findIndex((l) => l.id === lesson.id) - 1], next: j.lessons[j.lessons.findIndex((l) => l.id === lesson.id) + 1] };
  const done = Array.from({ length: 4 }, (_, i) => i).filter((i) => i < reached - 1 || (work?.completed ?? false));

  return (
    <div className="wrap m-page m-lesson">
      <StageSidebar j={j} stage={stage} currentLessonId={lesson.id} quote={lesson.sideQuote} />
      <main className="m-main stack gap-20">
        {step === 0 ? (
          <Overview j={j} lesson={lesson} stageName={stage.name} stageNo={stageNo} kicker={kicker} started={reached > 0} onStart={() => goStep(Math.max(1, Math.min(4, reached || 1)))} />
        ) : (
          <div className="m-stepbar">
            <Link to={`/app/lesson/${lesson.id}`} className="m-back"><Icon name="arrow-left" size={16} />Back to lesson</Link>
            <span className="row gap-8">
              <span className="body-sm muted">{kicker}</span>
              {neighbours.prev && j.canAccess(neighbours.prev) && <IconButton icon="chevron-left" size="sm" label={`Previous: ${neighbours.prev.title}`} onClick={() => nav(`/app/lesson/${neighbours.prev.id}`)} />}
              {neighbours.next && j.isUnlocked(neighbours.next) && <IconButton icon="chevron-right" size="sm" label={`Next: ${neighbours.next.title}`} onClick={() => nav(`/app/lesson/${neighbours.next.id}`)} />}
            </span>
          </div>
        )}
        <div className="card m-stepper-card">
          <Stepper steps={steps.map((s) => ({ label: s.label, sub: s.sub }))} current={Math.max(0, step - 1)} done={done} onStep={(i) => goStep(i + 1)} />
        </div>
        {step > 0 && !wd.draft && <div className="skeleton" style={{ height: 320 }} />}
        {step > 0 && wd.draft && (
          <section className="card m-stepcard fade-in" key={step} aria-live="polite">
            {step === 1 && <LearnStep j={j} lesson={lesson} kicker={kicker} onNext={() => goStep(2)} />}
            {step === 2 && <ReflectStep j={j} lesson={lesson} kicker={kicker} draft={wd.draft} setReflection={wd.setReflection} status={wd.status} onNext={() => goStep(3)} />}
            {step === 3 && <ApplyStep j={j} lesson={lesson} kicker={kicker} draft={wd.draft} setTool={wd.setTool} status={wd.status} onNext={() => goStep(4)} openSheet={() => setSheet(true)} />}
            {step === 4 && <NextStep j={j} lesson={lesson} kicker={kicker} draft={wd.draft} setTool={wd.setTool} setNext={wd.setNext} status={wd.status} completed={!!work?.completed} onComplete={complete} busy={wd.saving} />}
          </section>
        )}
      </main>
      {sheet && wd.draft && <WorksheetModal lesson={lesson} tool={wd.draft.tool} reflections={wd.draft.reflections} onClose={() => setSheet(false)} />}
    </div>
  );
}

/** Lesson landing: hero + what you'll learn + key takeaways. */
function Overview({ j, lesson, stageName, stageNo, kicker, started, onStart }: { j: Journey; lesson: Rec<Lesson>; stageName: string; stageNo: number; kicker: string; started: boolean; onStart: () => void }) {
  const steps = j.steps;
  const printable = lesson.tool.fields.length > 0 || !!lesson.tool.worksheet || ['values', 'wheel-priorities', 'habit-builder'].includes(lesson.tool.kind);
  const meta = [
    { icon: 'play', title: lesson.durationLabel, sub: steps[0]?.label },
    ...(lesson.reflections.length || lesson.tool.kind === 'wheel-priorities' ? [{ icon: 'doc', title: lesson.reflections.length === 1 ? 'Reflection question' : 'Reflection exercise', sub: steps[1]?.label }] : []),
    { icon: 'wrench', title: cap(lesson.tool.badge), sub: steps[2]?.label },
    ...(printable ? [{ icon: 'download', title: 'Worksheet', sub: 'Download' }] : []),
  ];
  return (
    <>
      <section className="m-hero" aria-labelledby="lesson-title">
        <div className="m-hero-copy">
          <div className="kicker rose">Stage {stageNo} of {j.stages.length} • {stageName}</div>
          <div className="m-lesson-n">{kicker}</div>
          <h1 className="h1" id="lesson-title">{lesson.title}</h1>
          <p className="lead">{lesson.subtitle}</p>
          {lesson.intro && <p className="body-sm muted m-hero-intro">{lesson.intro}</p>}
          <MetaRow items={meta} />
          <div><Button size="lg" arrow onClick={onStart}>{started ? 'Continue Lesson' : 'Start Lesson'}</Button></div>
        </div>
        <Art src={lesson.image} quote={lesson.heroQuote} quotePos="tr" quoteSize={32} className="m-hero-art" />
      </section>
      <div className="m-overview">
        {lesson.learn.length > 0 ? (
          <section className="m-learnbox" aria-labelledby="learn-h">
            <h2 className="h4" id="learn-h">{lesson.learnLabel}</h2>
            <ul className="m-checks">{lesson.learn.map((x, i) => <li key={i}><Icon name="check" size={16} />{x}</li>)}</ul>
          </section>
        ) : lesson.about ? (
          <section className="m-learnbox" aria-labelledby="about-h">
            <h2 className="h4" id="about-h">About this lesson</h2>
            <p className="body-sm muted">{lesson.about}</p>
          </section>
        ) : lesson.learnCards.length > 0 ? (
          <section className="m-learnbox" aria-labelledby="learn-h">
            <h2 className="h4" id="learn-h">{lesson.learnLabel}</h2>
            <ul className="m-checks">{lesson.learnCards.map((x, i) => <li key={i}><Icon name="check" size={16} />{x.title}</li>)}</ul>
          </section>
        ) : null}
        <Takeaways lesson={lesson} />
        <QuoteCard quote={lesson.sideQuote} tone="cream" className="m-overview-quote" />
      </div>
    </>
  );
}

function Takeaways({ lesson }: { lesson: Rec<Lesson> }) {
  if (!lesson.takeaways.length) return null;
  const titled = lesson.takeaways.some((t) => t.title);
  return (
    <section className="m-takeaways" aria-labelledby={`tk-${lesson.id}`}>
      <div className="row gap-12">
        <span className="icon-circle sm" aria-hidden="true"><Icon name="bulb" size={18} /></span>
        <h2 className="h4" id={`tk-${lesson.id}`}>{lesson.takeawaysLabel}</h2>
      </div>
      {titled ? (
        <ol className="m-numbered">
          {lesson.takeaways.map((t, i) => (
            <li key={i}><span className="m-bignum serif">{i + 1}</span><span className="stack"><strong>{t.title}</strong><span className="body-sm muted">{t.text}</span></span></li>
          ))}
        </ol>
      ) : (
        <ul className="m-tick">
          {lesson.takeaways.map((t, i) => <li key={i}><span className="m-tick-ic" aria-hidden="true"><Icon name="check" size={13} stroke={2.4} /></span>{t.text}</li>)}
        </ul>
      )}
    </section>
  );
}

function StepFooter({ children, status }: { children: React.ReactNode; status?: 'idle' | 'saving' | 'saved' | 'error' }) {
  return (
    <div className="m-stepfoot">
      <div className="wrap-row gap-12">{children}</div>
      {status && <AutosaveIndicator status={status === 'idle' ? 'saved' : status} />}
    </div>
  );
}

function LearnStep({ j, lesson, kicker, onNext }: { j: Journey; lesson: Rec<Lesson>; kicker: string; onNext: () => void }) {
  const save = useAction('saveWork');
  const [, trigger] = useAutosave<number>((s) => save.mutateAsync({ context: lessonCtx(lesson.id), patch: { videoSeconds: s } }), 5000);
  return (
    <div className="stack gap-24">
      <StepHead icon="play" kicker={kicker} title={lesson.videoTitle} sub={lesson.videoCaption ? undefined : lesson.intro || undefined} aside={<span className="row gap-8 body-sm muted"><Icon name="clock" size={16} />{lesson.durationLabel}</span>} />
      <div className="m-learngrid">
        <div className="stack gap-16">
          <VideoPlayer url={lesson.videoUrl} overlay={lesson.videoOverlay} duration={lesson.videoDuration} image={lesson.image} caption={lesson.videoCaption} onProgress={trigger} />
          {lesson.learn.length > 0 && (
            <div className="stack gap-8">
              <strong className="body-sm">{lesson.learnLabel}</strong>
              <ul className="m-tick">{lesson.learn.map((x, i) => <li key={i}><span className="m-tick-ic sage" aria-hidden="true"><Icon name="check" size={13} stroke={2.4} /></span>{x}</li>)}</ul>
            </div>
          )}
        </div>
        <Takeaways lesson={lesson} />
      </div>
      {lesson.learnCards.length > 0 && (
        <ul className="m-learncards">
          {lesson.learnCards.map((c, i) => (
            <li key={i}><span className="icon-circle" aria-hidden="true"><Icon name={c.icon ?? 'leaf'} size={20} /></span><span className="stack"><strong>{c.title}</strong><span className="body-sm muted">{c.text}</span></span></li>
          ))}
        </ul>
      )}
      {lesson.about && (
        <div className="m-about">
          <span className="icon-circle" aria-hidden="true"><Icon name="bulb" size={20} /></span>
          <div className="stack gap-4"><strong className="h4">About this lesson</strong><p className="body-sm muted">{lesson.about}</p></div>
        </div>
      )}
      <StepFooter><Button arrow onClick={onNext}>Continue to {j.steps[1]?.label ?? 'Reflect'}</Button></StepFooter>
    </div>
  );
}

/** Everything the person has written so far (used where a lesson has no reflection questions of its own). */
function JourneyReflections({ j }: { j: Journey }) {
  const groups = j.stages.map((s) => ({
    s,
    items: (j.byStage[s.id] ?? []).flatMap((l) => l.reflections.map((q) => ({ q: q.prompt, a: j.workFor(lessonCtx(l.id))?.reflections?.[q.id] ?? '' }))).concat(s.reflection.questions.map((q) => ({ q: q.prompt, a: j.workFor(stageCtx(s.id))?.reflections?.[q.id] ?? '' }))).filter((x) => x.a.trim()),
  })).filter((g) => g.items.length);
  if (!groups.length) return <p className="muted card-soft card-pad-sm">Your reflections from each stage will appear here.</p>;
  return (
    <div className="stack gap-16">
      {groups.map(({ s, items }) => (
        <section key={s.id} className="m-box stack gap-8">
          <strong className="row gap-8"><span className={`m-letter-sm m-tone-${s.color}`}>{s.letter}</span>{s.name}</strong>
          {items.slice(0, 4).map((x, i) => <div key={i} className="stack"><span className="body-sm muted">{x.q}</span><span className="body-sm">“{x.a}”</span></div>)}
        </section>
      ))}
    </div>
  );
}

function ReflectStep({ j, lesson, kicker, draft, setReflection, status, onNext }: { j: Journey; lesson: Rec<Lesson>; kicker: string; draft: WorkDraft; setReflection: (id: string, v: string) => void; status: 'idle' | 'saving' | 'saved' | 'error'; onNext: () => void }) {
  const single = lesson.reflections.length === 1;
  const wheel = lesson.tool.kind === 'wheel-priorities' && !lesson.reflections.length;
  return (
    <div className="stack gap-24">
      <StepHead icon="chat" kicker={kicker} title={lesson.reflectionTitle} sub={single ? undefined : lesson.reflectionIntro} />
      {wheel ? (
        <WheelReflect lesson={lesson} />
      ) : !lesson.reflections.length ? (
        <JourneyReflections j={j} />
      ) : single ? (
        <QuestionField prompt={lesson.reflections[0].prompt} helper={lesson.reflections[0].helper || (lesson.reflectionIntro !== lesson.reflections[0].prompt ? lesson.reflectionIntro : '')} placeholder={lesson.reflections[0].placeholder} value={draft.reflections[lesson.reflections[0].id] ?? ''} onChange={(v) => setReflection(lesson.reflections[0].id, v)} rows={9} maxWords={500} tone="plain" />
      ) : (
        <div className="stack gap-12">
          {lesson.reflections.map((q, i) => (
            <QuestionField key={q.id} n={i + 1} prompt={q.prompt} helper={q.helper} placeholder={q.placeholder} value={draft.reflections[q.id] ?? ''} onChange={(v) => setReflection(q.id, v)} />
          ))}
        </div>
      )}
      {lesson.reflectionReminder && (
        <div className="m-reminder">
          <Leaf size={30} />
          <div className="stack gap-4"><strong>A helpful reminder</strong><p className="body-sm muted">{lesson.reflectionReminder}</p></div>
        </div>
      )}
      <StepFooter status={wheel ? undefined : status}><Button arrow onClick={onNext}>Save and Continue</Button></StepFooter>
    </div>
  );
}

function ApplyStep({ j, lesson, kicker, draft, setTool, status, onNext, openSheet }: { j: Journey; lesson: Rec<Lesson>; kicker: string; draft: WorkDraft; setTool: (p: Record<string, unknown>) => void; status: 'idle' | 'saving' | 'saved' | 'error'; onNext: () => void; openSheet: () => void }) {
  const custom = useRef<(() => Promise<boolean>) | null>(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const registerSave = useCallback((fn: (() => Promise<boolean>) | null) => { custom.current = fn; }, []);
  const hideFooter = useCallback((h: boolean) => setHidden(h), []);
  const t = lesson.tool;
  const props: ToolProps = { j, lesson, tool: draft.tool, setTool, registerSave, onContinue: onNext, hideFooter };
  const body =
    t.kind === 'values' ? <ValuesTool {...props} />
    : t.kind === 'wheel-priorities' ? <WheelPriorities {...props} />
    : t.kind === 'habit-builder' ? <HabitBuilder {...props} />
    : t.kind === 'habit-progress' ? <HabitProgressTool {...props} />
    : t.kind === 'journey-review' ? <JourneyReview {...props} />
    : t.kind === 'future-self-rerate' ? <FutureSelfRerate {...props} />
    : t.kind === 'blueprint' ? <BlueprintTool {...props} />
    : <FormTool {...props} />;
  const generic = /^(the tool|apply the tool)$/i.test(t.title.trim());
  const printable = t.fields.length > 0 || !!t.worksheet || ['values', 'wheel-priorities', 'habit-builder'].includes(t.kind);
  const ownLabel = t.kind === 'habit-builder' ? 'Save and Continue' : t.saveLabel;
  const primary = async () => {
    setBusy(true);
    try {
      const ok = custom.current ? await custom.current() : true;
      if (ok) onNext();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack gap-24">
      {!hidden && (
        <StepHead
          icon="wrench"
          kicker={kicker}
          title={generic ? <>{t.title}<span className="m-subtitle">{t.subtitle}</span></> : t.title}
          sub={generic || t.subtitle === t.description ? t.description : t.subtitle}
          aside={t.badge ? <Pill tone="blush">{t.badge}</Pill> : undefined}
        />
      )}
      {!generic && t.subtitle !== t.description && t.description && !hidden && !['journey-review', 'future-self-rerate'].includes(t.kind) && <p className="muted">{t.description}</p>}
      {body}
      {!hidden && (
        <StepFooter status={status}>
          {printable && <Button variant="soft" icon="doc" onClick={openSheet}>Download Worksheet</Button>}
          <Button arrow onClick={primary} disabled={busy}>{ownLabel}</Button>
        </StepFooter>
      )}
    </div>
  );
}

function NextStep({ j, lesson, kicker, draft, setTool, setNext, status, completed, onComplete, busy }: { j: Journey; lesson: Rec<Lesson>; kicker: string; draft: WorkDraft; setTool: (p: Record<string, unknown>) => void; setNext: (p: Partial<WorkDraft['nextStep']>) => void; status: 'idle' | 'saving' | 'saved' | 'error'; completed: boolean; onComplete: () => void; busy: boolean }) {
  const [ticked, setTicked] = useState(completed);
  const ns = lesson.nextStep;
  const goals = useMine('goals').data;
  const saveGoal = useAction('saveGoal');
  const savesGoal = !!(lesson.tool.config as { savesGoal?: boolean }).savesGoal;
  const goal = goals ? latestGoal(goals) : null;
  const prio = lesson.tool.kind === 'wheel-priorities';
  const shiftDup = ns.shift && ns.helper === ns.shift;
  useEffect(() => setTicked(completed), [completed]);

  const finish = async () => {
    if (savesGoal && goal && draft.nextStep.text.trim()) {
      await saveGoal.mutateAsync({ id: goal.id, goal: { firstStep: draft.nextStep.text.trim(), statement: goal.statement } }).catch(() => undefined);
    }
    onComplete();
  };

  return (
    <div className="stack gap-24">
      <StepHead icon="flag" kicker={kicker} title="Your Next Step" sub={prio || savesGoal ? ns.helper : j.steps[3]?.sub} />
      {prio ? (
        <PrioritiesNext lesson={lesson} tool={draft.tool} setTool={setTool} nextStep={draft.nextStep} setNext={(p) => setNext(p)} />
      ) : (
        <div className="m-nextgrid">
          <div className="stack gap-16">
            {savesGoal && goal && <SmartGoalCard goal={goal} image={ns.image} imageQuote={ns.imageQuote} editTo={`/app/lesson/${lesson.id}?step=3`} />}
            {ns.shift && (
              <div className="m-shift">
                <Leaf size={36} />
                <div className="stack gap-4"><strong className="h4">Your SHIFT</strong><p className="body-sm">{ns.shift}</p></div>
              </div>
            )}
            <div className="m-box stack gap-8">
              <label className="h4" htmlFor="next-text">{ns.prompt}</label>
              {ns.helper && !shiftDup && !savesGoal && <p className="body-sm muted">{ns.helper}</p>}
              <textarea id="next-text" className="textarea" rows={4} placeholder={ns.placeholder} value={draft.nextStep.text ?? ''} onChange={(e) => setNext({ text: e.target.value })} />
            </div>
          </div>
          <div className="stack gap-16">
            {ns.image && !savesGoal && <Art src={ns.image} quote={ns.imageQuote} quotePos="tl" quoteSize={30} className="rounded-lg ratio-16x9" />}
            {ns.remember.length > 0 && (
              <div className="m-remember">
                <Leaf size={40} />
                <div className="stack gap-4">
                  <strong className="h4">Remember</strong>
                  <ul className="bullets body-sm">{ns.remember.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="m-complete">
        <label className="check">
          <input type="checkbox" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
          I'll mark this lesson as complete
        </label>
        <div className="wrap-row gap-12" style={{ alignItems: 'center' }}>
          <AutosaveIndicator status={status === 'idle' ? 'saved' : status} />
          <Button arrow size="lg" onClick={finish} disabled={!ticked || busy} aria-describedby={!ticked ? 'complete-hint' : undefined}>{lesson.completeLabel}</Button>
        </div>
        {!ticked && <span id="complete-hint" className="sr-only">Tick the box to mark this lesson as complete</span>}
        {completed && <span className="body-sm muted"><Icon name="check" size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Completed — you can revisit and update your answers any time.</span>}
      </div>
    </div>
  );
}

