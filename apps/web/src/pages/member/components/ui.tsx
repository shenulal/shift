import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { wordCount } from '@shift/core';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Loading } from '@/ui/kit';

/** `m-tone-<color>` sets --t-soft / --t-strong / --t-ink for a master-data ColorKey (see member.css). */
export const tone = (c?: string | null) => `m-tone-${c || 'sage'}`;

export function PageLoading() {
  return (
    <div className="wrap section-sm" aria-busy="true">
      <div className="stack gap-16">
        <Loading h={220} />
        <Loading h={320} />
      </div>
    </div>
  );
}

/** Small icon + two-line caption items ("6 min video / Learn"). */
export function MetaRow({ items, className = '' }: { items: { icon: string; title: ReactNode; sub?: ReactNode }[]; className?: string }) {
  return (
    <ul className={`m-meta ${className}`}>
      {items.map((m, i) => (
        <li key={i}>
          <span className="m-meta-ic" aria-hidden="true"><Icon name={m.icon} size={18} /></span>
          <span>
            <span className="m-meta-t">{m.title}</span>
            {m.sub && <span className="m-meta-s">{m.sub}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Step screen header: blush icon circle, "Lesson n of 3", serif title and intro. */
export function StepHead({ icon, kicker, title, sub, aside, num }: { icon: string; kicker?: ReactNode; title: ReactNode; sub?: ReactNode; aside?: ReactNode; num?: ReactNode }) {
  return (
    <div className="m-stephead">
      <span className="m-stephead-ic" aria-hidden="true"><Icon name={icon} size={24} /></span>
      <div className="grow stack gap-4">
        {kicker && <div className="m-lesson-n">{kicker}</div>}
        <h2 className="h2">{num !== undefined && <span className="m-num-inline">{num}. </span>}{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {aside && <div className="m-stephead-aside">{aside}</div>}
    </div>
  );
}

/** Section heading used on long single-page tools ("3. Habit Progress This Week"). */
export function SectionTitle({ icon, title, sub, num, aside, id }: { icon?: string; title: ReactNode; sub?: ReactNode; num?: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="m-sectitle">
      {icon && <span className="m-sectitle-ic" aria-hidden="true"><Icon name={icon} size={22} /></span>}
      <div className="grow stack gap-4" style={{ minWidth: 0 }}>
        <h3 className="h3" id={id}>{num !== undefined && <span>{num}. </span>}{title}</h3>
        {sub && <p className="body-sm muted">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Handwritten quote on a soft card with a leaf sprig. */
export function QuoteCard({ quote, tone: t = 'blush', className = '' }: { quote: string; tone?: 'blush' | 'sage' | 'cream'; className?: string }) {
  if (!quote) return null;
  return (
    <figure className={`m-quotecard m-quotecard-${t} ${className}`}>
      <Leaf className="m-quotecard-leaf" />
      <blockquote className="script">{quote}</blockquote>
    </figure>
  );
}

/** Decorative leaf sprig (line art). */
export function Leaf({ className = '', size = 64 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size * 1.4} viewBox="0 0 50 70" aria-hidden="true" fill="none">
      <path d="M25 68C24 50 22 30 30 4" stroke="#6f7c63" strokeWidth="1.6" />
      <path d="M26 50c-8-2-16-10-16-20 8 2 14 9 16 20zM27 38c6-4 14-6 18-14-8 0-15 5-18 14zM28 24c-6-3-10-9-9-16 6 3 9 9 9 16z" fill="#8d9a85" opacity=".85" />
    </svg>
  );
}

/** Numbered reflection question with helper and textarea. */
export function QuestionField({ n, prompt, helper, placeholder, value, onChange, rows = 3, maxWords, tone: t = 'blush' }: { n?: number; prompt: string; helper?: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; maxWords?: number; tone?: 'blush' | 'sage' | 'cream' | 'plain' }) {
  const id = `q-${prompt.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${n ?? 0}`;
  const wc = wordCount(value ?? '');
  return (
    <div className={`m-question m-question-${t}`}>
      {n !== undefined && <span className="m-qnum" aria-hidden="true">{n}</span>}
      <div className="grow stack gap-8" style={{ minWidth: 0 }}>
        <label htmlFor={id} className="m-qprompt">{prompt}</label>
        {helper && <p className="m-qhelp" id={`${id}-h`}>{helper}</p>}
        <textarea id={id} className="textarea" rows={rows} value={value ?? ''} placeholder={placeholder || 'Write your thoughts here…'} aria-describedby={helper ? `${id}-h` : undefined} onChange={(e) => onChange(e.target.value)} />
        {maxWords && <div className={`body-sm ${wc > maxWords ? 'm-over' : 'faint'}`} style={{ textAlign: 'right' }}>{wc}/{maxWords} words</div>}
      </div>
    </div>
  );
}

/** Friendly panel when the person doesn't have access to a lesson or tool. */
export function LockedPanel({ title, body, actions }: { title: string; body: ReactNode; actions?: ReactNode }) {
  return (
    <div className="m-locked card-soft card-pad-lg">
      <span className="icon-circle lg" aria-hidden="true"><Icon name="lock" size={28} /></span>
      <h2 className="h3">{title}</h2>
      <div className="muted" style={{ maxWidth: 520 }}>{body}</div>
      {actions ?? (
        <div className="wrap-row gap-12" style={{ justifyContent: 'center' }}>
          <Button to="/journey" arrow>Explore the Journey</Button>
          <Button to="/coaching" variant="ghost">1:1 Coaching</Button>
        </div>
      )}
    </div>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="m-back">
      <Icon name="arrow-left" size={16} />
      {children}
    </Link>
  );
}

/** Art tile with an optional handwritten quote, used as an image card. */
export function ImageQuote({ src, quote, className = '', pos = 'tl', size = 30 }: { src: string; quote?: string; className?: string; pos?: 'tl' | 'tr' | 'bl' | 'br' | 'center'; size?: number }) {
  return <Art src={src || 'coast'} quote={quote} quotePos={pos} quoteSize={size} className={`rounded-lg ${className}`} />;
}

/** Status glyph used in the lesson lists (check / ring / lock). */
export function StatusGlyph({ status, label }: { status: 'completed' | 'in-progress' | 'available' | 'locked' | 'no-access' | 'current'; label?: string }) {
  if (status === 'completed') return <span className="m-glyph done" title={label ?? 'Completed'}><Icon name="check" size={12} stroke={2.4} /><span className="sr-only">{label ?? 'Completed'}</span></span>;
  if (status === 'locked' || status === 'no-access') return <span className="m-glyph lock" title={label ?? 'Locked'}><Icon name="lock" size={12} /><span className="sr-only">{label ?? 'Locked'}</span></span>;
  return <span className={`m-glyph ring ${status === 'current' || status === 'in-progress' ? 'on' : ''}`} title={label}><span className="sr-only">{label ?? 'Not started'}</span></span>;
}
