import { Link, useParams } from 'react-router-dom';
import { useAuth, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Empty, Price } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { PurchasePanel } from './components/PurchasePanel';
import { BackLink, PageLoading, dotJoin, tone } from './components/shared';
import { ToolList, type ToolsContent } from './Tools';
import './public.css';

export default function ToolkitDetail() {
  const { id } = useParams();
  const c = useContent<ToolsContent>('tools');
  const tq = usePublicList('toolkits');
  const products = usePublicList('products').data;
  const { user } = useAuth();
  if (!c || !tq.data) return <PageLoading />;

  const t = tq.data.find((x) => x.id === id);
  if (!t) {
    return (
      <div className="wrap section">
        <Empty icon="leaf" title="This toolkit isn't available">
          <p style={{ marginBottom: 16 }}>It may have been retired or the link is incorrect.</p>
          <Button to="/tools" arrow>See all toolkits</Button>
        </Empty>
      </div>
    );
  }
  const owned = !!user?.toolkitIds.includes(t.id);
  const bundle = products?.find((p) => p.kind === 'bundle');
  const others = tq.data.filter((x) => x.id !== t.id);

  return (
    <div className={tone(t.color)}>
      <section className="wrap section-sm">
        <div style={{ marginBottom: 20 }}><BackLink to="/tools">{c.title.replace(/\.$/, '')}</BackLink></div>
        <div className="p-tkd">
          <div className="stack gap-20">
            <Art src={t.image} note={t.imageNote} alt={t.imageNote} />
            <div className="row gap-16">
              <span className="icon-circle lg p-tone-soft p-tone-ink" aria-hidden="true"><Icon name={t.icon} size={28} /></span>
              <div>
                <div className="p-caps sm p-tone-ink">{c.cardKicker}</div>
                <h1 className="h1" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.name}</h1>
              </div>
            </div>
            <p className="h3 serif">{t.tagline}</p>
            <p className="lead">{t.description}</p>
            <div className="p-card">
              <ToolList t={t} />
            </div>
          </div>

          <aside className="p-card p-buybox stack gap-16" aria-label="Buy this toolkit">
            <div>
              <div className="p-tk-price" style={{ fontSize: 32 }}><Price amount={t.price} /></div>
              <div className="p-caps sm">{c.priceNote}</div>
            </div>
            {owned ? (
              <div className="p-buy-done stack gap-12" role="status">
                <div className="row gap-12">
                  <span className="icon-circle sage sm"><Icon name="check" size={18} /></span>
                  <strong>You own this toolkit</strong>
                </div>
                <Button to={`/app/tools/${t.id}`} arrow>Open my toolkit</Button>
              </div>
            ) : (
              <PurchasePanel kind="toolkit" refId={t.id} amount={t.price} label={`${t.name} Toolkit`} ctaLabel={t.ctaLabel} />
            )}
          </aside>
        </div>
      </section>

      {bundle && (
        <section className="wrap" style={{ paddingBottom: 24 }}>
          <div className="p-bundle">
            <div className="p-bundle-copy">
              <span className="icon-circle cream lg" aria-hidden="true"><Icon name="layers" size={28} /></span>
              <div className="stack gap-4">
                <h2 className="h3">{bundle.name}</h2>
                <p className="body-sm muted">{bundle.description}</p>
              </div>
            </div>
            <div className="p-bundle-cta">
              <Button to="/tools#bundle" variant="outline" arrow>{bundle.ctaLabel} — <Price amount={bundle.price} /></Button>
              <span className="p-caps sm">{dotJoin(bundle.bullets)}</span>
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="wrap section-sm" aria-labelledby="more-tk">
          <h2 id="more-tk" className="h3" style={{ marginBottom: 16 }}>{c.kicker}</h2>
          <ul className="p-next-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))' }}>
            {others.map((o) => (
              <li key={o.id} className={tone(o.color)}>
                <Link to={`/tools/${o.id}`}>
                  <span className="ic" aria-hidden="true"><Icon name={o.icon} size={22} /></span>
                  <span className="grow"><strong>{o.name}</strong><span className="body-sm muted">{o.shortTagline}</span></span>
                  <Icon name="arrow-right" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
