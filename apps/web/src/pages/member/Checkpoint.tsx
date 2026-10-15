import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fmtDate, wheelCompare } from '@shift/core';
import { useAction, usePublicList, useSettings } from '@/data';
import { Radar, WheelOfLife } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { Button, Empty, TextArea, useToast } from '@/ui/kit';
import { wheelBounds } from './components/blueprint';
import { BackLink, PageLoading, tone } from './components/ui';
import { useJourney, useMine } from './components/useJourney';
import './member.css';

export default function Checkpoint() {
  const { id } = useParams();
  const j = useJourney();
  const checkpoints = usePublicList('checkpoints').data;
  const notes = useMine('notes').data;
  const scores = useMine('wheelScores').data;
  const areas = usePublicList('wheelAreas').data;
  const settings = useSettings();
  const saveNote = useAction('saveNote');
  const saveWheel = useAction('saveWheel');
  const toast = useToast();
  const [text, setText] = useState('');
  const [wheel, setWheel] = useState<Record<string, number> | null>(null);
  const cp = checkpoints?.find((c) => c.id === id);
  const ctx = `checkpoint:${id}`;
  const mine = scores?.find((s) => s.context === ctx) ?? null;
  useEffect(() => {
    if (wheel || !scores || cp?.kind !== 'wheel') return;
    const { sorted } = wheelBounds(scores);
    setWheel({ ...(mine?.scores ?? sorted[sorted.length - 1]?.scores ?? {}) });
  }, [scores, wheel, cp, mine]);

  if (!j.ready || !checkpoints || !notes || !scores || !areas || !settings) return <PageLoading />;
  if (!cp) return <div className="wrap section-sm"><Empty icon="calendar" title="We couldn't find that checkpoint"><Link to="/app/portal" className="link">Back to my portal</Link></Empty></div>;
  const stage = j.stages.find((s) => s.id === cp.afterStageId);
  const noteKind = cp.kind === 'note' ? 'shift-note' : 'marker';
  const previous = cp.kind === 'wheel' ? [] : notes.filter((n) => n.kind === noteKind && (cp.kind === 'note' || n.title === cp.title)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const start = wheelBounds(scores.filter((s) => s.context !== ctx)).start;

  const submitNote = async () => {
    if (!text.trim()) return toast('Write a few words first', true);
    try {
      await saveNote.mutateAsync({ kind: noteKind, title: cp.title, body: text.trim() });
      setText('');
      toast('Saved — your coach will see this before your next session');
    } catch (e) {
      toast((e as Error).message, true);
    }
  };
  const submitWheel = async () => {
    if (!wheel || Object.keys(wheel).length < areas.length) return toast('Please rate every area', true);
    try {
      await saveWheel.mutateAsync({ context: ctx, scores: wheel });
      toast('Wheel saved — your coach will see the shifts');
    } catch (e) {
      toast((e as Error).message, true);
    }
  };
  const rows = wheel ? wheelCompare(areas, start?.scores, wheel) : [];

  return (
    <div className="wrap m-page stack gap-24" style={{ maxWidth: 980 }}>
      <BackLink to="/app/portal">Back to my coaching portal</BackLink>
      <section className={`m-checkpoint ${tone(cp.color)}`} aria-labelledby="cp-title">
        <span className="m-checkpoint-ic" aria-hidden="true"><Icon name={cp.icon} size={26} /></span>
        <div className="grow stack gap-4" style={{ flex: '1 1 280px' }}>
          <span className="label-caps muted">Session {cp.sessionNumber}{stage ? ` · after ${stage.name}` : ''}</span>
          <h1 className="h2" id="cp-title">{cp.title}</h1>
          <p className="muted">{cp.description}</p>
        </div>
      </section>

      {cp.kind === 'wheel' ? (
        <section className="card stack gap-20">
          {wheel && <WheelOfLife value={wheel} onChange={setWheel} size={360} compare={start?.scores} />}
          {start && (
            <div className="m-rerate">
              <div className="stack gap-8">
                <div className="m-legend">
                  <span><i style={{ background: '#d29b94' }} />When you started<small>{fmtDate(start.date)}</small></span>
                  <span><i style={{ background: '#2e3b32' }} />This checkpoint{mine && <small>{fmtDate(mine.date)}</small>}</span>
                </div>
                <Radar axes={areas.map((a) => ({ id: a.id, label: a.name }))} max={settings.wheel.max} size={260} series={[
                  { label: 'When you started', values: start.scores, color: '#d29b94', fill: 'rgba(210,155,148,.15)' },
                  { label: 'This checkpoint', values: wheel ?? {}, color: '#2e3b32', fill: 'rgba(148,165,140,.25)' },
                ]} />
              </div>
              <div className="m-box scroll-x">
                <table className="table">
                  <thead><tr><th scope="col">Area</th><th scope="col">Start</th><th scope="col">Now</th><th scope="col">Change</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.areaId}>
                        <th scope="row" className="body-sm" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>{r.name}</th>
                        <td><span className="m-score">{r.start ?? '—'}</span></td>
                        <td><span className="m-score now">{r.now ?? '—'}</span></td>
                        <td><span className={`m-change ${r.change !== null && r.change < 0 ? 'neg' : 'pos'}`}>{r.change === null ? '—' : r.change > 0 ? `+${r.change}` : r.change}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="m-stepfoot">
            <Button arrow onClick={submitWheel} disabled={saveWheel.isPending}>{mine ? 'Update my Wheel' : cp.ctaLabel}</Button>
            {mine && <span className="body-sm muted">Last saved {fmtDate(mine.date)}</span>}
          </div>
        </section>
      ) : (
        <section className="card stack gap-16">
          <TextArea label={cp.kind === 'note' ? 'My SHIFT note' : 'My intention marker'} value={text} onChange={setText} rows={5} placeholder={cp.kind === 'note' ? 'A thought, an emotion, an insight…' : 'I will know it is working when…'} showCount />
          <div><Button arrow onClick={submitNote} disabled={saveNote.isPending}>{cp.ctaLabel}</Button></div>
          {previous.length > 0 && (
            <div className="stack gap-8">
              <h2 className="h4">Previous entries</h2>
              {previous.map((n) => (
                <div key={n.id} className="m-refl-item"><span className="body-sm muted">{fmtDate(n.date)}</span><blockquote>{n.body}</blockquote></div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
