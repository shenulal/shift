import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { COLLECTIONS, type CollectionName, type FieldDef, type RecOf } from '@shift/core';
import { useCrud, useSingleton } from '@/data';
import { Button, Confirm, Field, Loading, Select, Tabs, TextArea, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { CheckList, ColorKeySelect, DateTimeField, Drawer, FileField, IconPicker, ImagePicker, MoveButtons, NumberField, PriceField, StringList, Switch, move } from './controls';
import { FieldsBuilder } from './FieldsBuilder';
import { ShapeEditor } from './ShapeEditor';
import { clone, errMsg, getPath, isEmpty, setPath, stripMeta } from './util';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Opt = { value: string; label: string };
export type SpecType =
  | 'text' | 'textarea' | 'number' | 'price' | 'boolean' | 'select' | 'color' | 'icon' | 'image' | 'strings' | 'objects' | 'group'
  | 'datetime' | 'date' | 'email' | 'url' | 'file' | 'fields' | 'shape' | 'template' | 'checklist' | 'readonly' | 'heading' | 'custom';

export interface CustomProps { value: any; onChange: (v: any) => void; draft: any; setDraft: (d: any) => void }

/** Declarative field schema for the record editor. `key` may be a dotted path ("bonus.title"). */
export interface FieldSpec {
  key: string;
  label: string;
  type: SpecType;
  help?: ReactNode;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  full?: boolean;
  options?: Opt[];
  /** price / number: allow empty (null). group: object can be switched off (null). */
  nullable?: boolean;
  /** objects / group */
  fields?: FieldSpec[];
  blank?: () => any;
  itemLabel?: (item: any, i: number) => string;
  addLabel?: string;
  showIf?: (draft: any) => boolean;
  render?: (p: CustomProps) => ReactNode;
  min?: number;
  max?: number;
  accept?: string;
  vars?: string[];
  multiline?: boolean;
  toolExtras?: boolean;
  format?: (v: any, draft: any) => ReactNode;
}
export interface EditorTab { id: string; label: string; fields: FieldSpec[] }

const FULL_TYPES: SpecType[] = ['textarea', 'strings', 'objects', 'group', 'fields', 'shape', 'template', 'color', 'image', 'checklist', 'heading', 'custom'];

// ──────────────────────────────────────── template field (variable chips insert at the cursor)
function TemplateField({ label, value, onChange, vars, rows, help, required, error, multiline = true }: { label: ReactNode; value: string; onChange: (v: string) => void; vars: string[]; rows?: number; help?: ReactNode; required?: boolean; error?: ReactNode; multiline?: boolean }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const insert = (token: string) => {
    const el = ref.current;
    const v = value ?? '';
    const start = el?.selectionStart ?? v.length;
    const end = el?.selectionEnd ?? v.length;
    const next = `${v.slice(0, start)}${token}${v.slice(end)}`;
    onChange(next);
    window.requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };
  return (
    <Field label={label} htmlFor={id} help={help} required={required} error={error}>
      <div className="adm-chips" role="group" aria-label="Insert a variable">
        {vars.map((v) => (
          <button key={v} type="button" className="adm-chip" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(`{${v}}`)} aria-label={`Insert {${v}}`}>
            {`{${v}}`}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea id={id} ref={(el) => { ref.current = el; }} className="textarea adm-mono-ish" rows={rows ?? 10} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} ref={(el) => { ref.current = el; }} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

// ──────────────────────────────────────── object list (repeater)
function ObjectList({ spec, value, onChange }: { spec: FieldSpec; value: any[]; onChange: (v: any[]) => void }) {
  const list = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<Set<number>>(() => new Set(list.length <= 2 ? list.map((_, i) => i) : []));
  const title = (it: any, i: number) => {
    if (spec.itemLabel) return spec.itemLabel(it, i);
    const first = spec.fields?.find((f) => ['text', 'textarea'].includes(f.type));
    const t = first ? getPath(it, first.key) : '';
    return typeof t === 'string' && t.trim() ? `${i + 1}. ${t.length > 60 ? `${t.slice(0, 60)}…` : t}` : `Item ${i + 1}`;
  };
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <fieldset className="adm-fieldset">
      <legend>{spec.label} <span className="faint body-sm">({list.length})</span></legend>
      {spec.help && <div className="field-help" style={{ marginBottom: 8 }}>{spec.help}</div>}
      <div className="stack gap-8">
        {list.map((it, i) => {
          const isOpen = open.has(i);
          const inactive = it && typeof it === 'object' && it.active === false;
          return (
            <div key={i} className={`adm-repeat-item ${inactive ? 'is-inactive' : ''}`}>
              <div className="adm-repeat-head">
                <button type="button" className="adm-repeat-toggle" aria-expanded={isOpen} onClick={() => toggle(i)}>
                  <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={14} />
                  <span className="adm-ellipsis">{title(it, i)}</span>
                  {inactive && <span className="pill adm-tone tone-beige">Inactive</span>}
                </button>
                <MoveButtons label={title(it, i)} first={i === 0} last={i === list.length - 1} onUp={() => onChange(move(list, i, i - 1))} onDown={() => onChange(move(list, i, i + 1))} />
                <button
                  type="button"
                  className="adm-mini"
                  aria-label={`Duplicate ${title(it, i)}`}
                  title="Duplicate"
                  onClick={() => {
                    const copy = clone(it);
                    if (copy && typeof copy === 'object' && 'id' in copy && spec.blank) copy.id = (spec.blank() as any)?.id ?? `${copy.id}-copy`;
                    onChange([...list.slice(0, i + 1), copy, ...list.slice(i + 1)]);
                  }}
                >
                  <Icon name="copy" size={14} />
                </button>
                <button type="button" className="adm-mini danger" aria-label={`Remove ${title(it, i)}`} title="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
              </div>
              {isOpen && (
                <div className="adm-repeat-body">
                  <FieldGrid specs={spec.fields ?? []} draft={it} setDraft={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-ghost btn-sm adm-add" onClick={() => { onChange([...list, spec.blank ? spec.blank() : {}]); setOpen((s) => new Set(s).add(list.length)); }}>
        <Icon name="plus" size={16} /> {spec.addLabel ?? 'Add item'}
      </button>
    </fieldset>
  );
}

// ──────────────────────────────────────── single field
function SpecField({ spec, draft, setDraft, error }: { spec: FieldSpec; draft: any; setDraft: (d: any) => void; error?: string }) {
  const value = getPath(draft, spec.key) as any;
  const set = (v: unknown) => setDraft(setPath(draft, spec.key, v));
  const common = { label: spec.label, help: spec.help, required: spec.required, error };
  switch (spec.type) {
    case 'heading':
      return <h3 className="adm-h3">{spec.label}{spec.help && <span className="body-sm muted adm-h3-sub">{spec.help}</span>}</h3>;
    case 'text':
    case 'email':
    case 'url':
      return <TextInput {...common} type={spec.type === 'text' ? 'text' : spec.type} value={(value as string) ?? ''} onChange={set} placeholder={spec.placeholder} />;
    case 'textarea':
      return <TextArea {...common} value={(value as string) ?? ''} onChange={set} rows={spec.rows ?? 3} placeholder={spec.placeholder} />;
    case 'number':
      return <NumberField {...common} value={value as number | null} onChange={set} nullable={spec.nullable} min={spec.min} max={spec.max} placeholder={spec.placeholder} />;
    case 'price':
      return <PriceField label={spec.label} value={value as number | null} onChange={set} nullable={spec.nullable !== false} help={spec.help} />;
    case 'boolean':
      return <div className="adm-switch-cell"><Switch label={spec.label} checked={!!value} onChange={set} />{spec.help && <div className="field-help">{spec.help}</div>}</div>;
    case 'select':
      return <Select {...common} value={(value as string) ?? ''} onChange={set} options={spec.options ?? []} placeholder={spec.placeholder ?? 'Select…'} />;
    case 'color':
      return <ColorKeySelect label={spec.label} value={(value as string) ?? ''} onChange={set} help={spec.help} />;
    case 'icon':
      return <IconPicker label={spec.label} value={(value as string) ?? ''} onChange={set} />;
    case 'image':
      return <ImagePicker label={spec.label} value={(value as string) ?? ''} onChange={set} help={spec.help} />;
    case 'file':
      return <FileField label={spec.label} value={(value as string) ?? ''} onChange={set} accept={spec.accept} help={spec.help} />;
    case 'datetime':
      return <DateTimeField label={spec.label} value={value as string} onChange={set} help={spec.help} />;
    case 'date':
      return <DateTimeField label={spec.label} value={value as string} onChange={set} help={spec.help} dateOnly />;
    case 'strings':
      return <StringList label={spec.label} value={(value as string[]) ?? []} onChange={set} help={spec.help} placeholder={spec.placeholder} multiline={spec.multiline} addLabel={spec.addLabel} />;
    case 'checklist':
      return <CheckList label={spec.label} options={spec.options ?? []} value={(value as string[]) ?? []} onChange={set} help={spec.help} />;
    case 'objects':
      return <ObjectList spec={spec} value={value as any[]} onChange={set} />;
    case 'group': {
      if (spec.nullable && (value === null || value === undefined)) {
        return (
          <div className="adm-fieldset adm-group-off">
            <Switch label={`Include ${spec.label.toLowerCase()}`} checked={false} onChange={(on) => on && set(spec.blank ? spec.blank() : {})} />
            {spec.help && <div className="field-help">{spec.help}</div>}
          </div>
        );
      }
      return (
        <fieldset className="adm-fieldset">
          <legend>{spec.label}</legend>
          {spec.nullable && <div style={{ marginBottom: 12 }}><Switch label={`Include ${spec.label.toLowerCase()}`} checked onChange={(on) => !on && set(null)} /></div>}
          {spec.help && <div className="field-help" style={{ marginBottom: 8 }}>{spec.help}</div>}
          <FieldGrid specs={spec.fields ?? []} draft={value ?? {}} setDraft={set} />
        </fieldset>
      );
    }
    case 'fields':
      return <FieldsBuilder label={spec.label} value={(value as FieldDef[]) ?? []} onChange={set} showToolExtras={spec.toolExtras} />;
    case 'shape':
      return (
        <fieldset className="adm-fieldset">
          <legend>{spec.label}</legend>
          {spec.help && <div className="field-help" style={{ marginBottom: 8 }}>{spec.help}</div>}
          {value && typeof value === 'object' && Object.keys(value).length ? <ShapeEditor value={value} onChange={set} /> : <p className="body-sm muted">Nothing to configure for this item.</p>}
        </fieldset>
      );
    case 'template':
      return <TemplateField {...common} value={(value as string) ?? ''} onChange={set} vars={spec.vars ?? []} rows={spec.rows} multiline={spec.multiline !== false} />;
    case 'readonly':
      return (
        <div className="field">
          <span className="field-label">{spec.label}</span>
          <div className="adm-readonly">{spec.format ? spec.format(value, draft) : String(value ?? '—')}</div>
          {spec.help && <div className="field-help">{spec.help}</div>}
        </div>
      );
    case 'custom':
      return <>{spec.render?.({ value, onChange: set, draft, setDraft })}</>;
    default:
      return null;
  }
}

/** Two-column responsive grid of fields. */
export function FieldGrid({ specs, draft, setDraft, errors = {} }: { specs: FieldSpec[]; draft: any; setDraft: (d: any) => void; errors?: Record<string, string> }) {
  return (
    <div className="adm-form-grid">
      {specs.filter((s) => !s.showIf || s.showIf(draft)).map((s) => (
        <div key={s.key + s.label} className={s.full || FULL_TYPES.includes(s.type) ? 'full' : ''}>
          <SpecField spec={s} draft={draft} setDraft={setDraft} error={errors[s.key]} />
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────── editor state
function validate(specs: FieldSpec[], draft: any): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const s of specs) {
    if (s.showIf && !s.showIf(draft)) continue;
    if (s.required && isEmpty(getPath(draft, s.key))) errs[s.key] = `${s.label} is required`;
  }
  return errs;
}

interface EditorOpts { col: CollectionName; record: Record<string, any> | null | undefined; blank?: () => Record<string, any>; tabs?: EditorTab[]; fields?: FieldSpec[]; onSaved?: (rec: any) => void; transform?: (d: any) => any }

export function useEditor({ col, record, blank, tabs, fields, onSaved, transform }: EditorOpts) {
  const crud = useCrud(col);
  const toast = useToast();
  const singleton = !!COLLECTIONS[col].singleton;
  const init = () => clone(record ?? { ...(blank?.() ?? {}), ...(singleton ? {} : { active: true }) });
  const [draft, setDraft] = useState<any>(init);
  const [saved, setSaved] = useState<any>(init);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState(tabs?.[0]?.id ?? 'main');
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    if (!record || dirtyRef.current) return;
    const fresh = clone(record);
    setDraft(fresh);
    setSaved(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id, record?.updatedAt]);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const allSpecs = useMemo(() => [...(fields ?? []), ...(tabs ?? []).flatMap((t) => t.fields)], [fields, tabs]);
  const save = async () => {
    const errs = validate(allSpecs, draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const firstKey = Object.keys(errs)[0];
      const t = tabs?.find((x) => x.fields.some((f) => f.key === firstKey));
      if (t) setTab(t.id);
      toast(Object.values(errs)[0], true);
      return null;
    }
    setSaving(true);
    try {
      const data = stripMeta(transform ? transform(draft) : draft);
      if (!singleton) data.active = draft.active !== false;
      let rec: unknown;
      if (record?.id) {
        // Only send what changed, so several forms editing one record (e.g. Settings tabs) never overwrite each other.
        const before = { ...stripMeta(saved), active: saved.active };
        const patch = Object.fromEntries(Object.entries(data).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify((before as Record<string, unknown>)[k])));
        rec = await crud.update.mutateAsync({ id: record.id, patch });
      } else rec = await crud.create.mutateAsync(data);
      const fresh = clone(rec as any);
      if (transform) Object.assign(fresh, draft, { id: fresh.id, updatedAt: fresh.updatedAt });
      setDraft(fresh);
      setSaved(fresh);
      toast(record?.id ? 'Saved — live on the site' : `${COLLECTIONS[col].label}: item created`);
      onSaved?.(rec);
      return rec;
    } catch (e) {
      toast(errMsg(e), true);
      return null;
    } finally {
      setSaving(false);
    }
  };
  const reset = () => { setDraft(clone(saved)); setErrors({}); };
  return { draft, setDraft, dirty, errors, save, saving, reset, tab, setTab, singleton, isNew: !record?.id };
}

type Editor = ReturnType<typeof useEditor>;

function EditorBody({ ed, tabs, fields, preview, showActive, top }: { ed: Editor; tabs?: EditorTab[]; fields?: FieldSpec[]; preview?: (d: any) => ReactNode; showActive?: boolean; top?: ReactNode }) {
  const body = (
    <div className="stack gap-20">
      {top}
      {showActive && !ed.singleton && (
        <div className="adm-active-row">
          <Switch label={ed.draft.active !== false ? 'Active — visible on the site' : 'Inactive — hidden from the site (history kept)'} checked={ed.draft.active !== false} onChange={(v) => ed.setDraft({ ...ed.draft, active: v })} />
        </div>
      )}
      {fields && <FieldGrid specs={fields} draft={ed.draft} setDraft={ed.setDraft} errors={ed.errors} />}
      {tabs && tabs.length > 0 && (
        <>
          <Tabs tabs={tabs.map((t) => ({ id: t.id, label: <>{t.label}{t.fields.some((f) => ed.errors[f.key]) && <span className="adm-tab-err" aria-label="has errors"> •</span>}</> }))} value={ed.tab} onChange={ed.setTab} />
          {tabs.filter((t) => t.id === ed.tab).map((t) => <FieldGrid key={t.id} specs={t.fields} draft={ed.draft} setDraft={ed.setDraft} errors={ed.errors} />)}
        </>
      )}
    </div>
  );
  if (!preview) return body;
  return (
    <div className="adm-editor-split">
      <div className="adm-editor-main">{body}</div>
      <aside className="adm-editor-preview" aria-label="Live preview">
        <div className="adm-preview-label">Live preview</div>
        {preview(ed.draft)}
      </aside>
    </div>
  );
}

function SaveBar({ ed, onCancel, saveLabel, cancelLabel = 'Cancel' }: { ed: Editor; onCancel?: () => void; saveLabel?: string; cancelLabel?: string }) {
  return (
    <>
      <span className="adm-dirty body-sm" aria-live="polite">{ed.dirty ? 'Unsaved changes' : ed.isNew ? '' : 'All changes saved'}</span>
      {onCancel ? <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button> : ed.dirty && <Button variant="ghost" onClick={ed.reset}>Discard</Button>}
      <Button onClick={() => void ed.save()} disabled={ed.saving || (!ed.dirty && !ed.isNew)}>{ed.saving ? 'Saving…' : saveLabel ?? (ed.isNew ? 'Create' : 'Save changes')}</Button>
    </>
  );
}

// ──────────────────────────────────────── drawer editor
export interface RecordEditorProps extends Omit<EditorOpts, 'record'> {
  open: boolean;
  onClose: () => void;
  record: Record<string, any> | null;
  title?: ReactNode;
  sub?: ReactNode;
  preview?: (d: any) => ReactNode;
  wide?: boolean;
  top?: ReactNode;
}

function RecordEditorInner({ onClose, title, sub, preview, wide, top, ...opts }: Omit<RecordEditorProps, 'open'>) {
  const ed = useEditor({ ...opts, onSaved: (r) => { opts.onSaved?.(r); onClose(); } });
  const [confirm, setConfirm] = useState(false);
  const requestClose = () => (ed.dirty ? setConfirm(true) : onClose());
  const label = COLLECTIONS[opts.col].label;
  return (
    <>
      <Drawer open onClose={requestClose} wide={wide || !!preview} title={title ?? (ed.isNew ? `New · ${label}` : `Edit · ${label}`)} sub={sub} footer={<SaveBar ed={ed} onCancel={requestClose} />}>
        <EditorBody ed={ed} tabs={opts.tabs} fields={opts.fields} preview={preview} showActive top={top} />
      </Drawer>
      <Confirm open={confirm} title="Discard unsaved changes?" body="You have changes that haven't been saved. Close the editor and lose them?" confirmLabel="Discard changes" danger onConfirm={onClose} onClose={() => setConfirm(false)} />
    </>
  );
}

/** Drawer form editor driven by a per-collection field schema. Mount with a `key` per record. */
export function RecordEditor({ open, ...rest }: RecordEditorProps) {
  if (!open) return null;
  return <RecordEditorInner {...rest} />;
}

// ──────────────────────────────────────── inline editor (Journey Builder, Settings…)
export function RecordForm({ preview, top, showActive = true, saveLabel, className = '', ...opts }: EditorOpts & { preview?: (d: any) => ReactNode; top?: ReactNode; showActive?: boolean; saveLabel?: string; className?: string }) {
  const ed = useEditor(opts);
  return (
    <div className={`adm-inline-form ${className}`}>
      <EditorBody ed={ed} tabs={opts.tabs} fields={opts.fields} preview={preview} showActive={showActive} top={top} />
      <div className="adm-savebar">
        <SaveBar ed={ed} saveLabel={saveLabel} />
      </div>
    </div>
  );
}

/** Edit-only singleton (settings, branding, freeTool, blueprint). */
export function SingletonForm<C extends 'settings' | 'branding' | 'freeTool' | 'blueprint'>({ col, ...rest }: { col: C; tabs?: EditorTab[]; fields?: FieldSpec[]; preview?: (d: any) => ReactNode; top?: ReactNode; saveLabel?: string; transform?: (d: any) => any }) {
  const rec = useSingleton(col) as RecOf<C> | undefined;
  if (!rec) return <Loading h={200} />;
  return <RecordForm key={rec.id} col={col} record={rec as unknown as Record<string, any>} showActive={false} {...rest} />;
}
