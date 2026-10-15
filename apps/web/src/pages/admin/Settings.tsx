import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Rec, StepLabel, User } from '@shift/core';
import { useAction, useAuth, useCrud, useList, useRecord } from '@/data';
import { Button, Confirm, Loading, Modal, Select, Tabs, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection, CheckList, Dash, Switch, TonePill } from './components/controls';
import { RecordForm, SingletonForm, type FieldSpec } from './components/RecordEditor';
import { PlanPill } from './components/shared';
import { COLOR_HEX, errMsg } from './components/util';
import { AddClientModal } from './Clients';

/* eslint-disable @typescript-eslint/no-explicit-any */

type TabId = 'general' | 'sessions' | 'journey' | 'stages' | 'pipeline' | 'users' | 'blueprint' | 'admin';
const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'sessions', label: 'Sessions & booking' },
  { id: 'journey', label: 'Journey' },
  { id: 'stages', label: 'Client journey stages' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'users', label: 'Users & roles' },
  { id: 'blueprint', label: 'Blueprint PDF' },
  { id: 'admin', label: 'Admin account' },
];

const general: FieldSpec[] = [
  { key: 'siteName', label: 'Site name', type: 'text', required: true },
  { key: 'currency', label: 'Currency', type: 'select', required: true, options: ['AED', 'SAR', 'QAR', 'USD', 'EUR', 'GBP'].map((c) => ({ value: c, label: c })), help: 'Used for every price on the site.' },
  { key: 'coachName', label: 'Coach name', type: 'text', required: true },
  { key: 'coachTitle', label: 'Coach title', type: 'text' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'social.instagram', label: 'Instagram', type: 'text' },
  { key: 'social.linkedin', label: 'LinkedIn', type: 'text' },
  { key: 'social.tiktok', label: 'TikTok', type: 'text' },
  { key: 'social.youtube', label: 'YouTube', type: 'text' },
];

const sessions: FieldSpec[] = [
  { key: 'h1', label: '1:1 sessions', type: 'heading' },
  { key: 'session.lengthMin', label: 'Session length (minutes)', type: 'number', min: 15 },
  { key: 'session.validityMonths', label: 'Package validity (months)', type: 'number', min: 1 },
  { key: 'session.rescheduleHours', label: 'Reschedule notice (hours)', type: 'number', min: 0 },
  { key: 'h2', label: 'Discovery call', type: 'heading' },
  { key: 'discoveryCall.title', label: 'Title', type: 'text' },
  { key: 'discoveryCall.durationMin', label: 'Duration (minutes)', type: 'number', min: 5 },
  { key: 'discoveryCall.platformText', label: 'Platform', type: 'text' },
  { key: 'discoveryCall.bookingUrl', label: 'Booking URL', type: 'text' },
  { key: 'h3', label: 'Availability', type: 'heading' },
  { key: 'availability.days', label: 'Days offered', type: 'strings' },
  { key: 'availability.times', label: 'Times offered', type: 'strings' },
  { key: 'h4', label: 'Payment options', type: 'heading' },
  {
    key: 'paymentOptions', label: 'Payment options', type: 'objects', addLabel: 'Add payment option',
    blank: () => ({ key: 'new', label: '', icon: 'card', enabled: true }),
    itemLabel: (o, i) => `${i + 1}. ${o.label || 'New option'}${o.enabled ? '' : ' (off)'}`,
    fields: [{ key: 'label', label: 'Label', type: 'text', required: true }, { key: 'key', label: 'Key', type: 'text' }, { key: 'icon', label: 'Icon', type: 'icon' }, { key: 'enabled', label: 'Offered at checkout', type: 'boolean' }],
  },
];

const journey: FieldSpec[] = [
  {
    key: 'journeySteps', label: 'Lesson step labels', type: 'custom',
    render: ({ value, onChange }) => (
      <fieldset className="adm-fieldset">
        <legend>Lesson step labels</legend>
        <div className="adm-steplabels">
          {(value as StepLabel[]).map((s, i) => (
            <div key={s.key} className="stack gap-8">
              <TextInput label={`Step ${i + 1}`} value={s.label} onChange={(v) => onChange((value as StepLabel[]).map((x, j) => (j === i ? { ...x, label: v } : x)))} />
              <TextInput label="Sub-label" value={s.sub} onChange={(v) => onChange((value as StepLabel[]).map((x, j) => (j === i ? { ...x, sub: v } : x)))} />
            </div>
          ))}
        </div>
      </fieldset>
    ),
  },
  { key: 'hw', label: 'Wheel of Life scale', type: 'heading' },
  { key: 'wheel.min', label: 'Lowest', type: 'number' },
  { key: 'wheel.max', label: 'Highest', type: 'number' },
  { key: 'wheel.lowLabel', label: 'Low label', type: 'text' },
  { key: 'wheel.highLabel', label: 'High label', type: 'text' },
  { key: 'hq', label: 'Future Self quality scale', type: 'heading' },
  { key: 'qualityScale.min', label: 'Lowest', type: 'number' },
  { key: 'qualityScale.max', label: 'Highest', type: 'number' },
  { key: 'qualityScale.lowLabel', label: 'Low label', type: 'text' },
  { key: 'qualityScale.highLabel', label: 'High label', type: 'text' },
];

function JourneyStagesTab() {
  return (
    <CrudTable
      col="journeyStages"
      title="Client journey stages"
      description="Your business starter map: what to create, where it fits and when to send it (7 stages from Attract to Complete)."
      blank={() => ({ number: 8, name: '', short: '', subtitle: '', timing: '', tagline: '', assets: [], ruleLabel: 'Send', ruleText: '', icon: 'leaf', image: 'leaves' })}
      wide
      tabs={[
        {
          id: 'stage', label: 'Stage', fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'number', label: 'Number', type: 'number', min: 1 },
            { key: 'short', label: 'Short label', type: 'text', placeholder: 'ATTRACT' },
            { key: 'subtitle', label: 'Subtitle', type: 'text' },
            { key: 'timing', label: 'Timing', type: 'text', placeholder: 'Before someone books' },
            { key: 'tagline', label: 'Tagline', type: 'text' },
            { key: 'ruleLabel', label: 'Rule label', type: 'text', placeholder: 'Send' },
            { key: 'ruleText', label: 'Rule text', type: 'text', placeholder: 'As the first step' },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'image', label: 'Image', type: 'image' },
          ],
        },
        {
          id: 'assets', label: 'Assets', fields: [{
            key: 'assets', label: 'Assets', type: 'objects', addLabel: 'Add asset', blank: () => ({ title: '', description: '', icon: 'doc' }),
            fields: [{ key: 'title', label: 'Title', type: 'text', required: true }, { key: 'icon', label: 'Icon', type: 'icon' }, { key: 'description', label: 'Description', type: 'textarea', rows: 2 }],
          }],
        },
      ]}
      addLabel="Add stage"
      columns={[
        { label: 'Stage', render: (s) => <span className="row gap-8"><span className="num sage">{s.number}</span><span className="stack"><strong style={{ fontWeight: 500 }}>{s.name}</strong><span className="body-sm muted">{s.timing}</span></span></span> },
        { label: 'Assets', render: (s) => <span className="body-sm">{s.assets.map((a) => a.title).join(' · ')}</span> },
        { label: 'Rule', render: (s) => <span className="body-sm"><strong className="label-caps">{s.ruleLabel}:</strong> {s.ruleText}</span> },
      ]}
    />
  );
}

function PipelineTab() {
  const journeyStages = useList('journeyStages').data ?? [];
  const emails = useList('emails').data ?? [];
  return (
    <>
      <CrudTable
        col="pipelineStages"
        title="Pipeline stages"
        description="The stages a lead moves through on the Pipeline tab, with the default next step and the email sent when you move a lead there."
        blank={() => ({ name: '', journeyStageId: journeyStages[0]?.id ?? '', defaultNextStep: '', emailKey: '' })}
        fields={[
          { key: 'name', label: 'Stage name', type: 'text', required: true, full: true },
          { key: 'journeyStageId', label: 'Client journey stage', type: 'select', options: journeyStages.map((j) => ({ value: j.id, label: `${j.number}. ${j.name}` })) },
          { key: 'defaultNextStep', label: 'Default next step', type: 'text' },
          { key: 'emailKey', label: 'Stage email', type: 'select', options: emails.map((e) => ({ value: e.key, label: e.name })), placeholder: 'No email' },
        ]}
        addLabel="Add stage"
        columns={[
          { label: 'Stage', render: (p) => <strong style={{ fontWeight: 500 }}>{p.name}</strong> },
          { label: 'Journey stage', render: (p) => journeyStages.find((j) => j.id === p.journeyStageId)?.name ?? <Dash /> },
          { label: 'Next step', render: (p) => p.defaultNextStep || <Dash /> },
          { label: 'Email', render: (p) => emails.find((e) => e.key === p.emailKey)?.name ?? <Dash /> },
        ]}
      />
      <CrudTable
        col="leadSources"
        title="Lead sources"
        description="Where leads come from — each gets its own pill colour on the Pipeline tab."
        blank={() => ({ name: '', color: 'beige' })}
        fields={[{ key: 'name', label: 'Source name', type: 'text', required: true, full: true }, { key: 'color', label: 'Pill colour', type: 'color' }]}
        addLabel="Add source"
        columns={[
          { label: 'Source', render: (s) => s.name },
          { label: 'Pill', render: (s) => <TonePill tone={s.color}>{s.name}</TonePill> },
        ]}
      />
    </>
  );
}

function UsersTab() {
  const users = useList('users');
  const enrollments = useList('enrollments').data ?? [];
  const plans = useList('plans').data ?? [];
  const toolkits = useList('toolkits').data ?? [];
  const crud = useCrud('users');
  const assign = useAction('assignPackage');
  const reset = useAction('resetProgress');
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pkg, setPkg] = useState<{ user: Rec<User>; planId: string } | null>(null);
  const [tk, setTk] = useState<{ user: Rec<User>; ids: string[] } | null>(null);
  const [resetting, setResetting] = useState<Rec<User> | null>(null);
  const update = (u: Rec<User>, patch: Record<string, unknown>, msg: string) => crud.update.mutateAsync({ id: u.id, patch }).then(() => toast(msg), (e) => toast(errMsg(e), true));
  if (users.isLoading) return <Loading />;
  return (
    <AdminSection title="Users & roles" sub="Everyone with an account. Clients only ever see their own data." id="users" actions={<Button size="sm" icon="plus" onClick={() => setAdding(true)}>Create client</Button>}>
      <div className="scroll-x">
        <table className="table adm-table">
          <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Package</th><th scope="col">Journey access</th><th scope="col">Toolkits</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {(users.data ?? []).map((u) => {
              const en = enrollments.find((e) => e.userId === u.id);
              const isAdmin = u.role === 'admin';
              return (
                <tr key={u.id}>
                  <td><span className="row gap-8"><span className="adm-avatar" style={{ width: 32, height: 32, fontSize: 14, background: COLOR_HEX[u.avatarColor] ?? '#b07a74' }} aria-hidden>{u.initials}</span><span className="stack"><span className="adm-client-name">{u.name}</span><span className="body-sm muted">{u.email}</span></span></span></td>
                  <td><TonePill tone={isAdmin ? 'deep' : 'sage'}>{isAdmin ? 'Coach (admin)' : 'Client'}</TonePill></td>
                  <td>{en ? <PlanPill plan={plans.find((p) => p.id === en.planId)} /> : <Dash />}</td>
                  <td>{isAdmin ? <Dash /> : <Switch small hideLabel label={`Journey access for ${u.name}`} checked={u.journeyAccess} onChange={(v) => void update(u, { journeyAccess: v }, v ? 'Journey access granted' : 'Journey access removed')} />}</td>
                  <td className="body-sm">{isAdmin ? <Dash /> : <button type="button" className="link body-sm adm-left" onClick={() => setTk({ user: u, ids: u.toolkitIds })}>{u.toolkitIds.map((id) => toolkits.find((t) => t.id === id)?.name ?? id).join(', ') || 'None'} — edit</button>}</td>
                  <td className="adm-col-actions">
                    {!isAdmin && (
                      <span className="adm-actions">
                        <button type="button" className="adm-act" onClick={() => setPkg({ user: u, planId: en?.planId ?? '' })}><Icon name="briefcase" size={15} /><span>Package</span></button>
                        <Link className="adm-act" to={`/admin/clients/${u.id}`} style={{ textDecoration: 'none' }}><Icon name="user" size={15} /><span>Open</span></Link>
                        <button type="button" className="adm-mini danger" aria-label={`Reset progress for ${u.name}`} title="Reset progress" onClick={() => setResetting(u)}><Icon name="refresh" size={15} /></button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {adding && <AddClientModal open onClose={() => setAdding(false)} />}
      <Modal open={!!pkg} onClose={() => setPkg(null)} title={`Assign a package · ${pkg?.user.name ?? ''}`} footer={<><Button variant="ghost" onClick={() => setPkg(null)}>Cancel</Button><Button disabled={!pkg?.planId || assign.isPending} onClick={() => pkg && assign.mutateAsync({ userId: pkg.user.id, planId: pkg.planId }).then(() => { toast('Package assigned'); setPkg(null); }, (e) => toast(errMsg(e), true))}>Assign</Button></>}>
        {pkg && <Select label="Package" value={pkg.planId} onChange={(v) => setPkg({ ...pkg, planId: v })} options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${p.sessions} sessions` }))} placeholder="Choose a package" />}
      </Modal>
      <Modal open={!!tk} onClose={() => setTk(null)} title={`Toolkits owned · ${tk?.user.name ?? ''}`} footer={<><Button variant="ghost" onClick={() => setTk(null)}>Cancel</Button><Button onClick={() => tk && void update(tk.user, { toolkitIds: tk.ids }, 'Toolkits updated').then(() => setTk(null))}>Save</Button></>}>
        {tk && <CheckList label="Toolkits" options={toolkits.map((t) => ({ value: t.id, label: `${t.name}${t.active ? '' : ' (inactive)'}` }))} value={tk.ids} onChange={(ids) => setTk({ ...tk, ids })} />}
      </Modal>
      <Confirm open={!!resetting} title="Reset journey progress?" body={`This permanently deletes ${resetting?.name ?? ''}'s saved lesson, stage and checkpoint work. Wheel scores, habits and goals are kept (use the client record to reset everything).`} confirmLabel="Reset progress" danger onConfirm={() => resetting && reset.mutateAsync({ userId: resetting.id, scope: 'journey' }).then((r) => toast(`Reset — ${r.removed} records removed`), (e) => toast(errMsg(e), true))} onClose={() => setResetting(null)} />
    </AdminSection>
  );
}

const blueprintFields: FieldSpec[] = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'subtitle', label: 'Subtitle', type: 'text' },
  { key: 'footerScript', label: 'Footer (handwritten)', type: 'text' },
  { key: 'footerNote', label: 'Footer note', type: 'text' },
  { key: 'commitmentDefault', label: 'Default commitment', type: 'textarea', rows: 3 },
  { key: 'pages', label: 'Pages & sections', type: 'shape', help: 'Page titles and the title/subtitle of each section. {goal} and {habits} are filled with the client’s numbers.' },
  { key: 'toolSuggestions', label: 'Tool suggestions (page 4)', type: 'shape' },
];

function AdminAccountTab() {
  const { user } = useAuth();
  const me = useRecord('users', user?.id).data;
  return (
    <div className="adm-grid-2">
      <AdminSection title="Coach details on the site" id="acct-settings">
        <SingletonForm col="settings" saveLabel="Save" fields={[{ key: 'adminAccount.name', label: 'Display name', type: 'text', required: true }, { key: 'adminAccount.email', label: 'Notification email', type: 'email', required: true, help: 'Test emails are sent here.' }]} />
      </AdminSection>
      <AdminSection title="Your sign-in" id="acct-user">
        {me ? <RecordForm key={me.id} col="users" record={me as any} showActive={false} saveLabel="Save sign-in" fields={[{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'email', label: 'Sign-in email', type: 'email', required: true }, { key: 'initials', label: 'Initials', type: 'text' }]} /> : <Loading h={120} />}
      </AdminSection>
    </div>
  );
}

/** Admin › Settings. */
export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) || 'general';
  return (
    <AdminShell tab="cms" title="Settings" sub={<p className="adm-band-sub">Business details, booking, journey scales, the client journey map, pipeline, users and the Blueprint PDF.</p>}>
      <Tabs<TabId> tabs={TABS} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} />
      {tab === 'general' && <SingletonForm col="settings" fields={general} />}
      {tab === 'sessions' && <SingletonForm col="settings" fields={sessions} />}
      {tab === 'journey' && <SingletonForm col="settings" fields={journey} />}
      {tab === 'stages' && <JourneyStagesTab />}
      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'blueprint' && <SingletonForm col="blueprint" fields={blueprintFields} saveLabel="Save Blueprint template" />}
      {tab === 'admin' && <AdminAccountTab />}
    </AdminShell>
  );
}

