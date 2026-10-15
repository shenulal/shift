import { useState } from 'react';
import { fillTemplate, fmtDate, type FieldDef, type FormDef, type Rec } from '@shift/core';
import { useAction, usePublicList, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Icon } from '@/ui/Icon';
import { Button, DraftTag, FieldRenderer, Kicker, useToast } from '@/ui/kit';
import { LockedPanel, PageLoading } from './components/ui';
import { useJourney, useMine } from './components/useJourney';
import './member.css';

interface OnboardingContent { title: string; subtitle: string; steps: { title: string; text: string; timing: string; icon: string }[] }
const SESSION_REQUEST = 'Requested first session';

function FormCard({ form, initial, status, vars, onDone }: { form: Rec<FormDef>; initial: Record<string, unknown>; status: string | null; vars: Record<string, string | number>; onDone?: () => void }) {
  const submit = useAction('submitForm');
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const send = async (draft: boolean) => {
    if (!draft) {
      const errs: Record<string, string> = {};
      for (const f of form.fields) {
        const v = data[f.id];
        if (f.required && (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))) errs[f.id] = 'Required';
      }
      setErrors(errs);
      if (Object.keys(errs).length) return toast('Please complete the required fields', true);
    }
    try {
      await submit.mutateAsync({ formKey: form.key, data, draft });
      toast(draft ? 'Draft saved' : `${form.title} submitted — thank you`);
      if (!draft) onDone?.();
    } catch (e) {
      toast((e as Error).message, true);
    }
  };
  const field = (f: FieldDef): FieldDef => (f.type === 'paragraph' && f.helper ? { ...f, helper: fillTemplate(f.helper, vars) } : f);
  return (
    <section className="card stack gap-16" aria-labelledby={`f-${form.key}`}>
      <div className="row between gap-12 wrap-row">
        <div className="stack gap-4">
          <h2 className="h3" id={`f-${form.key}`}>{form.title} {form.draft && <DraftTag />}</h2>
          <p className="body-sm muted">{form.intro}</p>
        </div>
        {status && <span className={`pill ${status === 'received' || status === 'reviewed' ? 'pill-sage' : 'pill-tan'}`}>{status === 'in-progress' ? 'Draft saved' : 'Submitted'}</span>}
      </div>
      {form.draft && <p className="body-sm card-soft card-pad-sm" role="note"><Icon name="info" size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> This form's wording is a draft and may change before launch.</p>}
      <div className="stack gap-16">
        {form.fields.map((f) => <FieldRenderer key={f.id} field={field(f)} value={data[f.id]} onChange={(v) => setData((d) => ({ ...d, [f.id]: v }))} error={errors[f.id]} />)}
      </div>
      <div className="m-stepfoot">
        <div className="wrap-row gap-12">
          {form.key === 'intake' && <Button variant="ghost" onClick={() => send(true)} disabled={submit.isPending}>Save draft</Button>}
          <Button arrow onClick={() => send(false)} disabled={submit.isPending}>{form.submitLabel}</Button>
        </div>
        {form.footnote && <span className="body-sm muted">{form.footnote}</span>}
      </div>
    </section>
  );
}

export default function ClientOnboarding() {
  const j = useJourney();
  const c = useContent<OnboardingContent>('onboarding');
  const forms = usePublicList('forms').data;
  const subs = useMine('submissions').data;
  const notes = useMine('notes').data;
  const settings = useSettings();
  const saveNote = useAction('saveNote');
  const toast = useToast();
  const [slot, setSlot] = useState<{ day: string; time: string } | null>(null);
  const [open, setOpen] = useState<'intake' | 'agreement' | 'session' | null>(null);
  if (!j.ready || !c || !forms || !subs || !notes || !settings) return <PageLoading />;
  if (!j.enrolment) {
    return <div className="wrap m-page"><LockedPanel title={c.title} body={<p>Your onboarding forms appear here once you've enrolled in a 1:1 coaching package.</p>} actions={<Button to="/coaching" arrow>Explore 1:1 Coaching</Button>} /></div>;
  }
  const intake = forms.find((f) => f.key === 'intake');
  const agreement = forms.find((f) => f.key === 'agreement');
  const sub = (k: string) => subs.find((s) => s.formKey === k) ?? null;
  const request = notes.filter((n) => n.kind === 'marker' && n.title.startsWith(SESSION_REQUEST)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const en = j.enrolment;
  const intakeDone = en.forms.intake || ['received', 'reviewed'].includes(sub('intake')?.status ?? '');
  const signed = en.forms.signed || ['received', 'reviewed'].includes(sub('agreement')?.status ?? '');
  const booked = !!request || !!en.nextSession;
  const doneFlags = [true, intakeDone, signed, booked, booked && signed, booked && signed && intakeDone && en.sessionsCompleted > 0];
  const current = doneFlags.findIndex((d) => !d);
  const vars = { sessions: j.plan?.sessions ?? '', session_length: settings.session.lengthMin, validity: settings.session.validityMonths };
  const requestSlot = async () => {
    if (!slot) return toast('Choose a day and time', true);
    const label = `${SESSION_REQUEST}: ${slot.day} · ${slot.time}`;
    try {
      await saveNote.mutateAsync({ kind: 'marker', title: label, body: `${label}. Your coach will confirm the exact date by email.` });
      toast('Request sent — your coach will confirm by email');
      setSlot(null);
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  return (
    <div className="wrap m-page stack gap-24" style={{ maxWidth: 1040 }}>
      <header className="stack gap-8">
        <Kicker>{j.plan ? `${j.plan.name} package` : 'Onboarding'}</Kicker>
        <h1 className="h1">{c.title}</h1>
        <p className="muted">{c.subtitle}</p>
      </header>
      <ol className="m-onb-steps" aria-label="Onboarding steps">
        {c.steps.map((s, i) => (
          <li key={i} className={doneFlags[i] ? 'done' : i === current ? 'current' : ''}>
            <span className="m-onb-n" aria-hidden="true">{doneFlags[i] ? <Icon name="check" size={16} /> : i + 1}</span>
            <Icon name={s.icon} size={22} />
            <strong>{s.title}</strong>
            <span className="body-sm muted">{s.timing}</span>
            <span className="sr-only">{doneFlags[i] ? 'Done' : i === current ? 'Up next' : 'Not yet'}</span>
          </li>
        ))}
      </ol>

      {[
        { key: 'intake' as const, form: intake, done: intakeDone, step: c.steps[1] },
        { key: 'agreement' as const, form: agreement, done: signed, step: c.steps[2] },
      ].map(({ key, form, done, step }) => form && (
        <div key={key} className="stack gap-12">
          <div className="m-banner" style={{ background: done ? 'var(--sage-tint)' : 'var(--blush-soft)' }}>
            <span className="m-banner-ic" aria-hidden="true" style={{ background: done ? '#6e7d69' : '#b07a74' }}><Icon name={done ? 'check' : step?.icon ?? 'doc'} size={22} /></span>
            <div className="grow stack gap-4" style={{ flex: '1 1 260px' }}>
              <h2 className="h4">{step?.title ?? form.title}</h2>
              <p className="body-sm muted">{done ? `Completed${sub(key) ? ` on ${fmtDate(sub(key)!.submittedAt)}` : ''}` : step?.text ?? form.intro}</p>
            </div>
            <Button variant={done ? 'ghost' : 'primary'} arrow onClick={() => setOpen(open === key ? null : key)} aria-expanded={open === key}>{open === key ? 'Close' : done ? 'View' : form.submitLabel}</Button>
          </div>
          {open === key && <FormCard form={form} initial={(sub(key)?.data as Record<string, unknown>) ?? {}} status={sub(key)?.status ?? null} vars={vars} onDone={() => setOpen(null)} />}
        </div>
      ))}

      <div className="stack gap-12">
        <div className="m-banner" style={{ background: booked ? 'var(--sage-tint)' : 'var(--blush-soft)' }}>
          <span className="m-banner-ic" aria-hidden="true" style={{ background: booked ? '#6e7d69' : '#b07a74' }}><Icon name={booked ? 'check' : c.steps[3]?.icon ?? 'calendar'} size={22} /></span>
          <div className="grow stack gap-4" style={{ flex: '1 1 260px' }}>
            <h2 className="h4">{c.steps[3]?.title}</h2>
            <p className="body-sm muted">{request ? `${request.title} (sent ${fmtDate(request.date)}) — awaiting your coach's confirmation.` : en.nextSession ? `Next session: ${new Date(en.nextSession).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : c.steps[3]?.text}</p>
          </div>
          <Button variant={booked ? 'ghost' : 'primary'} arrow onClick={() => setOpen(open === 'session' ? null : 'session')} aria-expanded={open === 'session'}>{open === 'session' ? 'Close' : 'Choose your first session'}</Button>
        </div>
        {open === 'session' && (
          <section className="card stack gap-16" aria-labelledby="slot-h">
            <h2 className="h4" id="slot-h">Choose your first session</h2>
            <p className="body-sm muted">Pick a preferred day and time. Bookings are confirmed by your coach.</p>
            {settings.availability.days.map((d) => (
              <fieldset key={d} className="m-fieldset">
                <legend className="field-label">{d}</legend>
                <div className="m-slots">
                  {settings.availability.times.map((t) => {
                    const on = slot?.day === d && slot.time === t;
                    return <button key={t} type="button" className={`m-slot ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setSlot({ day: d, time: t })}>{t}</button>;
                  })}
                </div>
              </fieldset>
            ))}
            <div><Button arrow onClick={requestSlot} disabled={!slot || saveNote.isPending}>Request this time</Button></div>
          </section>
        )}
      </div>
    </div>
  );
}
