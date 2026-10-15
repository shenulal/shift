import type { CSSProperties } from 'react';

/** Minimal line-drawn icon set (24×24, stroke = currentColor), matching the SHIFT brand's line motif. */
const P: Record<string, string> = {
  // nature & brand
  leaf: 'M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19c3-4 6-7 9-9',
  sprout: 'M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 10c0-4 3-6 7-6 0 4-3 6-7 6z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  mountain: 'M3 19l6-10 4 6 2-3 6 7z',
  path: 'M8 21c0-4 8-4 8-8s-8-4-8-8',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  'circle-half': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18',
  lotus: 'M12 19c-4 0-8-2-9-6 3 0 6 1 9 4 3-3 6-4 9-4-1 4-5 6-9 6zM12 17c-2-2-3-5-3-8 1 1 2 2 3 4 1-2 2-3 3-4 0 3-1 6-3 8zM12 13c-1-3-1-6 0-9 1 3 1 6 0 9z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  cloud: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7',
  plane: 'M10 14l-6-2 1-2 7 1 4-6c1-1 3-1 3 1l-3 7 3 6-2 1-4-5-3 1v3l-2 1z',
  // body & mind
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0a3 3 0 0 0 3-1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3 3 3 0 0 1-3-1M9 9h1M14 9h1M8 14h2M14 14h2',
  head: 'M14 21v-3h2a2 2 0 0 0 2-2v-3l2-1-2-3a7 7 0 1 0-12 5v7M10 9a2 2 0 1 1 3 2',
  heart: 'M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3 3.6M6.6 6.6C3.7 8.4 2 12 2 12s4 7 10 7c1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4a3.5 3.5 0 0 1 0 7M18 20a7 7 0 0 0-2-5',
  run: 'M13 4a1.5 1.5 0 1 0 0 .1M9 21l2-6 3 2v4M7 12l3-4 4 1 2 3 3 1M11 15l-1-4',
  dumbbell: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  // objects
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  'book-open': 'M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  clipboard: 'M9 4h6v3H9zM9 5H6v16h12V5h-3M9 12h6M9 16h4',
  pencil: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  sign: 'M4 20h16M6 16l2-1 9-9-2-2-9 9zM14 5l2 2',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  bank: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
  link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  phone: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  laptop: 'M5 6h14v9H5zM2 19h20l-2-4H4z',
  video: 'M3 7h12v10H3zM15 11l6-4v10l-6-4',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2M8 17h2M12 17h2',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  gift: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10 3 8 4s0 3 4 3zM12 7s2-4 4-3 0 3-4 3z',
  briefcase: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
  coins: 'M8 9c3 0 5-1 5-2.5S11 4 8 4 3 5 3 6.5 5 9 8 9zM3 6.5v4C3 12 5 13 8 13s5-1 5-2.5v-4M3 10.5v4C3 16 5 17 8 17M16 12c3 0 5-1 5-2.5S19 7 16 7s-5 1-5 2.5M11 9.5v8c0 1.5 2 2.5 5 2.5s5-1 5-2.5v-8',
  home: 'M3 11l9-7 9 7M5 9v11h14V9M10 20v-6h4v6',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  print: 'M7 9V3h10v6M6 17H4v-7h16v7h-2M7 14h10v7H7z',
  download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
  upload: 'M12 20V9M7 14l5-5 5 5M4 4h16',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15 9a1.5 1.5 0 1 0 0-.1',
  diamond: 'M6 3h12l3 6-9 12L3 9zM3 9h18M9 3l3 6 3-6M12 21l-3-12M12 21l3-12',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 2 5 4 5M16 6h4c0 3-2 5-4 5M12 13v4M8 21h8M10 17h4v4h-4z',
  signpost: 'M12 3v18M5 6h11l3 3-3 3H5zM19 14H9l-3 3 3 3h10z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.5 1 2.5h6c0-1 .2-1.8 1-2.5A6 6 0 0 0 12 3z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  chart: 'M5 20V12M10 20V8M15 20v-6M20 20V4',
  'chart-line': 'M3 20h18M4 16l5-5 4 3 7-8',
  refresh: 'M20 11a8 8 0 0 0-14.9-3.9L4 9M4 4v5h5M4 13a8 8 0 0 0 14.9 3.9L20 15M20 20v-5h-5',
  chat: 'M4 5h16v11H9l-5 4z',
  question: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17v.1',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  instagram: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5v.1',
  linkedin: 'M4 9h3v11H4zM5.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM10 9h3v1.6c.6-1 1.8-1.8 3.3-1.8 2.5 0 3.7 1.6 3.7 4.3V20h-3v-6c0-1.4-.6-2.3-1.8-2.3-1.4 0-2.2 1-2.2 2.5V20h-3z',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  // ui
  play: 'M8 5l11 7-11 7z',
  pause: 'M8 5v14M16 5v14',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'arrow-up-right': 'M7 17L17 7M8 7h9v9',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  drag: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.1',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.1',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  cc: 'M3 6h18v12H3zM10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3',
  fullscreen: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  dot: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
};

export type IconName = keyof typeof P | string;

export function Icon({ name, size = 20, stroke = 1.6, className, style, title }: { name: IconName; size?: number; stroke?: number; className?: string; style?: CSSProperties; title?: string }) {
  const d = P[name] ?? P.leaf;
  const filled = name === 'play' || name === 'dot';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
