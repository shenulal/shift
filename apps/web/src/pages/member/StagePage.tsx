import { Link, useParams } from 'react-router-dom';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Empty, ProgressBar } from '@/ui/kit';
import { BackLink, MetaRow, PageLoading, tone } from './components/ui';
import { lessonCtx, stageCtx, toolName, useJourney } from './components/useJourney';
import './member.css';

const META_ICONS = ['play', 'doc', 'phone', 'chart'];

export default function StagePage() {
  const { stageId } = useParams();
  const j = useJourney();
  if (!j.ready) return <PageLoading />;
  const idx = j.stages.findIndex((s) => s.id === stageId);
  const stage = j.stages[idx];
  if (!stage) {
    return (
      <div className="wrap section-sm">
        <Empty icon="compass" title="We couldn't find that stage"><Link to="/app/journey" className="link">Back to The SHIFT Journey</Link></Empty>
      </div>
    );
  }
  const lessons = j.byStage[stage.id] ?? [];
  const prog = j.stageProgress(stage.id);
  const anyStarted = lessons.some((l) => ['completed', 'in-progress'].includes(j.status(l)));
  const target = lessons.find((l) => ['in-progress', 'available'].includes(j.status(l)));
  const refl = j.workFor(stageCtx(stage.id));
  const stepLabels = j.steps;

  return (
    <div className="wrap m-page stack gap-24">
      <section className="m-jhero" aria-labelledby="stage-title">
        <div className="m-jhero-copy">
          <BackLink to="/app/journey">Back to The Journey</BackLink>
          <div className="kicker">Stage {idx + 1} of {j.stages.length}</div>
          <h1 className="h-display" id="stage-title">{stage.name}</h1>
          <p className="lead">{stage.tagline}</p>
          <p className="muted body-sm" style={{ maxWidth: 560 }}>{stage.intro}</p>
          <MetaRow items={stage.meta.map((m, i) => ({ icon: META_ICONS[i % META_ICONS.length], title: m }))} />
          <div className="m-progress-row" aria-label="Stage progress">
            <ProgressBar pct={prog.pct} />
            <span>{prog.done} of {prog.total} lessons completed</span>
          </div>
          {target ? (
            <div><Button size="lg" arrow to={`/app/lesson/${target.id}`} className={`m-tone-btn ${tone(stage.color)}`}>{anyStarted ? `Continue ${stage.name}` : `Start ${stage.name}`}</Button></div>
          ) : prog.total && prog.done === prog.total ? (
            <div><Button size="lg" arrow to={`/app/stage/${stage.id}/reflection`}>{stage.reflection.title}</Button></div>
          ) : !j.hasJourney ? (
            <div className="wrap-row gap-12"><Button to="/journey" arrow>Explore the Journey</Button><Button to="/coaching" variant="ghost">1:1 Coaching</Button></div>
          ) : null}
        </div>
        <Art src={stage.image} quote={stage.quote} quotePos="tr" quoteSize={32} className="m-jhero-art" />
      </section>

      <section aria-labelledby="included" className="stack gap-16">
        <h2 className="h2" id="included">What's included</h2>
        <ol className="m-lessonrows">
          {lessons.map((l, i) => {
            const st = j.status(l);
            const w = j.workFor(lessonCtx(l.id));
            const open = st !== 'locked' && st !== 'no-access';
            const items = [
              { icon: 'play', text: l.durationLabel },
              { icon: 'doc', text: l.reflections.length === 1 ? 'Reflection question' : l.reflections.length ? 'Reflection exercise' : stepLabels[1]?.label ?? '' },
              { icon: 'wrench', text: toolName(l) },
            ];
            return (
              <li key={l.id} className={`m-lessonrow ${st === 'in-progress' ? 'current' : ''}`}>
                <span className="num" aria-hidden="true">{st === 'completed' ? <Icon name="check" size={16} /> : i + 1}</span>
                <Art src={l.image} className={`m-lessonrow-art ${tone(stage.color)}`} />
                <div className="stack gap-4" style={{ minWidth: 0 }}>
                  <span className="label-caps muted">Lesson {i + 1}</span>
                  <h3 className="h4">{open ? <Link to={`/app/lesson/${l.id}`} style={{ textDecoration: 'none' }}>{l.title}</Link> : l.title}</h3>
                  <p className="body-sm muted">{l.subtitle}</p>
                </div>
                <ul className="m-lessonrow-items">
                  {items.filter((x) => x.text).map((x) => <li key={x.icon}><Icon name={x.icon} size={14} />{x.text}</li>)}
                </ul>
                <div className="m-lessonrow-cta">
                  {open ? (
                    <Button size="sm" arrow variant={st === 'in-progress' ? 'primary' : st === 'completed' ? 'ghost' : 'taupe'} to={`/app/lesson/${l.id}${st === 'in-progress' && w?.step ? `?step=${Math.min(4, w.step)}` : ''}`}>
                      {st === 'completed' ? 'Review Lesson' : st === 'in-progress' ? 'Continue Lesson' : 'Open Lesson'}
                    </Button>
                  ) : (
                    <span className="m-locked-btn"><Icon name="lock" size={14} />Locked</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="m-banner" aria-labelledby="stage-refl">
        <span className="m-banner-ic" aria-hidden="true"><Icon name="star" size={24} /></span>
        <div className="grow stack gap-4" style={{ flex: '1 1 260px' }}>
          <h2 className="h4" id="stage-refl">{stage.reflection.title}</h2>
          <p className="body-sm muted">{stage.reflection.description}</p>
        </div>
        <Button to={`/app/stage/${stage.id}/reflection`} arrow>{refl?.completed ? 'Review Reflection' : 'Open Reflection'}</Button>
      </section>
    </div>
  );
}
