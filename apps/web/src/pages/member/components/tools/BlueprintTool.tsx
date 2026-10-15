import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { Button, Loading, Modal, Ring, TextArea, useToast } from '@/ui/kit';
import { useBlueprint, type BlueprintData, type BlueprintOverrides } from '../blueprint';
import { tone } from '../ui';
import type { ToolProps } from './types';

interface CardCfg { key: string; title: string; text: string; icon: string }
const CARD_TONES = ['sage', 'blush', 'blue', 'beige', 'green', 'peach'];

function toggle(list: string[], v: string, max?: number) {
  if (list.includes(v)) return list.filter((x) => x !== v);
  if (max && list.length >= max) return list;
  return [...list, v];
}

function Editor({ k, title, data, onSave, onClose }: { k: string; title: string; data: BlueprintData; onSave: (patch: BlueprintOverrides) => void; onClose: () => void }) {
  const [statement, setStatement] = useState(data.statement);
  const [qualities, setQualities] = useState(data.qualities.map((q) => q.name));
  const [values, setValues] = useState(data.values);
  const [prios, setPrios] = useState(data.priorities.map((p) => p.id));
  const [learnings, setLearnings] = useState<Record<string, string[]>>(Object.fromEntries(data.learnings.map((l) => [l.stageId, [l.bullets[0] ?? '', l.bullets[1] ?? '']])));
  const [works, setWorks] = useState<Record<string, string[]>>(Object.fromEntries(data.works.map((w) => [w.key, w.items])));
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [commitment, setCommitment] = useState(data.commitment);
  const save = () => {
    const patch: BlueprintOverrides =
      k === 'futureSelf' ? { futureSelf: { statement, qualities } }
      : k === 'values' ? { values: { values, priorities: prios } }
      : k === 'learnings' ? { learnings: Object.fromEntries(Object.entries(learnings).map(([s, b]) => [s, b.map((x) => x.trim()).filter(Boolean)])) }
      : k === 'works' ? { works }
      : k === 'commitment' ? { commitment }
      : {};
    onSave(patch);
    onClose();
  };
  const readOnly = k === 'progress';
  let body: JSX.Element;
  switch (k) {
    case 'futureSelf':
      body = (
        <div className="stack gap-16">
          <TextArea label={data.section('p1', 'futureSelf').title} value={statement} onChange={setStatement} rows={3} />
          <fieldset className="m-fieldset">
            <legend className="field-label">{data.section('p1', 'qualities').title}</legend>
            <div className="m-chips">
              {data.allQualities.map((q) => (
                <button key={q.name} type="button" className={`m-chip ${qualities.includes(q.name) ? 'on' : ''}`} aria-pressed={qualities.includes(q.name)} onClick={() => setQualities(toggle(qualities, q.name))}>
                  <Icon name={q.icon} size={14} />{q.name}
                </button>
              ))}
              {!data.allQualities.length && <p className="body-sm muted">Your qualities come from your Future Self card.</p>}
            </div>
          </fieldset>
        </div>
      );
      break;
    case 'values':
      body = (
        <div className="stack gap-16">
          <fieldset className="m-fieldset">
            <legend className="field-label">{data.section('p1', 'values').title} <span className="muted">({values.length}/{data.topCount})</span></legend>
            <div className="m-chips">
              {Array.from(new Set([...values, ...data.valueOptions])).map((v) => (
                <button key={v} type="button" className={`m-chip ${values.includes(v) ? 'on' : ''}`} aria-pressed={values.includes(v)} onClick={() => setValues(toggle(values, v, data.topCount))}>{v}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="m-fieldset">
            <legend className="field-label">{data.section('p1', 'priorities').title} <span className="muted">({prios.length}/3)</span></legend>
            <div className="m-chips">
              {data.areas.map((a) => (
                <button key={a.id} type="button" className={`m-chip ${prios.includes(a.id) ? 'on' : ''}`} aria-pressed={prios.includes(a.id)} onClick={() => setPrios(toggle(prios, a.id, 3))}>
                  <Icon name={a.icon} size={14} />{a.name}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      );
      break;
    case 'progress':
      body = (
        <div className="stack gap-16">
          <div className="m-rings3">
            {[{ k: 'goal', v: data.goalPct }, { k: 'habits', v: data.habitsPct }, { k: 'alignment', v: data.align.now }].map((r) => (
              <div key={r.k} className="stack" style={{ alignItems: 'center', gap: 8 }}>
                <strong className="body-sm">{data.section('p3', r.k).title}</strong>
                <Ring pct={r.v} size={96} stroke={9} />
              </div>
            ))}
          </div>
          {data.wheelStart && (
            <Radar axes={data.areas.map((a) => ({ id: a.id, label: a.name }))} size={260} series={[
              { label: 'Start', values: data.wheelStart.scores, color: '#d29b94', fill: 'rgba(210,155,148,.15)' },
              ...(data.wheelNow ? [{ label: 'Now', values: data.wheelNow.scores, color: '#2e3b32', fill: 'rgba(148,165,140,.25)' }] : []),
            ]} />
          )}
          <p className="body-sm muted">These numbers update automatically from your goal, habits, Future Self and Wheel of Life.</p>
        </div>
      );
      break;
    case 'learnings':
      body = (
        <div className="stack gap-16">
          {data.learnings.map((l) => (
            <fieldset key={l.stageId} className="m-fieldset">
              <legend className="field-label row gap-8"><span className={`m-letter-sm ${tone(l.color)}`}>{l.letter}</span>{l.name}</legend>
              {l.subtitle && <p className="body-sm muted">{l.subtitle}</p>}
              {[0, 1].map((i) => (
                <input key={i} className="input" style={{ marginTop: 6 }} aria-label={`${l.name} learning ${i + 1}`} value={learnings[l.stageId]?.[i] ?? ''} onChange={(e) => setLearnings((x) => ({ ...x, [l.stageId]: Object.assign([...(x[l.stageId] ?? ['', ''])], { [i]: e.target.value }) }))} />
              ))}
            </fieldset>
          ))}
        </div>
      );
      break;
    case 'works':
      body = (
        <div className="stack gap-16">
          {data.works.map((w) => {
            const items = works[w.key] ?? [];
            const options = Array.from(new Set([...w.suggestions, ...items]));
            return (
              <fieldset key={w.key} className="m-fieldset">
                <legend className="field-label">{w.title}</legend>
                <div className="checks-2">
                  {options.map((o) => (
                    <label key={o} className="check"><input type="checkbox" checked={items.includes(o)} onChange={() => setWorks((x) => ({ ...x, [w.key]: toggle(items, o) }))} />{o}</label>
                  ))}
                </div>
                <div className="row gap-8" style={{ marginTop: 8 }}>
                  <input className="input" placeholder="Add your own…" aria-label={`Add to ${w.title}`} value={custom[w.key] ?? ''} onChange={(e) => setCustom((c) => ({ ...c, [w.key]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = (custom[w.key] ?? '').trim(); if (v) { setWorks((x) => ({ ...x, [w.key]: [...items, v] })); setCustom((c) => ({ ...c, [w.key]: '' })); } } }} />
                  <Button size="sm" variant="ghost" onClick={() => { const v = (custom[w.key] ?? '').trim(); if (v) { setWorks((x) => ({ ...x, [w.key]: [...items, v] })); setCustom((c) => ({ ...c, [w.key]: '' })); } }}>Add</Button>
                </div>
              </fieldset>
            );
          })}
        </div>
      );
      break;
    default:
      body = <TextArea label={data.section('p4', 'commitment').title} value={commitment} onChange={setCommitment} rows={5} />;
  }
  return (
    <Modal open onClose={onClose} wide={k === 'learnings' || k === 'works' || k === 'progress'} title={title} footer={readOnly ? <Button onClick={onClose}>Close</Button> : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></>}>
      {body}
    </Modal>
  );
}

/** Create Your Personal Blueprint: six editable review cards + download. */
export function BlueprintTool({ lesson, tool, setTool }: ToolProps) {
  const toast = useToast();
  const { data } = useBlueprint(tool as BlueprintOverrides);
  const [open, setOpen] = useState<CardCfg | null>(null);
  const cfg = lesson.tool.config as { cards?: CardCfg[]; download?: { title: string; text: string; icon: string }[] };
  if (!data) return <Loading h={300} />;
  const done = (k: string) => k === 'progress' || (tool as Record<string, unknown>)[k] !== undefined;
  return (
    <div className="stack gap-32">
      <ul className="m-bpcards">
        {(cfg.cards ?? []).map((c, i) => (
          <li key={c.key}>
            <button type="button" className={`m-bpcard`} onClick={() => setOpen(c)}>
              <span className={`m-bpcard-ic ${tone(CARD_TONES[i % CARD_TONES.length])}`} aria-hidden="true"><Icon name={c.icon} size={26} /></span>
              <span className="grow stack gap-4">
                <strong className="serif">{c.title}</strong>
                <span className="body-sm muted">{c.text}</span>
                {done(c.key) && c.key !== 'progress' && <span className="m-saved"><Icon name="check" size={12} />Personalised</span>}
              </span>
              <Icon name="chevron-right" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <section className="stack gap-16" aria-labelledby="dl">
        <h3 className="h3" id="dl">{cfg.download?.[0]?.title}</h3>
        <ul className="m-dlcards">
          {(cfg.download ?? []).map((d, i) => (
            <li key={d.title} className={i === 0 ? 'primary' : ''}>
              {i === 0 ? (
                <Link to="/app/blueprint" className="m-dlcard">
                  <Icon name={d.icon} size={26} />
                  <span className="stack"><strong>{d.title}</strong><span className="body-sm">{d.text}</span></span>
                </Link>
              ) : (
                <div className="m-dlcard">
                  <Icon name={d.icon} size={26} />
                  <span className="stack"><strong>{d.title}</strong><span className="body-sm muted">{d.text}</span></span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      {open && <Editor k={open.key} title={open.title} data={data} onClose={() => setOpen(null)} onSave={(patch) => { setTool(patch as Record<string, unknown>); toast(`${open.title} saved`); }} />}
    </div>
  );
}
