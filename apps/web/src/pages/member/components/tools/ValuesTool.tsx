import { Icon } from '@/ui/Icon';
import { Num, useToast } from '@/ui/kit';
import { arr, obj, type ToolProps } from './types';

interface ValuesConfig { steps?: string[]; values?: string[]; commonCount?: number; pickCount?: number; topCount?: number }

const PETAL_TONES = ['blush', 'beige', 'sage', 'blue', 'peach', 'rose', 'green', 'lavender'];

/** "My Values" flower: a centre circle with one petal per value. */
export function ValuesFlower({ values, center = 'My Values' }: { values: string[]; center?: string }) {
  const list = values.slice(0, 8);
  const n = Math.max(list.length, 1);
  return (
    <div className="m-flower" role="img" aria-label={`${center}: ${list.join(', ') || 'none chosen yet'}`}>
      {list.map((v, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return (
          <span key={v} className={`m-petal m-tone-${PETAL_TONES[i % PETAL_TONES.length]}`} style={{ left: `${50 + Math.cos(a) * 34}%`, top: `${50 + Math.sin(a) * 34}%` }} aria-hidden="true">
            {v}
          </span>
        );
      })}
      <span className="m-flower-center serif" aria-hidden="true">{center}</span>
    </div>
  );
}

/** Values Compass: pick up to pickCount values, narrow to topCount, say what each means. */
export function ValuesTool({ lesson, tool, setTool }: ToolProps) {
  const cfg = lesson.tool.config as ValuesConfig;
  const toast = useToast();
  const all = cfg.values ?? [];
  const pickCount = cfg.pickCount ?? 8;
  const topCount = cfg.topCount ?? 5;
  const common = all.slice(0, cfg.commonCount ?? 8);
  const steps = cfg.steps ?? [];
  const picked = arr(tool.picked);
  const top = arr(tool.top);
  const narrowList = Array.from(new Set([...picked, ...top]));
  const meanings = obj<Record<string, string>>(tool.meanings);

  const togglePick = (v: string) => {
    if (picked.includes(v)) return setTool({ picked: picked.filter((x) => x !== v), top: top.filter((x) => x !== v) });
    if (picked.length >= pickCount) return toast(`You can choose up to ${pickCount} values`, true);
    setTool({ picked: [...picked, v] });
  };
  const toggleTop = (v: string) => {
    if (top.includes(v)) return setTool({ top: top.filter((x) => x !== v) });
    if (top.length >= topCount) return toast(`Narrow down to ${topCount} values`, true);
    setTool({ top: [...top, v] });
  };

  return (
    <div className="stack gap-24">
      <div className="m-values-top">
        <ol className="m-numlist">
          {steps.map((s, i) => (
            <li key={i}><Num n={i + 1} />{s}</li>
          ))}
        </ol>
        <ValuesFlower values={top.length ? top : picked} />
        <div className="m-common card-blush card-pad-sm">
          <div className="field-label">Common values <span className="muted" style={{ fontWeight: 400 }}>(examples)</span></div>
          <ul className="m-common-list">{common.map((v) => <li key={v}>{v}</li>)}</ul>
        </div>
      </div>

      <fieldset className="m-fieldset">
        <legend className="h4">{steps[1] ?? `Choose your top ${pickCount} values.`} <span className="body-sm muted">({picked.length}/{pickCount})</span></legend>
        <div className="m-chips">
          {all.map((v) => (
            <button key={v} type="button" className={`m-chip ${picked.includes(v) ? 'on' : ''}`} aria-pressed={picked.includes(v)} onClick={() => togglePick(v)}>
              {picked.includes(v) && <Icon name="check" size={14} />}
              {v}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="m-fieldset" disabled={!narrowList.length}>
        <legend className="h4">{steps[2] ?? `Narrow down to your top ${topCount}.`} <span className="body-sm muted">({top.length}/{topCount})</span></legend>
        {narrowList.length ? (
          <div className="m-chips">
            {narrowList.map((v) => (
              <button key={v} type="button" className={`m-chip deep ${top.includes(v) ? 'on' : ''}`} aria-pressed={top.includes(v)} onClick={() => toggleTop(v)}>
                {top.includes(v) && <Icon name="star" size={14} />}
                {v}
              </button>
            ))}
          </div>
        ) : (
          <p className="body-sm muted">Choose your values above first.</p>
        )}
      </fieldset>

      {top.length > 0 && (
        <fieldset className="m-fieldset">
          <legend className="h4">{steps[3] ?? 'Reflect on what each value means to you.'}</legend>
          <div className="m-grid2">
            {top.map((v) => (
              <label key={v} className="field">
                <span className="field-label">{v}</span>
                <input className="input" value={meanings[v] ?? ''} placeholder="This value means…" onChange={(e) => setTool({ meanings: { ...meanings, [v]: e.target.value } })} />
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
