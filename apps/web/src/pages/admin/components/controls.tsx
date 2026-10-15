import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { ColorKey } from '@shift/core';
import { client, useSettings } from '@/data';
import { Field, IconButton, useToast } from '@/ui/kit';
import { Icon, ICON_NAMES } from '@/ui/Icon';
import { Art, ART_SCENES } from '@/ui/Art';
import { COLOR_HEX, COLOR_KEYS, errMsg, fromLocalInput, toLocalInput } from './util';

/* Small, accessible form controls used across the admin CMS. */

export function Switch({ checked, onChange, label, hideLabel, disabled, small }: { checked: boolean; onChange: (v: boolean) => void; label: string; hideLabel?: boolean; disabled?: boolean; small?: boolean }) {
  return (
    <label className={`adm-switch ${small ? 'sm' : ''} ${disabled ? 'is-disabled' : ''}`} title={hideLabel ? label : undefined}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} aria-checked={checked} aria-label={hideLabel ? label : undefined} onChange={(e) => onChange(e.target.checked)} />
      <span className="adm-switch-track" aria-hidden><span className="adm-switch-thumb" /></span>
      {!hideLabel && <span className="adm-switch-label">{label}</span>}
    </label>
  );
}

export function NumberField({ label, value, onChange, nullable, help, min, max, step, required, error, placeholder }: { label?: ReactNode; value: number | null | undefined; onChange: (v: number | null) => void; nullable?: boolean; help?: ReactNode; min?: number; max?: number; step?: number; required?: boolean; error?: ReactNode; placeholder?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} htmlFor={id} required={required} error={error}>
      <input
        id={id}
        className="input"
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') onChange(nullable ? null : 0);
          else onChange(Number(raw));
        }}
      />
    </Field>
  );
}

/** Nullable price — empty means "Price on enquiry". Currency comes from Settings. */
export function PriceField({ label = 'Price', value, onChange, nullable = true, help }: { label?: ReactNode; value: number | null | undefined; onChange: (v: number | null) => void; nullable?: boolean; help?: ReactNode }) {
  const s = useSettings();
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help ?? (nullable ? 'Leave empty for "Price on enquiry". 0 shows as FREE.' : undefined)}>
      <div className="adm-price">
        <span className="adm-price-cur" aria-hidden>{s?.currency ?? 'AED'}</span>
        <input id={id} className="input" type="number" min={0} inputMode="decimal" placeholder={nullable ? 'Price on enquiry' : '0'} value={value === null || value === undefined ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? (nullable ? null : 0) : Number(e.target.value))} />
      </div>
    </Field>
  );
}

export function ColorKeySelect({ label = 'Colour', value, onChange, help }: { label?: ReactNode; value: string; onChange: (v: ColorKey) => void; help?: ReactNode }) {
  const name = useId();
  return (
    <fieldset className="adm-fieldset-plain">
      <legend className="field-label">{label}</legend>
      {help && <div className="field-help">{help}</div>}
      <div className="adm-swatches" role="radiogroup">
        {COLOR_KEYS.map((k) => (
          <label key={k} className={`adm-swatch ${value === k ? 'on' : ''}`} title={k}>
            <input type="radio" name={name} value={k} checked={value === k} onChange={() => onChange(k)} className="sr-only" />
            <span className="adm-swatch-dot" style={{ background: COLOR_HEX[k] }} aria-hidden />
            <span className="adm-swatch-name">{k}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function IconPicker({ label = 'Icon', value, onChange }: { label?: ReactNode; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const id = useId();
  const list = ICON_NAMES.filter((n) => n.includes(q.toLowerCase()));
  return (
    <div className="field">
      <span className="field-label" id={`${id}-l`}>{label}</span>
      <div className="row gap-8">
        <button type="button" className="adm-icon-current" aria-expanded={open} aria-controls={`${id}-grid`} aria-labelledby={`${id}-l`} onClick={() => setOpen((o) => !o)}>
          <Icon name={value || 'circle'} size={20} />
          <span>{value || 'Choose icon'}</span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
        </button>
      </div>
      {open && (
        <div className="adm-picker" id={`${id}-grid`}>
          <input className="input" placeholder="Search icons…" aria-label="Search icons" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="adm-icon-grid">
            {list.map((n) => (
              <button key={n} type="button" className={`adm-icon-opt ${n === value ? 'on' : ''}`} aria-label={n} aria-pressed={n === value} title={n} onClick={() => { onChange(n); setOpen(false); }}>
                <Icon name={n} size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function useUpload() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const upload = async (file: File | undefined | null) => {
    if (!file) return null;
    setBusy(true);
    try {
      const url = await client.upload(file);
      toast('Uploaded');
      return url;
    } catch (e) {
      toast(errMsg(e), true);
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy };
}

export function UploadButton({ label = 'Upload', accept = 'image/*', onUploaded }: { label?: string; accept?: string; onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const { upload, busy } = useUpload();
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const url = await upload(e.target.files?.[0]);
          if (url) onUploaded(url);
          e.target.value = '';
        }}
      />
      <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => ref.current?.click()}>
        <Icon name="upload" size={16} />
        {busy ? 'Uploading…' : label}
      </button>
    </>
  );
}

const isUrl = (s: string) => /^(https?:|data:|\/|blob:)/.test(s);

/** Placeholder art scene picker + upload. Value is a scene name or an uploaded URL. */
export function ImagePicker({ label = 'Image', value, onChange, help, allowEmpty = true }: { label?: ReactNode; value: string; onChange: (v: string) => void; help?: ReactNode; allowEmpty?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {help && <div className="field-help">{help}</div>}
      <div className="adm-image-row">
        <div className="adm-image-thumb">{value ? <Art src={value} className="ratio-4x3" alt="" /> : <div className="adm-image-empty ratio-4x3">No image</div>}</div>
        <div className="stack gap-8" style={{ minWidth: 0, flex: 1 }}>
          <div className="body-sm muted adm-ellipsis">{value ? (isUrl(value) ? 'Uploaded image' : `Scene: ${value}`) : 'None selected'}</div>
          <div className="wrap-row gap-8">
            <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open} aria-controls={`${id}-grid`} onClick={() => setOpen((o) => !o)}>
              <Icon name="image" size={16} /> {open ? 'Close library' : 'Choose scene'}
            </button>
            <UploadButton onUploaded={onChange} />
            {allowEmpty && value && <button type="button" className="link body-sm" onClick={() => onChange('')}>Remove</button>}
          </div>
        </div>
      </div>
      {open && (
        <div className="adm-picker" id={`${id}-grid`}>
          <div className="adm-scene-grid">
            {ART_SCENES.map((s) => (
              <button key={s} type="button" className={`adm-scene ${s === value ? 'on' : ''}`} aria-pressed={s === value} onClick={() => { onChange(s); setOpen(false); }}>
                <Art src={s} className="ratio-4x3" />
                <span>{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** URL text field with an upload button (PDF worksheets, etc.). */
export function FileField({ label, value, onChange, accept = 'application/pdf', help }: { label: ReactNode; value: string; onChange: (v: string) => void; accept?: string; help?: ReactNode }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help}>
      <div className="row gap-8 adm-file-row">
        <input id={id} className="input" value={value?.startsWith('data:') ? '(uploaded file)' : value ?? ''} placeholder="https://… or upload" onChange={(e) => onChange(e.target.value)} readOnly={value?.startsWith('data:')} />
        <UploadButton label="Upload" accept={accept} onUploaded={onChange} />
        {value && <IconButton icon="x" label="Clear" size="sm" onClick={() => onChange('')} />}
      </div>
    </Field>
  );
}

export function DateTimeField({ label, value, onChange, help, dateOnly }: { label: ReactNode; value: string | null | undefined; onChange: (v: string | null) => void; help?: ReactNode; dateOnly?: boolean }) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} help={help}>
      {dateOnly ? (
        <input id={id} className="input" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} />
      ) : (
        <input id={id} className="input" type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />
      )}
    </Field>
  );
}

/** Move up / down buttons — the keyboard alternative to drag-and-drop. */
export function MoveButtons({ onUp, onDown, label, first, last }: { onUp: () => void; onDown: () => void; label: string; first?: boolean; last?: boolean }) {
  return (
    <span className="adm-move">
      <button type="button" className="adm-mini" aria-label={`Move ${label} up`} title="Move up" disabled={first} onClick={onUp}><Icon name="chevron-up" size={14} /></button>
      <button type="button" className="adm-mini" aria-label={`Move ${label} down`} title="Move down" disabled={last} onClick={onDown}><Icon name="chevron-down" size={14} /></button>
    </span>
  );
}

export const move = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
};

/** Editable list of strings (add / remove / reorder). */
export function StringList({ label, value, onChange, placeholder, multiline, help, addLabel = 'Add item' }: { label?: ReactNode; value: string[] | undefined; onChange: (v: string[]) => void; placeholder?: string; multiline?: boolean; help?: ReactNode; addLabel?: string }) {
  const list = value ?? [];
  const lastRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [focusNew, setFocusNew] = useState(false);
  useEffect(() => {
    if (focusNew) {
      lastRef.current?.focus();
      setFocusNew(false);
    }
  }, [focusNew, list.length]);
  const groupLabel = typeof label === 'string' ? label : 'Item';
  return (
    <fieldset className="adm-fieldset-plain">
      {label && <legend className="field-label">{label}</legend>}
      {help && <div className="field-help">{help}</div>}
      <ol className="adm-strlist">
        {list.map((s, i) => (
          <li key={i} className="adm-strlist-row">
            <span className="adm-strlist-n" aria-hidden>{i + 1}</span>
            {multiline ? (
              <textarea ref={i === list.length - 1 ? (el) => { lastRef.current = el; } : undefined} className="textarea" rows={2} aria-label={`${groupLabel} ${i + 1}`} value={s} placeholder={placeholder} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
            ) : (
              <input ref={i === list.length - 1 ? (el) => { lastRef.current = el; } : undefined} className="input" aria-label={`${groupLabel} ${i + 1}`} value={s} placeholder={placeholder} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} />
            )}
            <MoveButtons label={`${groupLabel} ${i + 1}`} first={i === 0} last={i === list.length - 1} onUp={() => onChange(move(list, i, i - 1))} onDown={() => onChange(move(list, i, i + 1))} />
            <button type="button" className="adm-mini danger" aria-label={`Remove ${groupLabel} ${i + 1}`} title="Remove" onClick={() => onChange(list.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-ghost btn-sm adm-add" onClick={() => { onChange([...list, '']); setFocusNew(true); }}>
        <Icon name="plus" size={16} /> {addLabel}
      </button>
    </fieldset>
  );
}

/** Multi-select as a checkbox list. */
export function CheckList({ label, options, value, onChange, help }: { label?: ReactNode; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; help?: ReactNode }) {
  return (
    <fieldset className="adm-fieldset-plain">
      {label && <legend className="field-label">{label}</legend>}
      {help && <div className="field-help">{help}</div>}
      <div className="checks-2">
        {options.map((o) => (
          <label key={o.value} className="check">
            <input type="checkbox" checked={value.includes(o.value)} onChange={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Right-hand drawer (full screen on phones). */
export function Drawer({ open, onClose, title, sub, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => ref.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="adm-drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`adm-drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="adm-drawer-head">
          <div className="stack" style={{ minWidth: 0 }}>
            <h2 className="h4">{title}</h2>
            {sub && <div className="body-sm muted">{sub}</div>}
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} size="sm" />
        </div>
        <div className="adm-drawer-body">{children}</div>
        {footer && <div className="adm-drawer-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Uppercase letter-spaced pill tinted by a master colour key. */
export function TonePill({ tone, children, className = '' }: { tone?: string; children: ReactNode; className?: string }) {
  return <span className={`pill adm-tone tone-${tone ?? 'beige'} ${className}`}>{children}</span>;
}

export function StatCard({ value, label, note, delta }: { value: ReactNode; label: ReactNode; note?: ReactNode; delta?: ReactNode }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-value">{value}</div>
      <div className="adm-stat-label">{label}</div>
      {delta && <div className="adm-stat-note">{delta}</div>}
      {note && <div className="adm-stat-note">{note}</div>}
    </div>
  );
}

export function AdminSection({ title, sub, actions, children, id }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="adm-section" aria-labelledby={id}>
      <div className="adm-section-head">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          <h2 className="adm-h2" id={id}>{title}</h2>
          {sub && <p className="body-sm muted">{sub}</p>}
        </div>
        {actions && <div className="wrap-row gap-8">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export const Dash = () => <span className="faint" aria-label="none">—</span>;
