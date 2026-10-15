import { useEffect, useState } from 'react';
import type { Lesson, Rec } from '@shift/core';
import { useAction, usePublicList } from '@/data';
import { WheelOfLife } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { AutosaveIndicator, Loading, Tabs, useAutosave, useToast } from '@/ui/kit';
import { lessonCtx, useMine } from '../useJourney';
import { tone } from '../ui';
import { arr, obj, str, type ToolProps } from './types';

interface PrioConfig { min?: number; max?: number; tip?: string; exploreTitle?: string; exploreIntro?: string; explore?: { id: string; prompt: string; placeholder: string }[] }

/** Reflect step of the priorities lesson: rate the Life Wheel (saved as a wheelScores record for this lesson). */
export function WheelReflect({ lesson }: { lesson: Rec<Lesson> }) {
  const scores = useMine('wheelScores').data;
  const save = useAction('saveWheel');
  const [value, setValue] = useState<Record<string, number> | null>(null);
  const ctx = lessonCtx(lesson.id);
  useEffect(() => {
    if (value || !scores) return;
    setValue({ ...(scores.find((s) => s.context === ctx)?.scores ?? {}) });
  }, [scores, value, ctx]);
  const [status, trigger] = useAutosave<Record<string, number>>((v) => save.mutateAsync({ context: ctx, scores: v }));
  if (!value) return <Loading h={360} />;
  return (
    <div className="stack gap-12">
      <div className="m-wheel-wrap">
        <WheelOfLife value={value} onChange={(v) => { setValue(v); trigger(v); }} size={380} />
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><AutosaveIndicator status={status} /></div>
    </div>
  );
}

/** Apply step: choose 1–3 priority areas and explore each one. */
export function WheelPriorities({ lesson, tool, setTool }: ToolProps) {
  const cfg = lesson.tool.config as PrioConfig;
  const areas = usePublicList('wheelAreas').data;
  const scores = useMine('wheelScores').data;
  const toast = useToast();
  const max = cfg.max ?? 3;
  const chosen = arr(tool.priorities);
  const explore = obj<Record<string, Record<string, string>>>(tool.explore);
  const [tab, setTab] = useState(0);
  const mine = scores?.find((s) => s.context === lessonCtx(lesson.id))?.scores ?? {};
  if (!areas) return <Loading />;
  const toggle = (id: string) => {
    if (chosen.includes(id)) return setTool({ priorities: chosen.filter((x) => x !== id) });
    if (chosen.length >= max) return toast(`Choose up to ${max} areas`, true);
    setTool({ priorities: [...chosen, id] });
  };
  const active = chosen[Math.min(tab, chosen.length - 1)];
  const activeArea = areas.find((a) => a.id === active);
  return (
    <div className="m-prio">
      <div className="stack gap-12">
        <fieldset className="m-fieldset">
          <legend className="sr-only">{lesson.tool.subtitle}</legend>
          <ul className="m-arealist">
            {areas.map((a) => (
              <li key={a.id}>
                <label className={`m-area ${chosen.includes(a.id) ? 'on' : ''}`}>
                  <span className={`m-area-ic ${tone(a.color)}`} aria-hidden="true"><Icon name={a.icon} size={18} /></span>
                  <span className="grow">{a.name}</span>
                  {mine[a.id] !== undefined && <span className="body-sm faint" title="Your Life Wheel score">{mine[a.id]}</span>}
                  <input type="checkbox" checked={chosen.includes(a.id)} onChange={() => toggle(a.id)} />
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {cfg.tip && (
          <div className="m-tip">
            <Icon name="bulb" size={18} />
            <p className="body-sm"><strong>Tip: </strong>{cfg.tip}</p>
          </div>
        )}
      </div>
      <section className="m-explore" aria-labelledby="explore-title">
        <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
          <span className="icon-circle sm" aria-hidden="true"><Icon name="chat" size={16} /></span>
          <div className="stack gap-4">
            <h3 className="h4" id="explore-title">{cfg.exploreTitle}</h3>
            <p className="body-sm muted">{cfg.exploreIntro}</p>
          </div>
        </div>
        {chosen.length ? (
          <>
            <Tabs tabs={chosen.map((_, i) => ({ id: String(i), label: `Priority ${i + 1}` }))} value={String(Math.min(tab, chosen.length - 1))} onChange={(v) => setTab(Number(v))} />
            {activeArea && (
              <div className="stack gap-12 m-explore-body">
                <div className="row gap-8"><Icon name={activeArea.icon} size={18} /><strong>{activeArea.name}</strong></div>
                {(cfg.explore ?? []).map((p) => (
                  <label key={p.id} className="field">
                    <span className="field-label">{p.prompt}</span>
                    <textarea className="textarea" rows={2} placeholder={p.placeholder} value={str(explore[active]?.[p.id])} onChange={(e) => setTool({ explore: { ...explore, [active]: { ...(explore[active] ?? {}), [p.id]: e.target.value } } })} />
                  </label>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="body-sm muted" style={{ padding: '12px 0' }}>Tick 1–{max} areas to explore them here.</p>
        )}
      </section>
    </div>
  );
}

/** Next step of the priorities lesson: Top 3, main focus + why, and the checklist. */
export function PrioritiesNext({ lesson, tool, setTool, nextStep, setNext }: { lesson: Rec<Lesson>; tool: Record<string, unknown>; setTool: (p: Record<string, unknown>) => void; nextStep: { text: string; checklist?: Record<string, boolean> }; setNext: (p: { checklist: Record<string, boolean> }) => void }) {
  const areas = usePublicList('wheelAreas').data ?? [];
  const chosen = arr(tool.priorities).map((id) => areas.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
  const main = str(tool.mainFocus) || chosen[0]?.id || '';
  const mainArea = areas.find((a) => a.id === main);
  const checklist = nextStep.checklist ?? {};
  return (
    <div className="stack gap-20">
      <section className="m-box" aria-labelledby="top3">
        <h3 className="h4" id="top3">{lesson.nextStep.prompt}</h3>
        {chosen.length ? (
          <ol className="m-top3">
            {chosen.map((a, i) => (
              <li key={a.id}>
                <span className="num">{i + 1}</span>
                <span className={`m-area-ic ${tone(a.color)}`} aria-hidden="true"><Icon name={a.icon} size={16} /></span>
                {a.name}
              </li>
            ))}
          </ol>
        ) : (
          <p className="body-sm muted">Choose your priority areas in the previous step.</p>
        )}
      </section>
      {chosen.length > 0 && (
        <section className="m-box m-box-sage stack gap-12" aria-labelledby="mainfocus">
          <div className="row gap-12">
            <span className="icon-circle sm sage" aria-hidden="true"><Icon name="target" size={16} /></span>
            <h3 className="h4" id="mainfocus">My Main Focus</h3>
          </div>
          <label className="field">
            <span className="field-label">The area I will focus on first</span>
            <select className="select" value={main} onChange={(e) => setTool({ mainFocus: e.target.value })}>
              {chosen.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          {mainArea && (
            <label className="field">
              <span className="field-label">{mainArea.name}</span>
              <textarea className="textarea" rows={3} placeholder={lesson.nextStep.placeholder} value={str(tool.mainWhy)} onChange={(e) => setTool({ mainWhy: e.target.value })} />
            </label>
          )}
        </section>
      )}
      {lesson.nextStep.checklist.length > 0 && (
        <fieldset className="m-box m-fieldset">
          <legend className="h4" style={{ padding: 0 }}>{lesson.nextStep.helper}</legend>
          <div className="stack gap-4" style={{ marginTop: 8 }}>
            {lesson.nextStep.checklist.map((c, i) => (
              <label key={i} className="check">
                <input type="checkbox" checked={!!checklist[String(i)]} onChange={(e) => setNext({ checklist: { ...checklist, [String(i)]: e.target.checked } })} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
