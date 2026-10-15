import type { ColorKey } from '@shift/core';

/** Shared helpers for the coach admin / CMS. */

export const META_KEYS = ['id', 'sort', 'active', 'ownerId', 'createdAt', 'updatedAt'] as const;

export function stripMeta<T extends Record<string, unknown>>(rec: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rec)) if (!(META_KEYS as readonly string[]).includes(k)) out[k] = v;
  return out;
}

export const clone = <T,>(v: T): T => (v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T));

/** Read a dotted path ("bonus.title"). */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Immutable write to a dotted path. */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const base = (obj && typeof obj === 'object' ? obj : {}) as Record<string, unknown>;
  if (!rest.length) return { ...base, [head]: value } as T;
  return { ...base, [head]: setPath(base[head], rest.join('.'), value) } as T;
}

/** camelCase / kebab-case / snake_case → "Sentence case". */
export function humanise(key: string): string {
  const s = key
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export const uid = (prefix = 'id') => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : 'Something went wrong');

/** ISO string → value for <input type="datetime-local"> in the browser's zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const COLOR_KEYS: ColorKey[] = ['sage', 'taupe', 'beige', 'blush', 'peach', 'blue', 'rose', 'tan', 'green', 'lavender', 'deep', 'charcoal'];
export const COLOR_HEX: Record<ColorKey, string> = {
  sage: '#949F8E', taupe: '#B6A190', beige: '#EEE1D6', blush: '#E7D3CC', peach: '#F1DCC8', blue: '#D9E3EC',
  rose: '#E9C9C6', tan: '#EADFC9', green: '#D6E3D0', lavender: '#E3DEF0', deep: '#2E3B32', charcoal: '#4E514A',
};

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const fmtNum = (n: number) => n.toLocaleString('en-US');
