import { useState } from 'react';
import type { Rec, WheelArea } from '@shift/core';
import { usePublicList, useSettings } from '@/data';
import { Icon } from './Icon';
import { registerWheelEditor } from './kit';

const SEG_COLORS: Record<string, string> = {
  sage: '#cfd8c9', taupe: '#e4d5c6', beige: '#f0e6d8', blush: '#f1d9d2', peach: '#f6dcc4', blue: '#d6e2ec', rose: '#efd0cc', tan: '#eedfc6', green: '#d6e3d0', lavender: '#e3def0', deep: '#9aa596', charcoal: '#b9b9b2',
};
const SEG_STRONG: Record<string, string> = {
  sage: '#94a58c', taupe: '#b59a83', beige: '#c9b392', blush: '#d7a597', peach: '#e3ad7f', blue: '#8eaac2', rose: '#d29b94', tan: '#c9a873', green: '#8fae84', lavender: '#a99cc9', deep: '#5e6b5a', charcoal: '#77786f',
};

const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0} ${y0} A${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`;
}

/**
 * Interactive Wheel of Life. Areas and the scale come from master data (Admin › Questions & Wheel).
 * Click a ring in a segment (or use the per-area buttons) to set its score.
 */
export function WheelOfLife({ areas: areasProp, value, onChange, size = 360, readOnly, center = 'My Life Wheel', showLabels = true, compare }: { areas?: Rec<WheelArea>[]; value: Record<string, number>; onChange?: (v: Record<string, number>) => void; size?: number; readOnly?: boolean; center?: string; showLabels?: boolean; compare?: Record<string, number> }) {
  const listQ = usePublicList('wheelAreas');
  const settings = useSettings();
  const areas = areasProp ?? listQ.data ?? [];
  const min = settings?.wheel.min ?? 1;
  const max = settings?.wheel.max ?? 10;
  const [hover, setHover] = useState<string | null>(null);
  if (!areas.length) return null;
  const pad = showLabels ? 70 : 8;
  const W = size + pad * 2;
  const cx = W / 2;
  const cy = W / 2;
  const R = size / 2;
  const r0 = R * 0.2;
  const n = areas.length;
  const step = (2 * Math.PI) / n;
  const start = -Math.PI / 2 - step / 2;
  const ringR = (k: number) => r0 + ((R - r0) * k) / max;
  const set = (id: string, k: number) => !readOnly && onChange?.({ ...value, [id]: Math.max(min, Math.min(max, k)) });
  return (
    <div className="stack gap-12" style={{ alignItems: 'center' }}>
      <svg viewBox={`0 0 ${W} ${W}`} width="100%" style={{ maxWidth: W, touchAction: 'manipulation' }} role="group" aria-label="Wheel of Life">
        {areas.map((a, i) => {
          const a0 = start + i * step;
          const a1 = a0 + step;
          const score = value[a.id] ?? 0;
          const cmp = compare?.[a.id];
          const [lx, ly] = polar(cx, cy, R + 34, (a0 + a1) / 2);
          return (
            <g key={a.id} onMouseEnter={() => setHover(a.id)} onMouseLeave={() => setHover(null)}>
              <path d={arc(cx, cy, r0, R, a0, a1)} fill={SEG_COLORS[a.color] ?? '#eee'} stroke="#fff" strokeWidth="2" />
              {score > 0 && <path d={arc(cx, cy, r0, ringR(score), a0 + 0.02, a1 - 0.02)} fill={SEG_STRONG[a.color] ?? '#999'} opacity={hover === a.id ? 0.9 : 0.75} />}
              {cmp !== undefined && <path d={arc(cx, cy, ringR(cmp) - 1, ringR(cmp) + 1, a0 + 0.02, a1 - 0.02)} fill="#b07a74" />}
              {!readOnly &&
                Array.from({ length: max - min + 1 }).map((_, k) => {
                  const lvl = min + k;
                  return (
                    <path key={lvl} d={arc(cx, cy, ringR(lvl - 1), ringR(lvl), a0, a1)} fill="transparent" stroke="rgba(255,255,255,.55)" strokeWidth="0.8" style={{ cursor: 'pointer' }} onClick={() => set(a.id, lvl)}>
                      <title>{`${a.name}: ${lvl}`}</title>
                    </path>
                  );
                })}
              {showLabels && (
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-body)" fontSize="11" fill="#2f322e">
                  {a.name.split(' & ').map((part, j, arr) => (
                    <tspan key={j} x={lx} dy={j === 0 ? -(arr.length - 1) * 6 : 12}>{j < arr.length - 1 ? `${part} &` : part}</tspan>
                  ))}
                </text>
              )}
              {score > 0 && (() => {
                const [sx, sy] = polar(cx, cy, R - 14, (a0 + a1) / 2);
                return (
                  <g>
                    <circle cx={sx} cy={sy} r="12" fill="#fff" stroke="#e4dcd1" />
                    <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-heading)" fontSize="12" fill="#22281f">{score}</text>
                  </g>
                );
              })()}
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={r0} fill="#fbfaf6" stroke="#e4dcd1" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-heading)" fontSize={Math.max(11, r0 * 0.26)} fill="#22281f">
          {center.split(' ').map((w, i, arr) => <tspan key={i} x={cx} dy={i === 0 ? -((arr.length - 1) * r0 * 0.15) : r0 * 0.3}>{w}</tspan>)}
        </text>
      </svg>
      {!readOnly && (
        <div className="grid-4" style={{ width: '100%' }}>
          {areas.map((a) => (
            <div key={a.id} className="row gap-8 card-soft card-pad-sm" style={{ padding: '8px 10px', justifyContent: 'space-between' }}>
              <span className="body-sm" style={{ minWidth: 0 }}>{a.name}</span>
              <span className="row gap-4">
                <button type="button" className="icon-btn sm" aria-label={`Lower ${a.name}`} onClick={() => set(a.id, (value[a.id] ?? min) - 1)}><Icon name="minus" size={14} /></button>
                <span className="serif" style={{ width: 22, textAlign: 'center' }}>{value[a.id] ?? '–'}</span>
                <button type="button" className="icon-btn sm" aria-label={`Raise ${a.name}`} onClick={() => set(a.id, (value[a.id] ?? min - 1) + 1)}><Icon name="plus" size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

registerWheelEditor(({ value, onChange }) => <WheelOfLife value={value} onChange={onChange} size={280} />);

/** Radar/spider chart with one or more series (e.g. "When you started" vs "Today"). */
export function Radar({ axes, series, max = 10, size = 320 }: { axes: { id: string; label: string }[]; series: { label: string; values: Record<string, number>; color: string; fill?: string }[]; max?: number; size?: number }) {
  const pad = 80;
  const W = size + pad * 2;
  const c = W / 2;
  const R = size / 2;
  const n = axes.length;
  const pt = (i: number, v: number) => polar(c, c, (R * v) / max, -Math.PI / 2 + (i * 2 * Math.PI) / n);
  return (
    <svg viewBox={`0 0 ${W} ${W}`} width="100%" style={{ maxWidth: W }} role="img" aria-label={series.map((s) => s.label).join(' vs ')}>
      {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
        <polygon key={f} points={axes.map((_, i) => pt(i, max * f).join(',')).join(' ')} fill="none" stroke="#e4dcd1" />
      ))}
      {axes.map((a, i) => {
        const [x, y] = pt(i, max);
        const [lx, ly] = pt(i, max * 1.22);
        return (
          <g key={a.id}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="#e4dcd1" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontFamily="var(--font-body)" fill="#4e514a">
              {a.label.split(' & ').map((p, j, arr) => <tspan key={j} x={lx} dy={j === 0 ? -(arr.length - 1) * 6 : 12}>{j < arr.length - 1 ? `${p} &` : p}</tspan>)}
            </text>
          </g>
        );
      })}
      {series.map((s) => (
        <g key={s.label}>
          <polygon points={axes.map((a, i) => pt(i, s.values[a.id] ?? 0).join(',')).join(' ')} fill={s.fill ?? 'none'} stroke={s.color} strokeWidth="2" />
          {axes.map((a, i) => {
            const [x, y] = pt(i, s.values[a.id] ?? 0);
            return <circle key={a.id} cx={x} cy={y} r="3.5" fill={s.color} />;
          })}
        </g>
      ))}
    </svg>
  );
}

/** Horizontal bar used in analytics. */
export function Bar({ value, max, color = '#5e6b5a' }: { value: number; max: number; color?: string }) {
  return (
    <div style={{ height: 18, background: 'transparent', borderRadius: 6, width: '100%' }}>
      <div style={{ width: `${Math.max(2, (value / max) * 100)}%`, height: '100%', background: color, borderRadius: 6 }} />
    </div>
  );
}
