import { useBranding } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Kicker } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { DiscoveryCta } from './components/DiscoveryCta';
import { PageLoading, scrollToId, tone } from './components/shared';
import './public.css';

interface AboutContent {
  title: string;
  subtitle: string;
  paragraphs: string[];
  quote: string;
  quoteBy: string;
  cta: string;
  storyKicker: string;
  storyTitle: string;
  story: string[];
  numbersTitle: string;
  numbers: { value: string; label: string }[];
  purposeTitle: string;
  purpose: string;
  approachTitle: string;
  approach: { title: string; icon: string }[];
  valuesTitle: string;
  values: { title: string; icon: string }[];
  words: string[];
  whoTitle: string;
  whoBody: string;
  who: { title: string; icon: string }[];
  outcomesTitle: string;
  outcomes: string[];
}

/** Brand-board value circles cycle through the palette. */
const VALUE_TONES = ['sage', 'blush', 'sage', 'peach', 'sage'];

export default function About() {
  const c = useContent<AboutContent>('about');
  const branding = useBranding();
  if (!c) return <PageLoading />;

  return (
    <>
      <section className="wrap section-sm">
        <div className="p-center-col stack gap-12" style={{ marginBottom: 32 }}>
          <h1 className="h1">{c.title}</h1>
          <p className="lead">{c.subtitle}</p>
        </div>
        <div className="split" style={{ alignItems: 'center' }}>
          <Art src="about" alt="Edel, founder of SHIFT Coaching" className="rounded-lg ratio-4x3" />
          <div className="stack gap-16">
            {c.paragraphs.map((p, i) => <p key={i} className="muted" style={{ fontSize: 15.5 }}>{p}</p>)}
            <figure className="p-quote-card" style={{ margin: 0 }}>
              <blockquote className="p-quote-serif" style={{ margin: 0 }}>“{c.quote}”</blockquote>
              <figcaption className="p-caps">— {c.quoteBy}</figcaption>
            </figure>
            <div>
              <Button onClick={() => scrollToId('story')} arrow>{c.cta}</Button>
            </div>
          </div>
        </div>
      </section>

      <section id="story" className="section-sm bg-white" aria-labelledby="story-title">
        <div className="wrap" style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', alignItems: 'start' }}>
          <div className="stack gap-16">
            <Kicker>{c.storyKicker}</Kicker>
            <h2 id="story-title" className="h1">{c.storyTitle}</h2>
            {c.story.map((p, i) => <p key={i} className="muted">{p}</p>)}
          </div>
          <Art src="portrait" className="rounded-lg ratio-3x4" />
          <aside className="p-panel-sage stack gap-16" aria-labelledby="numbers-title">
            <h3 id="numbers-title" className="p-caps">{c.numbersTitle}</h3>
            <ul className="p-numbers">
              {c.numbers.map((n, i) => (
                <li key={i}>
                  <strong>{n.value}</strong>
                  <span className="body-sm muted">{n.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="wrap section-sm" aria-label={c.purposeTitle}>
        <div className="grid-3" style={{ alignItems: 'stretch' }}>
          <div className="p-panel stack gap-12">
            <h2 className="p-caps">{c.purposeTitle}</h2>
            <p className="serif" style={{ fontSize: 22, lineHeight: 1.35, color: 'var(--ink)' }}>{c.purpose}</p>
          </div>
          <div className="p-panel stack gap-16">
            <h2 className="p-caps">{c.approachTitle}</h2>
            <div className="p-approach">
              {c.approach.map((a, i) => (
                <div key={i}>
                  <Icon name={a.icon} size={36} stroke={1.3} />
                  <span>{a.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-panel stack gap-16">
            <h2 className="p-caps">{c.valuesTitle}</h2>
            <div className="p-values">
              {c.values.map((v, i) => (
                <div key={i} className={tone(VALUE_TONES[i % VALUE_TONES.length])}>
                  <span className="p-val-ic p-tone-soft" aria-hidden="true"><Icon name={v.icon} size={26} /></span>
                  <span>{v.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section-sm" aria-labelledby="who-title">
        <div className="split">
          <div className="stack gap-20">
            <h2 id="who-title" className="h1">{c.whoTitle}</h2>
            <p className="muted">{c.whoBody}</p>
            <div className="p-who">
              {c.who.map((w, i) => (
                <div key={i}>
                  <Icon name={w.icon} size={30} stroke={1.3} />
                  <span>{w.title}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="stack gap-16">
            <div className="p-words" aria-label="What SHIFT brings">
              {c.words.map((w) => <span key={w}>{w}</span>)}
              {branding?.taglines.tertiary && <p className="p-quote-serif" style={{ color: '#fff', marginTop: 12 }}>{branding.taglines.tertiary}</p>}
            </div>
            <div className="p-outcomes stack gap-12">
              <h3 className="p-caps">{c.outcomesTitle}</h3>
              <ul className="p-check">
                {c.outcomes.map((o, i) => (
                  <li key={i}><Icon name="check" size={16} />{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <DiscoveryCta />
    </>
  );
}
