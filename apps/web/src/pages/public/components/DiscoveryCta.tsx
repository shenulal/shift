import { useContent } from '@/lib/content';
import { Button, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import '../public.css';

interface AttractContent { title: string; body: string; cta: string; script: string }

/** "Book a Discovery Session" call-to-action card (Attract stage, design 23) — copy from the `attract` page. */
export function DiscoveryCta({ className = '' }: { className?: string }) {
  const c = useContent<AttractContent>('attract');
  if (!c) return null;
  return (
    <section className={`wrap section-sm ${className}`} aria-labelledby="discovery-cta-title">
      <div className="p-dcta">
        <span className="p-dcta-leaf" aria-hidden="true"><Icon name="leaf" size={30} /></span>
        <div className="p-dcta-copy">
          <h2 id="discovery-cta-title" className="h2">{c.title}</h2>
          <p className="p-caps">{c.body}</p>
        </div>
        <div className="p-dcta-action">
          <Button to="/discovery-call" caps size="lg" className="p-btn-chev">
            {c.cta}
            <Icon name="chevron-right" size={16} />
          </Button>
          <Script size={30} className="p-dcta-script">{c.script}</Script>
        </div>
      </div>
    </section>
  );
}
