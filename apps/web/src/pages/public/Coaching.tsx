import type { CSSProperties } from 'react';
import type { Lesson, Plan, Rec, Stage } from '@shift/core';
import { useBranding, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Price, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { DiscoveryCta } from './components/DiscoveryCta';
import { Caps, LetterCircle, PageLoading, scrollToId, tone, useStages } from './components/shared';
import './public.css';

interface CoachingContent {
  title: string;
  subtitle: string;
  bullets: { text: string; icon: string }[];
  cta: string;
  packagesTitle: string;
  packagesSubtitle: string;
  frameworkTitle: string;
  frameworkBody: string;
  frameworkScript: string;
  packagesFooter: string;
  packagesFootnote: string;
  pricePlaceholder: string;
}

export default function Coaching() {
  const c = useContent<CoachingContent>('coaching');
  const plans = usePublicList('plans').data;
  const stages = useStages();
  const lessons = usePublicList('lessons').data;
  const branding = useBranding();
  if (!c || !plans || !stages || !lessons) return <PageLoading />;
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const rows = stages.length + 5; // header, stats, stages…, bonus, leave-with, price/CTA

  return (
    <>
      <section className="wrap section-sm">
        <div className="p-coach-hero">
          <div className="stack gap-16">
            <h1 className="h1">{c.title}</h1>
            <p className="lead">{c.subtitle}</p>
            <ul className="p-iconrows sage" style={{ gap: 10 }}>
              {c.bullets.map((b, i) => (
                <li key={i}>
                  <span className="p-iconrows-ic" aria-hidden="true"><Icon name={b.icon} size={20} /></span>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>
            <div><Button onClick={() => scrollToId('packages')} arrow>{c.cta}</Button></div>
          </div>
          <Art src="coaching" alt="A coaching conversation" />
        </div>
      </section>

      <section id="packages" className="section-sm bg-white" aria-labelledby="pk-title">
        <div className="wrap">
          <div className="p-pk-head" style={{ marginBottom: 28 }}>
            <div className="stack gap-8 center" style={{ gridColumn: '1 / -1' }}>
              <h2 id="pk-title" className="h1">{c.packagesTitle}</h2>
              <Caps>{c.packagesSubtitle}</Caps>
            </div>
          </div>
          <div className="p-pk" style={{ '--plans': plans.length, '--rows': rows } as CSSProperties}>
            <div className="p-pk-fw">
              {branding?.taglines.secondary && <div className="p-caps sm faint pre-line">{branding.taglines.secondary.split('. ').join('.\n')}</div>}
              <h3 className="serif">{c.frameworkTitle}</h3>
              <p className="muted">{c.frameworkBody}</p>
              <hr className="p-rule" />
              <p className="muted">{c.frameworkScript}</p>
            </div>
            {plans.map((p) => <PlanColumn key={p.id} plan={p} stages={stages} lessonById={lessonById} placeholder={c.pricePlaceholder} />)}
          </div>
          <div className="p-pk-foot">
            <Caps className="sm">{c.packagesFootnote}</Caps>
            <Script size={36}>{c.packagesFooter}</Script>
          </div>
        </div>
      </section>

      <DiscoveryCta />
    </>
  );
}

function PlanColumn({ plan: p, stages, lessonById, placeholder }: { plan: Rec<Plan>; stages: Rec<Stage>[]; lessonById: Map<string, Rec<Lesson>>; placeholder: string }) {
  return (
    <article className={`p-pk-col ${tone(p.color)} ${p.badge ? 'popular' : ''}`} aria-labelledby={`pk-${p.id}`}>
      <header className="p-pk-top">
        {p.badge && <span className="p-pk-badge">{p.badge}</span>}
        <Caps className="sm">{p.packageLabel}</Caps>
        <h3 id={`pk-${p.id}`} className="p-pk-name">{p.name}</h3>
        <div className="p-pk-sub">{p.subtitle}</div>
        <p className="p-pk-desc">{p.description}</p>
        <Art src={p.image} />
      </header>
      <div className="p-pk-stats">
        <div>
          <span className="p-pk-cal" aria-hidden="true"><Icon name="calendar" size={26} stroke={1.3} /><b>{p.sessions}</b></span>
          <span>{p.sessions} coaching sessions</span>
        </div>
        <div><Icon name="clock" size={24} stroke={1.3} /><span>{p.durationLabel} duration</span></div>
        <div><Icon name="user" size={24} stroke={1.3} /><span>{p.supportLabel}</span></div>
      </div>
      {stages.map((s) => {
        const ls = (p.coverage[s.id] ?? []).map((id) => lessonById.get(id)).filter(Boolean) as Rec<Lesson>[];
        const note = p.coverageNotes[s.id];
        return (
          <div key={s.id} className={`p-pk-row ${tone(s.color)}`}>
            <LetterCircle stage={s} />
            <span className="icon-circle" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
            <div>
              <h4 className="serif">{s.name}</h4>
              {ls.length === 1 ? (
                <>
                  <div className="lesson">{ls[0].shortTitle}</div>
                  {note && <div className="note">{note}</div>}
                </>
              ) : ls.length > 1 ? (
                <ul>{ls.map((l) => <li key={l.id}>{l.shortTitle}</li>)}</ul>
              ) : (
                note && <div className="note">{note}</div>
              )}
            </div>
          </div>
        );
      })}
      <div className="p-pk-bonus">
        <Caps className="sm">Bonus resource</Caps>
        <div>
          <Icon name="gift" size={26} stroke={1.3} />
          <div>
            <div className="serif" style={{ fontSize: 15.5, color: 'var(--ink)' }}>{p.bonus.title}</div>
            <div className="body-sm muted">{p.bonus.description}</div>
          </div>
        </div>
      </div>
      <div className="p-pk-leave">
        <Caps className="sm">You'll leave with…</Caps>
        <ul className="p-check">
          {p.leaveWith.map((x, i) => <li key={i}><Icon name="check" size={15} />{x}</li>)}
        </ul>
      </div>
      <div className="p-pk-cta">
        <div className="p-pk-price"><Price amount={p.price} placeholder={placeholder} /></div>
        <Button to={`/enrol?plan=${p.id}`} variant="light" arrow>Enrol in {p.name}</Button>
        <Button to="/discovery-call" variant="outline" className="p-pk-outline">Book a free discovery call</Button>
      </div>
    </article>
  );
}
