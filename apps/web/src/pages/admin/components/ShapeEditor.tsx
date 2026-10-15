import { useId, useState } from 'react';
import { Field } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { MoveButtons, NumberField, StringList, Switch, move } from './controls';
import { clone, humanise } from './util';

/**
 * Generic editor for arbitrary nested JSON (page copy, free-tool texts, tool config…).
 * strings → input / textarea, numbers → number, booleans → switch, string[] → list, object[] → repeater,
 * objects → fieldset. Labels are humanised keys. Line breaks in textareas are preserved (\n → line break on the site).
 */
type Json = unknown;

const isLong = (s: string, key: string) => s.length > 70 || s.includes('\n') || /body|intro|description|text|answer|note|quote|helper|subtitle|bio|story|content/i.test(key);

/** Empty value with the same shape (used when adding a repeater item). */
export function emptyLike(v: Json): Json {
  if (typeof v === 'string') return '';
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, emptyLike(x)]));
  return '';
}

function itemTitle(item: Json, i: number) {
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const t = o.title ?? o.label ?? o.name ?? o.question ?? o.text ?? o.key ?? o.prompt;
    if (typeof t === 'string' && t.trim()) return `${i + 1}. ${t.length > 60 ? `${t.slice(0, 60)}…` : t}`;
  }
  return `Item ${i + 1}`;
}

function StringInput({ label, value, onChange, keyName }: { label: string; value: string; onChange: (v: string) => void; keyName: string }) {
  const id = useId();
  const long = isLong(value, keyName);
  return (
    <Field label={label} htmlFor={id}>
      {long ? (
        <textarea id={id} className="textarea" rows={Math.min(8, Math.max(3, Math.ceil(value.length / 80) + value.split('\n').length - 1))} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

function ObjectRepeater({ label, value, onChange, depth }: { label: string; value: Record<string, unknown>[]; onChange: (v: unknown[]) => void; depth: number }) {
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set(value.length <= 3 ? value.map((_, i) => i) : []));
  const toggle = (i: number) => setOpenSet((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <fieldset className="adm-fieldset">
      <legend>{label} <span className="faint body-sm">({value.length})</span></legend>
      <div className="stack gap-8">
        {value.map((item, i) => {
          const open = openSet.has(i);
          return (
            <div key={i} className="adm-repeat-item">
              <div className="adm-repeat-head">
                <button type="button" className="adm-repeat-toggle" aria-expanded={open} onClick={() => toggle(i)}>
                  <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} />
                  <span className="adm-ellipsis">{itemTitle(item, i)}</span>
                </button>
                <MoveButtons label={itemTitle(item, i)} first={i === 0} last={i === value.length - 1} onUp={() => onChange(move(value, i, i - 1))} onDown={() => onChange(move(value, i, i + 1))} />
                <button type="button" className="adm-mini" aria-label={`Duplicate ${itemTitle(item, i)}`} title="Duplicate" onClick={() => onChange([...value.slice(0, i + 1), clone(item), ...value.slice(i + 1)])}><Icon name="copy" size={14} /></button>
                <button type="button" className="adm-mini danger" aria-label={`Remove ${itemTitle(item, i)}`} title="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
              </div>
              {open && (
                <div className="adm-repeat-body">
                  <ShapeEditor value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? (v as Record<string, unknown>) : x)))} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-ghost btn-sm adm-add" onClick={() => { onChange([...value, emptyLike(value[0] ?? { text: '' })]); setOpenSet((s) => new Set(s).add(value.length)); }}>
        <Icon name="plus" size={16} /> Add {label.toLowerCase().replace(/s$/, '')}
      </button>
    </fieldset>
  );
}

export function ShapeEditor({ value, onChange, label, depth = 0, keyName = '' }: { value: Json; onChange: (v: Json) => void; label?: string; depth?: number; keyName?: string }) {
  const lbl = label ?? humanise(keyName || 'value');
  if (typeof value === 'string') return <StringInput label={lbl} value={value} onChange={onChange} keyName={keyName} />;
  if (typeof value === 'number') return <NumberField label={lbl} value={value} onChange={(v) => onChange(v ?? 0)} />;
  if (typeof value === 'boolean') return <Switch label={lbl} checked={value} onChange={onChange} />;
  if (value === null || value === undefined) return <StringInput label={lbl} value="" onChange={onChange} keyName={keyName} />;
  if (Array.isArray(value)) {
    const objects = value.length > 0 && value.every((x) => x && typeof x === 'object' && !Array.isArray(x));
    if (objects) return <ObjectRepeater label={lbl} value={value as Record<string, unknown>[]} onChange={onChange} depth={depth} />;
    return <StringList label={lbl} value={value.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)))} onChange={onChange} multiline={value.some((x) => typeof x === 'string' && x.length > 70)} />;
  }
  const obj = value as Record<string, unknown>;
  const body = (
    <div className="adm-shape-grid">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className={typeof v === 'string' && !isLong(v, k) ? 'adm-shape-cell' : 'adm-shape-cell full'}>
          <ShapeEditor value={v} keyName={k} depth={depth + 1} onChange={(nv) => onChange({ ...obj, [k]: nv })} />
        </div>
      ))}
    </div>
  );
  if (depth === 0 && !label) return body;
  return (
    <fieldset className="adm-fieldset">
      <legend>{lbl}</legend>
      {body}
    </fieldset>
  );
}
