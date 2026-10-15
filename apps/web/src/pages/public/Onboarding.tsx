import type { CSSProperties, ReactNode } from 'react';
import { useAuth, useBranding, usePublicList, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Art } from '@/ui/Art';
import { Button, Script } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Logo } from '@/ui/Logo';
import { InfoHeader } from './components/InfoHeader';
import { Caps, IconStrip, PageLoading } from './components/shared';
import './public.css';

interface OnboardingContent {
  title: string;
  subtitle: string;
  script: string;
  steps: { title: string; text: string; timing: string; icon: string }[];
  receiveTitle: string;
  receive: { text: string; icon: string }[];
  handsTitle: string;
  hands: { text: string; icon: string }[];
  quote: string;
  imageQuote: string;
  welcomeTitle: string;
  welcomeBody: string;
  guideTitle: string;
  guideSub: string;
}

const INTAKE_ICONS = ['user', 'target', 'head', 'heart', 'star', 'doc'];

export default function Onboarding() {
  const c = useContent<OnboardingContent>('onboarding');
  const forms = usePublicList('forms').data;
  const settings = useSettings();
  const branding = useBranding();
  const { user } = useAuth();
  if (!c || !forms || !settings) return <PageLoading />;
  const intake = forms.find((f) => f.key === 'intake');
  const agreement = forms.find((f) => f.key === 'agreement');
  const days = settings.availability.days;

  /** A small preview card under each step — built from the real forms and availability. */
  const mockups: ReactNode[] = [
    <div key="m1" className="p-mock" style={{ alignItems: 'center', textAlign: 'center' }}>
      <Icon name="leaf" size={22} />
      <h4 className="serif">{c.welcomeTitle}</h4>
      <Art src="mountains" />
      <p className="body-sm pre-line">{c.welcomeBody}</p>
      <span className="p-mock-btn deep">Let's begin</span>
    </div>,
    <div key="m2" className="p-mock">
      <h4 className="serif">{intake?.title}</h4>
      <ul>{intake?.fields.filter((f) => f.type === 'heading').map((f, i) => <li key={f.id}><Icon name={INTAKE_ICONS[i % INTAKE_ICONS.length]} size={14} />{f.label}</li>)}</ul>
      <span className="p-mock-btn">Start form</span>
    </div>,
    <div key="m3" className="p-mock">
      <h4 className="serif">{agreement?.title}</h4>
      <ul>{agreement?.fields.filter((f) => f.type === 'paragraph').map((f) => <li key={f.id}><Icon name="doc" size={14} />{f.label}</li>)}</ul>
      <span className="p-mock-btn">{agreement?.submitLabel}</span>
    </div>,
    <div key="m4" className="p-mock">
      <h4 className="serif">Choose your first session</h4>
      <div className="p-mock-days" style={{ '--d': days.length } as CSSProperties}>{days.map((d) => <span key={d}>{d}</span>)}</div>
      {settings.availability.times.map((t) => <div key={t} className="p-mock-time">{t}</div>)}
    </div>,
    <div key="m5" className="p-mock-art">
      <Art src="notebook-leaves" />
      <div className="p-mock-over">
        <span className="serif">{c.guideTitle}</span>
        <span className="p-caps sm">{c.guideSub}</span>
      </div>
    </div>,
    <div key="m6" className="p-mock-art">
      <Art src="leaves" />
      <div className="p-mock-over">
        <span className="serif">{branding?.taglines.small}</span>
        <Icon name="heart" size={16} />
      </div>
    </div>,
  ];

  return (
    <>
      <InfoHeader title={c.title} subtitle={c.subtitle} script={c.script} art="onboarding" />
      {user && user.role === 'client' && (
        <div className="wrap" style={{ marginBottom: 16 }}>
          <div className="p-panel-sage wrap-row between gap-12">
            <span>Ready to complete your onboarding, {user.name.split(' ')[0]}?</span>
            <Button to="/app/onboarding" arrow>Go to my onboarding</Button>
          </div>
        </div>
      )}
      <section className="wrap" aria-label="Onboarding steps">
        <ol className="p-cols" style={{ '--n': c.steps.length, listStyle: 'none', padding: 0, margin: 0 } as CSSProperties}>
          {c.steps.map((s, i) => (
            <li key={i} className="p-col">
              <span className="p-col-num">{i + 1}</span>
              <span className="p-col-ic" aria-hidden="true"><Icon name={s.icon} size={24} /></span>
              <h2 className="serif" style={{ fontSize: 20 }}>{s.title}</h2>
              <p className="txt">{s.text}</p>
              {mockups[i]}
              <span className="p-col-pill">{s.timing}</span>
              {i < c.steps.length - 1 && <Icon name="arrow-right" size={22} className="p-col-arrow" />}
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section-sm" style={{ paddingBottom: 0 }} aria-labelledby="ob-receive">
        <div className="p-receive stack gap-12">
          <h2 id="ob-receive" className="p-caps">{c.receiveTitle}</h2>
          <IconStrip items={c.receive} />
        </div>
      </section>

      <section className="wrap section-sm">
        <div className="p-trio">
          <div className="p-quotepanel">
            <span className="leaf-bg" aria-hidden="true"><Icon name="leaf" size={160} stroke={0.8} /></span>
            <Script size={36}>{c.quote}</Script>
            <Icon name="heart" size={18} />
          </div>
          <div className="p-panel stack gap-16" style={{ justifyContent: 'center' }}>
            <h2 className="p-caps center">{c.handsTitle}</h2>
            <div className="p-hands">
              {c.hands.map((h, i) => (
                <div key={i}>
                  <span className="icon-circle cream" aria-hidden="true"><Icon name={h.icon} size={20} /></span>
                  {h.text}
                </div>
              ))}
            </div>
            <hr className="divider" />
            <Caps className="sm center">{branding?.taglines.trio}</Caps>
          </div>
          <Art src="coast" quote={c.imageQuote} quotePos="br" quoteSize={32} />
        </div>
        <div className="center" style={{ marginTop: 28 }}>
          <Caps className="sm">{branding?.taglines.primary}</Caps>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}><Logo size={18} /></div>
        </div>
      </section>
    </>
  );
}
