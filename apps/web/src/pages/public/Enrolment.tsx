import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAction, useAuth, usePublicList, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Price, Script, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { JourneyHeader } from './components/JourneyHeader';
import { PaymentMethods, useDefaultMethod } from './components/PurchasePanel';
import { Caps, IconRows, NumberedSteps, PageLoading, tone } from './components/shared';
import './public.css';

interface EnrolmentContent {
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  benefits: { text: string; icon: string }[];
  quote: string;
  bannerQuote: string;
  chooseTitle: string;
  chooseBody: string;
  cta: string;
  ctaNote: string;
  nextTitle: string;
  next: { title: string; text: string }[];
  sideQuote: string;
  paymentTitle: string;
  paymentBody: string;
  receiveTitle: string;
  receive: string[];
  importantTitle: string;
  important: string[];
}

/** "SHIFT Start" → ["SHIFT", "Start"] (two stacked lines on the card). */
const splitAlias = (a: string) => {
  const [first, ...rest] = a.split(' ');
  return rest.length ? [first, rest.join(' ')] : [a];
};

export default function Enrolment() {
  const c = useContent<EnrolmentContent>('enrolment');
  const plans = usePublicList('plans').data;
  const settings = useSettings();
  const { user, isAdmin } = useAuth();
  const enrol = useAction('enrol');
  const toast = useToast();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(params.get('plan'));
  const [method, setMethod] = useDefaultMethod();
  const [outcome, setOutcome] = useState<'enrolled' | 'guest' | 'admin' | null>(null);

  useEffect(() => {
    if (plans?.length && (!selected || !plans.some((p) => p.id === selected))) setSelected(plans.find((p) => p.badge)?.id ?? plans[0].id);
  }, [plans, selected]);

  if (!c || !plans || !settings) return <><JourneyHeader current="enrol" /><PageLoading /></>;
  const plan = plans.find((p) => p.id === selected);

  const onEnrol = async () => {
    if (!plan) return;
    if (!user) return setOutcome('guest');
    if (isAdmin) return setOutcome('admin');
    try {
      await enrol.mutateAsync({ planId: plan.id, method });
      setOutcome('enrolled');
      toast(`Welcome to SHIFT — ${plan.name} confirmed`);
    } catch (e) {
      toast((e as Error).message, true);
    }
  };

  const payOptions = settings.paymentOptions.filter((o) => o.enabled);

  return (
    <>
      <JourneyHeader current="enrol" />
      <div className="wrap p-cj" style={{ '--cj-cols': 'minmax(0, 0.8fr) minmax(0, 1.75fr) minmax(0, 0.8fr)' } as CSSProperties}>
        <div className="p-cj-intro">
          <Caps>{c.kicker}</Caps>
          <h1 className="p-cj-title">{c.title}</h1>
          <hr className="p-rule" />
          <p className="p-cj-sub">{c.subtitle}</p>
          <p className="p-cj-body">{c.body}</p>
          <IconRows items={c.benefits} />
          <Script size={32} style={{ marginTop: 8 }}>“{c.quote}”</Script>
        </div>

        <div className="p-en-centre">
          <div className="p-en-banner">
            <Art src="enrolment" />
            <p className="p-quote-overlay">{c.bannerQuote}</p>
          </div>
          <div className="stack gap-16" style={{ padding: 'clamp(16px, 2.6vw, 24px)' }}>
            <div className="center stack gap-8">
              <h2 className="p-caps" style={{ fontSize: 14, letterSpacing: '0.24em' }}>{c.chooseTitle}</h2>
              <p className="body-sm muted">{c.chooseBody}</p>
            </div>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="sr-only">{c.chooseTitle}</legend>
              <div className="p-en-plans">
                {plans.map((p) => {
                  const on = p.id === selected;
                  return (
                    <label key={p.id} className={`p-en-plan ${tone(p.color)} ${on ? 'on' : ''}`}>
                      <input type="radio" name="plan" value={p.id} checked={on} onChange={() => { setSelected(p.id); setOutcome(null); }} />
                      {on && <span className="p-en-chosen" aria-hidden="true"><Icon name="check" size={14} /></span>}
                      <Icon name="sprout" size={34} stroke={1.4} style={{ color: 'var(--t-strong)' }} />
                      <span className="p-en-alias">{splitAlias(p.displayAlias).map((l, i) => <span key={i} style={{ display: 'block' }}>{l}</span>)}</span>
                      <span className="p-caps sm">{p.aliasTagline}</span>
                      <span className="p-en-pill">{p.sessions} sessions</span>
                      <ul className="p-check">
                        {p.features.map((f, i) => <li key={i}><Icon name="check" size={14} />{f}</li>)}
                      </ul>
                      <span className="serif" style={{ fontSize: 17, color: 'var(--ink)' }}><Price amount={p.price} /></span>
                      <Script size={26}>{p.scriptLine}</Script>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {user && !isAdmin && outcome !== 'enrolled' && <PaymentMethods value={method} onChange={setMethod} />}

            {outcome === 'enrolled' && plan ? (
              <div className="p-buy-done stack gap-12" role="status">
                <div className="row gap-12">
                  <span className="icon-circle sage sm"><Icon name="check" size={18} /></span>
                  <strong>You're enrolled in {plan.name} ({plan.displayAlias}).</strong>
                </div>
                <p className="body-sm muted">{c.next[2]?.text} {c.next[3]?.text}</p>
                <Button to="/app/onboarding" arrow>{c.next[3]?.title ?? 'Start onboarding'}</Button>
              </div>
            ) : outcome === 'guest' ? (
              <div className="p-panel-sage stack gap-12" role="status">
                <strong>Let's talk first.</strong>
                <p className="body-sm">Enrolment opens after your free discovery call — that's where we choose the right package together and I set up your client account. Book a time and mention {plan?.name ? `the ${plan.name} package` : 'the package you like'}.</p>
                <div className="wrap-row gap-12">
                  <Button to="/discovery-call" arrow>Book a free discovery call</Button>
                  <Button to="/login" variant="ghost">I already have an account</Button>
                </div>
              </div>
            ) : outcome === 'admin' ? (
              <div className="p-panel stack gap-8" role="status">
                <p className="body-sm">You're signed in as the coach. Assign packages to clients from the admin client page.</p>
                <Button to="/admin/clients" variant="ghost" arrow>Go to clients</Button>
              </div>
            ) : (
              <div className="center stack gap-8" style={{ alignItems: 'center' }}>
                <Button caps size="lg" arrow onClick={onEnrol} disabled={!plan || enrol.isPending}>{enrol.isPending ? 'Enrolling…' : c.cta}</Button>
                <Caps className="sm">{c.ctaNote}</Caps>
              </div>
            )}
          </div>
        </div>

        <div className="p-cj-side">
          <section className="p-panel stack gap-16" aria-labelledby="en-next">
            <h2 id="en-next" className="p-caps">{c.nextTitle}</h2>
            <NumberedSteps items={c.next} />
          </section>
          <div className="p-en-quoteart">
            <Art src="mountains" />
            <p className="p-quote-overlay">“{c.sideQuote}”</p>
            <Caps className="sm center" ><span style={{ display: 'block', padding: '14px 12px', whiteSpace: 'pre-line' }}>{c.bannerQuote}</span></Caps>
          </div>
        </div>
      </div>

      <div className="wrap p-cj-bottom">
        <section className="p-panel stack gap-12">
          <h2 className="p-caps row gap-8"><Icon name="card" size={20} />{c.paymentTitle}</h2>
          <p className="body-sm muted">{c.paymentBody}</p>
          <div className="p-pay-icons">
            {payOptions.map((o) => <div key={o.key}><Icon name={o.icon} size={30} stroke={1.3} />{o.label}</div>)}
          </div>
        </section>
        <section className="p-panel stack gap-12">
          <h2 className="p-caps row gap-8"><Icon name="mail" size={20} />{c.receiveTitle}</h2>
          <ul className="p-check">{c.receive.map((x, i) => <li key={i}><Icon name="check" size={15} />{x}</li>)}</ul>
        </section>
        <section className="p-panel stack gap-12">
          <h2 className="p-caps row gap-8"><Icon name="info" size={20} />{c.importantTitle}</h2>
          <ul className="p-check">{c.important.map((x, i) => <li key={i}><Icon name="check" size={15} />{x}</li>)}</ul>
        </section>
      </div>
    </>
  );
}
