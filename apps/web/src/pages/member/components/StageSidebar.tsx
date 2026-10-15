import { NavLink } from 'react-router-dom';
import type { Rec, Stage } from '@shift/core';
import { Icon } from '@/ui/Icon';
import type { Journey } from './useJourney';
import { stageCtx } from './useJourney';
import { BackLink, QuoteCard, StatusGlyph } from './ui';

/** Left rail on lesson screens: stage name, its lessons with status, stage reflection and a handwritten quote. */
export function StageSidebar({ j, stage, currentLessonId, quote, reflectionActive }: { j: Journey; stage: Rec<Stage>; currentLessonId?: string; quote?: string; reflectionActive?: boolean }) {
  const lessons = j.byStage[stage.id] ?? [];
  const refl = j.workFor(stageCtx(stage.id));
  return (
    <aside className="m-side" aria-label={`${stage.name} lessons`}>
      <BackLink to={`/app/stage/${stage.id}`}>Back to {stage.name}</BackLink>
      <div className="stack gap-4">
        <div className="m-side-name">{stage.name}</div>
        <p className="body-sm muted">{stage.tagline}</p>
      </div>
      <ol className="m-side-list">
        {lessons.map((l, i) => {
          const st = j.status(l);
          const current = l.id === currentLessonId;
          const locked = st === 'locked' || st === 'no-access';
          const inner = (
            <>
              <span className="m-side-num">{i + 1}</span>
              <span className="grow">{l.title}</span>
              <StatusGlyph status={current && (st === 'available' || st === 'in-progress') ? 'current' : st} />
            </>
          );
          return (
            <li key={l.id}>
              {locked ? (
                <span className="m-side-item locked" aria-disabled="true">{inner}</span>
              ) : (
                <NavLink to={`/app/lesson/${l.id}`} className={`m-side-item ${current ? 'current' : ''}`} aria-current={current ? 'page' : undefined}>{inner}</NavLink>
              )}
            </li>
          );
        })}
        <li>
          <NavLink to={`/app/stage/${stage.id}/reflection`} className={`m-side-item ${reflectionActive ? 'current' : ''}`}>
            <span className="m-side-num ic"><Icon name="sparkle" size={14} /></span>
            <span className="grow">{stage.reflection.title}</span>
            {refl?.completed && <StatusGlyph status="completed" />}
          </NavLink>
        </li>
      </ol>
      <QuoteCard quote={quote ?? stage.sideQuote} className="m-side-quote" />
    </aside>
  );
}
