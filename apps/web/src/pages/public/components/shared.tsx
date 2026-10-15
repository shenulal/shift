import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Rec, Stage } from '@shift/core';
import { usePublicList } from '@/data';
import { Button, Loading } from '@/ui/kit';
import { Icon } from '@/ui/Icon';

/** `tone-<color>` class: sets --t-soft / --t-strong / --t-ink for a master-data ColorKey (see public.css). */
export const tone = (c?: string | null) => `tone-${c || 'sage'}`;

/** Placeholder shown while master data loads. */
export function PageLoading() {
  return (
    <div className="wrap section" aria-busy="true">
      <Loading h={320} />
    </div>
  );
}

/** Fix legacy/short internal routes stored in CMS copy so links never 404. */
const ROUTE_ALIASES: Record<string, string> = { '/discovery': '/discovery-call', '/enroll': '/enrol', '/contact': '/enquiry' };
export const normalizeHref = (href?: string) => (href ? ROUTE_ALIASES[href] ?? href : '/');
export const isExternal = (href?: string) => !!href && /^(https?:|mailto:|tel:)/.test(href);

/** Button for a CMS link: internal routes use the router, external URLs open in a new tab. */
export function CtaButton({ href, children, ...rest }: { href?: string; children: ReactNode } & Omit<Parameters<typeof Button>[0], 'to' | 'href' | 'children'>) {
  const h = normalizeHref(href);
  return isExternal(h) ? <Button href={h} {...rest}>{children}</Button> : <Button to={h} {...rest}>{children}</Button>;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusable = el.querySelector<HTMLElement>('h1, h2, h3') ?? el;
  if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '-1');
  focusable.focus({ preventScroll: true });
}

/** Active stages in admin order. */
export function useStages() {
  const q = usePublicList('stages');
  return q.data;
}

/** Active lessons grouped by stage id, ordered. */
export function useLessonsByStage() {
  const q = usePublicList('lessons');
  return useMemo(() => {
    if (!q.data) return undefined;
    const map: Record<string, typeof q.data> = {};
    for (const l of [...q.data].sort((a, b) => a.order - b.order)) (map[l.stageId] ??= []).push(l);
    return map;
  }, [q.data]);
}

/** Round letter badge (S/H/I/F/T) tinted with the stage colour. */
export function LetterCircle({ stage, letter, color, size = 'md', solid }: { stage?: Pick<Rec<Stage>, 'letter' | 'color'>; letter?: string; color?: string; size?: 'sm' | 'md' | 'lg'; solid?: boolean }) {
  return (
    <span className={`p-letter ${size} ${solid ? 'solid' : ''} ${tone(stage?.color ?? color)}`} aria-hidden="true">
      {stage?.letter ?? letter}
    </span>
  );
}

/** Icon-in-circle benefit rows (taupe circles in the client-journey designs). */
export function IconRows({ items, variant = 'taupe', className = '' }: { items: { text: string; icon: string }[]; variant?: 'taupe' | 'soft' | 'sage'; className?: string }) {
  return (
    <ul className={`p-iconrows ${variant} ${className}`}>
      {items.map((b, i) => (
        <li key={i}>
          <span className="p-iconrows-ic" aria-hidden="true"><Icon name={b.icon} size={22} /></span>
          <span>{b.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Deep-green numbered steps ("What happens next?"). */
export function NumberedSteps({ items, className = '' }: { items: { title: string; text?: string }[]; className?: string }) {
  return (
    <ol className={`p-steps ${className}`}>
      {items.map((s, i) => (
        <li key={i}>
          <span className="p-steps-num" aria-hidden="true">{i + 1}</span>
          <div>
            <div className="p-steps-title">{s.title}</div>
            {s.text && <div className="p-steps-text">{s.text}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Small uppercase letter-spaced label. */
export const Caps = ({ children, className = '', as: As = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'span' | 'h2' | 'h3' | 'p' }) => <As className={`p-caps ${className}`}>{children}</As>;

/** Row of icon + caption items separated by thin rules (support strips). */
export function IconStrip({ items, className = '' }: { items: { text: string; icon: string }[]; className?: string }) {
  return (
    <ul className={`p-strip ${className}`}>
      {items.map((s, i) => (
        <li key={i}>
          <Icon name={s.icon} size={26} />
          <span>{s.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="p-back">
      <Icon name="arrow-left" size={16} />
      {children}
    </Link>
  );
}

/** "a · b · c" helper for CMS lists shown inline. */
export const dotJoin = (xs: string[]) => xs.filter(Boolean).join(' · ');
