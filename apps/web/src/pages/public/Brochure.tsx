import { canPrint, HOSTED_NOTE } from '@/lib/env';
import type { CSSProperties, ReactNode } from 'react';
import { useBranding, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Logo } from '@/ui/Logo';
import { PageLoading, tone, useStages } from './components/shared';
import './public.css';

interface BrochureContent {
  cover: { kicker: string; lines: string[]; script: string; pillars: string[]; footer: string };
  app: { kicker: string; title: string; body: string; features: { text: string; icon: string }[]; footer: string; phoneQuote: string };
  paths: { kicker: string; title: string; body: string; footer: string };
  close: { quote: string; title: string; body: string; cta: string; footer: string[] };
}

/** Line icons for the brochure's pillar / closing rows (pure decoration, matched by position). */
const PILLAR_ICONS = ['brain', 'heart', 'target', 'sprout'];
const CLOSE_ICONS = ['sprout', 'target', 'heart'];

function Page({ n, children, className = '', style }: { n: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className="p-bro-page" style={style} aria-label={`Brochure page ${n}`}>
      <div className={`p-bro-in ${className}`}>
        {children}
        <div className="p-bro-num">PAGE {n}</div>
      </div>
    </section>
  );
}

export default function Brochure() {
  const b = useContent<BrochureContent>('brochure');
  const about = useContent<Record<string, any>>('about');
  const method = useContent<Record<string, any>>('method');
  const plans = usePublicList('plans').data;
  const stages = useStages();
  const branding = useBranding();
  if (!b || !about || !method || !plans || !stages) return <PageLoading />;

  return (
    <div className="wrap section-sm p-bro-shell">
      <div className="wrap-row between gap-16 no-print" style={{ marginBottom: 24 }}>
        <div className="stack gap-4">
          <h1 className="h2">{branding?.wordmark} brochure</h1>
          <p className="muted body-sm">Eight pages, always in sync with your plans and content.</p>
        </div>
        {canPrint ? <Button icon="print" onClick={() => window.print()}>Print / Save as PDF</Button> : <span className="body-sm muted" style={{ maxWidth: 360 }}>{HOSTED_NOTE}</span>}
      </div>

      <div className="p-bro-grid">
        {/* 1 — Cover */}
        <Page n={1} className="p-bro-cover">
          <div className="p-bro-pad p-bro-cover" style={{ paddingBottom: '3cqw' }}>
            <div className="p-bro-kicker" style={{ fontSize: '0.62em' }}>{b.cover.kicker}</div>
            <Icon name="leaf" size={48} stroke={1.2} style={{ width: '14cqw', height: '14cqw', margin: '3cqw auto 0', color: 'var(--sage-deep)' }} />
            <div className="p-bro-logo">{branding?.wordmark}</div>
            <div className="p-bro-lines">{b.cover.lines.map((l) => <div key={l}>{l}</div>)}</div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
            <Art src="brochureCover" style={{ flex: 1 }} />
            <Script className="p-bro-cover-script" style={{ position: 'absolute', right: '6cqw', bottom: '5cqw', color: '#fff', fontSize: '2.2em', textAlign: 'right', maxWidth: '60%' }}>{b.cover.script}</Script>
          </div>
          <div className="p-bro-pillars">
            {b.cover.pillars.map((p, i) => (
              <div key={p}><Icon name={PILLAR_ICONS[i % PILLAR_ICONS.length]} stroke={1.3} />{p}</div>
            ))}
          </div>
          <div className="p-bro-foot" style={{ paddingBottom: '8cqw' }}>{b.cover.footer}</div>
        </Page>

        {/* 2 — Meet Edel */}
        <Page n={2}>
          <div className="p-bro-pad" style={{ flex: 1, minHeight: 0, paddingBottom: '9cqw' }}>
            <div className="p-bro-kicker">{about.storyKicker}</div>
            <h2>{about.storyTitle}</h2>
            <div className="p-bro-two">
              <div className="stack" style={{ gap: '1.6cqw', fontSize: '0.74em' }}>
                {(about.story as string[]).map((p, i) => <p key={i}>{p}</p>)}
                <p className="italic serif" style={{ marginTop: '1cqw' }}>“{about.quote}”</p>
                <p className="p-bro-kicker">— {about.quoteBy}</p>
              </div>
              <div className="stack" style={{ gap: '2cqw', minHeight: 0 }}>
                <Art src="about" style={{ aspectRatio: '3 / 2.8', borderRadius: '1cqw', flex: 'none' }} />
                <div className="p-bro-side">
                  <div className="p-bro-kicker" style={{ fontSize: '0.8em' }}>{about.numbersTitle}</div>
                  {(about.numbers as { value: string; label: string }[]).map((x) => (
                    <div key={x.value}><strong>{x.value}</strong>{x.label}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Page>

        {/* 3 — Why neuroscience */}
        <Page n={3}>
          <div className="p-bro-pad" style={{ paddingRight: '38cqw' }}>
            <div className="p-bro-kicker">{method.whyKicker}</div>
            <h2>{(method.whyTitle as string).split('. ').join('.\n')}</h2>
            <p style={{ fontSize: '0.86em', whiteSpace: 'pre-line' }}>{method.whyBody}</p>
            <ul className="p-bro-list" style={{ fontSize: '0.86em' }}>
              {(method.whyBullets as { text: string; icon: string }[]).map((x) => (
                <li key={x.text}><span className="p-bro-ic"><Icon name={x.icon} /></span>{x.text}</li>
              ))}
            </ul>
          </div>
          <div className="p-bro-pad" style={{ marginTop: 'auto', paddingBottom: '10cqw', paddingRight: '36cqw' }}>
            <p className="serif italic" style={{ fontSize: '1.15em' }}>“{method.whyQuote}”</p>
          </div>
          <div className="p-bro-stones"><Art src="stones-words" note="Awareness · Choice · Freedom" /></div>
        </Page>

        {/* 4 — The SHIFT Method */}
        <Page n={4}>
          <div className="p-bro-pad" style={{ flex: 1, paddingBottom: '12cqw' }}>
            <div className="p-bro-kicker">{(method.title as string).replace(/\.$/, '')}™</div>
            <h2>{method.frameworkTitle}</h2>
            <p style={{ fontSize: '0.8em' }}>{method.frameworkBody}</p>
            <ul className="p-bro-list" style={{ gap: '2cqw' }}>
              {stages.map((s) => (
                <li key={s.id} style={{ alignItems: 'flex-start' }}>
                  <span className="p-bro-letter">{s.letter}</span>
                  <span>
                    <span className="p-bro-kicker" style={{ color: 'var(--ink)', display: 'block' }}>{s.name}</span>
                    <span style={{ fontSize: '0.74em' }}>{s.brochureDescription}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Script style={{ marginTop: 'auto', fontSize: '1.8em' }}>{method.frameworkScript}</Script>
          </div>
        </Page>

        {/* 5 — Coaching in your pocket */}
        <Page n={5}>
          <div className="p-bro-pad">
            <div className="p-bro-kicker">{b.app.kicker}</div>
            <h2>{b.app.title}</h2>
            <p style={{ fontSize: '0.9em' }}>{b.app.body}</p>
          </div>
          <div style={{ display: 'flex', gap: '4cqw', padding: '4cqw 6cqw 0', alignItems: 'flex-start' }}>
            <div className="p-bro-phone" aria-hidden="true">
              <div className="p-bro-screen">
                <Logo size={14} center />
                <span>{branding?.taglines.trio}</span>
                <ul>
                  {stages.map((s) => (
                    <li key={s.id}><Icon name={s.icon} />{s.name}</li>
                  ))}
                </ul>
                <Art src="mountains" />
                <span className="italic serif" style={{ fontSize: '1.1em' }}>“{b.app.phoneQuote}”</span>
              </div>
            </div>
            <ul className="p-bro-list" style={{ fontSize: '0.8em', gap: '2.2cqw', flex: 1 }}>
              {b.app.features.map((f) => (
                <li key={f.text}><Icon name={f.icon} style={{ width: '6cqw', height: '6cqw', flex: 'none' }} stroke={1.3} />{f.text}</li>
              ))}
            </ul>
          </div>
          <div className="p-bro-foot" style={{ marginTop: 'auto', paddingBottom: '9cqw', textTransform: 'none', letterSpacing: 0, fontSize: '0.78em' }}>{b.app.footer}</div>
        </Page>

        {/* 6 — Choose the path (from Plans & Pricing) */}
        <Page n={6}>
          <div className="p-bro-pad" style={{ paddingBottom: '3cqw' }}>
            <div className="p-bro-kicker">{b.paths.kicker}</div>
            <h2>{b.paths.title}</h2>
            <p style={{ fontSize: '0.86em' }}>{b.paths.body}</p>
          </div>
          <div className="p-bro-paths" style={{ '--n': plans.length } as CSSProperties}>
            {plans.map((p) => (
              <div key={p.id} className={`p-bro-path ${tone(p.color)}`}>
                <Art src={p.image} />
                <div className="p-bro-path-body">
                  <div className="alias">{p.displayAlias.split(' ').map((w) => <div key={w}>{w}</div>)}</div>
                  <div style={{ letterSpacing: '0.16em', textTransform: 'uppercase' }}>{p.durationLabel}</div>
                  <div style={{ letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{p.aliasTagline}</div>
                  <ul>
                    <li><Icon name="check" />{p.sessions} coaching sessions</li>
                    {p.features.slice(1, 3).map((f) => <li key={f}><Icon name="check" />{f}</li>)}
                  </ul>
                  <div className="p-bro-path-btn">{p.badge || p.scriptLine}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-bro-foot" style={{ paddingBottom: '9cqw', paddingTop: '3cqw' }}>{b.paths.footer}</div>
        </Page>

        {/* 7 — Real people */}
        <Page n={7}>
          <div className="p-bro-pad">
            <div className="p-bro-kicker">Who it's for</div>
            <h2>{(about.whoTitle as string).split('. ').join('.\n')}</h2>
            <p style={{ fontSize: '0.86em' }}>{about.whoBody}</p>
          </div>
          <div className="p-bro-who" style={{ margin: '3cqw 5cqw' }}>
            {(about.who as { title: string; icon: string }[]).map((w) => (
              <div key={w.title}><Icon name={w.icon} stroke={1.2} />{w.title}</div>
            ))}
          </div>
          <div className="p-bro-outcomes" style={{ marginBottom: '10cqw' }}>
            <div className="p-bro-kicker" style={{ color: '#fff' }}>{about.outcomesTitle}</div>
            <ul>{(about.outcomes as string[]).map((o) => <li key={o}><Icon name="check" />{o}</li>)}</ul>
          </div>
        </Page>

        {/* 8 — Close */}
        <Page n={8}>
          <div className="p-bro-close-art">
            <Art src="sunrise" />
            <Script>{b.close.quote}</Script>
          </div>
          <div className="p-bro-close">
            <h2>{b.close.title}</h2>
            <p style={{ fontSize: '0.86em' }}>{b.close.body}</p>
            <Button to="/discovery-call" caps>{b.close.cta}<Icon name="chevron-right" size={14} /></Button>
          </div>
          <div className="p-bro-trio">
            {b.close.footer.map((f, i) => (
              <div key={f}><Icon name={CLOSE_ICONS[i % CLOSE_ICONS.length]} stroke={1.3} />{f}</div>
            ))}
          </div>
        </Page>
      </div>
    </div>
  );
}
