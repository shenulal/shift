import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Kicker, Modal, Price } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { PurchasePanel } from './components/PurchasePanel';
import { LetterCircle, PageLoading, scrollToId, tone, useLessonsByStage, useStages } from './components/shared';
import './public.css';

interface JourneyContent {
  title: string;
  subtitle: string;
  bullets: string[];
  quote: string;
  cta: string;
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

export default function JourneyPage() {
  const c = useContent<JourneyContent>('journey');
  const stages = useStages();
  const lessons = useLessonsByStage();
  const products = usePublicList('products').data;
  const { user } = useAuth();
  const [buyOpen, setBuyOpen] = useState(false);
  if (!c || !stages || !lessons) return <PageLoading />;

  const product = products?.find((p) => p.kind === 'journey');
  const hasAccess = !!user?.journeyAccess;
  const priced = !!product && product.price !== null;

  /** Primary CTA: members go to their journey; otherwise buy (if priced) or enquire. */
  const JourneyCta = ({ label, big }: { label: string; big?: boolean }) =>
    hasAccess ? (
      <Button to="/app/journey" size={big ? 'lg' : 'md'} arrow>{label}</Button>
    ) : priced ? (
      <Button size={big ? 'lg' : 'md'} arrow onClick={() => setBuyOpen(true)}>{label} · <Price amount={product!.price} /></Button>
    ) : (
      <Button to="/enquiry" size={big ? 'lg' : 'md'} arrow>Enquire about {product?.name ?? c.heroKicker}</Button>
    );

  return (
    <>
      <section className="wrap section-sm">
        <div className="p-center-col stack gap-16">
          <h1 className="h1">{c.title}</h1>
          <p className="lead">{c.subtitle}</p>
        </div>
        <ul className="p-stage-circles" style={{ marginTop: 28 }} aria-label="The five SHIFT stages">
          {stages.map((s) => (
            <li key={s.id}>
              <LetterCircle stage={s} size="lg" />
              <span>{s.name}</span>
            </li>
          ))}
        </ul>
        <div className="split" style={{ marginTop: 36, alignItems: 'center' }}>
          <ul className="p-check" style={{ gap: 12 }}>
            {c.bullets.map((b, i) => <li key={i} style={{ fontSize: 15.5 }}><Icon name="check" size={16} />{b}</li>)}
          </ul>
          <div className="stack gap-16" style={{ alignItems: 'center' }}>
            <Art src="path-sea" quote={c.quote} quotePos="br" quoteSize={34} className="rounded-lg ratio-16x9" style={{ width: '100%' }} />
            <Button onClick={() => scrollToId('journey-hero')} arrow>{c.cta}</Button>
          </div>
        </div>
      </section>

      <section id="journey-hero" className="wrap section-sm" aria-labelledby="jh-title">
        <div className="p-jhero">
          <div className="p-jhero-copy">
            <Kicker>{c.heroKicker}</Kicker>
            <h2 id="jh-title" className="h-display pre-line">{c.heroTitle}</h2>
            <p className="muted">{c.heroBody}</p>
            <div className="p-jmeta">
              {c.heroMeta.map((m, i) => (
                <div key={i}>
                  <span className="ic" aria-hidden="true"><Icon name={m.icon} size={16} /></span>
                  <span>{m.title}<br /><span className="muted">{m.text}</span></span>
                </div>
              ))}
            </div>
            <div><JourneyCta label={c.heroCta} big /></div>
            {product?.note && <p className="body-sm faint">{product.note}</p>}
          </div>
          <Art src="journey" />
        </div>
      </section>

      <section className="wrap section-sm" aria-labelledby="stages-title" style={{ paddingTop: 0 }}>
        <h2 id="stages-title" className="h2">{c.stagesTitle}</h2>
        <p className="muted" style={{ margin: '6px 0 20px' }}>{c.stagesBody}</p>
        <div className="p-jstages">
          {stages.map((s) => {
            const ls = lessons[s.id] ?? [];
            const tools = ls.filter((l) => l.tool.kind !== 'blueprint').length;
            const blueprint = ls.find((l) => l.tool.kind === 'blueprint');
            return (
              <article key={s.id} className={`p-jstage ${tone(s.color)}`}>
                <Art src={s.image} />
                <span className="p-jstage-letter" aria-hidden="true">{s.letter}</span>
                <h3 className="h4">{s.name}</h3>
                <p className="body-sm">{s.journeyDescription}</p>
                <div className="p-jstage-meta">
                  <span><Icon name="play" size={12} />{ls.length} lessons</span>
                  {blueprint ? <span><Icon name="doc" size={12} />{blueprint.shortTitle}</span> : <span><Icon name="doc" size={12} />{tools} practical tools</span>}
                </div>
                {hasAccess && (
                  <Link to={`/app/stage/${s.id}`} className="p-jstage-go" aria-label={`Open ${s.name}`}><Icon name="arrow-right" size={16} /></Link>
                )}
              </article>
            );
          })}
        </div>
        <div className="p-blueprint" style={{ marginTop: 20 }}>
          <span className="ic" aria-hidden="true"><Icon name="doc" size={24} /></span>
          <div className="grow stack gap-4" style={{ flex: '1 1 260px' }}>
            <h3 className="h4">{c.blueprintTitle}</h3>
            <p className="body-sm muted">{c.blueprintBody}</p>
          </div>
          {hasAccess ? <Button to="/app/blueprint" arrow>{c.blueprintCta}</Button> : <JourneyCta label={c.heroCta} />}
        </div>
      </section>

      {buyOpen && product && (
        <Modal open onClose={() => setBuyOpen(false)} title={product.name}>
          <div className="stack gap-16">
            <p className="muted">{product.description}</p>
            <PurchasePanel kind="journey" amount={product.price} label={product.name} ctaLabel={c.heroCta} />
          </div>
        </Modal>
      )}
    </>
  );
}
