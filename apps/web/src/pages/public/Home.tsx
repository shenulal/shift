import { usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Kicker, Price } from '@/ui/kit';
import { DiscoveryCta } from './components/DiscoveryCta';
import { CtaButton, PageLoading } from './components/shared';
import './public.css';

interface HomeContent {
  kicker: string;
  title: string;
  body: string;
  cta: string;
  heroQuote: string;
  pathTitle: string;
  paths: { key: string; title: string; text: string; cta: string; href: string; image: string }[];
  bannerQuote: string;
}

export default function Home() {
  const c = useContent<HomeContent>('home');
  const products = usePublicList('products').data;
  const toolkits = usePublicList('toolkits').data;
  if (!c) return <PageLoading />;

  const minToolkit = toolkits?.length ? Math.min(...toolkits.map((t) => t.price)) : null;
  const discover = products?.find((p) => p.kind === 'free');
  const journey = products?.find((p) => p.kind === 'journey');
  /** Price line per path, from master data (no price → nothing shown). */
  const priceFor = (key: string) => {
    if (key === 'discover' && discover) return <Price amount={discover.price} />;
    if (key === 'tools' && minToolkit !== null) return <Price amount={minToolkit} each />;
    if (key === 'journey' && journey && journey.price !== null) return <Price amount={journey.price} />;
    return null;
  };

  return (
    <>
      <section className="wrap" style={{ paddingTop: 24 }}>
        <div className="p-hero">
          <Art src="hero" />
          <div className="p-hero-copy">
            <Kicker>{c.kicker}</Kicker>
            <h1 className="h-display">{c.title}</h1>
            <p className="lead">{c.body}</p>
            <div>
              <Button to="/discover" size="lg" arrow>{c.cta}</Button>
            </div>
          </div>
          <p className="p-hero-quote">{c.heroQuote}</p>
        </div>
      </section>

      <section className="wrap section-sm" aria-labelledby="paths-title">
        <h2 id="paths-title" className="h2 center" style={{ marginBottom: 24 }}>{c.pathTitle}</h2>
        <div className="p-paths">
          {c.paths.map((p) => {
            const price = priceFor(p.key);
            return (
              <article key={p.key} className="p-pathcard">
                <Art src={p.image} />
                <div className="p-pathcard-body">
                  <h3 className="h4">{p.title}</h3>
                  <p className="body-sm muted">{p.text}</p>
                  {price && <div className="p-pathcard-price">{price}</div>}
                  <CtaButton href={p.href} size="sm" arrow>{p.cta}</CtaButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="wrap" aria-hidden={false}>
        <div className="p-banner">
          <Art src="homeBanner" quote={c.bannerQuote} quotePos="br" quoteSize={40} />
        </div>
      </section>

      <DiscoveryCta />
    </>
  );
}
