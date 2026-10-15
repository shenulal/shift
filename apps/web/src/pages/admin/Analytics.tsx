import { useMemo, useState } from 'react';
import { useList } from '@/data';
import { Loading, Select } from '@/ui/kit';
import { AdminShell } from './components/AdminShell';
import { AdminSection, StatCard } from './components/controls';
import { fmtNum } from './components/util';

/** /admin/analytics — Analytics tab (images 35 + 36). Monthly snapshot + live events recorded since it was taken. */
export default function Analytics() {
  const snapsQ = useList('analytics');
  const events = useList('events').data ?? [];
  const snaps = useMemo(() => (snapsQ.data ?? []).slice().sort((a, b) => b.month.localeCompare(a.month)), [snapsQ.data]);
  const [month, setMonth] = useState('');
  const snap = snaps.find((s) => s.month === month) ?? snaps[0];
  const isLatest = snap && snap.id === snaps[0]?.id;
  // live events added after the snapshot was taken (latest month only)
  const live = useMemo(() => {
    const c = { visit: 0, 'tool-complete': 0, email: 0, 'call-booked': 0, client: 0 } as Record<string, number>;
    if (!snap || !isLatest) return c;
    for (const e of events) if (e.at >= snap.updatedAt && c[e.type] !== undefined) c[e.type] += 1;
    return c;
  }, [events, snap, isLatest]);
  const liveTotal = Object.values(live).reduce((a, b) => a + b, 0);

  if (snapsQ.isLoading) return <AdminShell tab="analytics"><Loading h={240} /></AdminShell>;
  if (!snap) return <AdminShell tab="analytics"><p className="body-sm muted">No analytics yet.</p></AdminShell>;

  const visits = snap.siteVisits + live.visit;
  const completions = snap.toolCompletions + live['tool-complete'];
  const emails = snap.emails + live.email;
  const calls = snap.calls + live['call-booked'];
  const clients = snap.callsToClients + live.client;
  const emailRate = completions ? Math.round((emails / completions) * 100) : snap.emailRate;
  const max = Math.max(1, ...snap.sources.map((s) => s.visits));

  return (
    <AdminShell tab="analytics">
      {snaps.length > 1 && (
        <div style={{ maxWidth: 260 }}>
          <Select label="Month" value={snap.month} onChange={(v) => setMonth(v)} options={snaps.map((s) => ({ value: s.month, label: s.monthLabel }))} placeholder="Latest month" />
        </div>
      )}
      <div className="adm-stats">
        <StatCard value={fmtNum(visits)} label="Site visits · 30 days" note={`${snap.siteVisitsDelta >= 0 ? '▲' : '▼'} ${Math.abs(snap.siteVisitsDelta)}%`} />
        <StatCard value={fmtNum(completions)} label="Tool completions" note={snap.toolCompletionsNote} />
        <StatCard value={fmtNum(emails)} label="Emails captured" note={`${emailRate}% of completions`} />
        <StatCard value={fmtNum(calls)} label="Discovery calls booked" note={`${clients} became client${clients === 1 ? '' : 's'}`} />
      </div>
      {liveTotal > 0 && <p className="body-sm muted" style={{ marginTop: 10 }}>Includes {liveTotal} live event{liveTotal === 1 ? '' : 's'} recorded since this snapshot.</p>}

      <AdminSection title="Where leads are coming from" sub={`Tracked from first click → email capture → paid. ${snap.monthLabel}.`} id="sources">
        <div className="adm-bars" role="list">
          {snap.sources.map((s, i) => (
            <div key={s.name} role="listitem" className={`adm-bar-row ${i === snap.sources.length - 1 ? 'last' : ''}`}>
              <span>{s.name}</span>
              <span className="adm-bar-track" aria-hidden><span className="adm-bar-fill" style={{ width: `${(s.visits / max) * 100}%`, display: 'block' }} /></span>
              <span className="adm-bar-num">{fmtNum(s.visits)}</span>
              <span className="adm-bar-rate">{s.emailRate}% → email</span>
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Funnel this month" id="funnel">
        <div className="scroll-x">
          <table className="table adm-table">
            <thead><tr><th scope="col">Stage</th><th scope="col">People</th><th scope="col">Conversion</th><th scope="col">Best source</th></tr></thead>
            <tbody>
              {snap.funnel.map((f) => (
                <tr key={f.stage}>
                  <td>{f.stage}</td>
                  <td>{fmtNum(f.people)}</td>
                  <td>{f.conversion}</td>
                  <td>{f.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {snap.insight && <p className="adm-insight">{snap.insight}</p>}
      </AdminSection>
    </AdminShell>
  );
}
