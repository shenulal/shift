import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/data';
import { Loading } from '@/ui/kit';
import { Logo } from '@/ui/Logo';

/** Coach admin chrome: logo + Dashboard | Client view (preview) | View site → (images 33–38). */
export function AdminLayout() {
  const { user, loading, isAdmin, logout } = useAuth();
  const loc = useLocation();
  useEffect(() => window.scrollTo(0, 0), [loc.pathname]);
  if (loading) return <div className="wrap section"><Loading /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;
  return (
    <div style={{ background: '#f1eee9', minHeight: '100vh' }}>
      <header className="topnav" style={{ background: 'rgba(251,250,246,.96)' }}>
        <div className="wrap topnav-inner">
          <Link to="/admin" aria-label="Coach dashboard" style={{ textDecoration: 'none' }}><Logo size={20} /></Link>
          <nav className="topnav-links admin-links" aria-label="Admin">
            <NavLink to="/admin" end>Dashboard</NavLink>
            <NavLink to="/admin/preview">Client view (preview)</NavLink>
            <Link to="/">View site →</Link>
            <button type="button" className="link body-sm" onClick={() => void logout()}>Sign out</button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
