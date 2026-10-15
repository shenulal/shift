import type { CSSProperties } from 'react';
import { useBranding } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { InfoHeader } from './components/InfoHeader';
import { Caps, IconStrip, PageLoading, tone, useStages } from './components/shared';
import './public.css';

interface Phase { title: string; verb: string; text: string; bullets: string[]; footer: string; image: string }
interface ProcessContent {
  title: string;
  subtitle: string;
  subtitle2: string;
  script: string;
  discovery: Phase;
  onboard: Phase;
  supportTitle: string;
  supportSubtitle: string;
  support: { text: string; icon: string }[];
  takeawayTitle: string;
  takeaway: { text: string; icon: string }[];
  quote: string;
  imageQuote: string;
  footer: string;
}

interface Column { key: string; badge: string; solid?: string; icon: string; title: string; verb: string; text: string; image: string; bullets: string[]; footer: string }

export default function Process() {
  const c = useContent<ProcessContent>('process');
  const stages = useStages();
  const branding = useBranding();
  if (!c || !stages) return <PageLoading />;

  const cols: Column[] = [
    { key: 'discovery', badge: '1', icon: 'chat', ...c.discovery },
    { key: 'onboard', badge: '2', icon: 'clipboard', ...c.onboard },
    ...stages.map((s) => ({ key: s.id, badge: s.letter, solid: s.color, icon: s.icon, title: s.name, verb: s.coachingVerb, text: s.coachingDescription, image: s.image, bullets: s.coachingBullets, footer: s.sessionsLabel })),
  ];

  return (
    <>
      <InfoHeader title={c.title} subtitle={c.subtitle} subtitle2={c.subtitle2} script={c.script} art="mug" artNote={branding?.taglines.primary.replace(/\. /g, '. · ')} />
      <section className="wrap" aria-label="Coaching process steps">
        <ol className="p-cols" style={{ '--n': cols.length, listStyle: 'none', padding: 0, margin: 0 } as CSSProperties}>
          {cols.map((col, i) => (
            <li key={col.key} className={`p-col ${col.solid ? tone(col.solid) : ''}`}>
              <span className="p-col-num" style={col.solid ? { background: 'var(--t-strong)' } : { background: '#7f8f7b' }}>{col.badge}</span>
              <span className="p-col-ic" aria-hidden="true"><Icon name={col.icon} size={24} /></span>
              <h2 className="serif" style={{ fontSize: 20 }}>{col.title}</h2>
              <span className="verb">{col.verb}</span>
              <p className="txt">{col.text}</p>
              <Art src={col.image} />
              <ul className="p-check">{col.bullets.map((b, j) => <li key={j}><Icon name="check" size={16} />{b}</li>)}</ul>
              <span className="p-col-pill">{col.footer}</span>
              {i < cols.length - 1 && <Icon name="arrow-right" size={22} className="p-col-arrow" />}
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section-sm" style={{ paddingBottom: 0 }} aria-labelledby="pr-support">
        <div className="p-receive stack gap-12">
          <div className="center">
            <h2 id="pr-support" className="p-caps">{c.supportTitle}</h2>
            <Caps className="sm faint">{c.supportSubtitle}</Caps>
          </div>
          <IconStrip items={c.support} />
        </div>
      </section>

      <section className="wrap section-sm">
        <div className="p-trio">
          <div className="p-quotepanel">
            <span className="leaf-bg" aria-hidden="true"><Icon name="leaf" size={160} stroke={0.8} /></span>
            <Script size={34}>{c.quote}</Script>
            <Icon name="heart" size={18} />
          </div>
          <div className="p-panel stack gap-16" style={{ justifyContent: 'center' }}>
            <h2 className="p-caps center">{c.takeawayTitle}</h2>
            <div className="wrap-row gap-16" style={{ justifyContent: 'center' }}>
              {c.takeaway.map((t, i) => (
                <div key={i} className="stack gap-8 center" style={{ alignItems: 'center', width: 90, fontSize: 13 }}>
                  <span className="icon-circle cream" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
                  {t.text}
                </div>
              ))}
            </div>
            <Caps className="sm center">{branding?.taglines.trio}</Caps>
          </div>
          <Art src="coast" quote={c.imageQuote} quotePos="br" quoteSize={28} />
        </div>
        <div className="center stack gap-16" style={{ marginTop: 28, alignItems: 'center' }}>
          <Caps className="sm">{c.footer}</Caps>
          <div className="wrap-row gap-12" style={{ justifyContent: 'center' }}>
            <Button to="/discovery-call" arrow>{c.discovery.footer.split('·')[0].trim()}</Button>
            <Button to="/coaching" variant="ghost" arrow>{c.onboard.bullets[2]}</Button>
          </div>
        </div>
      </section>
    </>
  );
}
