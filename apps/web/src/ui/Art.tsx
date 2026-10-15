import type { CSSProperties, ReactNode } from 'react';
import { useBranding } from '@/data';

/**
 * Placeholder nature photography, drawn as SVG so it stays crisp and on-brand until real photos are uploaded
 * in Admin › Branding (any ImageRef that is a URL renders as a photo instead).
 */
type Fg = 'none' | 'stones' | 'figure' | 'mug' | 'notebook' | 'vase' | 'books' | 'brain' | 'signpost' | 'path' | 'peak' | 'leaves' | 'chair' | 'person' | 'pair' | 'bottle' | 'flowers' | 'card' | 'sprout' | 'presenter';
interface SceneDef { sky: [string, string, string]; sun?: [number, number, number]; sea?: boolean; hills?: string[]; fg: Fg; table?: boolean; tone?: string; dx?: number }

const SUNSET: [string, string, string] = ['#e9c7b4', '#f3d9c4', '#fbeee0'];
const DUSK: [string, string, string] = ['#c9b6b4', '#e8c9b8', '#f7e3cf'];
const SOFT: [string, string, string] = ['#efe6dc', '#f5ede4', '#faf5ef'];
const DAY: [string, string, string] = ['#cfdbe0', '#e4e9e5', '#f4f1ea'];

const SCENES: Record<string, SceneDef> = {
  'sunset-sea': { sky: SUNSET, sun: [300, 120, 26], sea: true, hills: ['#b9a6a3', '#8e8584'], fg: 'figure', dx: 110 },
  'sunset-woman': { sky: SUNSET, sun: [110, 130, 24], sea: true, hills: ['#c4b0aa', '#9b8c88'], fg: 'figure' },
  'coast-woman': { sky: DUSK, sun: [90, 150, 20], sea: true, hills: ['#a99a97', '#7d7472'], fg: 'figure' },
  coast: { sky: DUSK, sun: [120, 140, 22], sea: true, hills: ['#a99a97', '#6f6a66'], fg: 'none' },
  'path-sea': { sky: SUNSET, sun: [250, 140, 22], sea: true, hills: ['#b6a4a0', '#8b8a7c'], fg: 'path' },
  'path-hills': { sky: SUNSET, sun: [200, 120, 24], hills: ['#c9b49f', '#9d9479', '#7e7a66'], fg: 'path' },
  'path-mountain': { sky: SUNSET, sun: [230, 110, 20], hills: ['#b8a49b', '#8f8277', '#6e665e'], fg: 'path' },
  'plant-path': { sky: SUNSET, sun: [300, 110, 18], sea: true, hills: ['#b0a39b', '#8b8a7c'], fg: 'path' },
  mountains: { sky: SUNSET, sun: [280, 120, 24], hills: ['#c7b3a8', '#a99891', '#857a74'], fg: 'none' },
  'mountain-lake': { sky: DAY, hills: ['#a8b2b0', '#7f8c88'], sea: true, fg: 'peak' },
  sunrise: { sky: ['#e8c3a8', '#f3d2b3', '#fbe7cf'], sun: [200, 150, 30], hills: ['#a39383', '#7b7064', '#5e574e'], fg: 'none' },
  stones: { sky: SUNSET, sun: [300, 110, 22], sea: true, hills: ['#b8a7a2'], fg: 'stones' },
  'stones-plant': { sky: SUNSET, sun: [90, 120, 20], sea: true, hills: ['#b8a7a2'], fg: 'stones' },
  'stones-words': { sky: SUNSET, sun: [300, 110, 22], sea: true, hills: ['#b8a7a2'], fg: 'stones' },
  'stone-sunset': { sky: SUNSET, sun: [280, 140, 26], sea: true, hills: ['#a99891'], fg: 'stones' },
  mug: { sky: SOFT, fg: 'mug', table: true },
  'notebook-mug': { sky: SUNSET, sun: [320, 90, 18], sea: true, hills: ['#c0afa8'], fg: 'notebook', table: true },
  notebook: { sky: SOFT, fg: 'notebook', table: true },
  'notebook-plant': { sky: SOFT, fg: 'notebook', table: true },
  'notebook-leaves': { sky: SOFT, fg: 'notebook', table: true },
  'notebook-bottle': { sky: SOFT, fg: 'bottle', table: true },
  'flowers-mug': { sky: DAY, sea: true, hills: ['#b9c0bd'], fg: 'flowers', table: true },
  books: { sky: SOFT, fg: 'books', table: true },
  vase: { sky: SUNSET, sun: [110, 110, 22], hills: ['#c9b6a7', '#a89a8d'], fg: 'vase', table: true },
  'vase-card': { sky: SOFT, fg: 'card', table: true },
  'leaf-card': { sky: SOFT, fg: 'card', table: true },
  leaves: { sky: SOFT, fg: 'leaves' },
  sprout: { sky: ['#f1e6d9', '#f6ece0', '#fbf5ec'], fg: 'sprout', hills: ['#e6d6c3'] },
  brain: { sky: SUNSET, sun: [300, 100, 18], hills: ['#c9b2aa'], fg: 'brain' },
  'brain-woman': { sky: SUNSET, sun: [300, 100, 18], hills: ['#c9b2aa', '#9e8f8a'], fg: 'brain' },
  signpost: { sky: SUNSET, sun: [200, 150, 30], sea: true, hills: ['#a7978f'], fg: 'signpost' },
  chair: { sky: SOFT, fg: 'chair' },
  portrait: { sky: ['#e6d6c6', '#efe3d6', '#f6eee5'], fg: 'person' },
  presenter: { sky: ['#e3d5c8', '#ece2d6', '#f4ece3'], fg: 'presenter' },
  conversation: { sky: ['#ecdcca', '#f2e6d8', '#f8f0e6'], fg: 'pair' },
};

const isUrl = (s: string) => /^(https?:|data:|\/|blob:)/.test(s);

function Foreground({ fg, note, dx = 0 }: { fg: Fg; note?: string; dx?: number }) {
  const ink = '#4a3f3a';
  switch (fg) {
    case 'figure':
      return (
        <g>
          <path d="M0 262 C80 240 150 236 210 250 C280 266 340 248 400 254 V300 H0Z" fill="#6d5f58" />
          <g transform={dx ? `translate(${dx} 4)` : undefined}>
          <path d="M150 248c-2-26 6-44 22-50 4-12 18-14 22-3 5 3 6 10 2 15 16 6 24 22 22 40Z" fill="#e8ddd0" />
          <circle cx="182" cy="186" r="12" fill="#5b4339" />
          <path d="M176 176c4-8 14-8 16 2" fill="#5b4339" />
          <path d="M148 250c10-6 50-8 74 0" stroke="#d8cbbd" strokeWidth="6" fill="none" />
          </g>
        </g>
      );
    case 'stones':
      return (
        <g>
          <path d="M0 250 C120 236 260 238 400 248 V300 H0Z" fill="#8c7d74" />
          <ellipse cx="200" cy="244" rx="70" ry="16" fill="#a19388" />
          <ellipse cx="200" cy="218" rx="54" ry="15" fill="#b3a598" />
          <ellipse cx="200" cy="194" rx="40" ry="13" fill="#c2b5a8" />
          <ellipse cx="200" cy="173" rx="28" ry="10" fill="#cfc3b6" />
          {note && <text x="200" y="222" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="11" letterSpacing="2" fill="#4a3f3a">{note.split('·')[0]?.trim().toUpperCase()}</text>}
        </g>
      );
    case 'mug':
      return (
        <g>
          <rect x="150" y="150" width="90" height="100" rx="10" fill="#f0e8dc" />
          <path d="M240 175c28 0 28 50 0 50" stroke="#e6dccd" strokeWidth="10" fill="none" />
          <text x="195" y="190" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="10" fill={ink}>{(note ?? 'Pause · Breathe · Choose').split('·').map((s, i) => <tspan key={i} x="195" dy={i ? 14 : 0}>{s.trim()}</tspan>)}</text>
        </g>
      );
    case 'notebook':
      return (
        <g>
          <rect x="95" y="150" width="170" height="110" rx="6" fill="#fbf7f0" transform="rotate(-8 180 205)" />
          <g transform="rotate(-8 180 205)">{Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={100 + i * 19} cy="152" r="3" fill="#bfb4a6" />)}</g>
          <text x="180" y="205" textAnchor="middle" fontFamily="Allura, cursive" fontSize="24" fill={ink} transform="rotate(-8 180 205)">{(note ?? 'Clarity starts with awareness.').slice(0, 34)}</text>
          <rect x="285" y="175" width="52" height="64" rx="8" fill="#ece3d6" />
        </g>
      );
    case 'bottle':
      return (
        <g>
          <rect x="250" y="120" width="54" height="140" rx="18" fill="#9fa99a" />
          <rect x="262" y="104" width="30" height="22" rx="6" fill="#8b9586" />
          <rect x="80" y="170" width="150" height="90" rx="6" fill="#fbf7f0" transform="rotate(-6 155 215)" />
          <text x="155" y="210" textAnchor="middle" fontFamily="Allura, cursive" fontSize="20" fill={ink} transform="rotate(-6 155 215)">{(note ?? 'Smaller steps').split('·')[0]}</text>
        </g>
      );
    case 'flowers':
      return (
        <g>
          {[[90, 120], [120, 100], [70, 150], [140, 135], [105, 160]].map(([x, y], i) => (
            <g key={i}><circle cx={x} cy={y} r="14" fill="#eaa3a0" /><circle cx={x} cy={y} r="4" fill="#d67e74" /></g>
          ))}
          <rect x="180" y="150" width="90" height="100" rx="10" fill="#f4c9c4" />
          <text x="225" y="190" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="10" fill={ink}>{(note ?? 'I am capable · I am enough').split('·').map((s, i) => <tspan key={i} x="225" dy={i ? 14 : 0}>{s.trim().toUpperCase()}</tspan>)}</text>
        </g>
      );
    case 'books':
      return (
        <g>
          {(note ?? 'Good · Boundaries · Brighter days').split('·').map((s, i) => (
            <g key={i}>
              <rect x={120 - i * 6} y={230 - i * 30} width={170 + i * 12} height="28" rx="3" fill={['#e4dccf', '#ece5d9', '#f3eee5'][i % 3]} stroke="#d6cab9" />
              <text x="205" y={249 - i * 30} textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="11" letterSpacing="1.5" fill={ink}>{s.trim().toUpperCase()}</text>
            </g>
          ))}
          <path d="M310 230c0-30 10-60 30-80M330 230c0-20-10-50-30-60" stroke="#7d8a72" strokeWidth="3" fill="none" />
        </g>
      );
    case 'vase':
      return (
        <g>
          <path d="M170 255c-30-10-30-60-10-80 0-10 6-14 14-14h20c8 0 14 4 14 14 20 20 20 70-10 80z" fill="#e5d8c6" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M190 160c${-30 + i * 15} -40 ${-20 + i * 10} -80 ${-10 + i * 6} -110`} stroke="#6f7c63" strokeWidth="2.4" fill="none" />)}
          <rect x="235" y="215" width="110" height="40" rx="4" fill="#efe6d8" />
          <text x="290" y="240" textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="9" letterSpacing="1.5" fill={ink}>A CALMER MIND</text>
        </g>
      );
    case 'card':
      return (
        <g>
          <rect x="210" y="70" width="140" height="190" rx="4" fill="#fbf7f0" transform="rotate(4 280 165)" />
          <text x="280" y="160" textAnchor="middle" fontFamily="Allura, cursive" fontSize="24" fill={ink} transform="rotate(4 280 165)">{(note ?? 'Awareness creates choice.').split(' ').slice(0, 3).map((w, i) => <tspan key={i} x="280" dy={i ? 26 : 0}>{w}</tspan>)}</text>
          <path d="M90 260c10-60 40-110 90-140M110 210c-20-10-30-30-30-50M130 180c20-6 34-20 40-40" stroke="#6f7c63" strokeWidth="2.6" fill="none" />
        </g>
      );
    case 'leaves':
      return (
        <g opacity="0.85">
          {[[60, 80, -30], [140, 40, 10], [300, 60, 40], [330, 200, -20], [80, 220, 20], [220, 250, -40]].map(([x, y, r], i) => (
            <path key={i} d="M0 0c20-30 60-30 80 0-20 30-60 30-80 0z" transform={`translate(${x} ${y}) rotate(${r})`} fill={i % 2 ? '#a3ae99' : '#8d9a85'} />
          ))}
        </g>
      );
    case 'sprout':
      return (
        <g>
          <path d="M0 250 C120 230 280 230 400 250 V300 H0Z" fill="#e4d4bf" />
          <path d="M200 250v-60" stroke="#5f6f52" strokeWidth="4" />
          <path d="M200 205c-10-30-40-40-60-36 6 24 30 40 60 36zM200 195c10-34 40-46 64-42-6 28-34 44-64 42z" fill="#6f7f5f" />
        </g>
      );
    case 'brain':
      return (
        <g>
          <ellipse cx="220" cy="140" rx="90" ry="70" fill="#f2c0b3" opacity="0.95" />
          {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M${150 + i * 20} 90c-10 20 10 40 0 60s10 40 0 50`} stroke="#e39f90" strokeWidth="3" fill="none" />)}
          <circle cx="220" cy="140" r="100" fill="#ffd9a8" opacity="0.18" />
        </g>
      );
    case 'signpost':
      return (
        <g>
          <rect x="196" y="80" width="10" height="190" fill="#7a5c45" />
          {(note ?? 'Health · Career · Relationships · Freedom · Growth').split('·').slice(0, 5).map((s, i) => (
            <g key={i}>
              <path d={i % 2 ? `M130 ${88 + i * 32}h120l12 12-12 12H130z` : `M150 ${88 + i * 32}h120l-0 24H150l-12-12z`} fill="#9a7458" />
              <text x="200" y={104 + i * 32} textAnchor="middle" fontFamily="Playfair Display, serif" fontSize="10" letterSpacing="1.5" fill="#fbf2e6">{s.trim().toUpperCase()}</text>
            </g>
          ))}
        </g>
      );
    case 'path':
      return <path d="M170 300 C190 260 230 250 215 230 C200 212 240 205 250 190" stroke="#e6d7c4" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.9" />;
    case 'peak':
      return <path d="M60 210 L200 70 L250 120 L280 100 L360 210Z" fill="#8e9a96" />;
    case 'chair':
      return (
        <g>
          <rect x="120" y="150" width="140" height="80" rx="20" fill="#c9ab8f" />
          <rect x="130" y="110" width="120" height="60" rx="16" fill="#d4b89d" />
          <rect x="280" y="170" width="50" height="70" rx="4" fill="#a98c70" />
          <path d="M305 170c-10-30 0-60 20-80M310 170c10-26 30-40 50-40" stroke="#6f7c63" strokeWidth="3" fill="none" />
        </g>
      );
    case 'person':
    case 'presenter':
      return (
        <g>
          <path d="M120 300c0-60 36-96 80-96s80 36 80 96z" fill={fg === 'presenter' ? '#e9ddd0' : '#2f2d2c'} />
          <ellipse cx="200" cy="150" rx="44" ry="52" fill="#e8c8b0" />
          <path d="M152 150c-6-60 30-84 60-80 36 4 50 40 40 90-6-30-20-48-40-56-22 10-44 20-60 46z" fill="#7a5640" />
          <path d="M150 160c-10 50 0 90 10 110M250 160c8 50 0 90-8 110" stroke="#7a5640" strokeWidth="14" fill="none" />
        </g>
      );
    case 'pair':
      return (
        <g>
          {[[130, '#7a5640', '#efe6da'], [270, '#3b2f2a', '#d8c9b8']].map(([x, hair, top], i) => (
            <g key={i}>
              <path d={`M${Number(x) - 60} 300c0-56 26-86 60-86s60 30 60 86z`} fill={top as string} />
              <ellipse cx={x as number} cy="160" rx="34" ry="40" fill="#e8c8b0" />
              <path d={`M${Number(x) - 38} 160c-4-48 22-66 46-62 28 4 38 30 30 70-4-24-16-36-30-42-18 8-34 16-46 34z`} fill={hair as string} />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

export interface ArtProps {
  src?: string;
  /** Handwritten Allura quote overlaid on the image. */
  quote?: string;
  quotePos?: 'tl' | 'tr' | 'bl' | 'br' | 'center';
  quoteSize?: number;
  quoteDark?: boolean;
  /** Text printed on objects in the scene (mug, books, stones). */
  note?: string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
  children?: ReactNode;
}

export function Art({ src = 'sunset-sea', quote, quotePos = 'br', quoteSize = 30, quoteDark, note, className = '', style, alt = '', children }: ArtProps) {
  const branding = useBranding();
  const resolved = branding?.images?.[src] ?? src;
  const pos: CSSProperties =
    quotePos === 'tl' ? { top: '8%', left: '7%' } : quotePos === 'tr' ? { top: '8%', right: '7%', textAlign: 'right' } : quotePos === 'bl' ? { bottom: '8%', left: '7%' } : quotePos === 'center' ? { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' } : { bottom: '8%', right: '7%', textAlign: 'right' };
  let content: ReactNode;
  if (isUrl(resolved)) {
    content = <img src={resolved} alt={alt} loading="lazy" />;
  } else {
    const s = SCENES[resolved] ?? SCENES['sunset-sea'];
    const id = `g${resolved.replace(/[^a-z0-9]/gi, '')}`;
    content = (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={s.sky[0]} />
            <stop offset="0.55" stopColor={s.sky[1]} />
            <stop offset="1" stopColor={s.sky[2]} />
          </linearGradient>
          <radialGradient id={`${id}-sun`}>
            <stop offset="0" stopColor="#fff6e2" />
            <stop offset="0.35" stopColor="#ffe7c0" stopOpacity="0.9" />
            <stop offset="1" stopColor="#ffe7c0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#${id}-sky)`} />
        {s.sun && <circle cx={s.sun[0]} cy={s.sun[1]} r={s.sun[2] * 3} fill={`url(#${id}-sun)`} />}
        {s.sun && <circle cx={s.sun[0]} cy={s.sun[1]} r={s.sun[2] * 0.6} fill="#fff8ea" opacity="0.9" />}
        {s.hills?.map((c, i) => (
          <path key={i} d={`M0 ${170 + i * 18} C 70 ${140 + i * 22} 140 ${165 + i * 12} 210 ${150 + i * 20} S 340 ${150 + i * 16} 400 ${168 + i * 16} V300 H0Z`} fill={c} opacity={0.75 + i * 0.08} />
        ))}
        {s.sea && <rect y="205" width="400" height="95" fill="#d8c3b6" opacity="0.65" />}
        {s.sea && s.sun && <rect x={s.sun[0] - 30} y="208" width="60" height="3" fill="#fff4e0" opacity="0.7" />}
        {s.table && <rect y="248" width="400" height="52" fill="#d9cbb9" />}
        <Foreground fg={s.fg} note={note} dx={s.dx} />
      </svg>
    );
  }
  return (
    <div className={`art ${className}`} style={style}>
      {content}
      {quote && (
        <div className="art-quote" style={{ ...pos, fontSize: quoteSize, color: quoteDark ? '#2f2622' : undefined, textShadow: quoteDark ? 'none' : undefined, maxWidth: '78%' }}>
          {quote}
        </div>
      )}
      {children}
    </div>
  );
}

export const ART_SCENES = Object.keys(SCENES);
