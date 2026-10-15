import type { ReactNode } from 'react';
import { useBranding } from '@/data';
import { Art } from '@/ui/Art';
import { Logo } from '@/ui/Logo';
import { Script } from '@/ui/kit';
import { Caps } from './shared';
import '../public.css';

/** Header used by the coach-process infographic pages (Onboarding, Coaching Process, Complete & Continue). */
export function InfoHeader({ title, subtitle, subtitle2, script, art, artNote, artQuote }: { title: string; subtitle: string; subtitle2?: string; script?: string; art: string; artNote?: string; artQuote?: ReactNode }) {
  const b = useBranding();
  return (
    <header className="wrap section-sm" style={{ paddingBottom: 24 }}>
      <div className="p-infohead">
        <div className="stack gap-12">
          <div className="row gap-16 wrap-row">
            <Logo size={28} sub />
            {b?.taglines.trio && <Caps className="sm p-hide-sm">{b.taglines.trio}</Caps>}
          </div>
          <h1 className="h-display" style={{ marginTop: 12 }}>{title}</h1>
          <Caps>{subtitle}</Caps>
          {subtitle2 && <Caps>{subtitle2}</Caps>}
          {script && <Script size={36}>{script}</Script>}
        </div>
        <Art src={art} note={artNote} quote={typeof artQuote === 'string' ? artQuote : undefined} quotePos="tr" quoteSize={28} />
      </div>
    </header>
  );
}
