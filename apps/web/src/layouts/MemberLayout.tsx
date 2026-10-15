import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/data';
import { useContent } from '@/lib/content';
import { IconButton, Loading } from '@/ui/kit';
import { Logo } from '@/ui/Logo';

interface GlobalContent { memberNav: { label: string; href: string }[] }

/** Member app chrome: Home | My Journey | Tools | Coaching | About | avatar. */
export function MemberLayout() {
  const { user, loading, logout, isAdmin } = useAuth();
  const g = useContent<GlobalContent>('global');
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    setOpen(false);
    setMenu(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  if (loading) return <div className="wrap section"><Loading /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return (
    <>
      <header className="topnav">
        <div className="wrap topnav-inner">
          <Link to="/app" aria-label="My Journey" style={{ textDecoration: 'none' }}><Logo size={22} /></Link>
          <IconButton icon={open ? 'x' : 'menu'} label="Menu" className="topnav-burger" onClick={() => setOpen((o) => !o)} />
          <nav className={`topnav-links ${open ? 'open' : ''}`} aria-label="Member">
            {(g?.memberNav ?? []).map((n) => <NavLink key={n.href} to={n.href} end={n.href === '/app'}>{n.label}</NavLink>)}
            {isAdmin && <NavLink to="/admin">Coach dashboard</NavLink>}
            <div style={{ position: 'relative' }}>
              <button type="button" className="avatar" style={{ border: 0, cursor: 'pointer' }} aria-label="Account menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{user.initials}</button>
              {menu && (
                <div className="card shadow" style={{ position: 'absolute', right: 0, top: 46, padding: 8, minWidth: 200, zIndex: 50 }}>
                  <div className="body-sm" style={{ padding: '8px 12px' }}><strong>{user.name}</strong><br /><span className="muted">{user.email}</span></div>
                  <hr className="divider" />
                  <Link className="tab" style={{ display: 'block' }} to="/app/portal">My coaching portal</Link>
                  <Link className="tab" style={{ display: 'block' }} to="/app/onboarding">My forms</Link>
                  <button type="button" className="tab" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => void logout()}>Sign out</button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main id="main"><Outlet /></main>
    </>
  );
}
