import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fmtDay } from '@shift/core';
import { useAction, useList } from '@/data';
import { Button, Loading, Modal, ProgressBar, Select, TextInput, useToast } from '@/ui/kit';
import { AdminShell } from './components/AdminShell';
import { AdminSection, Dash, TonePill } from './components/controls';
import { PlanPill } from './components/shared';
import { errMsg } from './components/util';

/** Modal: create a client account (optionally with a package). */
export function AddClientModal({ open, onClose, leadId, defaults }: { open: boolean; onClose: () => void; leadId?: string; defaults?: { name?: string; email?: string } }) {
  const plans = useList('plans').data ?? [];
  const create = useAction('createClient');
  const toast = useToast();
  const nav = useNavigate();
  const [name, setName] = useState(defaults?.name ?? '');
  const [email, setEmail] = useState(defaults?.email ?? '');
  const [planId, setPlanId] = useState('');
  const [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    try {
      const u = await create.mutateAsync({ name, email, planId: planId || undefined, leadId });
      toast(`${u.name} added as a client`);
      onClose();
      nav(`/admin/clients/${u.id}`);
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={leadId ? 'Convert lead to client' : 'Add a client'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => void submit()} disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create client'}</Button></>}
    >
      <div className="stack gap-16">
        <TextInput label="Full name" value={name} onChange={setName} required />
        <TextInput label="Email" type="email" value={email} onChange={setEmail} required />
        <Select label="Package" value={planId} onChange={setPlanId} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.sessions} sessions${p.active ? '' : ' (inactive)'}` }))} placeholder="No package yet" />
        {err && <p className="field-error" role="alert">{err}</p>}
      </div>
    </Modal>
  );
}

/** /admin/clients — My Clients tab (image 33). */
export default function Clients() {
  const enrollments = useList('enrollments');
  const users = useList('users').data ?? [];
  const plans = useList('plans').data ?? [];
  const [adding, setAdding] = useState(false);
  const rows = (enrollments.data ?? []).filter((e) => e.status === 'active');
  const others = (enrollments.data ?? []).filter((e) => e.status !== 'active');
  const unenrolled = users.filter((u) => u.role === 'client' && !(enrollments.data ?? []).some((e) => e.userId === u.id));
  return (
    <AdminShell tab="clients">
      <AdminSection title="Active clients" id="active-clients" actions={<Button size="sm" icon="plus" onClick={() => setAdding(true)}>Add client</Button>}>
        {enrollments.isLoading ? (
          <Loading h={180} />
        ) : !rows.length ? (
          <p className="body-sm muted">No active 1:1 clients yet.</p>
        ) : (
          <div className="scroll-x">
            <table className="table adm-table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Package</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Focus areas (wheel)</th>
                  <th scope="col">Forms</th>
                  <th scope="col">Next<br />session</th>
                  <th scope="col"><span className="sr-only">Portal</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const u = users.find((x) => x.id === e.userId);
                  const plan = plans.find((p) => p.id === e.planId);
                  const total = plan?.sessions ?? 0;
                  return (
                    <tr key={e.id}>
                      <td>
                        <div className="adm-client-name">{u?.name ?? 'Unknown'}</div>
                        <div className="body-sm muted">{e.emailMasked}</div>
                      </td>
                      <td><PlanPill plan={plan} /></td>
                      <td>
                        <div className="adm-progress">
                          <ProgressBar pct={total ? (e.sessionsCompleted / total) * 100 : 0} />
                          <span className="body-sm">{e.sessionsCompleted}/{total}</span>
                        </div>
                      </td>
                      <td style={{ minWidth: 180 }}>{e.focusAreas.length ? e.focusAreas.map((f) => (f.score !== null ? `${f.label} (${f.score}/10)` : f.label)).join(' · ') : <Dash />}</td>
                      <td>
                        <div className="adm-form-pills">
                          <TonePill tone={e.forms.intake ? 'sage' : 'rose'}>{e.forms.intake ? 'Intake ✓' : 'Intake pending'}</TonePill>
                          <TonePill tone={e.forms.signed ? 'sage' : 'rose'}>{e.forms.signed ? 'Signed ✓' : 'Not signed'}</TonePill>
                        </div>
                      </td>
                      <td className="nowrap">{e.nextSession ? fmtDay(new Date(e.nextSession)) : <Dash />}</td>
                      <td><Link className="adm-open" to={`/admin/clients/${e.userId}`}>Open portal →</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="adm-footnote">
          Each client's portal shows their own session map, reflections and Wheel-of-Life progress — <Link to="/admin/preview">preview the client view →</Link>
        </p>
      </AdminSection>

      {(others.length > 0 || unenrolled.length > 0) && (
        <AdminSection title="Other accounts" sub="Completed or pending packages, and clients without a package (e.g. self-paced Journey or toolkit buyers)." id="other-clients">
          <div className="scroll-x">
            <table className="table adm-table">
              <thead><tr><th scope="col">Client</th><th scope="col">Package</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {others.map((e) => {
                  const u = users.find((x) => x.id === e.userId);
                  return (
                    <tr key={e.id}>
                      <td className="adm-client-name">{u?.name ?? e.userId}</td>
                      <td><PlanPill plan={plans.find((p) => p.id === e.planId)} /></td>
                      <td><TonePill tone={e.status === 'completed' ? 'green' : 'peach'}>{e.status}</TonePill></td>
                      <td><Link className="adm-open" to={`/admin/clients/${e.userId}`}>Open →</Link></td>
                    </tr>
                  );
                })}
                {unenrolled.map((u) => (
                  <tr key={u.id}>
                    <td><div className="adm-client-name">{u.name}</div><div className="body-sm muted">{u.email}</div></td>
                    <td><Dash /></td>
                    <td><TonePill tone="beige">{u.journeyAccess ? 'Journey access' : u.toolkitIds.length ? `${u.toolkitIds.length} toolkit(s)` : 'No package'}</TonePill></td>
                    <td><Link className="adm-open" to={`/admin/clients/${u.id}`}>Open →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminSection>
      )}
      {adding && <AddClientModal open onClose={() => setAdding(false)} />}
    </AdminShell>
  );
}
