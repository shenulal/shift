import { useState } from 'react';
import type { ColorKey, FieldDef, FieldType } from '@shift/core';
import { Select, TextArea, TextInput } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { ColorKeySelect, IconPicker, MoveButtons, StringList, Switch, move } from './controls';
import { clone, slugify } from './util';

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Dropdown (one choice)' },
  { value: 'checkboxes', label: 'Checkboxes (many choices)' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'signature', label: 'Signature (typed name)' },
  { value: 'consent', label: 'Consent tick-box' },
  { value: 'wheel', label: 'Wheel of Life' },
  { value: 'heading', label: 'Section heading' },
  { value: 'paragraph', label: 'Paragraph / info text' },
];
const typeLabel = (t: FieldType) => FIELD_TYPES.find((x) => x.value === t)?.label ?? t;

function uniqueId(base: string, taken: string[]) {
  const b = slugify(base) || 'field';
  let id = b;
  let n = 2;
  while (taken.includes(id)) id = `${b}-${n++}`;
  return id;
}

/** Edit a FieldDef[] — used for forms and lesson tools / worksheets. */
export function FieldsBuilder({ value, onChange, label = 'Fields', showToolExtras }: { value: FieldDef[] | undefined; onChange: (v: FieldDef[]) => void; label?: string; showToolExtras?: boolean }) {
  const list = value ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const set = (i: number, patch: Partial<FieldDef>) => onChange(list.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const add = () => {
    const id = uniqueId('new field', list.map((f) => f.id));
    onChange([...list, { id, label: 'New question', type: 'text', required: false }]);
    setOpen(list.length);
  };
  return (
    <fieldset className="adm-fieldset">
      <legend>{label} <span className="faint body-sm">({list.length})</span></legend>
      {!list.length && <p className="body-sm muted">No fields yet.</p>}
      <ol className="adm-fb-list">
        {list.map((f, i) => {
          const isOpen = open === i;
          const hasOptions = f.type === 'select' || f.type === 'checkboxes';
          const name = f.label || f.id;
          return (
            <li key={`${f.id}-${i}`} className={`adm-fb-item ${isOpen ? 'open' : ''}`}>
              <div className="adm-repeat-head">
                <button type="button" className="adm-repeat-toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                  <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} />
                  {f.letter && <span className="adm-fb-letter">{f.letter}</span>}
                  <span className="adm-ellipsis">{name}</span>
                  <span className="adm-fb-type">{typeLabel(f.type)}{f.required ? ' · required' : ''}</span>
                </button>
                <MoveButtons label={name} first={i === 0} last={i === list.length - 1} onUp={() => onChange(move(list, i, i - 1))} onDown={() => onChange(move(list, i, i + 1))} />
                <button type="button" className="adm-mini" aria-label={`Duplicate ${name}`} title="Duplicate" onClick={() => onChange([...list.slice(0, i + 1), { ...clone(f), id: uniqueId(f.id, list.map((x) => x.id)) }, ...list.slice(i + 1)])}><Icon name="copy" size={14} /></button>
                <button type="button" className="adm-mini danger" aria-label={`Remove ${name}`} title="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
              </div>
              {isOpen && (
                <div className="adm-repeat-body adm-form-grid">
                  <div className="full"><TextInput label="Label / question" value={f.label} onChange={(v) => set(i, { label: v })} required /></div>
                  <Select label="Type" value={f.type} onChange={(v) => set(i, { type: (v || 'text') as FieldType })} options={FIELD_TYPES} placeholder="Choose a type" />
                  <TextInput label="Field key" value={f.id} onChange={(v) => set(i, { id: v.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') })} help="Stored with each answer. Changing it hides older answers." />
                  <div className="full"><TextArea label={f.type === 'paragraph' ? 'Paragraph text' : 'Helper text'} rows={2} value={f.helper ?? ''} onChange={(v) => set(i, { helper: v || undefined })} /></div>
                  {!['heading', 'paragraph', 'consent', 'wheel', 'checkboxes'].includes(f.type) && <TextInput label="Placeholder" value={f.placeholder ?? ''} onChange={(v) => set(i, { placeholder: v || undefined })} />}
                  {!['heading', 'paragraph'].includes(f.type) && (
                    <div className="adm-switch-cell"><Switch label="Required" checked={!!f.required} onChange={(v) => set(i, { required: v })} /></div>
                  )}
                  {hasOptions && (
                    <div className="full">
                      <StringList label="Options" value={f.options ?? []} onChange={(v) => set(i, { options: v })} addLabel="Add option" />
                    </div>
                  )}
                  {f.type === 'checkboxes' && <div className="adm-switch-cell"><Switch label='Allow "Other" with text' checked={!!f.allowOther} onChange={(v) => set(i, { allowOther: v })} /></div>}
                  {showToolExtras && (
                    <>
                      <TextInput label="Letter (for lettered tools, e.g. S·T·O·P)" value={f.letter ?? ''} onChange={(v) => set(i, { letter: v.slice(0, 2) || undefined })} />
                      <IconPicker value={f.icon ?? ''} onChange={(v) => set(i, { icon: v })} />
                      <div className="full"><ColorKeySelect value={f.color ?? ''} onChange={(v: ColorKey) => set(i, { color: v })} /></div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn btn-ghost btn-sm adm-add" onClick={add}><Icon name="plus" size={16} /> Add field</button>
    </fieldset>
  );
}
