import { canPrint, HOSTED_NOTE } from '@/lib/env';
import { useState } from 'react';
import { Button, Kicker, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { BlueprintPages } from './components/BlueprintPages';
import { PrintPortal } from './components/Print';
import { useBlueprint } from './components/blueprint';
import { BackLink, LockedPanel, PageLoading } from './components/ui';
import './member.css';

export default function Blueprint() {
  const { inp, data } = useBlueprint();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!inp.ready || !data) return <PageLoading />;
  const j = inp.j;
  const lesson = j.lessons.find((l) => l.id === data.blueprintLessonId);
  if (!j.hasJourney) {
    return <div className="wrap m-page"><LockedPanel title={data.tpl.title} body={<p>Your personal SHIFT Blueprint is created from your work across The SHIFT Journey or 1:1 coaching.</p>} /></div>;
  }
  const script = lesson?.sideQuote;
  const download = async () => {
    setBusy(true);
    try {
      const mod = await import('./components/BlueprintPdf');
      await mod.downloadBlueprintPdf(data, script);
      toast('Your Blueprint PDF is downloading');
    } catch (e) {
      toast(`Couldn't create the PDF: ${(e as Error).message}`, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wrap m-page stack gap-24">
      <div className="row between gap-16 wrap-row no-print">
        <div className="stack gap-8">
          {lesson && j.isUnlocked(lesson) ? <BackLink to={`/app/lesson/${lesson.id}?step=3`}>Back to {lesson.shortTitle}</BackLink> : <BackLink to="/app">Back to My Journey</BackLink>}
          <Kicker>Printable PDF preview</Kicker>
          <h1 className="h1">{data.tpl.title}</h1>
          <p className="muted">{data.tpl.subtitle}</p>
        </div>
        <div className="wrap-row gap-12">
          {canPrint ? (
            <>
              <Button variant="ghost" icon="print" onClick={() => window.print()}>Print</Button>
              <Button icon="download" onClick={download} disabled={busy}>{busy ? 'Preparing your PDF…' : 'Download My Blueprint'}</Button>
            </>
          ) : <span className="body-sm muted" style={{ maxWidth: 360 }}>{HOSTED_NOTE}</span>}
        </div>
      </div>
      {lesson && (
        <p className="body-sm muted no-print row gap-8"><Icon name="info" size={16} />Edit any section in “{lesson.title}” — your blueprint updates automatically.</p>
      )}
      <BlueprintPages d={data} script={script} />
      <PrintPortal><BlueprintPages d={data} script={script} /></PrintPortal>
    </div>
  );
}
