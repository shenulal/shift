import { Fragment } from 'react';
import { now, parseDate } from '@shift/core';
import { usePublicList, useSingleton } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { Button, Kicker, Script } from '@/ui/kit';
import { PageLoading, tone } from './components/ui';
import { firstName, useJourney } from './components/useJourney';
import './member.css';

/** Splits a stage name so its first letter can be drawn in the script accent ("𝒮elf-Awareness"). */
function BandName({ name }: { name: string }) {
  return <h2 className="serif m-band-name"><span className="script" aria-hidden="true">{name.charAt(0)}</span><span aria-hidden="true">{name.slice(1)}</span><span className="sr-only">{name}</span></h2>;
}

export default function Portal() {
  const j = useJourney();
  const checkpoints = usePublicList('checkpoints').data;
  const tpl = useSingleton('blueprint');
  const jc = useContent<{ blueprintTitle: string; blueprintBody: string; heroKicker: string }>('journey');
  if (!j.ready || !checkpoints || !tpl || !jc) return <PageLoading />;
  const plan = j.plan;
  const enrolment = j.enrolment;
  const coached = !!plan && !!enrolment;
  const sessionLessons = j.lessons.filter((l) => (coached ? j.covered.has(l.id) : true));
  const total = coached ? plan.sessions : sessionLessons.length;
  const done = coached ? enrolment.sessionsCompleted : j.progress.completed;
  const remaining = Math.max(0, total - done);
  const week = enrolment ? Math.max(1, Math.floor((now().getTime() - parseDate(enrolment.startDate).getTime()) / (7 * 864e5)) + 1) : null;
  const nextStage = j.nextLesson ? j.stages.find((s) => s.id === j.nextLesson!.stageId) : null;
  let n = 0;

  return (
    <div className="wrap m-page m-portal stack gap-24">
      <header className="stack gap-12">
        <Kicker>Welcome back, {firstName(j.user?.name)}</Kicker>
        <h1 className="serif m-portal-title">
          An entire {total}-session journey<br />to build your <span className="script">brighter</span> self.
        </h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          {coached
            ? `You chose the ${plan.name} package — ${plan.durationLabel} of guided coaching structured around the SHIFT framework. Every session below opens to a ${j.steps.map((s) => s.label).join(' → ')} workspace, and everything you write here feeds your progress and your personal SHIFT Blueprint.`
            : `You have ${jc.heroKicker}: every lesson below opens to a ${j.steps.map((s) => s.label).join(' → ')} workspace. Book 1:1 coaching to work through it with your coach.`}
        </p>
        <div className="m-chiprow">
          <span className="m-statchip">{done} session{done === 1 ? '' : 's'} complete</span>
          <span className="m-statchip">{remaining} session{remaining === 1 ? '' : 's'} remaining</span>
          {(week || nextStage) && <span className="m-statchip">{week ? `Week ${week}` : ''}{week && nextStage ? ' · ' : ''}{nextStage?.name ?? ''}</span>}
        </div>
      </header>

      {coached ? (
        <section className="m-package" aria-labelledby="pkg">
          <div className="stack gap-4" style={{ maxWidth: 560 }}>
            <Kicker>Active package</Kicker>
            <h2 className="h3" id="pkg">{plan.name} · {plan.sessions} sessions across {plan.durationLabel}</h2>
            <p className="body-sm muted">{plan.description}</p>
            {enrolment.nextSession && <p className="body-sm"><Icon name="calendar" size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Next session: {new Date(enrolment.nextSession).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
          <div className="m-package-n">
            <div className="serif">{plan.sessions}</div>
            <div className="label-caps">Complete sessions</div>
          </div>
        </section>
      ) : (
        <section className="m-package" aria-label="Journey">
          <p className="body-sm muted" style={{ maxWidth: 560 }}>You don't have a 1:1 coaching package yet, so this shows the full self-paced SHIFT Journey. Your coach will set up your sessions here once you enrol.</p>
          <Button to="/coaching" variant="ghost" arrow>Explore 1:1 Coaching</Button>
        </section>
      )}

      {j.stages.map((s, si) => {
        const ls = sessionLessons.filter((l) => l.stageId === s.id);
        if (!ls.length) return null;
        const cps = checkpoints.filter((c) => c.afterStageId === s.id).sort((a, b) => a.sessionNumber - b.sessionNumber);
        return (
          <Fragment key={s.id}>
            <section className="stack gap-14" aria-label={s.name} style={{ gap: 14 }}>
              <div className={`m-band ${tone(s.color)}`}>
                <div className="stack gap-4">
                  <span className="label-caps muted">Framework principle {si + 1} of {j.stages.length}</span>
                  <BandName name={s.name} />
                </div>
                <span className="label-caps muted">{coached ? s.portalWeeks : s.sessionsLabel}</span>
              </div>
              <ol className="m-sessions" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {ls.map((l) => {
                  n += 1;
                  const st = j.status(l);
                  const open = st !== 'locked' && st !== 'no-access';
                  const badge = st === 'completed' ? 'DONE' : n === sessionLessons.length ? 'FINAL SESSION' : `${l.portalMinutes} MINS`;
                  const idx = (j.byStage[s.id] ?? []).findIndex((x) => x.id === l.id) + 1;
                  return (
                    <li key={l.id} className={`m-session ${tone(s.color)}`}>
                      <div className="m-session-top">
                        <Art src={l.image} />
                        <span className="m-session-n">{n}</span>
                        <span className="m-session-badge">{badge}</span>
                        <Icon name={s.icon} size={36} />
                      </div>
                      <div className="m-session-body">
                        <span className="label-caps muted">{s.name} · {idx}</span>
                        <h3 className="h4">{l.title}</h3>
                        <p className="body-sm muted">{l.portalBlurb}</p>
                        {open ? (
                          <Button size="sm" to={`/app/lesson/${l.id}`} className="m-tone-btn" arrow>Open this session</Button>
                        ) : (
                          <span className="m-locked-btn"><Icon name="lock" size={14} />Opens after the previous session</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
            {coached && cps.map((c) => (
              <section key={c.id} className={`m-checkpoint ${tone(c.color)}`} aria-labelledby={`cp-${c.id}`}>
                <span className="m-checkpoint-ic" aria-hidden="true"><Icon name={c.icon} size={24} /></span>
                <div className="grow stack gap-4" style={{ flex: '1 1 280px' }}>
                  <h3 className="h4" id={`cp-${c.id}`}>{c.title}</h3>
                  <p className="body-sm muted">{c.description}</p>
                </div>
                <Button to={`/app/checkpoint/${c.id}`} arrow>{c.ctaLabel}</Button>
              </section>
            ))}
          </Fragment>
        );
      })}

      <section className="m-bpband" aria-labelledby="bp-h">
        <span className="label-caps muted">When session {total} ends</span>
        <div>
          <Script size={44}>My</Script>
          <h2 className="h2" id="bp-h">{jc.blueprintTitle.replace(/^(your|my)\s+/i, '')}</h2>
        </div>
        <p className="muted" style={{ maxWidth: 560 }}>{jc.blueprintBody}</p>
        <Button to="/app/blueprint" variant="primary" arrow>Generate my Blueprint</Button>
        <Script size={26}>{tpl.footerScript}</Script>
      </section>
    </div>
  );
}
