import { useMemo, useState, type FormEvent } from 'react';
import type { CSSProperties } from 'react';
import { DAY_SHORT, addDays, fmtDay, now } from '@shift/core';
import { useAction, useAuth, useBranding, usePublicList, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Modal, Script, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { JourneyHeader } from './components/JourneyHeader';
import { Caps, IconRows, NumberedSteps, PageLoading } from './components/shared';
import './public.css';

interface DiscoveryContent {
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  benefits: { text: string; icon: string }[];
  heroQuote: string;
  sideQuote: string;
  meta: { title: string; text: string; icon: string }[];
  talkTitle: string;
  talk: { title: string; text: string; icon: string }[];
  cta: string;
  ctaNote: string;
  expectTitle: string;
  expect: { title: string; text: string }[];
  faqTitle: string;
  cardQuote: string;
  prepareTitle: string;
  prepare: string[];
  knowTitle: string;
  know: string[];
  readyTitle: string;
  readyBody: string;
  bookedTitle: string;
  bookedBody: string;
}

/** "9:00 AM" → [9, 0] */
function parseTime(t: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})\s*([AP]M)?$/i.exec(t.trim());
  if (!m) return null;
  let h = Number(m[1]);
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return [h, Number(m[2])];
}

/** Bookable slots: the next 14 days (from the demo-aware clock) on the coach's available days × times. */
export function useSlots(days = 14) {
  const s = useSettings();
  return useMemo(() => {
    if (!s) return [];
    const today = now();
    const out: { day: Date; label: string; times: { label: string; when: Date }[] }[] = [];
    for (let i = 1; i <= days; i++) {
      const d = addDays(today, i);
      if (!s.availability.days.includes(DAY_SHORT[(d.getDay() + 6) % 7])) continue;
      const times = s.availability.times
        .map((t) => {
          const hm = parseTime(t);
          if (!hm) return null;
          const when = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hm[0], hm[1]);
          return { label: t, when };
        })
        .filter(Boolean) as { label: string; when: Date }[];
      if (times.length) out.push({ day: d, label: fmtDay(d), times });
    }
    return out;
  }, [s, days]);
}

export default function DiscoveryCall() {
  const c = useContent<DiscoveryContent>('discovery');
  const method = useContent<{ frameworkScript: string }>('method');
  const settings = useSettings();
  const branding = useBranding();
  const faqs = usePublicList('faqs', { context: 'discovery' }).data;
  const [open, setOpen] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  if (!c || !settings) return <><JourneyHeader current="discover" /><PageLoading /></>;

  const url = settings.discoveryCall.bookingUrl;
  const external = /^https?:\/\//.test(url);
  const BookButton = () =>
    external ? (
      <Button href={url} caps arrow>{c.cta}</Button>
    ) : (
      <Button caps arrow onClick={() => setBooking(true)}>{c.cta}</Button>
    );

  return (
    <>
      <JourneyHeader current="discover" />
      <div className="wrap p-cj" style={{ '--cj-cols': 'minmax(0, 0.95fr) minmax(0, 1.35fr) minmax(0, 0.95fr)' } as CSSProperties}>
        <div className="p-cj-intro">
          <Caps>{c.kicker}</Caps>
          <h1 className="p-cj-title">{c.title}</h1>
          <hr className="p-rule" />
          <p className="p-cj-sub">{c.subtitle}</p>
          <p className="p-cj-body">{c.body}</p>
          <IconRows items={c.benefits} />
          <Script size={32} style={{ marginTop: 8 }}>“{c.sideQuote}”</Script>
        </div>

        <div className="p-dc-centre">
          <div className="p-dc-art">
            <Art src="discovery" />
            <p className="p-dc-quote">{c.heroQuote}</p>
          </div>
          <div className="p-dc-meta">
            {c.meta.map((m, i) => (
              <div key={i}>
                <Icon name={m.icon} size={24} />
                <strong>{m.title}</strong>
                <span>{m.text}</span>
              </div>
            ))}
          </div>
          <div className="stack gap-20" style={{ padding: 'clamp(18px, 3vw, 28px)', alignItems: 'center' }}>
            <h2 className="p-caps center">{c.talkTitle}</h2>
            <div className="p-talk" style={{ width: '100%' }}>
              {c.talk.map((t, i) => (
                <div key={i}>
                  <span className="ic" aria-hidden="true"><Icon name={t.icon} size={28} stroke={1.3} /></span>
                  <strong>{t.title}</strong>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ width: '100%' }} />
            <BookButton />
            <Caps className="sm center">{c.ctaNote}</Caps>
          </div>
        </div>

        <div className="p-cj-side">
          <section className="p-panel stack gap-16" aria-labelledby="expect-title">
            <h2 id="expect-title" className="p-caps">{c.expectTitle}</h2>
            <NumberedSteps items={c.expect} />
          </section>
          {!!faqs?.length && (
            <section className="p-panel stack gap-12" aria-labelledby="faq-title">
              <h2 id="faq-title" className="p-caps">{c.faqTitle}</h2>
              <div className="p-faq">
                {faqs.map((f, i) => (
                  <div key={f.id} className="p-faq-item">
                    <h3 style={{ font: 'inherit' }}>
                      <button type="button" aria-expanded={open === i} aria-controls={`faq-${f.id}`} onClick={() => setOpen(open === i ? null : i)}>
                        {f.question}
                        <Icon name={open === i ? 'minus' : 'plus'} size={16} />
                      </button>
                    </h3>
                    <div id={`faq-${f.id}`} className="ans" hidden={open !== i}>{f.answer}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className="p-quotepanel" style={{ borderRadius: 'var(--radius-lg)', minHeight: 180 }}>
            <span className="leaf-bg" aria-hidden="true"><Icon name="leaf" size={140} stroke={0.8} /></span>
            <p className="p-quote-serif" style={{ fontSize: 24 }}>“{c.cardQuote}”</p>
            <Caps className="sm">{branding?.wordmark}</Caps>
          </div>
        </div>
      </div>

      <div className="wrap p-cj-bottom">
        <section className="p-panel stack gap-12">
          <h2 className="p-caps row gap-8"><Icon name="clipboard" size={20} />{c.prepareTitle}</h2>
          <ul className="p-check">{c.prepare.map((x, i) => <li key={i}><Icon name="check" size={15} />{x}</li>)}</ul>
        </section>
        <section className="p-panel stack gap-12">
          <h2 className="p-caps row gap-8"><Icon name="info" size={20} />{c.knowTitle}</h2>
          <ul className="p-check">{c.know.map((x, i) => <li key={i}><Icon name="check" size={15} />{x}</li>)}</ul>
        </section>
        <section className="p-panel stack gap-12" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h2 className="p-caps row gap-8"><Icon name="calendar" size={20} />{c.readyTitle}</h2>
          <p className="muted">{c.readyBody}</p>
          <BookButton />
        </section>
        <Art src="sunrise" quote={method?.frameworkScript} quotePos="bl" quoteSize={28} className="rounded-lg" style={{ minHeight: 200 }} />
      </div>

      {booking && <BookingModal c={c} onClose={() => setBooking(false)} />}
    </>
  );
}

function BookingModal({ c, onClose }: { c: DiscoveryContent; onClose: () => void }) {
  const { user } = useAuth();
  const settings = useSettings();
  const slots = useSlots();
  const book = useAction('bookDiscovery');
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [dayIdx, setDayIdx] = useState(0);
  const [when, setWhen] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Date | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Please enter a valid email address';
    if (!when) errs.when = 'Please choose a time';
    setErrors(errs);
    if (Object.keys(errs).length || !when) return;
    try {
      await book.mutateAsync({ name: name.trim(), email: email.trim(), when: when.toISOString() });
      setDone(when);
    } catch (err) {
      toast((err as Error).message, true);
    }
  };

  const day = slots[dayIdx];
  return (
    <Modal open onClose={onClose} title={settings?.discoveryCall.title ?? c.cta} wide={false}>
      {done ? (
        <div className="p-thanks" role="status">
          <span className="icon-circle sage lg"><Icon name="check" size={28} /></span>
          <h3 className="h3">{c.bookedTitle}</h3>
          <p className="serif" style={{ fontSize: 18 }}>{fmtDay(done)} · {slots.flatMap((d) => d.times).find((t) => t.when.getTime() === done.getTime())?.label}</p>
          <p className="muted">{c.bookedBody}</p>
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form className="stack gap-16" onSubmit={submit} noValidate>
          <p className="body-sm muted">{settings?.discoveryCall.durationMin} minutes · {settings?.discoveryCall.platformText}</p>
          <div className="grid-2" style={{ gap: 12 }}>
            <TextInput label="Your name" required value={name} onChange={setName} error={errors.name} autoComplete="name" />
            <TextInput label="Email address" type="email" required value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack gap-12">
            <legend className="field-label" style={{ marginBottom: 8 }}>Choose a day</legend>
            <div className="p-slots-days" role="radiogroup" aria-label="Day">
              {slots.map((d, i) => (
                <button key={d.label} type="button" role="radio" aria-checked={i === dayIdx} className="p-slot" onClick={() => { setDayIdx(i); setWhen(null); }}>{d.label}</button>
              ))}
            </div>
            <div className="field-label">Choose a time</div>
            <div className="p-slots-times" role="radiogroup" aria-label="Time">
              {day?.times.map((t) => (
                <button key={t.label} type="button" role="radio" aria-checked={when?.getTime() === t.when.getTime()} className="p-slot" onClick={() => setWhen(t.when)}>{t.label}</button>
              ))}
            </div>
            {errors.when && <div className="field-error" role="alert">{errors.when}</div>}
          </fieldset>
          <div className="row gap-12" style={{ justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" arrow disabled={book.isPending}>{book.isPending ? 'Booking…' : c.cta}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
