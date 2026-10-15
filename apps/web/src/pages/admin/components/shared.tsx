import { useMemo, useState, type ReactNode } from 'react';
import { fillTemplate, fmtDate, fmtDay, fmtTime, type FieldDef, type FormDef, type Rec, type OutboxEmail, type Plan, type Booking } from '@shift/core';
import { useList, useSettings } from '@/data';
import { Modal, Select } from '@/ui/kit';
import { Logo } from '@/ui/Logo';
import { Dash, TonePill } from './controls';
import { humanise } from './util';

/* Domain bits shared by several admin pages. */

/** Package pill tone — Transform shows dark like the design (image 33). */
export const planTone = (p?: Pick<Plan, 'color'> | null) => (!p ? 'beige' : p.color === 'sage' ? 'deep' : p.color === 'taupe' ? 'tan' : p.color === 'blush' ? 'beige' : p.color);

export function PlanPill({ plan }: { plan?: Rec<Plan> | null }) {
  if (!plan) return <Dash />;
  return <TonePill tone={planTone(plan)} className="adm-plan-pill">{plan.name} · {plan.sessions}</TonePill>;
}

const BOOKING_STATUS: Record<Booking['status'], { label: string; tone: string }> = {
  confirmed: { label: 'Confirmed', tone: 'sage' },
  'intake-pending': { label: 'Intake pending', tone: 'rose' },
  scheduled: { label: 'Scheduled', tone: 'beige' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'charcoal' },
};
export const BookingStatus = ({ status }: { status: Booking['status'] }) => <TonePill tone={BOOKING_STATUS[status]?.tone}>{BOOKING_STATUS[status]?.label ?? status}</TonePill>;

export function useLeadSources() {
  const q = useList('leadSources');
  return useMemo(() => new Map((q.data ?? []).map((s) => [s.id, s])), [q.data]);
}
export function SourcePill({ id }: { id: string }) {
  const map = useLeadSources();
  const s = map.get(id);
  return <TonePill tone={s?.color ?? 'beige'}>{s?.name ?? id}</TonePill>;
}

export const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${fmtDay(d)} · ${fmtTime(d)}`;
};

/** Read-only view of submitted form data, using the form's field labels when available. */
export function SubmissionData({ data, form }: { data: Record<string, unknown>; form?: FormDef | null }) {
  const labels = new Map((form?.fields ?? []).map((f: FieldDef) => [f.id, f.label]));
  const areas = useList('wheelAreas').data ?? [];
  const entries = Object.entries(data ?? {});
  if (!entries.length) return <p className="body-sm muted">No answers yet.</p>;
  return (
    <dl className="adm-dl">
      {entries.map(([k, v]) => (
        <div key={k} className="adm-dl-row">
          <dt>{labels.get(k) ?? humanise(k)}</dt>
          <dd>
            {v && typeof v === 'object' && !Array.isArray(v) ? (
              <span className="wrap-row gap-8">
                {Object.entries(v as Record<string, unknown>).map(([ak, av]) => (
                  <span key={ak} className="adm-kv">{areas.find((a) => a.id === ak)?.short ?? humanise(ak)}: <strong>{String(av)}</strong></span>
                ))}
              </span>
            ) : Array.isArray(v) ? (
              v.join(', ') || '—'
            ) : typeof v === 'boolean' ? (
              v ? 'Yes' : 'No'
            ) : (
              <span className="pre-line">{String(v ?? '') || '—'}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Email rendered like it lands in the inbox (SHIFT header, body, CTA). */
export function EmailCard({ subject, preheader, body, ctaLabel, fromName, fromEmail, to }: { subject: string; preheader?: string; body: string; ctaLabel?: string; fromName?: string; fromEmail?: string; to?: string }) {
  return (
    <div className="adm-email">
      <div className="adm-email-meta">
        {fromName && <div><span className="faint">From</span> {fromName}{fromEmail ? ` <${fromEmail}>` : ''}</div>}
        {to && <div><span className="faint">To</span> {to}</div>}
        <div className="adm-email-subject">{subject || '(no subject)'}</div>
        {preheader && <div className="faint body-sm">{preheader}</div>}
      </div>
      <div className="adm-email-card">
        <div className="adm-email-head"><Logo size={18} sub /></div>
        <div className="adm-email-body pre-line">{body}</div>
        {ctaLabel && <div className="adm-email-cta"><span className="btn btn-primary btn-sm" aria-hidden>{ctaLabel}</span></div>}
      </div>
    </div>
  );
}

export const SAMPLE_VARS: Record<string, string> = {
  name: 'Sarah',
  package: 'Momentum',
  sessions: '10',
  next_session: 'Wed 30 Sep · 18:00',
  amount: 'AED 1,500',
  title: 'The pause-before-yes',
  body: 'How often do you say yes before you have even checked in with yourself?',
};
export const TEMPLATE_VARS = ['name', 'package', 'sessions', 'next_session', 'booking_link', 'portal_link', 'amount'];

export function useTemplateVars(extra: Record<string, string> = {}): Record<string, string> {
  const s = useSettings();
  return { ...SAMPLE_VARS, booking_link: s?.discoveryCall.bookingUrl ?? '', portal_link: `https://${s?.website ?? ''}/app`, ...extra };
}
export const fill = (t: string, vars: Record<string, string>) => fillTemplate(t ?? '', vars);

/** Email outbox list; click a row to read the email. */
export function OutboxList({ limit, compact }: { limit?: number; compact?: boolean }) {
  const q = useList('outbox');
  const emails = useList('emails').data ?? [];
  const [view, setView] = useState<Rec<OutboxEmail> | null>(null);
  const rows = useMemo(() => (q.data ?? []).slice().sort((a, b) => b.sentAt.localeCompare(a.sentAt)).slice(0, limit ?? 9999), [q.data, limit]);
  if (q.isLoading) return <div className="skeleton" style={{ height: 120 }} />;
  if (!rows.length) return <p className="body-sm muted">No emails sent yet.</p>;
  return (
    <>
      <div className="scroll-x">
        <table className="table adm-table">
          <thead>
            <tr>
              <th scope="col">When</th>
              {!compact && <th scope="col">Template</th>}
              <th scope="col">To</th>
              <th scope="col">Subject</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="adm-click-row" onClick={() => setView(o)}>
                <td className="nowrap body-sm">{fmtWhen(o.sentAt)}</td>
                {!compact && <td className="body-sm">{emails.find((e) => e.key === o.templateKey)?.name ?? o.templateKey}</td>}
                <td className="body-sm">{o.to}</td>
                <td><button type="button" className="link body-sm adm-left" onClick={(e) => { e.stopPropagation(); setView(o); }}>{o.subject}</button></td>
                <td><TonePill tone={o.status === 'sent' ? 'sage' : o.status === 'queued' ? 'peach' : 'beige'}>{o.status}</TonePill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title="Email" wide>
        {view && (
          <div className="stack gap-12">
            <div className="body-sm muted">{emails.find((e) => e.key === view.templateKey)?.name ?? view.templateKey} · {fmtWhen(view.sentAt)} · {view.status}</div>
            <EmailCard subject={view.subject} body={view.body} to={view.to} />
          </div>
        )}
      </Modal>
    </>
  );
}

/** All form submissions, filterable by form. */
export function SubmissionsList({ userId, leadId }: { userId?: string; leadId?: string }) {
  const subs = useList('submissions').data;
  const forms = useList('forms').data ?? [];
  const leads = useList('leads').data ?? [];
  const users = useList('users').data ?? [];
  const [formKey, setFormKey] = useState('');
  const [view, setView] = useState<string | null>(null);
  const rows = (subs ?? [])
    .filter((s) => (!userId || s.userId === userId) && (!leadId || s.leadId === leadId) && (!formKey || s.formKey === formKey))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const who = (s: (typeof rows)[number]) => users.find((u) => u.id === s.userId)?.name ?? leads.find((l) => l.id === s.leadId)?.name ?? '—';
  const current = rows.find((r) => r.id === view);
  const formOf = (k: string) => forms.find((f) => f.key === k);
  if (!subs) return <div className="skeleton" style={{ height: 120 }} />;
  return (
    <div className="stack gap-12">
      {!userId && !leadId && (
        <div style={{ maxWidth: 280 }}>
          <Select label="Filter by form" value={formKey} onChange={setFormKey} options={forms.map((f) => ({ value: f.key, label: f.name }))} placeholder="All forms" />
        </div>
      )}
      {!rows.length ? (
        <p className="body-sm muted">No submissions{formKey ? ' for this form' : ''} yet.</p>
      ) : (
        <div className="scroll-x">
          <table className="table adm-table">
            <thead>
              <tr><th scope="col">Form</th><th scope="col">From</th><th scope="col">Status</th><th scope="col">Submitted</th><th scope="col"><span className="sr-only">View</span></th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="adm-click-row" onClick={() => setView(s.id)}>
                  <td>{formOf(s.formKey)?.name ?? s.formKey}</td>
                  <td>{who(s)}</td>
                  <td><TonePill tone={s.status === 'received' ? 'rose' : s.status === 'reviewed' ? 'sage' : 'peach'}>{s.status === 'in-progress' ? 'In progress' : s.status}</TonePill></td>
                  <td className="nowrap body-sm">{fmtDate(s.submittedAt.slice(0, 10))}</td>
                  <td><button type="button" className="link body-sm" onClick={(e) => { e.stopPropagation(); setView(s.id); }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!current} onClose={() => setView(null)} title={current ? `${formOf(current.formKey)?.name ?? current.formKey} — ${who(current)}` : ''} wide>
        {current && <SubmissionData data={current.data} form={formOf(current.formKey)} />}
      </Modal>
    </div>
  );
}

export function KeyValue({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="adm-dl-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
