import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Kicker, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { DiscoveryCta } from './components/DiscoveryCta';
import { LetterCircle, PageLoading, scrollToId, useStages } from './components/shared';
import './public.css';

interface MethodContent {
  title: string;
  subtitle: string;
  body: string;
  quote: string;
  cta: string;
  whyTitle: string;
  whyKicker: string;
  whyBody: string;
  whyBullets: { text: string; icon: string }[];
  whyQuote: string;
  frameworkTitle: string;
  frameworkBody: string;
  frameworkScript: string;
}

export default function Method() {
  const c = useContent<MethodContent>('method');
  const stages = useStages();
  if (!c || !stages) return <PageLoading />;
  const [whyIntro, ...whyRest] = c.whyBody.split('\n');

  return (
    <>
      <section className="wrap section-sm">
        <div className="p-center-col stack gap-16">
          <h1 className="h1">{c.title}</h1>
          <p className="lead">{c.subtitle}</p>
          <p className="muted">{c.body}</p>
        </div>
        <div className="split" style={{ marginTop: 40, alignItems: 'center' }}>
          <ul className="p-method-rows" aria-label="The five SHIFT stages">
            {stages.map((s) => (
              <li key={s.id}>
                <LetterCircle stage={s} size="lg" />
                <div>
                  <h3 className="serif">{s.name}</h3>
                  <p className="muted body-sm" style={{ fontSize: 14 }}>{s.methodDescription}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="stack gap-16">
            <Art src="method" quote={c.quote} quotePos="br" quoteSize={34} className="rounded-lg ratio-4x3" />
            <div className="center">
              <Button onClick={() => scrollToId('why')} arrow>{c.cta}</Button>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="section-sm bg-white" aria-labelledby="why-title">
        <div className="wrap split" style={{ alignItems: 'center' }}>
          <div className="stack gap-16">
            <Kicker>{c.whyKicker}</Kicker>
            <h2 id="why-title" className="h1">{c.whyTitle}</h2>
            <p className="muted">{whyIntro}</p>
            {whyRest.length > 0 && <p className="muted">{whyRest.join(' ')}</p>}
            <ul className="p-why-list">
              {c.whyBullets.map((b, i) => (
                <li key={i}>
                  <span className="p-iconrows-ic" aria-hidden="true"><Icon name={b.icon} size={22} /></span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <hr className="p-rule" />
            <p className="p-quote-serif">“{c.whyQuote}”</p>
          </div>
          <Art src="stones-words" note="Awareness · Choice · Freedom" className="rounded-lg ratio-3x4" style={{ maxHeight: 560 }} />
        </div>
      </section>

      <section id="framework" className="wrap section-sm" aria-labelledby="fw-title">
        <div className="split" style={{ alignItems: 'center' }}>
          <div className="stack gap-16">
            <Kicker>{c.title.replace(/\.$/, '')}</Kicker>
            <h2 id="fw-title" className="h1">{c.frameworkTitle}</h2>
            <p className="muted">{c.frameworkBody}</p>
            <Script size={40} style={{ marginTop: 8 }}>{c.frameworkScript}</Script>
          </div>
          <ul className="p-method-rows p-framework">
            {stages.map((s) => (
              <li key={s.id}>
                <LetterCircle stage={s} size="lg" solid />
                <div>
                  <div className="p-caps">{s.name}</div>
                  <p className="muted" style={{ fontSize: 14 }}>{s.brochureDescription}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DiscoveryCta />
    </>
  );
}
