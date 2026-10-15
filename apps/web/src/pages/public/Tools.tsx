import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Rec, Toolkit } from '@shift/core';
import { useAuth, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Kicker, Modal, Price } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { PurchasePanel } from './components/PurchasePanel';
import { PageLoading, dotJoin, tone } from './components/shared';
import './public.css';

export interface ToolsContent {
  title: string;
  subtitle: string;
  cta: string;
  kicker: string;
  pageTitle: string;
  pageBody: string;
  pageQuote: string;
  cardKicker: string;
  priceNote: string;
}

export default function Tools() {
  const c = useContent<ToolsContent>('tools');
  const toolkits = usePublicList('toolkits').data;
  const products = usePublicList('products').data;
  const [bundleOpen, setBundleOpen] = useState(false);
  const { hash } = useLocation();
  const ready = !!c && !!toolkits;
  useEffect(() => {
    if (ready && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [ready, hash]);
  if (!c || !toolkits) return <PageLoading />;
  const bundle = products?.find((p) => p.kind === 'bundle');
  const minPrice = toolkits.length ? Math.min(...toolkits.map((t) => t.price)) : null;

  return (
    <>
      {/* Overview (website page 6) */}
      <section className="wrap section-sm">
        <div className="p-center-col stack gap-12" style={{ marginBottom: 24 }}>
          <h1 className="h1">{c.title}</h1>
          <p className="lead">
            {c.subtitle} {minPrice !== null && <strong style={{ color: 'var(--ink)' }}><Price amount={minPrice} each />.</strong>}
          </p>
        </div>
        <ul className="p-tklist" aria-label="Toolkits">
          {toolkits.map((t) => (
            <li key={t.id} className={tone(t.color)}>
              <a href={`#tk-${t.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`tk-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
                <span className="icon-circle p-tone-soft p-tone-ink" aria-hidden="true"><Icon name={t.icon} size={22} /></span>
                <span className="grow">
                  <strong className="serif" style={{ fontWeight: 500, fontSize: 17, display: 'block' }}>{t.name}</strong>
                  <span className="body-sm muted">{t.shortTagline}</span>
                </span>
                <Icon name="chevron-down" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Full toolkit collection (design 03) */}
      <section className="section-sm bg-white" aria-labelledby="tk-title">
        <div className="wrap stack gap-32">
          <div className="p-tools-head">
            <div className="stack gap-12">
              <Kicker rose>{c.kicker}</Kicker>
              <h2 id="tk-title" className="h1">{c.pageTitle}</h2>
              <p className="lead">{c.pageBody}</p>
            </div>
            <div className="p-badge-script" aria-hidden="true">{c.pageQuote}</div>
          </div>

          <div className="p-tkgrid">
            {toolkits.map((t) => <ToolkitCard key={t.id} t={t} c={c} />)}
          </div>

          {bundle && (
            <div id="bundle" className="p-bundle">
              <div className="p-bundle-copy">
                <span className="icon-circle cream lg" aria-hidden="true"><Icon name="layers" size={28} /></span>
                <div className="stack gap-4">
                  <h2 className="h3">{bundle.name}</h2>
                  <p className="body-sm muted">{bundle.description}</p>
                </div>
              </div>
              <div className="p-bundle-cta">
                <Button arrow onClick={() => setBundleOpen(true)}>
                  {bundle.ctaLabel} — <Price amount={bundle.price} />
                </Button>
                <span className="p-caps sm">{dotJoin(bundle.bullets)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {bundle && bundleOpen && (
        <Modal open onClose={() => setBundleOpen(false)} title={bundle.name}>
          <BundleBody label={bundle.ctaLabel} price={bundle.price} description={bundle.description} />
        </Modal>
      )}
    </>
  );
}

function BundleBody({ label, price, description }: { label: string; price: number | null; description: string }) {
  const { user } = useAuth();
  const toolkits = usePublicList('toolkits').data ?? [];
  const ownsAll = !!user && toolkits.every((t) => user.toolkitIds.includes(t.id));
  return (
    <div className="stack gap-16">
      <p className="muted">{description}</p>
      {ownsAll ? (
        <div className="p-buy-done stack gap-12">
          <strong>You already own every toolkit.</strong>
          <Button to="/app/tools" arrow>Open my tools</Button>
        </div>
      ) : (
        <PurchasePanel kind="bundle" amount={price} label={label} ctaLabel={label} />
      )}
    </div>
  );
}

export function ToolList({ t }: { t: Rec<Toolkit> }) {
  return (
    <ul className="p-tk-tools">
      {t.tools.filter((x) => x.active).map((x) => (
        <li key={x.id}>
          <span className="ic" aria-hidden="true"><Icon name={x.icon} size={16} /></span>
          <span>
            <strong>{x.name}</strong>
            <span>{x.description}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ToolkitCard({ t, c }: { t: Rec<Toolkit>; c: ToolsContent }) {
  return (
    <article id={`tk-${t.id}`} className={`p-tk ${tone(t.color)}`} aria-labelledby={`tk-${t.id}-name`}>
      <Art src={t.image} note={t.imageNote} alt={t.imageNote} />
      <span className="p-tk-ic" aria-hidden="true"><Icon name={t.icon} size={26} /></span>
      <div className="p-tk-body">
        <div className="p-caps sm center p-tone-ink">{c.cardKicker}</div>
        <h3 id={`tk-${t.id}-name`} className="p-tk-name">{t.name}</h3>
        <p className="p-tk-tag">{t.tagline}</p>
        <p className="p-tk-desc">{t.description}</p>
        <ToolList t={t} />
        <div className="p-tk-foot">
          <div>
            <div className="p-tk-price"><Price amount={t.price} /></div>
            <div className="p-caps sm">{c.priceNote}</div>
          </div>
          <Link to={`/tools/${t.id}`} className="btn p-tone-btn" style={{ minHeight: 44 }}>
            {t.ctaLabel}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
