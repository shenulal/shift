import { useState, type FormEvent } from 'react';
import type { FieldDef } from '@shift/core';
import { useAction, useBranding, useList, usePublicList, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, FieldRenderer, Script, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Logo } from '@/ui/Logo';
import { JourneyHeader } from './components/JourneyHeader';
import { Caps, IconRows, NumberedSteps, PageLoading } from './components/shared';
import './public.css';

interface EnquiryContent {
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  benefits: { text: string; icon: string }[];
  quote: string;
  nextTitle: string;
  next: { title: string; text: string }[];
  thanksTitle: string;
  thanksBody: string;
}

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0);

export function validate(fields: FieldDef[], data: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = data[f.id];
    if (f.required && f.type !== 'heading' && f.type !== 'paragraph') {
      // phone input stores "+971 " when only the code is chosen
      const blank = f.type === 'phone' ? !String(v ?? '').replace(/^\+\d+\s*/, '').trim() : isEmpty(v);
      if (blank) errors[f.id] = `${f.label.replace(/[?:]$/, '')} is required`;
    }
    if (!errors[f.id] && f.type === 'email' && !isEmpty(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())) errors[f.id] = 'Please enter a valid email address';
  }
  return errors;
}

export default function Enquiry() {
  const forms = usePublicList('forms').data;
  const form = forms?.find((f) => f.key === 'enquiry');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const c = useContent<EnquiryContent>('enquiry', { email: sentTo ?? '' });
  const submit = useAction('submitEnquiry');
  const toast = useToast();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (!c || !forms) return <><JourneyHeader current="enquiry" /><PageLoading /></>;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const errs = validate(form.fields, data);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`fld-${first}`)?.querySelector<HTMLElement>('input, select, textarea')?.focus();
      return;
    }
    try {
      await submit.mutateAsync({ data });
      setSentTo(String(data.email ?? '').trim());
    } catch (err) {
      toast((err as Error).message || 'Something went wrong — please try again.', true);
    }
  };

  return (
    <>
      <JourneyHeader current="enquiry" />
      <div className="wrap p-cj">
        <div className="p-cj-intro">
          <Caps>{c.kicker}</Caps>
          <h1 className="p-cj-title">{c.title}</h1>
          <hr className="p-rule" />
          <p className="p-cj-sub">{c.subtitle}</p>
          <p className="p-cj-body">{c.body}</p>
          <IconRows items={c.benefits} />
          <Script size={34} style={{ marginTop: 8 }}>“{c.quote}”</Script>
        </div>

        <div className="p-formcard">
          <div className="p-formcard-head">
            <Art src="enquiry" />
            <div className="p-formcard-logo"><Logo size={30} center /></div>
          </div>
          <div className="p-formcard-body">
            {!form ? (
              <p className="muted">The enquiry form is currently unavailable — please email us instead.</p>
            ) : sentTo ? (
              <div className="p-thanks" role="status" aria-live="polite">
                <span className="icon-circle sage lg"><Icon name="check" size={28} /></span>
                <h2 className="h2">{c.thanksTitle}</h2>
                <p className="muted">{c.thanksBody}</p>
                <Button to="/discovery-call" arrow>Book your discovery call</Button>
              </div>
            ) : (
              <form className="stack gap-16" onSubmit={onSubmit} noValidate aria-labelledby="enq-title">
                <div className="center stack gap-8">
                  <h2 id="enq-title" className="h3">{form.title}</h2>
                  <p className="body-sm muted">{form.intro}</p>
                </div>
                {form.fields.map((f) => (
                  <div key={f.id} id={`fld-${f.id}`}>
                    <FieldRenderer
                      field={f}
                      value={data[f.id]}
                      error={errors[f.id]}
                      onChange={(v) => {
                        setData((d) => ({ ...d, [f.id]: v }));
                        if (errors[f.id]) setErrors((x) => ({ ...x, [f.id]: '' }));
                      }}
                    />
                  </div>
                ))}
                <div className="center">
                  <Button type="submit" caps arrow size="lg" disabled={submit.isPending}>{submit.isPending ? 'Sending…' : form.submitLabel}</Button>
                </div>
                <p className="body-sm faint center">{form.footnote}</p>
              </form>
            )}
          </div>
        </div>

        <div className="p-cj-side">
          <section className="p-panel stack gap-16" aria-labelledby="next-title">
            <h2 id="next-title" className="p-caps">{c.nextTitle}</h2>
            <NumberedSteps items={c.next} />
          </section>
          <ConfirmationEmail />
        </div>
      </div>
    </>
  );
}

/** "Example confirmation email" — rendered from the enquiry-confirmation template when it is readable for this viewer. */
function ConfirmationEmail() {
  const q = useList('emails', { key: 'enquiry-confirmation' });
  const settings = useSettings();
  const branding = useBranding();
  const tpl = q.data?.find((e) => e.key === 'enquiry-confirmation' && e.active);
  if (!tpl) return null;
  const body = tpl.body.replace(/\{name\}/g, '[Name]');
  const social = settings?.social;
  return (
    <section className="p-panel stack gap-12" aria-labelledby="email-title">
      <h2 id="email-title" className="p-caps">Example confirmation email</h2>
      <div className="p-email">
        <div className="p-email-meta">
          <span><b>From:</b> {tpl.fromEmail}</span>
          <span><b>To:</b> You</span>
          <span><b>Subject:</b> {tpl.subject}</span>
        </div>
        <div className="p-email-brand">
          <Art src="leaves" />
          <span><Logo size={24} /></span>
        </div>
        <div className="p-email-body">{body}</div>
        <div className="p-email-foot">
          <hr className="p-rule" />
          {branding && <span className="p-caps sm">{branding.taglines.primary}</span>}
          {social && settings && (
            <div className="p-social">
              <span><Icon name="instagram" size={22} />{social.instagram}</span>
              <span><Icon name="globe" size={22} />{settings.website}</span>
              <span><Icon name="linkedin" size={22} />{social.linkedin}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
