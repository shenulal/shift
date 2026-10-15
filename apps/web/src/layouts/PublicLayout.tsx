import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useBranding, useSettings } from '@/data';
import { useContent } from '@/lib/content';
import { Button, IconButton } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { Logo } from '@/ui/Logo';

interface GlobalContent { nav: { label: string; href: string }[]; navCta: string; footerPillars: string; footerTagline: string; footerNote: string }

export function PublicNav() {
  const g = useContent<GlobalContent>('global');
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  return (
    <header className="topnav">
      <div className="wrap topnav-inner">
        <Link to="/" aria-label="SHIFT home" style={{ textDecoration: 'none' }}><Logo size={22} /></Link>
        <IconButton icon={open ? 'x' : 'menu'} label="Menu" className="topnav-burger" onClick={() => setOpen((o) => !o)} />
        <nav className={`topnav-links ${open ? 'open' : ''}`} aria-label="Main">
          {(g?.nav ?? []).map((n) => <NavLink key={n.href} to={n.href}>{n.label}</NavLink>)}
          {user ? <NavLink to={isAdmin ? '/admin' : '/app'}>{isAdmin ? 'Dashboard' : 'My Journey'}</NavLink> : <NavLink to="/login">Sign in</NavLink>}
          <Button to="/discover" size="sm">{g?.navCta ?? 'Discover SHIFT'}</Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const g = useContent<GlobalContent>('global');
  const s = useSettings();
  const b = useBranding();
  return (
    <footer className="footer">
      <div className="wrap stack gap-24">
        <div className="footer-inner">
          <Logo size={20} sub />
          <span className="pillars">{g?.footerPillars}</span>
          <div className="row gap-16 body-sm">
            <a href={`mailto:${s?.contactEmail}`} className="row gap-4" style={{ textDecoration: 'none' }}><Icon name="mail" size={16} />{s?.contactEmail}</a>
            <span className="row gap-4"><Icon name="instagram" size={16} />{s?.social.instagram}</span>
            <span className="row gap-4"><Icon name="globe" size={16} />{s?.website}</span>
          </div>
        </div>
        <div className="wrap-row between gap-12 body-sm muted">
          <span>{b?.taglines.primary}</span>
          <nav className="wrap-row gap-16" aria-label="Footer">
            <Link to="/enquiry">Enquire</Link>
            <Link to="/discovery-call">Discovery call</Link>
            <Link to="/process">Coaching process</Link>
            <Link to="/brochure">Brochure</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const loc = useLocation();
  useEffect(() => window.scrollTo(0, 0), [loc.pathname]);
  return (
    <>
      <PublicNav />
      <main id="main"><Outlet /></main>
      <PublicFooter />
    </>
  );
}
