import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBranding, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Logo } from '@/ui/Logo';
import { Script } from '@/ui/kit';
import '../public.css';

/** Public page that tells each client-journey stage's story. Stages without a public page are not linked. */
const STAGE_ROUTES: Record<string, string> = {
  attract: '/',
  enquiry: '/enquiry',
  discover: '/discovery-call',
  enrol: '/enrol',
  onboard: '/onboarding',
  coach: '/process',
  complete: '/complete',
};

/**
 * "CLIENT JOURNEY" stepper header used on the Enquiry, Discovery Call and Enrolment pages (designs 24–26).
 * Stages come from the `journeyStages` master collection; `current` is a stage id.
 */
export function JourneyHeader({ current }: { current: string }) {
  const stages = usePublicList('journeyStages').data;
  const branding = useBranding();
  const brochure = useContent<{ close?: { footer?: string[] } }>('brochure');
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const li = nav?.querySelector<HTMLElement>('li.current');
    if (nav && li && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = li.offsetLeft - nav.clientWidth / 2 + li.clientWidth / 2;
  }, [stages, current]);
  const script = brochure?.close?.footer?.slice(0, 2).map((s) => (/[.!?]$/.test(s) ? s : `${s}.`)).join('\n');
  if (!stages) return <div className="p-jh p-jh-skel" aria-hidden="true" />;
  const sorted = [...stages].sort((a, b) => a.number - b.number);
  return (
    <header className="p-jh">
      <div className="wrap p-jh-inner">
        <div className="p-jh-logo">
          <Logo size={26} />
          {branding?.taglines.primary && <span className="p-jh-tagline">{branding.taglines.primary}</span>}
        </div>
        <nav ref={navRef} className="p-jh-nav" aria-label="Client journey">
          <div className="p-caps p-jh-label">Client journey</div>
          <ol className="p-jh-steps">
            {sorted.map((s) => {
              const isCurrent = s.id === current;
              const href = STAGE_ROUTES[s.id];
              const inner = (
                <>
                  <span className="p-jh-num">{s.number}</span>
                  <span className="p-jh-name">{s.short}</span>
                  <span className="p-jh-sub">{s.subtitle}</span>
                </>
              );
              return (
                <li key={s.id} className={isCurrent ? 'current' : ''}>
                  {href && !isCurrent ? (
                    <Link to={href}>{inner}</Link>
                  ) : (
                    <span aria-current={isCurrent ? 'step' : undefined}>{inner}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {script && <Script size={30} className="p-jh-script">{script}</Script>}
      </div>
    </header>
  );
}
