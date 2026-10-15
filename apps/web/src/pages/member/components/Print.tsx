import { canPrint, HOSTED_NOTE } from '@/lib/env';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { FieldDef, Lesson, Rec } from '@shift/core';
import { usePublicList } from '@/data';
import { Button, Modal } from '@/ui/kit';
import { Logo } from '@/ui/Logo';
import { useMine } from './useJourney';
import { arr, obj, str } from './tools/types';

/**
 * Print-only copy of some content: rendered into <body> and, via @media print rules in member.css,
 * becomes the only thing printed while mounted.
 */
export function PrintPortal({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.add('m-print-mode');
    return () => document.body.classList.remove('m-print-mode');
  }, []);
  return createPortal(<div className="m-print-root">{children}</div>, document.body);
}

const answer = (v: unknown) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v));

function QA({ label, helper, value }: { label: string; helper?: string; value: unknown }) {
  const a = answer(value);
  return (
    <div className="m-sheet-qa">
      <div className="m-sheet-q">{label}</div>
      {helper && <div className="m-sheet-h">{helper}</div>}
      <div className={`m-sheet-a ${a ? '' : 'empty'}`}>{a || ' '}</div>
    </div>
  );
}

/** Printable worksheet: the tool's fields with the person's answers (blank lines where empty). */
export function WorksheetContent({ lesson, tool, reflections }: { lesson: Rec<Lesson>; tool: Record<string, unknown>; reflections: Record<string, string> }) {
  const areas = usePublicList('wheelAreas').data ?? [];
  const habits = useMine('habits').data ?? [];
  const t = lesson.tool;
  const cfg = t.config as Record<string, unknown>;
  const fieldList = (fs: FieldDef[]) => fs.filter((f) => f.type !== 'heading' && f.type !== 'paragraph').map((f) => <QA key={f.id} label={f.letter ? `${f.letter} — ${f.label}` : f.label} helper={f.helper} value={tool[f.id]} />);
  let kindBody: ReactNode = null;
  if (t.kind === 'values') {
    const meanings = obj<Record<string, string>>(tool.meanings);
    kindBody = (
      <>
        <ol className="m-sheet-steps">{arr(cfg.steps).map((s, i) => <li key={i}>{s}</li>)}</ol>
        <QA label={arr(cfg.steps)[1] ?? ''} value={arr(tool.picked)} />
        <QA label={arr(cfg.steps)[2] ?? ''} value={arr(tool.top)} />
        {arr(tool.top).map((v) => <QA key={v} label={v} value={meanings[v]} />)}
      </>
    );
  } else if (t.kind === 'wheel-priorities') {
    const explore = obj<Record<string, Record<string, string>>>(tool.explore);
    const prompts = (cfg.explore as { id: string; prompt: string }[] | undefined) ?? [];
    kindBody = arr(tool.priorities).map((id, i) => (
      <div key={id} className="m-sheet-block">
        <h3>{i + 1}. {areas.find((a) => a.id === id)?.name ?? id}</h3>
        {prompts.map((p) => <QA key={p.id} label={p.prompt} value={explore[id]?.[p.id]} />)}
      </div>
    ));
  } else if (t.kind === 'habit-builder') {
    kindBody = (
      <>
        {t.fields.map((f) => <QA key={f.id} label={f.label} helper={f.helper} value="" />)}
        {habits.length > 0 && <div className="m-sheet-block"><h3>My habits</h3><ul>{habits.map((h) => <li key={h.id}>{h.name} — {h.frequency}{h.trigger ? ` · ${h.trigger}` : ''}</li>)}</ul></div>}
      </>
    );
  } else {
    const loop = (cfg.loop as { title: string; text: string }[] | undefined) ?? [];
    const steps = (cfg.steps as { letter: string; title: string; text: string }[] | undefined) ?? [];
    kindBody = (
      <>
        {loop.length > 0 && <p className="m-sheet-loop">{loop.map((l) => l.title).join(' → ')}</p>}
        {steps.length > 0 && <ol className="m-sheet-steps">{steps.map((s) => <li key={s.letter + s.title}><strong>{s.letter} · {s.title}</strong> — {s.text}</li>)}</ol>}
        {fieldList(t.fields)}
        {str(tool.intention) && <QA label="Intention" value={tool.intention} />}
      </>
    );
  }
  return (
    <article className="m-sheet">
      <header className="m-sheet-head">
        <Logo size={20} />
        <div>
          <div className="m-sheet-kicker">{t.badge}</div>
          <h2>{t.kind === 'form' && /^(the tool|apply the tool)$/i.test(t.title) ? t.subtitle : t.title}</h2>
          <p>{lesson.title}</p>
        </div>
      </header>
      {t.description && <p className="m-sheet-intro">{t.description}</p>}
      {kindBody}
      {t.worksheet && (
        <div className="m-sheet-block">
          <h3>{t.worksheet.title}</h3>
          <p className="m-sheet-intro">{t.worksheet.intro}</p>
          {fieldList(t.worksheet.fields)}
        </div>
      )}
      {lesson.reflections.length > 0 && (
        <div className="m-sheet-block">
          <h3>{lesson.reflectionTitle}</h3>
          {lesson.reflections.map((q) => <QA key={q.id} label={q.prompt} helper={q.helper} value={reflections[q.id]} />)}
        </div>
      )}
    </article>
  );
}

/** "Download Worksheet": a print-friendly modal (and print-only portal) — no extra route needed. */
export function WorksheetModal({ lesson, tool, reflections, onClose }: { lesson: Rec<Lesson>; tool: Record<string, unknown>; reflections: Record<string, string>; onClose: () => void }) {
  const content = <WorksheetContent lesson={lesson} tool={tool} reflections={reflections} />;
  return (
    <>
      <Modal open onClose={onClose} wide title="Your worksheet" footer={<><Button variant="ghost" onClick={onClose}>Close</Button>{lesson.tool.worksheetUrl && <Button variant="ghost" href={lesson.tool.worksheetUrl} icon="download">Original PDF</Button>}{canPrint ? <Button icon="print" onClick={() => window.print()}>Print or save as PDF</Button> : <span className="body-sm muted">{HOSTED_NOTE}</span>}</>}>
        {content}
      </Modal>
      <PrintPortal>{content}</PrintPortal>
    </>
  );
}
