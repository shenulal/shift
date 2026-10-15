import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Confirm } from '@/ui/kit';
import { client, isDemo, useAuth, useQueryClient } from '@/data';

/** Review-build helper: switch between visitor, client and coach views, or reset the demo data. */
export function DemoBar() {
  const { user, loginAs, logout } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [asking, setAsking] = useState(false);
  if (!isDemo) return null;
  const as = async (id: string | null, to: string) => {
    if (id) await loginAs(id);
    else await logout();
    nav(to);
  };
  return (
    <div className="demo-bar no-print">
      <div className="wrap">
        <strong style={{ fontWeight: 600 }}>Demo</strong>
        <span style={{ opacity: 0.8 }}>View as:</span>
        <button className={!user ? 'on' : ''} onClick={() => as(null, '/')}>Visitor</button>
        <button className={user?.id === 'sarah' ? 'on' : ''} onClick={() => as('sarah', '/app')}>Sarah (client)</button>
        <button className={user?.id === 'edel' ? 'on' : ''} onClick={() => as('edel', '/admin')}>Edel (coach admin)</button>
        <span style={{ marginLeft: 'auto', opacity: 0.8 }}>Changes are saved in this browser.</span>
        <button onClick={() => setAsking(true)}>Reset demo data</button>
        <Confirm
          open={asking}
          title="Reset the demo?"
          body="All changes made in this browser — edits, enquiries, reflections — go back to the original sample data."
          confirmLabel="Reset demo data"
          danger
          onClose={() => setAsking(false)}
          onConfirm={async () => {
            await client.reset?.();
            qc.clear();
            window.location.hash = '#/';
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
}
