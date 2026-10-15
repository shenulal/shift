import { useBranding } from '@/data';

/** SHIFT wordmark: serif letters with two leaves sprouting from the "I"; optional "COACHING" beneath. */
export function Logo({ size = 22, sub = false, tagline, light = false, center = false }: { size?: number; sub?: boolean; tagline?: string; light?: boolean; center?: boolean }) {
  const b = useBranding();
  const word = b?.wordmark ?? 'SHIFT';
  const ink = light ? '#fbfaf6' : '#2b2f2a';
  if (b?.logoUrl) return <img src={b.logoUrl} alt={word} style={{ height: size * 1.6 }} />;
  const iIdx = word.toUpperCase().indexOf('I');
  const letters = word.split('');
  return (
    <span aria-label={`${word}${sub ? ` ${b?.subMark ?? 'COACHING'}` : ''}`} role="img" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: center ? 'center' : 'flex-start', gap: size * 0.25, lineHeight: 1 }}>
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'flex-end', gap: size * 0.32, fontFamily: 'var(--font-heading)', fontSize: size, color: ink, letterSpacing: 0 }}>
        {letters.map((ch, i) =>
          i === iIdx ? (
            <svg key={i} width={size * 0.62} height={size * 1.35} viewBox="0 0 20 44" style={{ marginBottom: size * 0.02 }}>
              <path d="M10 44V16" stroke={ink} strokeWidth="2.2" />
              <path d="M10 18C10 10 5 6 1 6c0 7 4 11 9 12z" fill={light ? '#c9cfc4' : '#3d443b'} />
              <path d="M10 16c0-9 4-14 9-15 0 8-3 13-9 15z" fill={light ? '#e4d9cf' : '#c1b2a6'} />
            </svg>
          ) : (
            <span key={i} style={{ lineHeight: 0.8 }}>{ch}</span>
          ),
        )}
      </span>
      {sub && <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.42, letterSpacing: '0.42em', color: ink, marginLeft: center ? '0.42em' : 0 }}>{b?.subMark ?? 'COACHING'}</span>}
      {tagline && <span style={{ fontFamily: 'var(--font-body)', fontSize: Math.max(9, size * 0.3), letterSpacing: '0.24em', textTransform: 'uppercase', color: light ? '#e8e4dc' : '#5c5f58', marginTop: 2 }}>{tagline}</span>}
    </span>
  );
}
