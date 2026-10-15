import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth, usePublicList } from '@/data';
import { Art } from '@/ui/Art';
import { Icon } from '@/ui/Icon';
import { AutosaveIndicator, Button, Empty, Kicker, Price } from '@/ui/kit';
import { BackLink, LockedPanel, PageLoading, tone } from './components/ui';
import { useMine } from './components/useJourney';
import { useWorkDraft } from './components/useWorkDraft';
import './member.css';

function ToolNotes({ context }: { context: string }) {
  const work = useMine('work').data;
  const wd = useWorkDraft(context, work?.find((w) => w.context === context), !!work);
  if (!wd.draft) return <div className="skeleton" style={{ height: 140 }} />;
  return (
    <div className="stack gap-8">
      <label className="field-label" htmlFor="tool-notes">My notes</label>
      <textarea id="tool-notes" className="textarea" rows={6} placeholder="Write your thoughts here…" value={wd.draft.reflections.notes ?? ''} onChange={(e) => wd.setReflection('notes', e.target.value)} />
      <div className="row" style={{ justifyContent: 'flex-end' }}><AutosaveIndicator status={wd.status} /></div>
    </div>
  );
}

export default function ToolkitTools() {
  const { toolkitId } = useParams();
  const { user, isAdmin } = useAuth();
  const toolkits = usePublicList('toolkits').data;
  const [sel, setSel] = useState<string | null>(null);
  if (!toolkits || !user) return <PageLoading />;
  const tk = toolkits.find((t) => t.id === toolkitId);
  if (!tk) return <div className="wrap section-sm"><Empty icon="wrench" title="We couldn't find that toolkit"><Link className="link" to="/app/tools">Back to My Tools</Link></Empty></div>;
  const owns = isAdmin || user.toolkitIds.includes(tk.id);
  if (!owns) {
    return (
      <div className="wrap m-page stack gap-16">
        <BackLink to="/app/tools">Back to My Tools</BackLink>
        <LockedPanel title={`${tk.name} Toolkit`} body={<p>{tk.description}</p>} actions={<Button to={`/tools/${tk.id}`} arrow>{tk.ctaLabel} · <Price amount={tk.price} /></Button>} />
      </div>
    );
  }
  const tools = tk.tools.filter((t) => t.active);
  const tool = tools.find((t) => t.id === sel) ?? tools[0];
  return (
    <div className="wrap m-page stack gap-24">
      <BackLink to="/app/tools">Back to My Tools</BackLink>
      <section className={`m-jhero ${tone(tk.color)}`} aria-labelledby="tk-title" style={{ background: 'var(--t-soft)' }}>
        <div className="m-jhero-copy">
          <Kicker>{tk.name} Toolkit</Kicker>
          <h1 className="h1" id="tk-title">{tk.tagline}</h1>
          <p className="muted">{tk.description}</p>
        </div>
        <Art src={tk.image} note={tk.imageNote} className="m-jhero-art" />
      </section>
      {tools.length ? (
        <div className="m-tk-layout">
          <ol className="m-tk-list" aria-label="Tools">
            {tools.map((t, i) => (
              <li key={t.id}>
                <button type="button" className={`m-tk-item ${tool?.id === t.id ? 'on' : ''}`} aria-current={tool?.id === t.id} onClick={() => setSel(t.id)}>
                  <span className="num" aria-hidden="true">{i + 1}</span>
                  <span className="grow stack"><strong className="body-sm">{t.name}</strong><span className="body-sm muted">{t.description}</span></span>
                  <Icon name={t.icon} size={18} />
                </button>
              </li>
            ))}
          </ol>
          {tool && (
            <section className="card stack gap-16" aria-labelledby="tool-title" key={tool.id}>
              <div className="m-stephead">
                <span className="m-stephead-ic" aria-hidden="true"><Icon name={tool.icon} size={22} /></span>
                <div className="stack gap-4"><h2 className="h3" id="tool-title">{tool.name}</h2><p className="muted body-sm">{tool.description}</p></div>
              </div>
              {tool.content ? (
                <div className="pre-line" style={{ lineHeight: 1.7 }}>{tool.content}</div>
              ) : (
                <div className="card-soft card-pad-sm row gap-12" style={{ alignItems: 'flex-start' }}>
                  <Icon name="leaf" size={20} />
                  <p className="body-sm muted">This tool's guided exercise is being prepared. In the meantime, use the space below to capture your own notes — they're saved privately for you.</p>
                </div>
              )}
              <ToolNotes context={`tool:${tk.id}:${tool.id}`} />
            </section>
          )}
        </div>
      ) : <Empty icon="wrench" title="Tools coming soon" />}
    </div>
  );
}
