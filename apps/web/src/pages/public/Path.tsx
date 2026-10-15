import { useState } from 'react';
import { usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Modal, Pill } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { CtaButton, PageLoading } from './components/shared';
import './public.css';

type PathKey = 'discover' | 'tools' | 'journey' | 'coaching';
interface PathContent {
  title: string;
  subtitle: string;
  options: { key: PathKey; title: string; tag: string; bullets: string[]; cta: string; href: string; image: string }[];
  quizTitle: string;
  quizBody: string;
  quizCta: string;
  quizResults: { path: PathKey; title: string; text: string }[];
}

const TAG_TONE: Record<string, 'rose' | 'sage' | 'taupe' | 'blush'> = { discover: 'rose', tools: 'blush', journey: 'rose', coaching: 'rose' };

export default function Path() {
  const c = useContent<PathContent>('path');
  const [quizOpen, setQuizOpen] = useState(false);
  if (!c) return <PageLoading />;

  return (
    <>
      <section className="wrap section-sm">
        <div className="p-center-col stack gap-12" style={{ marginBottom: 32 }}>
          <h1 className="h1">{c.title}</h1>
          <p className="lead">{c.subtitle}</p>
        </div>
        <div className="p-options">
          {c.options.map((o) => (
            <article key={o.key} className="p-option">
              <Art src={o.image} />
              <div className="p-option-body">
                <div className="wrap-row gap-12">
                  <h2 className="h3">{o.title}</h2>
                  <Pill tone={TAG_TONE[o.key] ?? 'rose'}>{o.tag}</Pill>
                </div>
                <ul className="p-check">
                  {o.bullets.map((b, i) => <li key={i}><Icon name="check" size={16} />{b}</li>)}
                </ul>
                <CtaButton href={o.href} arrow>{o.cta}</CtaButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 72 }}>
        <div className="p-quizcard">
          <span className="p-quizcard-leaf" aria-hidden="true"><Icon name="leaf" size={120} stroke={1} /></span>
          <h2 className="h2">{c.quizTitle}</h2>
          <p className="muted">{c.quizBody}</p>
          <Button arrow onClick={() => setQuizOpen(true)}>{c.quizCta}</Button>
        </div>
      </section>

      {quizOpen && <Quiz content={c} onClose={() => setQuizOpen(false)} />}
    </>
  );
}

function Quiz({ content: c, onClose }: { content: PathContent; onClose: () => void }) {
  const questions = usePublicList('quiz').data ?? [];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PathKey>>({});
  const done = questions.length > 0 && step >= questions.length;

  /** Most frequent path wins; ties go to the path chosen first in the quiz. */
  const result = (() => {
    const order = questions.map((q) => answers[q.id]).filter(Boolean) as PathKey[];
    const counts = new Map<PathKey, number>();
    order.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
    let best: PathKey | null = null;
    for (const p of order) if (!best || (counts.get(p) ?? 0) > (counts.get(best) ?? 0)) best = p;
    return best;
  })();
  const resultCopy = c.quizResults.find((r) => r.path === result);
  const resultOption = c.options.find((o) => o.key === result);
  const q = questions[step];

  return (
    <Modal
      open
      onClose={onClose}
      title={c.quizCta}
      footer={
        done ? (
          <>
            <Button variant="ghost" onClick={() => { setStep(0); setAnswers({}); }}>Start again</Button>
            {resultOption && <CtaButton href={resultOption.href} arrow>{resultOption.cta}</CtaButton>}
          </>
        ) : (
          <>
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
            <Button arrow disabled={!q || !answers[q.id]} onClick={() => setStep((s) => s + 1)}>{step === questions.length - 1 ? 'See my result' : 'Next'}</Button>
          </>
        )
      }
    >
      {!questions.length ? (
        <p className="muted">Loading…</p>
      ) : done ? (
        <div className="stack gap-12 center" style={{ alignItems: 'center' }} role="status">
          <span className="icon-circle sage lg"><Icon name="sparkle" size={28} /></span>
          <h3 className="h3">{resultCopy?.title ?? resultOption?.title}</h3>
          <p className="muted">{resultCopy?.text}</p>
        </div>
      ) : (
        <fieldset className="p-quiz-opts">
          <legend className="stack gap-4" style={{ marginBottom: 14 }}>
            <span className="p-caps sm">{step + 1} / {questions.length}</span>
            <span className="h4 serif">{q.question}</span>
          </legend>
          {q.options.map((o, i) => (
            <label key={i} className={`p-quiz-opt ${answers[q.id] === o.path ? 'on' : ''}`}>
              <input type="radio" name={`quiz-${q.id}`} checked={answers[q.id] === o.path} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.path }))} />
              {o.label}
            </label>
          ))}
        </fieldset>
      )}
    </Modal>
  );
}
