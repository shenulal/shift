import { Link } from 'react-router-dom';
import { formatCompactMoney } from '@shift/core';
import { useList, useSettings } from '@/data';
import { Button, Loading } from '@/ui/kit';
import { AdminShell, CMS_LINKS, useOverview } from './components/AdminShell';
import { AdminSection, StatCard } from './components/controls';
import { BookingStatus, OutboxList } from './components/shared';
import { errMsg } from './components/util';
import { Icon } from '@/ui/Icon';

/** /admin — Overview tab (images 37 + 38). */
export default function Overview() {
  const ov = useOverview();
  const settings = useSettings();
  const leads = useList('leads').data ?? [];
  const d = ov.data;
  const snap = d?.snapshot;
  const month = snap?.monthLabel.split(' ')[0] ?? '';
  const pipelineOpen = leads.filter((l) => !l.userId).length;
  return (
    <AdminShell tab="overview">
      {ov.isLoading ? (
        <Loading h={140} />
      ) : ov.isError ? (
        <p className="field-error" role="alert">Could not load the overview: {errMsg(ov.error)}</p>
      ) : d ? (
        <div className="adm-stats">
          <StatCard value={d.activeClients} label="Active 1:1 clients" note={d.byPlan || 'No active packages yet'} />
          <StatCard value={(snap?.emailListThisMonth ?? 0).toLocaleString('en-US')} label="Email list this month" note={snap ? `${snap.emailListDelta >= 0 ? '▲' : '▼'} ${Math.abs(snap.emailListDelta)}% vs last month` : undefined} />
          <StatCard value={formatCompactMoney(snap?.revenue ?? 0, settings?.currency ?? 'AED')} label={`Revenue · ${month}`} note={snap?.revenueNote} />
          <StatCard value={`${snap?.freeToolEmailRate ?? 0}%`} label="Free tool → email rate" note={snap?.freeToolNote} />
        </div>
      ) : null}

      <AdminSection title="This week" id="this-week">
        {d && d.thisWeek.length ? (
          <div className="scroll-x">
            <table className="table adm-table">
              <thead>
                <tr><th scope="col">When</th><th scope="col">What</th><th scope="col">Who</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {d.thisWeek.map((b) => (
                  <tr key={b.id}>
                    <td className="nowrap">{b.whenLabel}</td>
                    <td>{b.title}</td>
                    <td>{b.userId ? <Link className="adm-open" style={{ fontWeight: 400 }} to={`/admin/clients/${b.userId}`}>{b.whoLabel}</Link> : b.whoLabel}</td>
                    <td><BookingStatus status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="body-sm muted">{ov.isLoading ? '' : 'Nothing booked this week.'}</p>
        )}
      </AdminSection>

      <div className="adm-grid-2">
        <AdminSection title="Pipeline" sub={`${pipelineOpen} open lead${pipelineOpen === 1 ? '' : 's'} · ${d?.intakeAwaiting ?? 0} intake form${d?.intakeAwaiting === 1 ? '' : 's'} to review`} id="ov-pipeline" actions={<Button size="sm" variant="ghost" to="/admin/pipeline" arrow>Open pipeline</Button>}>
          <ul className="stack gap-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {leads.filter((l) => !l.userId).slice(0, 4).map((l) => (
              <li key={l.id} className="row between gap-12 body-sm" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                <span className="adm-client-name">{l.name}</span>
                <span className="muted">{l.nextStep}</span>
              </li>
            ))}
          </ul>
        </AdminSection>
        <AdminSection title="Latest emails" sub="Everything the site has sent, newest first." id="ov-outbox" actions={<Button size="sm" variant="ghost" to="/admin/cms/forms?tab=outbox" arrow>Outbox</Button>}>
          <OutboxList limit={4} compact />
        </AdminSection>
      </div>

      <AdminSection title="Settings & content" sub="Everything on the site — prices, toolkits, lessons, questions, emails and branding — is edited here." id="ov-cms">
        <div className="adm-grid-3">
          {CMS_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="adm-card row gap-12" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="icon-circle sage sm"><Icon name={l.icon} size={16} /></span>
              <span className="stack"><strong style={{ fontWeight: 500 }}>{l.label}</strong><span className="body-sm muted">{l.sub}</span></span>
            </Link>
          ))}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
