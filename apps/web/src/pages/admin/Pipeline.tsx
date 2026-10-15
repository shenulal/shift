import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fmtDate, type Lead, type Rec } from '@shift/core';
import { useAction, useList } from '@/data';
import { Button, Loading, Select, useToast } from '@/ui/kit';
import { WheelOfLife } from '@/ui/charts';
import { AdminShell } from './components/AdminShell';
import { AdminSection, Dash, Drawer, Switch, TonePill } from './components/controls';
import { EmailCard, KeyValue, OutboxList, SourcePill, SubmissionsList, fill, useTemplateVars } from './components/shared';
import { errMsg, firstName } from './components/util';
import { AddClientModal } from './Clients';

const IntakePill = ({ v }: { v: Lead['intake'] }) => (v === 'received' ? <TonePill tone="sage">Received ✓</TonePill> : v === 'in-progress' ? <TonePill tone="rose">In progress</TonePill> : <Dash />);

function TriggerEmail({ lead }: { lead: Rec<Lead> }) {
  const templates = (useList('emails').data ?? []).filter((t) => t.active);
  const trigger = useAction('triggerEmail');
  const toast = useToast();
  const [key, setKey] = useState('');
  const vars = useTemplateVars({ name: firstName(lead.name) });
  const tpl = templates.find((t) => t.key === key);
  const send = async () => {
    if (!tpl) return;
    try {
      await trigger.mutateAsync({ templateKey: tpl.key, to: lead.email, vars: { name: firstName(lead.name) } });
      toast(`"${tpl.name}" sent to ${lead.email} — see the outbox`);
      setKey('');
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <div className="stack gap-12">
      <Select label="Email template" value={key} onChange={setKey} options={templates.map((t) => ({ value: t.key, label: `${t.name}${t.draft ? ' (draft copy)' : ''}` }))} placeholder="Choose an email to send" />
      {tpl && (
        <>
          <EmailCard to={lead.email} fromName={tpl.fromName} fromEmail={tpl.fromEmail} subject={fill(tpl.subject, vars)} preheader={fill(tpl.preheader, vars)} body={fill(tpl.body, vars)} ctaLabel={tpl.ctaLabel} />
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button icon="mail" onClick={() => void send()} disabled={trigger.isPending}>{trigger.isPending ? 'Sending…' : `Send to ${firstName(lead.name)}`}</Button>
          </div>
        </>
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Rec<Lead>; onClose: () => void }) {
  const stages = useList('pipelineStages').data ?? [];
  const ftSubs = (useList('freeToolSubmissions').data ?? []).filter((s) => s.leadId === lead.id || s.email === lead.email);
  const questions = useList('freeQuestions').data ?? [];
  const wheel = (useList('wheelScores').data ?? []).filter((w) => w.leadId === lead.id);
  const [convert, setConvert] = useState(false);
  return (
    <Drawer open onClose={onClose} title={lead.name} sub={`${lead.email}${lead.phone ? ` · ${lead.phone}` : ''}`} wide>
      <div className="adm-grid-2">
        <div className="stack gap-20">
          <div className="adm-card">
            <dl className="adm-dl">
              <KeyValue label="Source"><SourcePill id={lead.source} /></KeyValue>
              <KeyValue label="Stage">{stages.find((s) => s.id === lead.stageId)?.name ?? lead.stageId}</KeyValue>
              <KeyValue label="Next step">{lead.nextStep || '—'}</KeyValue>
              <KeyValue label="Location">{lead.location || '—'}</KeyValue>
              <KeyValue label="Wants support with">{lead.supportAreas.join(', ') || '—'}</KeyValue>
              <KeyValue label="Goal">{lead.goal || '—'}</KeyValue>
              <KeyValue label="Created">{fmtDate(lead.createdAt.slice(0, 10))}</KeyValue>
            </dl>
          </div>
          <div className="adm-card stack gap-12">
            <h3 className="h4">Convert to client</h3>
            {lead.userId ? (
              <p className="body-sm">Already a client — <Link className="adm-open" to={`/admin/clients/${lead.userId}`}>open their record →</Link></p>
            ) : (
              <>
                <p className="body-sm muted">Creates a client account (and their portal) from this lead, optionally with a package.</p>
                <Button variant="sage" icon="user" onClick={() => setConvert(true)}>Convert to client</Button>
              </>
            )}
          </div>
          <div className="adm-card stack gap-12">
            <h3 className="h4">Trigger an email</h3>
            <TriggerEmail lead={lead} />
          </div>
        </div>
        <div className="stack gap-20">
          <div className="adm-card stack gap-12">
            <h3 className="h4">Submitted forms</h3>
            <SubmissionsList leadId={lead.id} />
            {lead.userId && <SubmissionsList userId={lead.userId} />}
          </div>
          <div className="adm-card stack gap-12">
            <h3 className="h4">Discover SHIFT (free tool)</h3>
            {!ftSubs.length && !wheel.length && <p className="body-sm muted">No free-tool answers yet.</p>}
            {ftSubs.map((s) => (
              <div key={s.id} className="stack gap-12">
                {Object.keys(s.answers).length > 0 && (
                  <dl className="adm-dl">
                    {Object.entries(s.answers).map(([qid, a]) => (
                      <KeyValue key={qid} label={questions.find((q) => q.id === qid)?.question ?? qid}>{Array.isArray(a) ? a.join(', ') : a}</KeyValue>
                    ))}
                  </dl>
                )}
                {Object.keys(s.plan ?? {}).length > 0 && <dl className="adm-dl">{Object.entries(s.plan).map(([k, v]) => <KeyValue key={k} label={k}>{v}</KeyValue>)}</dl>}
                {Object.keys(s.scores).length > 0 && <WheelOfLife value={s.scores} readOnly size={260} center="Wheel of Life" />}
              </div>
            ))}
            {!ftSubs.some((s) => Object.keys(s.scores).length) && wheel.map((w) => <WheelOfLife key={w.id} value={w.scores} readOnly size={260} center="Wheel of Life" />)}
          </div>
        </div>
      </div>
      {convert && <AddClientModal open onClose={() => setConvert(false)} leadId={lead.id} defaults={{ name: lead.name, email: lead.email }} />}
    </Drawer>
  );
}

/** /admin/pipeline — Pipeline & Forms tab (image 34). */
export default function Pipeline() {
  const leadsQ = useList('leads');
  const stages = useList('pipelineStages').data ?? [];
  const move = useAction('moveLead');
  const toast = useToast();
  const [sendEmail, setSendEmail] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const leads = useMemo(() => leadsQ.data ?? [], [leadsQ.data]);
  const open = leads.find((l) => l.id === openId);
  const changeStage = async (lead: Rec<Lead>, stageId: string) => {
    if (!stageId || stageId === lead.stageId) return;
    try {
      await move.mutateAsync({ leadId: lead.id, stageId, sendEmail });
      const st = stages.find((s) => s.id === stageId);
      toast(`${lead.name} moved to "${st?.name}"${sendEmail && st?.emailKey ? ' — stage email queued' : ''}`);
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <AdminShell tab="pipeline">
      <AdminSection
        title="Pipeline — forms & sign-ups"
        id="pipeline"
        actions={<Switch label="Send the stage email when I move a lead" checked={sendEmail} onChange={setSendEmail} />}
      >
        {leadsQ.isLoading ? (
          <Loading h={200} />
        ) : (
          <div className="scroll-x">
            <table className="table adm-table">
              <thead>
                <tr>
                  <th scope="col">Lead</th>
                  <th scope="col">Source</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Intake</th>
                  <th scope="col">Wheel of life</th>
                  <th scope="col">Agreement</th>
                  <th scope="col">Next step</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="adm-click-row" onClick={() => setOpenId(l.id)}>
                    <td><button type="button" className="link adm-left" style={{ textDecoration: 'none' }} onClick={(e) => { e.stopPropagation(); setOpenId(l.id); }}>{l.name}</button></td>
                    <td><SourcePill id={l.source} /></td>
                    <td onClick={(e) => e.stopPropagation()} style={{ minWidth: 200 }}>
                      <label className="sr-only" htmlFor={`stage-${l.id}`}>Stage for {l.name}</label>
                      <select id={`stage-${l.id}`} className="select" style={{ minHeight: 38, padding: '6px 32px 6px 10px', background: 'transparent' }} value={l.stageId} onChange={(e) => void changeStage(l, e.target.value)}>
                        {stages.map((s) => <option key={s.id} value={s.id}>{s.name}{s.active ? '' : ' (inactive)'}</option>)}
                      </select>
                    </td>
                    <td><IntakePill v={l.intake} /></td>
                    <td>{l.wheel === 'done' ? <TonePill tone="sage">Done ✓</TonePill> : <Dash />}</td>
                    <td>{l.agreement === 'signed' ? <TonePill tone="sage">Signed ✓</TonePill> : <Dash />}</td>
                    <td className="nowrap">{l.nextStep || <Dash />}</td>
                  </tr>
                ))}
                {!leads.length && <tr><td colSpan={7} className="center muted body-sm">No leads yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <p className="adm-footnote">Leads appear here the moment they submit the intake form, buy a toolkit, or join the list — with the source attached, so you always know which channel is working.</p>
      </AdminSection>

      <AdminSection title="Submitted forms" sub="Every enquiry, intake, agreement and check-in — click one to read the answers." id="submitted">
        <SubmissionsList />
      </AdminSection>

      <AdminSection title="Email outbox" sub="Automatic and manual emails, newest first." id="outbox">
        <OutboxList />
      </AdminSection>

      {open && <LeadDrawer lead={open} onClose={() => setOpenId(null)} />}
    </AdminShell>
  );
}
