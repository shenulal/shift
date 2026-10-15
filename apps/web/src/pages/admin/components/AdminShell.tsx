import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { now } from '@shift/core';
import { client, useAuth, useSettings } from '@/data';
import { Icon } from '@/ui/Icon';
import { firstName, plural } from './util';
import '../admin.css';

export type AdminTab = 'overview' | 'clients' | 'pipeline' | 'analytics' | 'cms';

const TABS: { id: Exclude<AdminTab, 'cms'>; label: string; to: string }[] = [
  { id: 'overview', label: 'Overview', to: '/admin' },
  { id: 'clients', label: 'My Clients', to: '/admin/clients' },
  { id: 'pipeline', label: 'Pipeline & Forms', to: '/admin/pipeline' },
  { id: 'analytics', label: 'Analytics', to: '/admin/analytics' },
];

export const CMS_LINKS: { to: string; label: string; icon: string; sub: string }[] = [
  { to: '/admin/cms/plans', label: 'Plans & Pricing', icon: 'coins', sub: 'Packages, prices, products' },
  { to: '/admin/cms/toolkits', label: 'Toolkits', icon: 'layers', sub: 'Guided SHIFT toolkits & tools' },
  { to: '/admin/cms/journey', label: 'Journey Builder', icon: 'compass', sub: 'Stages, lessons, checkpoints' },
  { to: '/admin/cms/questions', label: 'Questions & Wheel', icon: 'circle-half', sub: 'Wheel of Life, free tool, quiz' },
  { to: '/admin/cms/forms', label: 'Forms & Emails', icon: 'mail', sub: 'Forms, templates, letters, outbox' },
  { to: '/admin/cms/content', label: 'Content Pages', icon: 'doc', sub: 'Page copy & FAQs' },
  { to: '/admin/cms/branding', label: 'Branding', icon: 'sparkle', sub: 'Logo, colours, fonts, images' },
  { to: '/admin/cms/settings', label: 'Settings', icon: 'gear', sub: 'Business, booking, users' },
];

/** Admin overview numbers (summary line, stat cards, this week). Refreshes after every change. */
export function useOverview() {
  return useQuery({ queryKey: ['c', 'admin-overview'], queryFn: () => client.action('overview', {} as never), staleTime: 10_000 });
}

export function greeting(d = now()) {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function SettingsMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(wrap.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []);
        const i = items.indexOf(document.activeElement as HTMLAnchorElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.setTimeout(() => wrap.current?.querySelector<HTMLAnchorElement>('[role="menuitem"]')?.focus(), 0);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="adm-gear-wrap" ref={wrap}>
      <button ref={btn} type="button" className={`adm-gear ${active ? 'active' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="gear" size={17} />
        <span>Settings &amp; content</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} />
      </button>
      {open && (
        <div className="adm-menu" role="menu" aria-label="Settings and content">
          {CMS_LINKS.map((l) => (
            <Link key={l.to} to={l.to} role="menuitem" className={`adm-menu-item ${loc.pathname === l.to ? 'on' : ''}`}>
              <Icon name={l.icon} size={18} />
              <span className="stack">
                <span className="adm-menu-label">{l.label}</span>
                <span className="adm-menu-sub">{l.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CmsNav() {
  return (
    <nav className="adm-cmsnav" aria-label="Content management">
      {CMS_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `adm-cmsnav-link ${isActive ? 'active' : ''}`}>
          <Icon name={l.icon} size={15} />
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Summary line under the greeting: "3 active 1:1 clients · 2 intake forms awaiting review · …" */
export function SummaryLine() {
  const ov = useOverview().data;
  if (!ov) return <p className="adm-band-sub" aria-busy="true">&nbsp;</p>;
  const parts = [
    `${plural(ov.activeClients, 'active 1:1 client')}`,
    `${plural(ov.intakeAwaiting, 'intake form')} awaiting review`,
    `${plural(ov.callsThisWeek, 'discovery call')} this week`,
    `${ov.joinedThisMonth.toLocaleString('en-US')} people joined your list this month.`,
  ];
  return <p className="adm-band-sub">{parts.join(' · ')}</p>;
}

/**
 * Shared admin chrome used by every admin page: dark-green header band (images 33–38), folder tabs
 * Overview | My Clients | Pipeline & Forms | Analytics, the "Settings & content" gear menu, and a persistent
 * CMS sub-nav on content pages.
 */
export function AdminShell({ tab, title, kicker, sub, children, actions }: { tab: AdminTab; title?: ReactNode; kicker?: ReactNode; sub?: ReactNode; children: ReactNode; actions?: ReactNode }) {
  const { user } = useAuth();
  const settings = useSettings();
  const name = firstName(settings?.adminAccount.name || user?.name || settings?.coachName || '');
  const isCms = tab === 'cms';
  return (
    <div className="adm">
      <section className="adm-band">
        <div className="wrap adm-band-inner">
          <div className="stack gap-8" style={{ minWidth: 0 }}>
            <div className="adm-band-kicker">{kicker ?? (isCms ? 'Settings & content' : 'Coach account')}</div>
            <h1 className="adm-band-title">{title ?? `${greeting()}, ${name}.`}</h1>
            {sub ?? (!isCms && <SummaryLine />)}
          </div>
          {actions && <div className="wrap-row gap-8 adm-band-actions">{actions}</div>}
        </div>
      </section>
      <div className="wrap adm-body">
        <div className="adm-tabrow">
          <nav className="adm-tabs" aria-label="Dashboard sections">
            {TABS.map((t) => (
              <Link key={t.id} to={t.to} className={`adm-tab ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
          <SettingsMenu active={isCms} />
        </div>
        <div className={`adm-panel ${isCms ? 'cms' : ''}`}>
          {isCms && <CmsNav />}
          {children}
        </div>
      </div>
    </div>
  );
}
