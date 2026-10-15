import { fillTemplate, formatPrice } from '@shift/core';
import { usePage, usePublicList, useSettings } from '@/data';

/** Variables available inside CMS copy, e.g. "{toolkit_price} each" or "{duration} minutes". */
export function useContentVars(extra: Record<string, string | number | null | undefined> = {}) {
  const s = useSettings();
  const toolkits = usePublicList('toolkits').data ?? [];
  const minPrice = toolkits.length ? Math.min(...toolkits.map((t) => t.price)) : null;
  return {
    toolkit_price: formatPrice(minPrice, s?.currency ?? 'AED') ?? '',
    currency: s?.currency ?? 'AED',
    duration: s?.discoveryCall.durationMin ?? 30,
    platform: s?.discoveryCall.platformText ?? '',
    validity: s?.session.validityMonths ?? 6,
    reschedule: s?.session.rescheduleHours ?? 24,
    session_length: s?.session.lengthMin ?? 60,
    coach: s?.coachName ?? 'Edel',
    ...extra,
  };
}

/** Page copy with {variables} filled in. Strings anywhere in the tree are interpolated. */
export function useContent<T = Record<string, any>>(slug: string, extra: Record<string, string | number | null | undefined> = {}): T | undefined {
  const raw = usePage<T>(slug);
  const vars = useContentVars(extra);
  if (!raw) return undefined;
  const walk = (v: unknown): unknown => (typeof v === 'string' ? fillTemplate(v, vars) : Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : v);
  return walk(raw) as T;
}
