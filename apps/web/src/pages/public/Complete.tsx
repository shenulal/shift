import type { CSSProperties } from 'react';
import { useBranding } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { InfoHeader } from './components/InfoHeader';
import { Caps, CtaButton, IconStrip, PageLoading } from './components/shared';
import './public.css';

interface CompleteContent {
  title: string;
  subtitle: string;
  script: string;
  steps: { title: string; verb: string; text: string; icon: string; note: string }[];
  optionsTitle: string;
  optionsSubtitle: string;
  options: { title: string; text: string; cta: string; href: string; icon: string }[];
  quote: string;
  supportTitle: string;
  support: { text: string; icon: string }[];
  footer: string;
}

/** Placeholder photography per step (real photos are uploaded in Admin › Branding). */
const STEP_ART = ['notebook', 'stones', 'leaf-card', 'path-hills', 'vase-card', 'leaves'];
const NUM_COLORS = ['#5e6b5a', '#7f8f7b', '#8a7363', '#7f8f7b', '#5e6b5a', '#8a7363'];

export default function Complete() {
  const c = useContent<CompleteContent>('complete');
  const branding = useBranding();
  if (!c) return <PageLoading />;

  return (
    <>
      <InfoHeader title={c.title} subtitle={c.subtitle} script={c.script} art="signpost" artNote={c.subtitle.split(/[.?]\s*/).filter(Boolean).join(" · ")} />
      <section className="wrap" aria-label="Completion steps">
        <ol className="p-cols" style={{ '--n': c.steps.length, listStyle: 'none', padding: 0, margin: 0 } as CSSProperties}>
          {c.steps.map((s, i) => (
            <li key={i} className="p-col">
              <span className="p-col-num" style={{ background: NUM_COLORS[i % NUM_COLORS.length] }}>{i + 1}</span>
              <span className="p-col-ic" aria-hidden="true"><Icon name={s.icon} size={24} /></span>
              <h2 className="serif" style={{ fontSize: 20 }}>{s.title}</h2>
              <span className="verb">{s.verb}</span>
              <p className="txt">{s.text}</p>
              <Art src={STEP_ART[i % STEP_ART.length]} note={s.note || undefined} quote={s.note && !['notebook', 'leaf-card', 'vase-card'].includes(STEP_ART[i % STEP_ART.length]) ? s.note : undefined} quotePos="center" quoteSize={26} quoteDark className="p-col-note" style={{ marginTop: 'auto' }} />
              {i < c.steps.length - 1 && <Icon name="arrow-right" size={22} className="p-col-arrow" />}
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section-sm">
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))' }}>
          <div className="p-receive stack gap-16 p-span2">
            <div>
              <h2 className="p-caps" style={{ fontSize: 14 }}>{c.optionsTitle}</h2>
              <Caps className="sm faint">{c.optionsSubtitle}</Caps>
            </div>
            <div className="p-opts">
              {c.options.map((o, i) => (
                <div key={i} className="p-opt">
                  <Icon name={o.icon} size={30} stroke={1.3} />
                  <h3 className="h4">{o.title}</h3>
                  <p className="body-sm muted">{o.text}</p>
                  <CtaButton href={o.href} size="sm" caps>{o.cta}</CtaButton>
                </div>
              ))}
            </div>
          </div>
          <div className="p-panel-sage stack gap-16 center" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="leaf" size={36} style={{ color: 'var(--sage-deep)' }} />
            <p className="p-quote-serif" style={{ fontSize: 24 }}>“{c.quote}”</p>
            <Icon name="heart" size={18} />
            <Caps className="sm">{branding?.taglines.trio}</Caps>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 56 }} aria-labelledby="cc-support">
        <div className="p-receive stack gap-12">
          <h2 id="cc-support" className="p-caps center">{c.supportTitle}</h2>
          <IconStrip items={c.support} />
        </div>
        <div className="wrap-row between gap-12" style={{ marginTop: 24 }}>
          <Caps className="sm">{branding?.taglines.primary}</Caps>
          <Script size={30}>{c.footer}</Script>
        </div>
      </section>
    </>
  );
}
