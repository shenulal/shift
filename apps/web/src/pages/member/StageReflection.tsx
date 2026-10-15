import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@/data';
import { AutosaveIndicator, Button, DraftTag, Empty, useToast } from '@/ui/kit';
import { StageSidebar } from './components/StageSidebar';
import { PageLoading, QuestionField, StepHead } from './components/ui';
import { stageCtx, useJourney } from './components/useJourney';
import { useWorkDraft } from './components/useWorkDraft';
import './member.css';

export default function StageReflection() {
  const { stageId } = useParams();
  const j = useJourney();
  const ctx = stageCtx(stageId ?? '');
  const wd = useWorkDraft(ctx, j.workFor(ctx), j.ready);
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  if (!j.ready) return <PageLoading />;
  const idx = j.stages.findIndex((s) => s.id === stageId);
  const stage = j.stages[idx];
  if (!stage) {
    return <div className="wrap section-sm"><Empty icon="compass" title="We couldn't find that stage"><Link to="/app/journey" className="link">Back to The SHIFT Journey</Link></Empty></div>;
  }
  const work = j.workFor(ctx);
  const next = j.stages[idx + 1];
  const complete = async () => {
    try {
      await wd.commit({ completed: true, step: 4 });
      await qc.invalidateQueries({ queryKey: ['c'] });
      toast(`${stage.reflection.title} saved`);
      nav(next ? `/app/stage/${next.id}` : '/app/journey');
    } catch (e) {
      toast((e as Error).message, true);
    }
  };
  return (
    <div className="wrap m-page m-lesson">
      <StageSidebar j={j} stage={stage} reflectionActive />
      <main className="m-main">
        <section className="card m-stepcard stack gap-24">
          <StepHead icon="sparkle" kicker={`Stage ${idx + 1} of ${j.stages.length} • ${stage.name}`} title={<>{stage.reflection.title} {stage.reflection.draft && <DraftTag />}</>} sub={stage.reflection.description} />
          {!wd.draft ? <div className="skeleton" style={{ height: 260 }} /> : (
            <div className="stack gap-12">
              {stage.reflection.questions.map((q, i) => (
                <QuestionField key={q.id} n={i + 1} prompt={q.prompt} helper={q.helper} placeholder={q.placeholder} value={wd.draft!.reflections[q.id] ?? ''} onChange={(v) => wd.setReflection(q.id, v)} />
              ))}
            </div>
          )}
          <div className="m-stepfoot">
            <div className="wrap-row gap-12">
              <Button arrow onClick={complete} disabled={wd.saving}>{work?.completed ? 'Save Reflection' : 'Complete Reflection'}</Button>
              <Button variant="ghost" to={`/app/stage/${stage.id}`}>Back to {stage.name}</Button>
            </div>
            <AutosaveIndicator status={wd.status === 'idle' ? 'saved' : wd.status} />
          </div>
        </section>
      </main>
    </div>
  );
}
