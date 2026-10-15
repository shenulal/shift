import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderedLessons } from '@shift/core';
import { useList, useSingleton } from '@/data';
import { Button, Empty, Loading, Script, Select } from '@/ui/kit';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { COLOR_HEX, firstName } from './components/util';

const BAND_BG: Record<string, string> = { sage: '#e3e8df', blush: '#f1e2dd', peach: '#f6e6d6', blue: '#e2e9f0', taupe: '#ece3d8', rose: '#f3dfdc', green: '#e1eadc', tan: '#efe5d3', lavender: '#e9e6f2', beige: '#efe8df', deep: '#dfe3dc', charcoal: '#e5e5e1' };
const BTN: Record<string, string> = { sage: 'sage', blush: 'rose', rose: 'rose', peach: 'taupe', taupe: 'taupe', tan: 'taupe', blue: 'sage', green: 'sage' };

/** /admin/preview — read-only "client view" of a client's portal summary (image 39). */
export default function Preview() {
  const [params, setParams] = useSearchParams();
  const blueprint = useSingleton('blueprint');
  const users = (useList('users').data ?? []).filter((u) => u.role === 'client');
  const enrollments = useList('enrollments').data ?? [];
  const plans = useList('plans').data ?? [];
  const stagesQ = useList('stages');
  const stages = (stagesQ.data ?? []).filter((s) => s.active);
  const lessons = (useList('lessons').data ?? []).filter((l) => l.active);
  const checkpoints = (useList('checkpoints').data ?? []).filter((c) => c.active);
  const userId = params.get('user') || enrollments.find((e) => e.status === 'active')?.userId || users[0]?.id || '';
  const user = users.find((u) => u.id === userId);
  const work = useList('work', { userId }, { enabled: !!userId }).data ?? [];
  const enrollment = enrollments.find((e) => e.userId === userId);
  const plan = plans.find((p) => p.id === enrollment?.planId);
  const covered = useMemo(() => new Set(plan ? Object.values(plan.coverage).flat() : lessons.map((l) => l.id)), [plan, lessons]);
  const ordered = orderedLessons(lessons, stages).filter((l) => covered.has(l.id));
  const doneIds = new Set(work.filter((w) => w.completed).map((w) => w.context.replace('lesson:', '')));
  const remaining = plan && enrollment ? Math.max(0, plan.sessions - enrollment.sessionsCompleted) : null;
  const currentStage = stages.find((s) => ordered.some((l) => l.stageId === s.id && !doneIds.has(l.id)));

  return (
    <AdminShell
      tab="clients"
      kicker="Client view (preview)"
      title={user ? `${user.name}'s portal` : 'Client view'}
      sub={<p className="adm-band-sub">Exactly what your client sees on their portal home — read-only.</p>}
      actions={user && <Button variant="light" size="sm" to={`/admin/clients/${user.id}`} arrow>Open their record</Button>}
    >
      <div className="row gap-16" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 240 }}>
          <Select label="Preview as" value={userId} onChange={(v) => v && setParams({ user: v }, { replace: true })} options={users.map((u) => ({ value: u.id, label: u.name }))} placeholder="Choose a client" />
        </div>
        {user && <Link className="adm-open" to={`/admin/clients/${user.id}`} style={{ marginBottom: 12 }}>Open their record →</Link>}
      </div>

      {stagesQ.isLoading ? (
        <Loading />
      ) : !user ? (
        <Empty icon="user" title="Choose a client to preview" />
      ) : (
        <div className="adm-pv" aria-label={`Portal preview for ${user.name}`}>
          <div className="adm-pv-hero">
            <div className="kicker">Welcome back, {firstName(user.name)}</div>
            <h2>
              {plan ? `An entire ${plan.sessions}-session journey` : 'Your SHIFT journey'}
              <br />to build your <Script className="script" size={44}>brighter</Script> self.
            </h2>
            {plan && <p className="lead" style={{ fontSize: 15 }}>You chose the {plan.name} package — {plan.description.charAt(0).toLowerCase()}{plan.description.slice(1)}</p>}
            <div className="adm-pv-chips">
              {enrollment && <span className="adm-pv-chip">{enrollment.sessionsCompleted} sessions complete</span>}
              {remaining !== null && <span className="adm-pv-chip">{remaining} sessions remaining</span>}
              {currentStage && <span className="adm-pv-chip">{currentStage.portalWeeks.split('·')[1]?.trim() || currentStage.sessionsLabel} · {currentStage.name}</span>}
            </div>
          </div>

          {plan ? (
            <div className="adm-pv-package">
              <div className="stack gap-4" style={{ maxWidth: 520 }}>
                <div className="kicker">Active package</div>
                <div className="serif" style={{ fontSize: 20, color: 'var(--ink)' }}>{plan.name} · {plan.sessions} sessions across {plan.durationLabel}</div>
                <p className="body-sm muted">{plan.subtitle}. {plan.supportLabel}.</p>
              </div>
              <div className="adm-pv-package-n"><div className="serif">{plan.sessions}</div><div className="label-caps muted">Complete sessions</div></div>
            </div>
          ) : (
            <div className="adm-pv-package"><p className="body-sm">No 1:1 package assigned — this client sees the self-paced journey{user.journeyAccess ? '' : ' (no Journey access yet)'}.</p></div>
          )}

          {stages.map((s, si) => {
            const ls = ordered.filter((l) => l.stageId === s.id);
            if (!ls.length) return null;
            const cps = checkpoints.filter((c) => c.afterStageId === s.id);
            return (
              <section key={s.id} aria-label={s.name}>
                <div className="adm-pv-band" style={{ background: BAND_BG[s.color] ?? '#efe8df' }}>
                  <div className="stack gap-4">
                    <div className="label-caps muted">Transformation principle {si + 1} of {stages.length}</div>
                    <h3><Script className="script" size={34}>{s.letter}</Script>{s.name.slice(1)}</h3>
                  </div>
                  <span className="adm-pv-weeks">{s.portalWeeks}</span>
                </div>
                <div className="adm-pv-cards">
                  {ls.map((l) => {
                    const done = doneIds.has(l.id);
                    const n = ordered.indexOf(l) + 1;
                    return (
                      <article key={l.id} className="adm-pv-card">
                        <div className="adm-pv-card-art">
                          <Art src={l.image} className="ratio-16x9" />
                          <span className="adm-pv-card-n">{n}</span>
                          <span className={`adm-pv-card-tag ${done ? 'done' : ''}`}>{done ? 'Done ✓' : `${l.portalMinutes} mins`}</span>
                        </div>
                        <div className="adm-pv-card-body">
                          <div className="label-caps muted">{s.name} · {l.order}</div>
                          <h4 className="h4">{l.title}</h4>
                          <p className="body-sm muted">{l.portalBlurb || l.subtitle}</p>
                          <span className={`btn btn-${BTN[s.color] ?? 'sage'} btn-sm`} aria-disabled="true">Open this session →</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {cps.map((c) => (
                  <div key={c.id} className="adm-pv-checkpoint" style={{ background: BAND_BG[c.color] ?? '#efe8df' }}>
                    <span className="icon-circle white"><Icon name={c.icon} size={20} /></span>
                    <div className="grow stack gap-4" style={{ minWidth: 200 }}>
                      <strong className="serif" style={{ fontWeight: 500, fontSize: 17, color: 'var(--ink)' }}>{c.title}</strong>
                      <span className="body-sm muted">{c.description}</span>
                    </div>
                    <span className="btn btn-primary btn-sm" aria-disabled="true">{c.ctaLabel}</span>
                  </div>
                ))}
              </section>
            );
          })}

          <div className="adm-pv-blueprint">
            <div className="label-caps muted">When session {plan?.sessions ?? ordered.length} ends</div>
            <div className="serif" style={{ fontSize: 28, color: 'var(--ink)' }}>{blueprint?.title ?? 'Blueprint'}</div>
            <p className="body-sm muted" style={{ maxWidth: 480 }}>{blueprint?.subtitle}</p>
            <span className="btn btn-primary btn-sm" aria-disabled="true">Generate my Blueprint →</span>
            {blueprint?.footerScript && <Script size={26} style={{ color: COLOR_HEX.taupe }}>{blueprint.footerScript}</Script>}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
