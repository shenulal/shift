import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import type { FreeQuestion, Rec } from '@shift/core';
import { useAction, useAuth, usePublicList, useSingleton } from '@/data';
import { Art } from '@/ui/Art';
import { WheelOfLife } from '@/ui/charts';
import { Button, Checkboxes, Loading, Script, TextArea, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Logo } from '@/ui/Logo';
import { tone } from './components/shared';
import './public.css';

const STORE_KEY = 'shift-discover-flow-v1';
type Answer = string | string[];
interface FlowState {
  step: number;
  scores: Record<string, number>;
  answers: Record<string, Answer>;
  plan: Record<string, string>;
  email: string;
  submitted: boolean;
  emailed: boolean;
}
const EMPTY: FlowState = { step: 0, scores: {}, answers: {}, plan: {}, email: '', submitted: false, emailed: false };

function loadState(): FlowState {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}
function saveState(s: FlowState) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — keep state in memory */
  }
}

const PLAN_ICONS = ['calendar', 'alert', 'check'];
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

/** Discover SHIFT free tool — full-screen guided flow (design 02, nine screens). */
export default function DiscoverFlow() {
  const ft = useSingleton('freeTool');
  const qList = usePublicList('freeQuestions').data;
  const toolkits = usePublicList('toolkits').data;
  const { user } = useAuth();
  const submit = useAction('submitFreeTool');
  const toast = useToast();
  const [s, setS] = useState<FlowState>(loadState);
  const [emailError, setEmailError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const questions = useMemo(() => (qList ? [...qList].sort((a, b) => a.number - b.number) : []), [qList]);
  // screens: intro, wheel, one per question, results, next
  const total = questions.length + 4;
  const step = Math.min(s.step, Math.max(total - 1, 0));
  const update = (patch: Partial<FlowState>) => setS((prev) => ({ ...prev, ...patch }));

  useEffect(() => saveState(s), [s]);
  useEffect(() => {
    if (user?.email && !s.email) update({ email: user.email });
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, [step]);

  if (!ft || !qList) {
    return (
      <div className="p-flow">
        <FlowHeader step={0} total={1} />
        <div className="wrap section"><Loading h={420} /></div>
      </div>
    );
  }

  const go = (n: number) => update({ step: Math.max(0, Math.min(total - 1, n)) });
  const resultsStep = questions.length + 2;
  const nextStep = questions.length + 3;

  const payload = (email?: string) => ({
    email,
    answers: s.answers,
    plan: s.plan,
    scores: s.scores,
  });

  const sendEmail = async () => {
    setEmailError(null);
    if (!isEmail(s.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    try {
      await submit.mutateAsync(payload(s.email.trim()));
      update({ submitted: true, emailed: true });
      toast('Your First SHIFT is on its way to your inbox');
    } catch (e) {
      setEmailError((e as Error).message);
    }
  };

  /** Leaving the results screen: record the submission even if no email was given. */
  const leaveResults = async () => {
    if (!s.submitted) {
      try {
        await submit.mutateAsync(payload());
        update({ submitted: true, step: nextStep });
        return;
      } catch {
        /* still let them move on */
      }
    }
    go(nextStep);
  };

  const restart = () => setS({ ...EMPTY, email: s.email });

  let screen: JSX.Element;
  if (step === 0) {
    const i = ft.intro;
    screen = (
      <div className="p-flow-card">
        <div className="p-intro">
          <Art src="coast-woman" quote={i.quote} quotePos="tr" quoteSize={38} />
          <div className="stack gap-16">
            <Logo size={30} />
            <div className="p-caps">{i.kicker}</div>
            <h1 ref={headingRef} tabIndex={-1} className="h1 pre-line">{i.title}</h1>
            <p className="muted">{i.body}</p>
            <div><Button size="lg" arrow onClick={() => go(1)}>{i.cta}</Button></div>
          </div>
        </div>
      </div>
    );
  } else if (step === 1) {
    const w = ft.wheel;
    screen = (
      <div className="p-flow-card">
        <div className="p-flow-top">
          <span className="p-flow-n">1</span>
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="h2">{w.title}</h1>
            <div className="p-flow-theme">{w.subtitle}</div>
          </div>
        </div>
        <p className="muted pre-line" style={{ marginBottom: 16 }}>{w.instructions}</p>
        <WheelOfLife value={s.scores} onChange={(scores) => update({ scores })} size={340} />
        <div className="p-flow-caption" style={{ marginTop: 20 }}>
          <span className="ic" aria-hidden="true"><Icon name="pencil" size={20} /></span>
          <span>{w.caption}</span>
        </div>
      </div>
    );
  } else if (step < resultsStep) {
    const q = questions[step - 2];
    screen = <QuestionScreen q={q} n={step} value={s.answers[q.id]} onChange={(v) => update({ answers: { ...s.answers, [q.id]: v } })} headingRef={headingRef} />;
  } else if (step === resultsStep) {
    const r = ft.results;
    const e = ft.emailCapture;
    screen = (
      <div className="p-flow-card stack gap-24">
        <div className="p-flow-top" style={{ marginBottom: 0 }}>
          <span className="p-flow-n">{step}</span>
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="h2">{r.title}</h1>
            <div className="p-flow-theme">{r.subtitle}</div>
          </div>
        </div>
        <p className="muted">{r.intro}</p>
        <div className="p-sumrows">
          {questions.map((q) => {
            const v = s.answers[q.id];
            const id = `sum-${q.id}`;
            return (
              <div key={q.id} className={`p-sumrow ${tone(q.color)}`}>
                <label className="p-sumrow-label" htmlFor={id}>
                  <span className="ic" aria-hidden="true"><Icon name={q.captionIcon} size={18} /></span>
                  <span>
                    <strong>{q.summaryLabel}</strong>
                    <small>(From Question {q.number})</small>
                  </span>
                </label>
                {Array.isArray(v) ? (
                  <div id={id} className="body-sm" style={{ padding: '10px 14px' }}>{v.join(', ') || '—'}</div>
                ) : (
                  <textarea id={id} className="textarea" value={v ?? ''} placeholder="—" onChange={(ev) => update({ answers: { ...s.answers, [q.id]: ev.target.value } })} />
                )}
              </div>
            );
          })}
        </div>

        <section className="p-panel stack gap-12" aria-labelledby="plan-title">
          <h2 id="plan-title" className="p-caps center">{r.planTitle}</h2>
          <div className="p-plan3">
            {r.planFields.map((label, i) => (
              <div key={label} className="p-card" style={{ padding: 14 }}>
                <TextArea
                  label={<span className="row gap-8"><Icon name={PLAN_ICONS[i % PLAN_ICONS.length]} size={16} />{label}</span>}
                  value={s.plan[label] ?? ''}
                  rows={2}
                  onChange={(v) => update({ plan: { ...s.plan, [label]: v } })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="p-panel-sage stack gap-12" aria-labelledby="keep-title">
          <h2 id="keep-title" className="h3">{e.title}</h2>
          <p className="muted body-sm">{e.body}</p>
          {s.emailed ? (
            <p className="row gap-8" role="status"><Icon name="check" size={18} /> Sent to {s.email}</p>
          ) : (
            <form className="wrap-row gap-12" style={{ alignItems: 'flex-end' }} onSubmit={(ev) => { ev.preventDefault(); void sendEmail(); }} noValidate>
              <div style={{ flex: '1 1 240px' }}>
                <TextInput label="Email address" type="email" value={s.email} onChange={(email) => update({ email })} placeholder="you@example.com" autoComplete="email" error={emailError} />
              </div>
              <Button type="submit" arrow disabled={submit.isPending}>{e.cta}</Button>
            </form>
          )}
          <p className="body-sm faint">{e.consent}</p>
        </section>
      </div>
    );
  } else {
    const n = ft.next;
    screen = (
      <div className="p-flow-card stack gap-20">
        <div className="p-flow-top" style={{ marginBottom: 0 }}>
          <span className="p-flow-n">{step}</span>
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="h2">{n.title}</h1>
            <div className="p-flow-theme">{n.subtitle}</div>
          </div>
        </div>
        <p className="muted">{n.intro}</p>
        <ul className="p-next-list">
          {(toolkits ?? []).map((t) => (
            <li key={t.id} className={tone(t.color)}>
              <Link to={`/tools/${t.id}`}>
                <span className="ic" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
                <span className="grow">
                  <strong>{t.name} Toolkit</strong>
                  <span className="body-sm muted">{t.shortTagline}</span>
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="wrap-row between gap-16">
          <Script size={36}>{n.quote}</Script>
          <Button variant="ghost" to="/path" arrow>Explore every path</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-flow">
      <FlowHeader step={step} total={total} />
      <main id="main" className="p-flow-main">
        <div className="wrap">
          <div className="fade-in" key={step}>{screen}</div>
          {step > 0 && (
            <div className="p-flow-nav">
              <Button variant="ghost" icon="arrow-left" onClick={() => go(step - 1)}>Back</Button>
              {step < resultsStep && <Button arrow onClick={() => go(step + 1)}>Next</Button>}
              {step === resultsStep && <Button arrow disabled={submit.isPending} onClick={() => void leaveResults()}>{ft.next.title.replace(/\?$/, '')}</Button>}
              {step === nextStep && <Button variant="ghost" icon="refresh" onClick={restart}>Start again</Button>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function FlowHeader({ step, total }: { step: number; total: number }) {
  return (
    <header className="p-flow-head">
      <div className="wrap">
        <Link to="/" aria-label="SHIFT home" style={{ textDecoration: 'none' }}><Logo size={20} /></Link>
        <ol className="p-flow-dots" aria-label={`Step ${step + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <li key={i} className={i === step ? 'current' : i < step ? 'done' : ''} aria-hidden="true" />
          ))}
        </ol>
        <Link to="/discover" className="p-flow-exit"><Icon name="x" size={16} />Exit</Link>
      </div>
    </header>
  );
}

function QuestionScreen({ q, n, value, onChange, headingRef }: { q: Rec<FreeQuestion>; n: number; value: Answer | undefined; onChange: (v: Answer) => void; headingRef: RefObject<HTMLHeadingElement> }) {
  return (
    <div className={`p-flow-card ${tone(q.color)}`}>
      <div className="p-flow-top">
        <span className="p-flow-n">{n}</span>
        <div>
          <div className="p-flow-label">{q.label}</div>
          <div className="p-flow-theme">{q.theme}</div>
        </div>
      </div>
      <div className="p-flow-q">
        <div className="stack gap-16">
          <h1 ref={headingRef} tabIndex={-1} className="h2">{q.question}</h1>
          <p className="muted">{q.helper}</p>
          <div className="p-flow-answer">
            <span className="icon-circle cream sm" aria-hidden="true"><Icon name="pencil" size={16} /></span>
            {q.fieldType === 'checkboxes' ? (
              <Checkboxes label="Your answer:" options={q.options} value={Array.isArray(value) ? value : []} onChange={onChange} columns={1} />
            ) : (
              <TextArea label="Your answer:" value={typeof value === 'string' ? value : ''} onChange={onChange} rows={4} />
            )}
          </div>
        </div>
        <div className="stack gap-16">
          <Art src={q.image} note={q.photoNote || undefined} alt={q.photoNote ? `Photo: ${q.photoNote}` : ''} />
          <div className="p-flow-caption">
            <span className="ic" aria-hidden="true"><Icon name={q.captionIcon} size={20} /></span>
            <span>{q.caption}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
