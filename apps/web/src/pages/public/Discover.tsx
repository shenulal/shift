import { usePublicList, useSingleton } from '@/data';
import { WheelOfLife } from '@/ui/charts';
import { Button, Kicker } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { PageLoading } from './components/shared';
import './public.css';

export default function Discover() {
  const ft = useSingleton('freeTool');
  const questions = usePublicList('freeQuestions').data;
  if (!ft || !questions) return <PageLoading />;
  const l = ft.landing;
  const sorted = [...questions].sort((a, b) => a.number - b.number);
  // "Six powerful questions. One meaningful step." → card title is the first sentence.
  const cardTitle = l.subtitle.split('.')[0];

  return (
    <section className="wrap section-sm">
      <div className="p-center-col stack gap-12">
        <Kicker>{l.label}</Kicker>
        <h1 className="h1">{l.title}</h1>
        <p className="h3 serif">{l.subtitle}</p>
        <p className="muted italic">{l.body}</p>
      </div>

      <div className="split" style={{ marginTop: 36, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
          <WheelOfLife value={{}} readOnly size={300} center={ft.wheel.title} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="p-six" aria-label={cardTitle}>
            <div className="p-caps center">{cardTitle}</div>
            <ol>
              {sorted.map((q) => (
                <li key={q.id}>
                  <span className="num">{q.number}</span>
                  <span>{q.theme}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="p-feature3" style={{ maxWidth: 820, margin: '40px auto 0' }}>
        {l.bullets.map((b, i) => (
          <div key={i}>
            <span className="icon-circle sage" aria-hidden="true"><Icon name={b.icon} size={22} /></span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <div className="center" style={{ marginTop: 32 }}>
        <Button to="/discover/start" size="lg" arrow>{l.cta}</Button>
      </div>
    </section>
  );
}
