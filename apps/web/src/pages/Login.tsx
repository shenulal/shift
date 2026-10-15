import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isDemo, useAuth } from '@/data';
import { Button, Kicker, TextInput, useToast } from '@/ui/kit';
import { Logo } from '@/ui/Logo';
import { Art } from '@/ui/Art';

export default function Login() {
  const { login, loginAs } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = (role: string) => nav(params.get('next') ?? (role === 'admin' ? '/admin' : '/app'), { replace: true });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      toast(`Welcome back, ${u.name.split(' ')[0]}`);
      go(u.role);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wrap section">
      <div className="split card" style={{ padding: 0, overflow: 'hidden', alignItems: 'stretch' }}>
        <Art src="sunset-woman" quote={'Small steps.\nBig change.'} style={{ minHeight: 320 }} />
        <form onSubmit={submit} className="stack gap-20" style={{ padding: 'clamp(24px,4vw,48px)' }}>
          <Logo size={24} sub />
          <div className="stack gap-8">
            <Kicker>Welcome back</Kicker>
            <h1 className="h2">Sign in to SHIFT</h1>
            <p className="muted">Your journey, reflections and tools — all in one calm place.</p>
          </div>
          <TextInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <TextInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required={!isDemo} error={error || undefined} />
          <Button type="submit" arrow disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          {isDemo && (
            <div className="card-soft stack gap-12">
              <div className="body-sm"><strong>Demo accounts</strong> — no password needed.</div>
              <div className="wrap-row gap-8">
                <Button variant="ghost" size="sm" onClick={async () => { await loginAs('sarah'); go('client'); }}>Sarah K. (client)</Button>
                <Button variant="ghost" size="sm" onClick={async () => { await loginAs('edel'); go('admin'); }}>Edel (coach admin)</Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
