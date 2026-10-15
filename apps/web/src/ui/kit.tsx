import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, wordCount, type ColorKey, type FieldDef } from '@shift/core';
import { useSettings } from '@/data';
import { Icon } from './Icon';
import { Art } from './Art';

// ─────────────────────────── buttons
type Variant = 'primary' | 'taupe' | 'rose' | 'sage' | 'outline' | 'ghost' | 'soft' | 'light' | 'danger';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: 'sm' | 'md' | 'lg'; arrow?: boolean; icon?: string; caps?: boolean; block?: boolean; to?: string; href?: string }

/** Rounded pill button. Pass `to` for an internal link, `href` for an external one. */
export function Button({ variant = 'primary', size = 'md', arrow, icon, caps, block, to, href, className = '', children, ...rest }: BtnProps) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${caps ? 'btn-caps' : ''} ${block ? 'btn-block' : ''} ${className}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {arrow && <Icon name="arrow-right" size={16} />}
    </>
  );
  if (to) return <Link to={to} className={cls} aria-disabled={rest.disabled}>{inner}</Link>;
  if (href) return <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{inner}</a>;
  return <button type="button" className={cls} {...rest}>{inner}</button>;
}

export function IconButton({ icon, label, onClick, size = 'md', className = '' }: { icon: string; label: string; onClick?: () => void; size?: 'sm' | 'md'; className?: string }) {
  return (
    <button type="button" className={`icon-btn ${size === 'sm' ? 'sm' : ''} ${className}`} aria-label={label} title={label} onClick={onClick}>
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
}

// ─────────────────────────── text bits
export const Kicker = ({ children, rose, className = '', style }: { children: ReactNode; rose?: boolean; className?: string; style?: CSSProperties }) => <div className={`kicker ${rose ? 'rose' : ''} ${className}`} style={style}>{children}</div>;
export const Script = ({ children, size = 32, className = '', style }: { children: ReactNode; size?: number; className?: string; style?: CSSProperties }) => <div className={`script ${className}`} style={{ fontSize: size, ...style }}>{children}</div>;
export const Pill = ({ children, tone = 'default', className = '' }: { children: ReactNode; tone?: 'default' | 'sage' | 'blush' | 'rose' | 'taupe' | 'deep' | 'outline' | 'tan' | 'beige'; className?: string }) => <span className={`pill ${tone !== 'default' ? `pill-${tone}` : ''} ${className}`}>{children}</span>;
export const Num = ({ n, tone, size, className = '' }: { n: ReactNode; tone?: 'deep' | 'sage' | 'taupe' | 'outline'; size?: 'lg' | 'xl'; className?: string }) => <span className={`num ${tone ?? ''} ${size ?? ''} ${className}`}>{n}</span>;
export function IconCircle({ name, tone, size, className = '' }: { name: string; tone?: 'sage' | 'taupe' | 'cream' | 'white'; size?: 'sm' | 'lg'; className?: string }) {
  return <span className={`icon-circle ${tone ?? ''} ${size ?? ''} ${className}`}><Icon name={name} size={size === 'sm' ? 16 : size === 'lg' ? 28 : 22} /></span>;
}
export const DraftTag = () => <span className="draft-tag">DRAFT</span>;

export function SectionHead({ kicker, title, sub, center, num, icon, actions }: { kicker?: ReactNode; title: ReactNode; sub?: ReactNode; center?: boolean; num?: ReactNode; icon?: string; actions?: ReactNode }) {
  return (
    <div className={`wrap-row gap-16 ${center ? 'center' : ''}`} style={{ justifyContent: center ? 'center' : 'space-between', marginBottom: 20 }}>
      <div className="row gap-16" style={{ alignItems: 'flex-start', flexDirection: center ? 'column' : 'row', ...(center ? { alignItems: 'center' } : {}) }}>
        {num !== undefined && <Num n={num} size="lg" />}
        {icon && <IconCircle name={icon} />}
        <div className="stack gap-4">
          {kicker && <Kicker>{kicker}</Kicker>}
          <h2 className="h3">{title}</h2>
          {sub && <p className="muted body-sm">{sub}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function Checklist({ items, icon = 'check', className = '', color }: { items: ReactNode[]; icon?: string; className?: string; color?: string }) {
  return (
    <ul className={`checklist ${className}`}>
      {items.map((it, i) => (
        <li key={i}>
          <Icon name={icon} size={16} style={color ? { color } : undefined} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** Price from master data; null price shows the configured placeholder. */
export function Price({ amount, each, placeholder = 'Price on enquiry', className = '' }: { amount: number | null | undefined; each?: boolean; placeholder?: string; className?: string }) {
  const s = useSettings();
  const p = formatPrice(amount ?? null, s?.currency ?? 'AED');
  return <span className={className}>{p ? `${p}${each ? ' each' : ''}` : placeholder}</span>;
}
export function usePriceText() {
  const s = useSettings();
  return (amount: number | null | undefined) => formatPrice(amount ?? null, s?.currency ?? 'AED');
}

export const colorClass = (c?: ColorKey | string) => (c ? `c-${c}` : '');

// ─────────────────────────── progress
export function Ring({ pct, size = 96, stroke = 9, color = 'var(--deep)', track = 'var(--line)', label, sub, children }: { pct: number; size?: number; stroke?: number; color?: string; track?: string; label?: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }} role="img" aria-label={`${Math.round(v)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .5s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {children ?? (
          <>
            <span className="serif" style={{ fontSize: size * 0.24, color: 'var(--ink)', lineHeight: 1 }}>{label ?? `${Math.round(v)}%`}</span>
            {sub && <span className="body-sm muted">{sub}</span>}
          </>
        )}
      </div>
    </div>
  );
}
export const ProgressBar = ({ pct, color }: { pct: number; color?: string }) => (
  <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
    <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
  </div>
);

export function Stepper({ steps, current, done = [], onStep }: { steps: { label: string; sub?: string }[]; current: number; done?: number[]; onStep?: (i: number) => void }) {
  return (
    <nav className="stepper" aria-label="Lesson steps">
      {steps.map((s, i) => {
        const isDone = done.includes(i) && i !== current;
        return (
          <button key={i} type="button" className={`stepper-step ${i === current ? 'current' : ''} ${isDone ? 'done' : ''}`} onClick={() => onStep?.(i)} aria-current={i === current ? 'step' : undefined}>
            <span className="stepper-dot">{isDone ? <Icon name="check" size={16} /> : i + 1}</span>
            <span className="stepper-title">{s.label}</span>
            {s.sub && <span className="stepper-sub">{s.sub}</span>}
          </button>
        );
      })}
    </nav>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────── form controls
export function Field({ label, required, help, error, children, htmlFor }: { label?: ReactNode; required?: boolean; help?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {help && <div className="field-help">{help}</div>}
      {children}
      {error && <div className="field-error" role="alert">{error}</div>}
    </div>
  );
}
export function TextInput({ label, value, onChange, placeholder, type = 'text', required, help, error, ...rest }: { label?: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; help?: ReactNode; error?: ReactNode; autoComplete?: string; name?: string }) {
  const id = useId();
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <input id={id} className="input" type={type} value={value ?? ''} placeholder={placeholder} required={required} aria-invalid={!!error} onChange={(e) => onChange(e.target.value)} {...rest} />
    </Field>
  );
}
export function TextArea({ label, value, onChange, placeholder, rows = 4, required, help, error, maxWords, showCount }: { label?: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean; help?: ReactNode; error?: ReactNode; maxWords?: number; showCount?: boolean }) {
  const id = useId();
  const wc = wordCount(value ?? '');
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <textarea id={id} className="textarea" rows={rows} value={value ?? ''} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} />
      {(showCount || maxWords) && <div className="body-sm faint" style={{ textAlign: 'right' }}>{wc}{maxWords ? `/${maxWords}` : ''} words</div>}
    </Field>
  );
}
export function Select({ label, value, onChange, options, placeholder, required, help, error }: { label?: ReactNode; value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string; required?: boolean; help?: ReactNode; error?: ReactNode }) {
  const id = useId();
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <select id={id} className="select" value={value ?? ''} required={required} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder ?? 'Select an option'}</option>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          return <option key={v} value={v}>{typeof o === 'string' ? o : o.label}</option>;
        })}
      </select>
    </Field>
  );
}
export function Checkboxes({ label, options, value, onChange, allowOther, columns = 2, help, required, error }: { label?: ReactNode; options: string[]; value: string[]; onChange: (v: string[]) => void; allowOther?: boolean; columns?: 1 | 2; help?: ReactNode; required?: boolean; error?: ReactNode }) {
  const vals = value ?? [];
  const other = vals.find((v) => v.startsWith('Other:'))?.slice(6).trim() ?? '';
  const toggle = (o: string) => onChange(vals.includes(o) ? vals.filter((x) => x !== o) : [...vals, o]);
  return (
    <Field label={label} help={help} required={required} error={error}>
      <div className={columns === 2 ? 'checks-2' : 'stack'}>
        {options.map((o) => (
          <label key={o} className="check">
            <input type="checkbox" checked={vals.includes(o)} onChange={() => toggle(o)} />
            {o}
          </label>
        ))}
        {allowOther && (
          <label className="check" style={{ gap: 8 }}>
            <input type="checkbox" checked={vals.some((v) => v.startsWith('Other:'))} onChange={(e) => onChange(e.target.checked ? [...vals, 'Other: '] : vals.filter((v) => !v.startsWith('Other:')))} />
            Other:
            <input className="input" style={{ minHeight: 32, padding: '4px 10px' }} value={other} aria-label="Other" onChange={(e) => onChange([...vals.filter((v) => !v.startsWith('Other:')), `Other: ${e.target.value}`])} />
          </label>
        )}
      </div>
    </Field>
  );
}
export function Slider({ label, value, onChange, min = 1, max = 10, step = 1, lowLabel, highLabel }: { label?: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; lowLabel?: string; highLabel?: string }) {
  const id = useId();
  return (
    <div className="field">
      {label && <label className="field-label" htmlFor={id}>{label}</label>}
      <input id={id} type="range" className="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {(lowLabel || highLabel) && (
        <div className="row between body-sm muted"><span>{min}<br />{lowLabel}</span><span style={{ textAlign: 'right' }}>{max}<br />{highLabel}</span></div>
      )}
    </div>
  );
}

/** Renders any master FieldDef (forms builder + tool worksheets). */
export function FieldRenderer({ field, value, onChange, error }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string }) {
  const common = { label: field.label, required: field.required, help: field.helper, error };
  switch (field.type) {
    case 'heading':
      return <h3 className="h4" style={{ marginTop: 8 }}>{field.label}</h3>;
    case 'paragraph':
      return (
        <div className="card-soft card-pad-sm">
          <div className="field-label">{field.label}</div>
          <p className="body-sm muted" style={{ marginTop: 4 }}>{field.helper}</p>
        </div>
      );
    case 'textarea':
      return <TextArea {...common} value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder} />;
    case 'select':
      return <Select {...common} value={(value as string) ?? ''} onChange={onChange} options={field.options ?? []} placeholder={field.placeholder} />;
    case 'checkboxes':
      return <Checkboxes {...common} options={field.options ?? []} value={(value as string[]) ?? []} onChange={onChange} allowOther={field.allowOther} />;
    case 'consent':
      return (
        <label className="check">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked || undefined)} />
          <span>{field.label}{field.required && <span className="req" style={{ color: 'var(--rose-deep)' }}> *</span>}</span>
        </label>
      );
    case 'signature':
      return <TextInput {...common} value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder ?? 'Type your full name'} />;
    case 'email':
      return <TextInput {...common} type="email" value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder} autoComplete="email" />;
    case 'phone':
      return <PhoneInput {...common} value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder} />;
    case 'date':
      return <TextInput {...common} type="date" value={(value as string) ?? ''} onChange={onChange} />;
    case 'number':
      return <TextInput {...common} type="number" value={(value as string) ?? ''} onChange={onChange} />;
    case 'wheel':
      return <div className="field"><div className="field-label">{field.label}</div><div className="field-help">{field.helper}</div><WheelInlineSlot value={value as Record<string, number>} onChange={onChange} /></div>;
    default:
      return <TextInput {...common} value={(value as string) ?? ''} onChange={onChange} placeholder={field.placeholder} />;
  }
}

/** Late-bound wheel editor so kit.tsx doesn't import charts (avoids a cycle). Registered in charts.tsx. */
let WheelEditorImpl: ((p: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) => JSX.Element) | null = null;
export function registerWheelEditor(c: typeof WheelEditorImpl) {
  WheelEditorImpl = c;
}
function WheelInlineSlot({ value, onChange }: { value: Record<string, number>; onChange: (v: unknown) => void }) {
  return WheelEditorImpl ? <WheelEditorImpl value={value ?? {}} onChange={onChange} /> : null;
}

export function PhoneInput({ label, value, onChange, placeholder, required, help, error }: { label?: ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; help?: ReactNode; error?: ReactNode }) {
  const id = useId();
  const [code, num] = value?.startsWith('+') ? [value.split(' ')[0], value.split(' ').slice(1).join(' ')] : ['+971', value ?? ''];
  return (
    <Field label={label} required={required} help={help} error={error} htmlFor={id}>
      <div className="row gap-8">
        <select className="select" style={{ width: 110, flex: 'none' }} aria-label="Country code" value={code} onChange={(e) => onChange(`${e.target.value} ${num}`)}>
          {['+971', '+966', '+974', '+973', '+968', '+965', '+44', '+353', '+1', '+91'].map((c) => <option key={c} value={c}>{c === '+971' ? '🇦🇪 ' : ''}{c}</option>)}
        </select>
        <input id={id} className="input" type="tel" inputMode="tel" autoComplete="tel-national" value={num} placeholder={placeholder} onChange={(e) => onChange(`${code} ${e.target.value}`)} />
      </div>
    </Field>
  );
}

// ─────────────────────────── autosave
/** Debounced save: returns [status, trigger]. Status drives the "Autosaved" indicator. */
export function useAutosave<T>(save: (v: T) => Promise<unknown>, delay = 800) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timer = useRef<number>();
  const latest = useRef(save);
  latest.current = save;
  const trigger = useCallback((v: T) => {
    window.clearTimeout(timer.current);
    setStatus('saving');
    timer.current = window.setTimeout(() => {
      latest.current(v).then(() => setStatus('saved'), () => setStatus('error'));
    }, delay);
  }, [delay]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [status, trigger] as const;
}
export function AutosaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  return (
    <span className="autosave" aria-live="polite">
      {status === 'saving' ? <span className="skeleton" style={{ width: 12, height: 12, borderRadius: 99 }} /> : <Icon name={status === 'error' ? 'alert' : 'check'} size={14} style={{ color: status === 'error' ? 'var(--danger)' : 'var(--deep)' }} />}
      {status === 'saving' ? 'Saving…' : status === 'error' ? 'Not saved' : 'Autosaved'}
    </span>
  );
}

// ─────────────────────────── overlays
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="modal-head">
          <h2 className="h4">{title}</h2>
          <IconButton icon="x" label="Close" onClick={onClose} size="sm" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, title, body, confirmLabel = 'Confirm', danger, onConfirm, onClose }: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <div className="body-sm">{body}</div>
    </Modal>
  );
}

interface ToastItem { id: number; text: string; error?: boolean }
const ToastCtx = createContext<(text: string, error?: boolean) => void>(() => undefined);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, error }]);
    window.setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((t) => <div key={t.id} className={`toast ${t.error ? 'error' : ''}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

export function Empty({ icon = 'leaf', title, children }: { icon?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty stack gap-12" style={{ alignItems: 'center' }}>
      <IconCircle name={icon} tone="sage" />
      <div className="h4">{title}</div>
      {children && <div className="body-sm">{children}</div>}
    </div>
  );
}
export const Loading = ({ h = 240 }: { h?: number }) => <div className="skeleton" style={{ height: h }} aria-label="Loading" />;

// ─────────────────────────── video
/** Video player with brand thumbnail (handwritten overlay) — plays the lesson video URL once set in admin. */
export function VideoPlayer({ url, overlay, duration = '5:12', image = 'sunset-woman', caption, onProgress, className = '' }: { url?: string; overlay?: string; duration?: string; image?: string; caption?: string; onProgress?: (seconds: number) => void; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const isEmbed = url && /youtube|youtu\.be|vimeo/.test(url);
  if (playing && url) {
    return (
      <div className={`rounded-lg ratio-16x9 ${className}`} style={{ background: '#000' }}>
        {isEmbed ? (
          <iframe title="Lesson video" src={url.replace('watch?v=', 'embed/')} style={{ width: '100%', height: '100%', border: 0 }} allow="autoplay; fullscreen" allowFullScreen />
        ) : (
          <video src={url} controls autoPlay style={{ width: '100%', height: '100%' }} onTimeUpdate={(e) => onProgress?.(Math.floor(e.currentTarget.currentTime))} />
        )}
      </div>
    );
  }
  return (
    <div className={`rounded-lg ${className}`} style={{ position: 'relative' }}>
      <Art src={image} quote={overlay} quotePos="tl" quoteSize={30} className="ratio-16x9" />
      {caption && <div style={{ position: 'absolute', left: '10%', right: '10%', bottom: 56, background: 'rgba(0,0,0,.45)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>{caption}</div>}
      <button type="button" onClick={() => setPlaying(true)} aria-label={url ? 'Play video' : 'Video coming soon'} title={url ? 'Play' : 'Video URL not set yet (Admin › Journey Builder)'} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 64, height: 64, borderRadius: 999, border: 0, background: '#fff', color: '#22281f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,.2)' }}>
        <Icon name="play" size={24} />
      </button>
      <div className="row gap-12" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px', color: '#fff', background: 'linear-gradient(transparent, rgba(0,0,0,.45))' }}>
        <Icon name="play" size={14} />
        <span className="body-sm">0:00 / {duration}</span>
        <span style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.45)', borderRadius: 3 }}><span style={{ display: 'block', width: '18%', height: '100%', background: '#fff', borderRadius: 3 }} /></span>
        <Icon name="volume" size={16} />
        <Icon name="cc" size={16} />
        <Icon name="gear" size={16} />
        <Icon name="fullscreen" size={16} />
      </div>
    </div>
  );
}
