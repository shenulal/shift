import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Kicker, ProgressBar } from '@/ui/kit';
import { MetaRow, PageLoading, tone } from './components/ui';
import { useJourney } from './components/useJourney';
import './member.css';

interface JourneyContent {
  heroKicker: string;
  heroTitle: string;
  heroBody: string;
  heroMeta: { title: string; text: string; icon: string }[];
  heroCta: string;
  stagesTitle: string;
  stagesBody: string;
  blueprintTitle: string;
  blueprintBody: string;
  blueprintCta: string;
}

/** Renders the word "brighter" in the handwritten accent, as in the brand designs. */
export function ScriptAccent({ text, word = 'brighter' }: { text: string; word?: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const parts = line.split(new RegExp(`(${word})`, 'i'));
        const content: ReactNode = parts.map((p, k) => (p.toLowerCase() === word ? <span key={k} className="m-script-word">{p}</span> : <Fragment key={k}>{p}</Fragment>));
        return <Fragment key={i}>{content}{i < lines.length - 1 && <br />}</Fragment>;
      })}
    </>
  );
}

export default function JourneyHome() {
  const c = useContent<JourneyContent>('journey');
  const j = useJourney();
  if (!c || !j.ready) return <PageLoading />;
  const next = j.nextLesson;
  const started = j.progress.completed > 0 || j.work.length > 0;
  return (
    <div className="wrap m-page stack gap-32">
      <section className="m-jhero" aria-labelledby="jh-title">
        <div className="m-jhero-copy">
          <Kicker>{c.heroKicker}</Kicker>
          <h1 className="h-display" id="jh-title"><ScriptAccent text={c.heroTitle} /></h1>
          <p className="muted" style={{ maxWidth: 560 }}>{c.heroBody}</p>
          <MetaRow items={c.heroMeta.map((m) => ({ icon: m.icon, title: m.title, sub: m.text }))} />
          {j.hasJourney && (
            <div className="m-progress-row" aria-label="Journey progress">
              <ProgressBar pct={j.progress.pct} />
              <span>{j.progress.completed} of {j.progress.total} lessons completed</span>
            </div>
          )}
          <div className="wrap-row gap-12">
            {next ? (
              <Button size="lg" arrow to={`/app/lesson/${next.id}`}>{started ? `Continue: ${next.title}` : c.heroCta}</Button>
            ) : j.hasJourney ? (
              <Button size="lg" arrow to="/app/blueprint">{c.blueprintCta}</Button>
            ) : (
              <Button size="lg" arrow to="/journey">{c.heroCta}</Button>
            )}
          </div>
        </div>
        <Art src="journey" className="m-jhero-art" />
      </section>

      <section aria-labelledby="stages-title" className="stack gap-16">
        <div className="stack gap-4">
          <h2 className="h2" id="stages-title">{c.stagesTitle}</h2>
          <p className="muted">{c.stagesBody}</p>
        </div>
        <div className="m-stagecards">
          {j.stages.map((s) => {
            const ls = j.byStage[s.id] ?? [];
            const p = j.stageProgress(s.id);
            const bp = ls.find((l) => l.tool.kind === 'blueprint');
            return (
              <Link key={s.id} to={`/app/stage/${s.id}`} className={`m-stagecard ${tone(s.color)}`} aria-label={`${s.name}: ${p.done} of ${p.total} lessons completed`}>
                <Art src={s.image} className="m-stagecard-art" />
                <span className="m-stagecard-letter" aria-hidden="true">{s.letter}</span>
                <h3 className="h4">{s.name}</h3>
                <p className="body-sm">{s.journeyDescription}</p>
                <div className="m-stagecard-meta">
                  <span><Icon name="play" size={13} />{ls.length} lessons</span>
                  <span><Icon name="doc" size={13} />{bp ? bp.shortTitle : `${ls.length} practical tools`}</span>
                  {p.total > 0 && <span style={{ maxWidth: 'calc(100% - 44px)', display: 'flex', alignItems: 'center', gap: 8 }}><ProgressBar pct={p.pct} color="var(--t-strong)" /><small style={{ whiteSpace: 'nowrap' }}>{p.done}/{p.total}</small></span>}
                </div>
                <span className="m-stagecard-go" aria-hidden="true"><Icon name="arrow-right" size={16} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="m-banner" aria-labelledby="bp-title">
        <span className="m-banner-ic" aria-hidden="true"><Icon name="doc" size={24} /></span>
        <div className="grow stack gap-4" style={{ flex: '1 1 260px' }}>
          <h2 className="h4" id="bp-title">{c.blueprintTitle}</h2>
          <p className="body-sm muted">{c.blueprintBody}</p>
        </div>
        <Button to="/app/blueprint" arrow>{c.blueprintCta}</Button>
      </section>
    </div>
  );
}
