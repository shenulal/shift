import { Fragment, useEffect, useState } from 'react';
import { isoDate, now, type FieldDef, type FutureSelfCard } from '@shift/core';
import { useAction, useSettings } from '@/data';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Checkboxes, IconButton, Num, Select, TextArea, TextInput, useToast } from '@/ui/kit';
import { latestGoal } from '../blueprint';
import { lessonCtx, useMine } from '../useJourney';
import { tone } from '../ui';
import { arr, str, type ToolProps } from './types';

interface LoopItem { title: string; text: string; icon: string }
interface LetterStep { letter: string; title: string; text: string }
interface FormConfig { layout?: 'grid' | 'loop' | 'numbered' | 'letters' | 'columns' | 'flow'; loop?: LoopItem[]; steps?: LetterStep[]; tryIt?: string; image?: string; imageNote?: string; savesCard?: boolean; savesGoal?: boolean; intentionFrom?: string; arrows?: boolean }

const QUALITY_ICONS = ['leaf', 'heart', 'dumbbell', 'sun', 'star', 'compass'];
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const listJoin = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const sentences = (s: string) => s.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter(Boolean);

/** Field input for worksheets: textarea / text / select / checkboxes. */
function Input({ f, value, onChange, hideLabel }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; hideLabel?: boolean }) {
  const label = hideLabel ? undefined : f.label;
  if (f.type === 'checkboxes') return <Checkboxes label={label} help={hideLabel ? undefined : f.helper} options={f.options ?? []} value={arr(value)} onChange={onChange} allowOther={f.allowOther} />;
  if (f.type === 'select') return <Select label={label} value={str(value)} onChange={onChange} options={f.options ?? []} placeholder={f.placeholder} />;
  if (f.type === 'textarea') return <TextArea label={label} value={str(value)} onChange={onChange} placeholder={f.placeholder} rows={3} />;
  return <TextInput label={label} value={str(value)} onChange={onChange} placeholder={f.placeholder} />;
}

/** A labelled control whose visible label lives elsewhere (rows with a left label column). */
function BareInput({ f, value, onChange, labelId, rows = 2 }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; labelId: string; rows?: number }) {
  if (f.type === 'select') {
    return (
      <select className="select" aria-labelledby={labelId} value={str(value)} onChange={(e) => onChange(e.target.value)}>
        <option value="">{f.placeholder ?? 'Select an option'}</option>
        {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === 'textarea') return <textarea className="textarea" rows={rows} aria-labelledby={labelId} value={str(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  return <input className="input" aria-labelledby={labelId} value={str(value)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function FormTool(props: ToolProps) {
  const { lesson, tool, setTool } = props;
  const cfg = lesson.tool.config as FormConfig;
  const fields = lesson.tool.fields;
  const set = (id: string) => (v: unknown) => setTool({ [id]: v });

  let body: JSX.Element | null = null;
  switch (cfg.layout) {
    case 'grid':
      body = (
        <div className="m-grid2">
          {fields.map((f, i) => (
            <div key={f.id} className="m-box">
              <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                <Num n={i + 1} />
                <div className="grow"><Input f={f} value={tool[f.id]} onChange={set(f.id)} /></div>
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case 'loop': {
      const [first, ...rest] = fields;
      body = (
        <div className="stack gap-20">
          <ol className="m-loop" aria-label="The habit loop">
            {(cfg.loop ?? []).map((s, i, a) => (
              <Fragment key={s.title}>
                <li className="m-loop-step">
                  <span className={`m-loop-ic ${tone(['peach', 'blush', 'beige', 'green'][i % 4])}`} aria-hidden="true"><Icon name={s.icon} size={26} /></span>
                  <strong>{s.title}</strong>
                  <span className="body-sm muted">{s.text}</span>
                </li>
                {i < a.length - 1 && <li className="m-loop-arrow" aria-hidden="true"><Icon name="arrow-right" size={18} /></li>}
              </Fragment>
            ))}
          </ol>
          {first && <Input f={first} value={tool[first.id]} onChange={set(first.id)} />}
          <div className="m-grid2">{rest.map((f) => <Input key={f.id} f={f} value={tool[f.id]} onChange={set(f.id)} />)}</div>
        </div>
      );
      break;
    }
    case 'numbered':
      body = (
        <div className="stack gap-16">
          {fields.map((f, i) => (
            <section key={f.id} className="m-box" aria-labelledby={`nf-${f.id}`}>
              <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                <Num n={i + 1} size="lg" />
                <div className="grow stack gap-8">
                  <h3 className="h4" id={`nf-${f.id}`}>{f.label}</h3>
                  {f.helper && <p className="body-sm muted">{f.helper}</p>}
                  <Input f={f} value={tool[f.id]} onChange={set(f.id)} hideLabel />
                </div>
              </div>
            </section>
          ))}
        </div>
      );
      break;
    case 'columns':
      body = (
        <div className="m-cols3">
          {fields.map((f) => (
            <section key={f.id} className="m-col" aria-labelledby={`cf-${f.id}`}>
              <div className="m-col-head">
                <h3 className="label-caps" id={`cf-${f.id}`}>{f.label}</h3>
                {f.helper && <p className="body-sm muted">{f.helper}</p>}
              </div>
              {f.placeholder && <input className="input" aria-label={f.placeholder} placeholder={f.placeholder} value={str(tool[`${f.id}Note`])} onChange={(e) => setTool({ [`${f.id}Note`]: e.target.value })} />}
              <Checkboxes options={f.options ?? []} value={arr(tool[f.id])} onChange={set(f.id)} allowOther={f.allowOther} columns={1} />
            </section>
          ))}
        </div>
      );
      break;
    case 'letters':
      body = fields.some((f) => f.letter) ? <SmartBuilder {...props} /> : <LetterSteps cfg={cfg} />;
      break;
    case 'flow':
      body = cfg.savesCard ? <FutureSelfFlow {...props} /> : <FlowRows fields={fields} tool={tool} set={set} arrows={!!cfg.arrows} />;
      break;
    default:
      body = <div className="stack gap-16">{fields.map((f) => <Input key={f.id} f={f} value={tool[f.id]} onChange={set(f.id)} />)}</div>;
  }

  return (
    <div className="stack gap-24">
      {body}
      {lesson.tool.worksheet && (
        <section className="card m-worksheet" aria-labelledby="ws-title">
          <div className="m-stephead">
            <span className="m-stephead-ic" aria-hidden="true"><Icon name="doc" size={22} /></span>
            <div className="grow stack gap-4">
              <h3 className="h3" id="ws-title">{lesson.tool.worksheet.title}</h3>
              <p className="body-sm muted">{lesson.tool.worksheet.intro}</p>
            </div>
          </div>
          <ol className="m-rows">
            {lesson.tool.worksheet.fields.map((f, i) => (
              <li key={f.id} className="m-row">
                <Num n={i + 1} tone="outline" />
                <div className="m-row-label">
                  <strong id={`ws-${f.id}`}>{f.label}</strong>
                  {f.helper && <span className="body-sm muted">{f.helper}</span>}
                </div>
                <div className="m-row-input"><BareInput f={f} value={tool[f.id]} onChange={set(f.id)} labelId={`ws-${f.id}`} /></div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function FlowRows({ fields, tool, set, arrows }: { fields: FieldDef[]; tool: Record<string, unknown>; set: (id: string) => (v: unknown) => void; arrows: boolean }) {
  return (
    <ol className={`m-rows m-flow ${arrows ? 'arrows' : ''}`}>
      {fields.map((f, i) => (
        <li key={f.id} className={`m-row ${tone(f.color)}`}>
          <span className="m-flow-ic" aria-hidden="true"><Icon name={f.icon ?? 'leaf'} size={22} /></span>
          <div className="m-row-label">
            <strong id={`fl-${f.id}`}>{/^\d/.test(f.label) ? f.label : <><span className="m-flow-n">{i + 1}</span> {f.label}</>}</strong>
            {f.helper && <span className="body-sm muted">{f.helper}</span>}
          </div>
          <div className="m-row-input"><BareInput f={f} value={tool[f.id]} onChange={set(f.id)} labelId={`fl-${f.id}`} /></div>
        </li>
      ))}
    </ol>
  );
}

/** STOP-style letter tiles with a practice prompt and image. */
function LetterSteps({ cfg }: { cfg: FormConfig }) {
  return (
    <div className="stack gap-20">
      <div className="m-letters-wrap">
        <ol className="m-letters" aria-label="Steps">
          {(cfg.steps ?? []).map((s) => (
            <li key={s.letter + s.title}>
              <span className="m-letter-tile" aria-hidden="true">{s.letter}</span>
              <strong className="m-letter-title">{s.title}</strong>
              <span className="body-sm muted">{s.text}</span>
            </li>
          ))}
        </ol>
        {cfg.image && <Art src={cfg.image} note={cfg.imageNote} className="rounded-lg m-letters-art" />}
      </div>
      {cfg.tryIt && (
        <div className="m-tryit">
          <span className="icon-circle sm" aria-hidden="true"><Icon name="pencil" size={16} /></span>
          <div className="stack gap-4">
            <strong>Try it now</strong>
            <p className="body-sm muted">{cfg.tryIt}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/** SMART goal builder: intention (from the intention lesson) + lettered rows → saveGoal. */
function SmartBuilder({ j, lesson, tool, setTool, registerSave }: ToolProps) {
  const cfg = lesson.tool.config as FormConfig;
  const goals = useMine('goals').data;
  const saveGoal = useAction('saveGoal');
  const toast = useToast();
  const goal = goals ? latestGoal(goals) : null;
  const fromLesson = cfg.intentionFrom ? str(j.workFor(lessonCtx(cfg.intentionFrom))?.tool?.intention) : '';
  const intention = str(tool.intention) || goal?.intention || fromLesson;
  const [editing, setEditing] = useState(false);
  const valuesLesson = j.lessons.find((l) => l.tool.kind === 'values');
  const topValues = arr(valuesLesson ? j.workFor(lessonCtx(valuesLesson.id))?.tool?.top : []);
  const cards = useMine('cards').data;

  // Prefill the rows from an existing goal the first time.
  useEffect(() => {
    if (!goal) return;
    const patch: Record<string, unknown> = {};
    for (const f of lesson.tool.fields) if (tool[f.id] === undefined && (goal as unknown as Record<string, unknown>)[f.id]) patch[f.id] = (goal as unknown as Record<string, unknown>)[f.id];
    if (Object.keys(patch).length) setTool(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.id]);

  useEffect(() => {
    registerSave(async () => {
      const g: Record<string, unknown> = { intention };
      for (const f of lesson.tool.fields) g[f.id] = str(tool[f.id]);
      if (!str(g.specific)) {
        toast(`Please complete "${lesson.tool.fields.find((f) => f.id === 'specific')?.label ?? lesson.tool.fields[0]?.label}" first`, true);
        return false;
      }
      try {
        await saveGoal.mutateAsync({
          id: goal?.id,
          goal: { ...g, why: str(g.relevant) || goal?.why || '', values: goal?.values?.length ? goal.values : topValues.slice(0, 3), futureSelf: goal?.futureSelf || cards?.[0]?.statement || '', timeline: str(g.timeBound) || goal?.timeline || '' },
        });
        toast('Your SMART goal is saved');
        return true;
      } catch (e) {
        toast((e as Error).message, true);
        return false;
      }
    });
    return () => registerSave(null);
  });

  return (
    <div className="stack gap-20">
      <div className="m-intention">
        <span className="icon-circle" aria-hidden="true"><Icon name="target" size={22} /></span>
        <div className="grow stack gap-4">
          <div className="row between gap-8">
            <strong>Your Intention</strong>
            <button type="button" className="link body-sm" onClick={() => setEditing((e) => !e)}>{editing ? 'Done' : 'Edit'}</button>
          </div>
          {editing ? <TextArea value={intention} onChange={(v) => setTool({ intention: v })} rows={2} /> : <p className="body-sm muted">{intention || '—'}</p>}
        </div>
      </div>
      <ol className="m-rows m-smart">
        {lesson.tool.fields.map((f) => (
          <li key={f.id} className={`m-row ${tone(f.color)}`}>
            <span className="m-smart-letter" aria-hidden="true">{f.letter}</span>
            <div className="m-row-label">
              <strong id={`sm-${f.id}`}>{f.label}</strong>
              {f.helper && <span className="body-sm muted">{f.helper}</span>}
            </div>
            <div className="m-row-input"><BareInput f={f} value={tool[f.id]} onChange={(v) => setTool({ [f.id]: v })} labelId={`sm-${f.id}`} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Meet Your Future Self flow: five rows → saveCard → "Your Future Self Card is ready!" confirmation. */
function FutureSelfFlow({ lesson, tool, setTool, registerSave, onContinue, hideFooter }: ToolProps) {
  const cards = useMine('cards').data;
  const saveCard = useAction('saveCard');
  const settings = useSettings();
  const toast = useToast();
  const [done, setDone] = useState(false);
  useEffect(() => {
    hideFooter(done);
    return () => hideFooter(false);
  }, [done, hideFooter]);
  const card = cards?.[0] ?? null;
  const set = (id: string) => (v: unknown) => setTool({ [id]: v });

  // Prefill from an existing card.
  useEffect(() => {
    if (!card) return;
    const patch: Record<string, unknown> = {};
    for (const f of lesson.tool.fields) {
      const v = (card as unknown as Record<string, unknown>)[f.id];
      if (tool[f.id] === undefined && typeof v === 'string' && v) patch[f.id] = v;
    }
    if (Object.keys(patch).length) setTool(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id]);

  useEffect(() => {
    registerSave(async () => {
      const v = (k: string) => str(tool[k]).trim();
      const words = v('become').split(/[,·•]|\band\b/).map((s) => s.trim()).filter(Boolean).map(cap).slice(0, 6);
      if (!words.length && !v('see')) {
        toast('Please write a little about your future self first', true);
        return false;
      }
      const today = isoDate(now());
      const base = settings ? Math.max(settings.qualityScale.min, Math.round((settings.qualityScale.min + settings.qualityScale.max) / 2) - 1) : 2;
      const prev = card?.qualities ?? [];
      const qualities: FutureSelfCard['qualities'] = words.map((name, i) => prev.find((q) => q.name.toLowerCase() === name.toLowerCase()) ?? { name, description: '', icon: QUALITY_ICONS[i % QUALITY_ICONS.length], then: base, now: base, thenDate: today, nowDate: today });
      const commitments = [...sentences(v('live')), v('choose'), v('today')].filter(Boolean);
      try {
        await saveCard.mutateAsync({
          card: {
            see: v('see'), become: v('become'), live: v('live'), choose: v('choose'), today: v('today'),
            statement: card?.statement || (words.length ? `A ${listJoin(words.map((w) => w.toLowerCase()))} me.` : ''),
            commitments, qualities: qualities.length ? qualities : prev,
          },
        });
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
      } catch (e) {
        toast((e as Error).message, true);
        return false;
      }
    });
    return () => registerSave(null);
  });

  const conf = lesson.tool.confirmation;
  if (done && conf) {
    return (
      <div className="m-confirm" role="status">
        <span className="icon-circle lg sage" aria-hidden="true"><Icon name="sprout" size={30} /></span>
        <h2 className="h1">{conf.title}</h2>
        <p className="muted" style={{ maxWidth: 520 }}>{conf.body}</p>
        <Art src={lesson.nextStep.image || lesson.image} quote={lesson.nextStep.imageQuote || lesson.heroQuote} quotePos="tl" quoteSize={36} className="rounded-lg ratio-16x9 m-confirm-art" />
        <Button to="/app?tab=cards" arrow>{conf.cta}</Button>
        <button type="button" className="link" onClick={onContinue}>Continue to your next step</button>
        <IconButton icon="edit" label="Edit my plan" size="sm" onClick={() => setDone(false)} />
      </div>
    );
  }
  return <FlowRows fields={lesson.tool.fields} tool={tool} set={set} arrows={false} />;
}
