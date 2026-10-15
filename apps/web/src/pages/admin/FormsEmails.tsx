import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fmtDate, now, type FieldDef } from '@shift/core';
import { useAction, useSettings } from '@/data';
import { Button, FieldRenderer, Tabs, useToast } from '@/ui/kit';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection, TonePill } from './components/controls';
import type { FieldSpec } from './components/RecordEditor';
import { EmailCard, OutboxList, SubmissionsList, TEMPLATE_VARS, fill, useTemplateVars } from './components/shared';
import { errMsg } from './components/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

type TabId = 'forms' | 'emails' | 'letters' | 'outbox';

/** Live preview of a form as clients will see it. */
function FormPreview({ draft }: { draft: any }) {
  const [vals, setVals] = useState<Record<string, unknown>>({});
  return (
    <div className="adm-form-preview">
      <h3 className="h3">{draft.title || 'Untitled form'}</h3>
      {draft.intro && <p className="body-sm muted pre-line">{draft.intro}</p>}
      {(draft.fields as FieldDef[] ?? []).map((f) => <FieldRenderer key={f.id} field={f} value={vals[f.id]} onChange={(v) => setVals((x) => ({ ...x, [f.id]: v }))} />)}
      <span className="btn btn-primary" aria-disabled="true" style={{ alignSelf: 'flex-start' }}>{draft.submitLabel || 'Submit'}</span>
      {draft.footnote && <p className="body-sm faint">{draft.footnote}</p>}
    </div>
  );
}

function EmailPreview({ draft }: { draft: any }) {
  const vars = useTemplateVars();
  const settings = useSettings();
  const send = useAction('triggerEmail');
  const toast = useToast();
  const to = settings?.adminAccount.email ?? '';
  const sendTest = async () => {
    try {
      await send.mutateAsync({ templateKey: draft.key, to, vars: { name: settings?.adminAccount.name ?? 'Edel' } });
      toast(`Test sent to ${to} — see the Outbox tab`);
    } catch (e) {
      toast(errMsg(e), true);
    }
  };
  return (
    <div className="stack gap-12">
      <EmailCard fromName={draft.fromName} fromEmail={draft.fromEmail} to={`${vars.name} (sample)`} subject={fill(draft.subject, vars)} preheader={fill(draft.preheader, vars)} body={fill(draft.body, vars)} ctaLabel={draft.ctaLabel} />
      {draft.id && (
        <div className="stack gap-4">
          <Button size="sm" variant="ghost" icon="mail" onClick={() => void sendTest()} disabled={send.isPending || draft.active === false}>Send test to {to}</Button>
          <span className="body-sm faint">Sends the last saved version{draft.active === false ? ' (activate the template first)' : ''}.</span>
        </div>
      )}
    </div>
  );
}

const formFields: FieldSpec[] = [
  { key: 'name', label: 'Internal name', type: 'text', required: true },
  { key: 'key', label: 'Form key', type: 'text', required: true, help: 'Used by the site to find this form (e.g. enquiry, intake).' },
  { key: 'audience', label: 'Who fills it in', type: 'select', required: true, options: [{ value: 'public', label: 'Public visitors' }, { value: 'client', label: 'Clients' }, { value: 'coach', label: 'Coach only (internal)' }] },
  { key: 'draft', label: 'Draft copy (shows a DRAFT tag)', type: 'boolean' },
  { key: 'title', label: 'Title', type: 'text', full: true },
  { key: 'intro', label: 'Intro', type: 'textarea', rows: 3 },
  { key: 'submitLabel', label: 'Submit button', type: 'text' },
  { key: 'footnote', label: 'Footnote', type: 'text' },
  { key: 'fields', label: 'Fields', type: 'fields' },
];

const emailFields: FieldSpec[] = [
  { key: 'name', label: 'Template name', type: 'text', required: true },
  { key: 'key', label: 'Template key', type: 'text', required: true, help: 'Pipeline stages and the site send emails by this key.' },
  { key: 'trigger', label: 'When it is sent', type: 'text', full: true },
  { key: 'fromName', label: 'From name', type: 'text' },
  { key: 'fromEmail', label: 'From email', type: 'email' },
  { key: 'subject', label: 'Subject', type: 'template', vars: TEMPLATE_VARS, multiline: false, required: true },
  { key: 'preheader', label: 'Preheader', type: 'text', full: true },
  { key: 'body', label: 'Body', type: 'template', vars: TEMPLATE_VARS, rows: 12, required: true, help: 'Click a variable to insert it at the cursor.' },
  { key: 'ctaLabel', label: 'Button label', type: 'text' },
  { key: 'ctaUrl', label: 'Button link', type: 'text', placeholder: '{portal_link}' },
  { key: 'draft', label: 'Draft copy', type: 'boolean' },
];

/** Admin › Forms & Emails. */
export default function FormsEmails() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as TabId) || 'forms';
  return (
    <AdminShell tab="cms" title="Forms & Emails" sub={<p className="adm-band-sub">Every form on the site, the automatic emails, the weekly SHIFT Letter and everything that has been sent.</p>}>
      <Tabs<TabId>
        tabs={[{ id: 'forms', label: 'Forms' }, { id: 'emails', label: 'Email templates' }, { id: 'letters', label: 'Weekly letters' }, { id: 'outbox', label: 'Outbox' }]}
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
      />
      {tab === 'forms' && (
        <>
          <CrudTable
            col="forms"
            title="Forms"
            description="Enquiry, intake, agreement, completion, feedback, check-in and your internal note templates."
            blank={() => ({ key: '', name: '', title: '', intro: '', submitLabel: 'Submit', footnote: '', audience: 'client', fields: [], draft: true })}
            fields={formFields}
            preview={(d) => <FormPreview draft={d} />}
            addLabel="Add form"
            columns={[
              { label: 'Form', render: (f) => <span className="stack"><strong style={{ fontWeight: 500 }}>{f.name}</strong><span className="body-sm muted">{f.key}</span></span> },
              { label: 'Audience', render: (f) => <TonePill tone={f.audience === 'public' ? 'blue' : f.audience === 'coach' ? 'deep' : 'sage'}>{f.audience}</TonePill> },
              { label: 'Fields', render: (f) => f.fields.length },
              { label: 'Copy', render: (f) => (f.draft ? <span className="draft-tag">DRAFT</span> : 'Final') },
            ]}
          />
          <AdminSection title="Submissions" id="subs"><SubmissionsList /></AdminSection>
        </>
      )}
      {tab === 'emails' && (
        <CrudTable
          col="emails"
          title="Email templates"
          description="Variables like {name} are filled in when the email is sent."
          blank={() => ({ key: '', name: '', trigger: '', fromName: 'Edel · SHIFT', fromEmail: '', subject: '', preheader: '', body: 'Hi {name},\n\n', ctaLabel: '', ctaUrl: '', draft: true })}
          fields={emailFields}
          preview={(d) => <EmailPreview draft={d} />}
          addLabel="Add template"
          searchText={(e) => `${e.name} ${e.subject} ${e.key}`}
          columns={[
            { label: 'Template', render: (e) => <span className="stack"><strong style={{ fontWeight: 500 }}>{e.name}</strong><span className="body-sm muted">{e.trigger}</span></span> },
            { label: 'Subject', render: (e) => <span className="body-sm">{e.subject}</span> },
            { label: 'Copy', render: (e) => (e.draft ? <span className="draft-tag">DRAFT</span> : 'Final') },
          ]}
        />
      )}
      {tab === 'letters' && (
        <CrudTable
          col="letters"
          title="Weekly SHIFT Letters"
          description="Schedule the Sunday letter to your email list."
          blank={() => ({ title: '', scheduledFor: now().toISOString(), status: 'draft', subscribers: 0, body: '' })}
          fields={[
            { key: 'title', label: 'Title', type: 'text', required: true, full: true },
            { key: 'scheduledFor', label: 'Send on', type: 'datetime' },
            { key: 'status', label: 'Status', type: 'select', options: [{ value: 'draft', label: 'Draft' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'sent', label: 'Sent' }] },
            { key: 'subscribers', label: 'Subscribers', type: 'number', min: 0 },
            { key: 'body', label: 'Letter', type: 'textarea', rows: 12 },
          ]}
          addLabel="New letter"
          columns={[
            { label: 'Letter', render: (l) => <strong style={{ fontWeight: 500 }}>{l.title}</strong> },
            { label: 'Send on', render: (l) => fmtDate(l.scheduledFor.slice(0, 10)) },
            { label: 'Status', render: (l) => <TonePill tone={l.status === 'sent' ? 'sage' : l.status === 'scheduled' ? 'beige' : 'peach'}>{l.status}</TonePill> },
            { label: 'Subscribers', render: (l) => l.subscribers.toLocaleString('en-US') },
          ]}
        />
      )}
      {tab === 'outbox' && (
        <AdminSection title="Outbox" sub="Every email the site has sent or queued. Click one to read it." id="outbox">
          <OutboxList />
        </AdminSection>
      )}
    </AdminShell>
  );
}
