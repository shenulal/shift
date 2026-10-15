import { useEffect } from 'react';
import { useBranding } from '@/data';

const VAR_MAP: Record<string, string> = { sage: '--sage', taupe: '--taupe', beige: '--beige', blush: '--blush', white: '--white', charcoal: '--charcoal', deep: '--deep', ground: '--ground', peach: '--peach', blue: '--blue', rose: '--rose' };

/** Writes Admin › Branding colours and fonts into CSS variables so every page updates instantly. */
export function Theme() {
  const b = useBranding();
  useEffect(() => {
    if (!b) return;
    const root = document.documentElement.style;
    for (const [k, v] of Object.entries(b.colors ?? {})) if (VAR_MAP[k] && v) root.setProperty(VAR_MAP[k], v);
    root.setProperty('--font-heading', `'${b.fonts.heading}', Georgia, serif`);
    root.setProperty('--font-body', `'${b.fonts.body}', 'Helvetica Neue', Arial, sans-serif`);
    root.setProperty('--font-script', `'${b.fonts.script}', cursive`);
    const fam = (f: string) => encodeURIComponent(f).replace(/%20/g, '+');
    const href = `https://fonts.googleapis.com/css2?family=${fam(b.fonts.heading)}:ital,wght@0,400;0,500;0,600;1,400&family=${fam(b.fonts.body)}:wght@300;400;500;600&family=${fam(b.fonts.script)}&display=swap`;
    const link = document.getElementById('brand-fonts') as HTMLLinkElement | null;
    if (link && link.href !== href) link.href = href;
  }, [b]);
  return null;
}
