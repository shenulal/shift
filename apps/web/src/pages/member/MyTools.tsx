import { useAuth, usePublicList } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Kicker, Pill, Price } from '@/ui/kit';
import { PageLoading, tone } from './components/ui';
import './member.css';

export default function MyTools() {
  const { user, isAdmin } = useAuth();
  const toolkits = usePublicList('toolkits').data;
  const c = useContent<{ kicker: string; pageTitle: string; pageBody: string; priceNote: string }>('tools');
  if (!toolkits || !c || !user) return <PageLoading />;
  const owned = (id: string) => isAdmin || user.toolkitIds.includes(id);
  const mine = toolkits.filter((t) => owned(t.id));
  const others = toolkits.filter((t) => !owned(t.id));
  const Card = ({ t, own }: { t: (typeof toolkits)[number]; own: boolean }) => (
    <article className={`m-tk ${tone(t.color)}`}>
      <Art src={t.image} note={t.imageNote} />
      <div className="m-tk-body">
        <div className="row gap-8"><span className="icon-circle sm" aria-hidden="true" style={{ background: 'var(--t-soft)', color: 'var(--t-ink)' }}><Icon name={t.icon} size={16} /></span><h3 className="h4">{t.name}</h3>{own && <Pill tone="sage">Yours</Pill>}</div>
        <p className="body-sm muted">{t.shortTagline}</p>
        <p className="body-sm faint">{t.tools.filter((x) => x.active).length} tools</p>
        {own ? <Button size="sm" to={`/app/tools/${t.id}`} arrow>Open toolkit</Button> : <Button size="sm" variant="ghost" to={`/tools/${t.id}`} arrow>Get the toolkit · <Price amount={t.price} /></Button>}
      </div>
    </article>
  );
  return (
    <div className="wrap m-page stack gap-32">
      <header className="stack gap-8">
        <Kicker>{c.kicker}</Kicker>
        <h1 className="h1">My Tools</h1>
        <p className="muted" style={{ maxWidth: 640 }}>{c.pageBody}</p>
      </header>
      <section className="stack gap-16" aria-labelledby="owned">
        <h2 className="h3" id="owned">My toolkits</h2>
        {mine.length ? <div className="m-tk-grid">{mine.map((t) => <Card key={t.id} t={t} own />)}</div> : <p className="muted card-soft card-pad-sm">You don't have any toolkits yet — explore them below.</p>}
      </section>
      {others.length > 0 && (
        <section className="stack gap-16" aria-labelledby="more">
          <h2 className="h3" id="more">More toolkits</h2>
          <p className="body-sm muted">{c.priceNote}</p>
          <div className="m-tk-grid">{others.map((t) => <Card key={t.id} t={t} own={false} />)}</div>
        </section>
      )}
    </div>
  );
}
