import { fillTemplate } from '@shift/core';
import { Radar } from '@/ui/charts';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Ring, Script } from '@/ui/kit';
import { Logo } from '@/ui/Logo';
import type { BlueprintData } from './blueprint';
import { Leaf, tone } from './ui';

export const VALUE_ICONS = ['heart', 'leaf', 'people', 'sun', 'star', 'compass', 'mountain', 'sprout'];
const WORK_ICONS: Record<string, string> = { mindset: 'brain', regulation: 'leaf', habitsRoutine: 'calendar', planning: 'target' };
export const workIcon = (key: string, i: number) => WORK_ICONS[key] ?? VALUE_ICONS[i % VALUE_ICONS.length];

function PageFrame({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="m-bp-pagewrap">
      {label && <div className="m-bp-label">{label}</div>}
      <article className="m-bp-page">{children}</article>
    </div>
  );
}

/** On-screen (and printable) preview of the four Blueprint pages. */
export function BlueprintPages({ d, script, heroImage = 'sunset-sea' }: { d: BlueprintData; script?: string; heroImage?: string }) {
  const p1 = d.page('p1');
  const p2 = d.page('p2');
  const p3 = d.page('p3');
  const p4 = d.page('p4');
  const s = d.section;
  const ring = (key: string, pct: number, vars: Record<string, number>) => (
    <div>
      <strong className="serif" style={{ fontSize: 14 }}>{s('p3', key).title}</strong>
      <Ring pct={pct} size={88} stroke={9} />
      <span className="muted">{fillTemplate(s('p3', key).subtitle, vars)}</span>
    </div>
  );
  return (
    <div className="m-bp-pages">
      {p1 && (
        <PageFrame label={p1.label}>
          <Leaf className="m-bp-leaf" size={48} />
          {script && <Script size={24} className="m-bp-script">{script}</Script>}
          <div className="stack gap-4">
            <Logo size={20} />
            <h2 className="serif m-bp-title">{p1.title}</h2>
            <p className="body-sm muted">{p1.subtitle}</p>
          </div>
          <Art src={heroImage} className="rounded ratio-16x9" style={{ aspectRatio: '2.6 / 1' }} />
          <div className="m-bp-grid2">
            <div className="m-bp-box">
              <span className="m-bp-h">{s('p1', 'futureSelf').title}</span>
              <p className="m-bp-quote">“{d.statement}”</p>
            </div>
            <div className="m-bp-box">
              <span className="m-bp-h">{s('p1', 'qualities').title}</span>
              <div className="m-bp-icons">
                {d.qualities.map((q, i) => <span key={q.name}><span className={`icon-circle ${['sage', '', 'cream', 'white'][i % 4]}`}><Icon name={q.icon} size={18} /></span>{q.name}</span>)}
              </div>
            </div>
            <div className="m-bp-box">
              <span className="m-bp-h">{s('p1', 'values').title}</span>
              <div className="m-bp-icons">
                {d.values.map((v, i) => <span key={v}><span className={`icon-circle ${['', 'sage', 'cream', 'white'][i % 4]}`}><Icon name={VALUE_ICONS[i % VALUE_ICONS.length]} size={18} /></span>{v}</span>)}
              </div>
            </div>
            <div className="m-bp-box">
              <span className="m-bp-h">{s('p1', 'priorities').title}</span>
              <ol className="m-top3">
                {d.priorities.map((p, i) => <li key={p.id} className="body-sm"><span className="num" style={{ width: 24, height: 24, fontSize: 13 }}>{i + 1}</span>{p.name}</li>)}
              </ol>
            </div>
          </div>
        </PageFrame>
      )}
      {p2 && (
        <PageFrame label={p2.label}>
          <Leaf className="m-bp-leaf" size={48} />
          <div className="stack gap-4">
            <Logo size={20} />
            <h2 className="serif m-bp-title">{p2.title}</h2>
            <p className="body-sm muted">{p2.subtitle}</p>
          </div>
          <div className="stack gap-8">
            {d.learnings.map((l) => (
              <div key={l.stageId} className="m-bp-learn">
                <span className={`m-bp-letter ${tone(l.color)}`}>{l.letter}</span>
                <div style={{ minWidth: 0 }}>
                  <strong className="serif" style={{ fontSize: 14 }}>{l.name}</strong>
                  {l.subtitle && <div className="body-sm muted" style={{ fontSize: 11.5 }}>{l.subtitle}</div>}
                  <ul>{l.bullets.length ? l.bullets.map((b, i) => <li key={i}>{b}</li>) : <li className="muted">—</li>}</ul>
                </div>
                <Art src={l.image} />
              </div>
            ))}
          </div>
        </PageFrame>
      )}
      {p3 && (
        <PageFrame label={p3.label}>
          <Leaf className="m-bp-leaf" size={48} />
          <div className="stack gap-4">
            <Logo size={20} />
            <h2 className="serif m-bp-title">{p3.title}</h2>
            <p className="body-sm muted">{p3.subtitle}</p>
          </div>
          <div className="m-bp-rings">
            {ring('goal', d.goalPct, { goal: d.goalPct })}
            {ring('habits', d.habitsPct, { habits: d.habitsPct })}
            {ring('alignment', d.align.now, { alignment: d.align.now })}
          </div>
          <div className="m-bp-box" style={{ flex: 1 }}>
            <span className="m-bp-h">{s('p3', 'wheel').title}</span>
            <span className="body-sm muted" style={{ fontSize: 11.5 }}>{s('p3', 'wheel').subtitle}</span>
            {d.wheelStart ? (
              <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
                <Radar axes={d.areas.map((a) => ({ id: a.id, label: a.name }))} size={240} series={[
                  { label: 'Start', values: d.wheelStart.scores, color: '#d29b94', fill: 'rgba(210,155,148,.12)' },
                  ...(d.wheelNow ? [{ label: 'Now', values: d.wheelNow.scores, color: '#2e3b32', fill: 'rgba(148,165,140,.28)' }] : []),
                ]} />
              </div>
            ) : <p className="body-sm muted">—</p>}
          </div>
        </PageFrame>
      )}
      {p4 && (
        <PageFrame label={p4.label}>
          <Leaf className="m-bp-leaf" size={48} />
          <div className="stack gap-4">
            <Logo size={20} />
            <h2 className="serif m-bp-title">{p4.title}</h2>
            <p className="body-sm muted">{p4.subtitle}</p>
          </div>
          <div className="m-bp-works">
            {d.works.map((w, i) => (
              <div key={w.key} className="m-bp-box">
                <span className="m-bp-h row gap-8"><span className="icon-circle sm" aria-hidden="true"><Icon name={workIcon(w.key, i)} size={15} /></span>{w.title}</span>
                <ul>{w.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="m-bp-box" style={{ background: 'var(--blush-soft)' }}>
            <span className="m-bp-h row gap-8"><span className="icon-circle sm" aria-hidden="true"><Icon name="heart" size={15} /></span>{s('p4', 'commitment').title}</span>
            <p className="m-bp-quote" style={{ fontSize: 15 }}>“{d.commitment}”</p>
          </div>
          <div className="m-bp-foot">
            <Script size={26}>{d.tpl.footerScript}</Script>
            <div className="m-bp-note">{d.tpl.footerNote}<br /><strong>Date:</strong> {d.date}</div>
          </div>
        </PageFrame>
      )}
    </div>
  );
}
