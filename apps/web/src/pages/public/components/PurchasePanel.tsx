import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAction, useAuth, useSettings } from '@/data';
import { Button, Price, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import '../public.css';

type Kind = 'toolkit' | 'bundle' | 'journey';

/** Where a buyer goes in the member app once a purchase is complete. */
const appLink = (kind: Kind, refId?: string) => (kind === 'toolkit' ? `/app/tools/${refId}` : kind === 'bundle' ? '/app/tools' : '/app/journey');

/** Payment-method radio group from Settings › Payment options (enabled only). */
export function PaymentMethods({ value, onChange, legend = 'Payment method' }: { value: string; onChange: (v: string) => void; legend?: string }) {
  const s = useSettings();
  const options = (s?.paymentOptions ?? []).filter((o) => o.enabled);
  if (!options.length) return null;
  return (
    <fieldset className="p-methods">
      <legend className="field-label">{legend}</legend>
      <div className="p-methods-row">
        {options.map((o) => (
          <label key={o.key} className={`p-method ${value === o.key ? 'on' : ''}`}>
            <input type="radio" name="payment-method" value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} />
            <Icon name={o.icon} size={22} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function useDefaultMethod() {
  const s = useSettings();
  const first = s?.paymentOptions.find((o) => o.enabled)?.key ?? '';
  const [method, setMethod] = useState(first);
  useEffect(() => {
    if (!method && first) setMethod(first);
  }, [first, method]);
  return [method, setMethod] as const;
}

/**
 * Self-paced purchase (toolkit / bundle / journey) via the `purchase` action.
 * Signed-in buyers pick a payment method; guests also give an email address for their receipt and access.
 */
export function PurchasePanel({ kind, refId, amount, label, ctaLabel, onDone }: { kind: Kind; refId?: string; amount: number | null; label: string; ctaLabel?: string; onDone?: () => void }) {
  const { user, refresh } = useAuth();
  const purchase = useAction('purchase');
  const toast = useToast();
  const [method, setMethod] = useDefaultMethod();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    try {
      await purchase.mutateAsync({ kind, refId, method, email: user ? undefined : email.trim() });
      await refresh();
      setDone(user?.email ?? email.trim());
      toast(`${label} — purchase complete`);
      onDone?.();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong — please try again.');
    }
  };

  if (done) {
    return (
      <div className="p-buy-done stack gap-12" role="status">
        <div className="row gap-12">
          <span className="icon-circle sage sm"><Icon name="check" size={18} /></span>
          <strong>Thank you — {label} is yours.</strong>
        </div>
        <p className="body-sm muted">A confirmation has been sent to {done}.</p>
        {user ? (
          <Button to={appLink(kind, refId)} arrow>Open in my SHIFT app</Button>
        ) : (
          <p className="body-sm">
            Use the link in your email to set up access, or <Link to="/login">sign in</Link> if you already have an account.
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="stack gap-16" onSubmit={submit} noValidate>
      <PaymentMethods value={method} onChange={setMethod} />
      {!user && <TextInput label="Email address" type="email" required value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" help="Your receipt and access link are sent here." />}
      {error && <div className="field-error" role="alert">{error}</div>}
      <Button type="submit" block arrow disabled={purchase.isPending}>
        {purchase.isPending ? 'Processing…' : ctaLabel ?? 'Buy now'}
        {!purchase.isPending && amount !== null && <span className="p-buy-amt">· <Price amount={amount} /></span>}
      </Button>
      {user && <p className="body-sm faint center">Signed in as {user.email}</p>}
    </form>
  );
}
