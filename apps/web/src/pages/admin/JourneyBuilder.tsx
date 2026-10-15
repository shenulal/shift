import { useMemo, useState, type DragEvent } from 'react';
import { orderedLessons, type Lesson, type Rec, type Stage, type StepLabel } from '@shift/core';
import { client, useCrud, useList, useQueryClient, useSettings } from '@/data';
import { Button, Loading, TextInput, useToast } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection, MoveButtons, Switch, TonePill, move } from './components/controls';
import { RecordForm, SingletonForm, type EditorTab, type FieldSpec, type Opt } from './components/RecordEditor';
import { COLOR_HEX, errMsg, uid } from './components/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Sel = { kind: 'stage' | 'lesson'; id: string } | { kind: 'new-stage' } | { kind: 'new-lesson'; stageId: string };

const blankStage = (): Stage => ({
  letter: '', name: '', tagline: '', methodDescription: '', journeyDescription: '', brochureDescription: '', coachingVerb: '', coachingDescription: '', coachingBullets: [],
  sessionsLabel: '', intro: '', meta: [], quote: '', sideQuote: '', color: 'sage', icon: 'leaf', image: 'leaves', portalWeeks: '',
  reflection: { title: '', description: '', questions: [], draft: true },
});

const blankLesson = (stageId: string, order: number): Lesson => ({
  stageId, order, title: '', shortTitle: '', subtitle: '', intro: '', about: '', videoUrl: '', videoTitle: '', videoDuration: '5:00', durationLabel: '5 min video', videoOverlay: '', videoCaption: '',
  heroQuote: '', sideQuote: '', image: 'sunset-woman', learnLabel: "In this lesson, you'll learn:", learn: [], learnCards: [], takeawaysLabel: 'Key Takeaways', takeaways: [],
  reflectionTitle: 'Reflection', reflectionIntro: 'Take a moment to explore and reflect.', reflections: [], reflectionReminder: '',
  tool: { kind: 'form', title: 'Apply the Tool', subtitle: '', description: '', badge: 'PRACTICAL TOOL', fields: [], config: {}, worksheet: null, worksheetUrl: '', saveLabel: 'Save and Continue', confirmation: null },
  nextStep: { prompt: 'This week, I will…', helper: '', placeholder: 'My first step is…', shift: '', remember: [], image: '', imageQuote: '', checklist: [] },
  portalBlurb: '', portalMinutes: 15, celebrate: [], reminders: [], completeLabel: 'Complete Lesson',
});

const TOOL_KINDS: Record<string, string> = {
  form: 'Field-based worksheet — build the fields below',
  values: 'Values Compass (special layout — edit the copy and config below)',
  'wheel-priorities': 'Life Wheel re-rate + choose priorities (special layout)',
  'habit-builder': '5-step habit builder + weekly planner (special layout)',
  'habit-progress': 'Momentum progress rings (special layout)',
  'journey-review': 'Look how far you’ve come (special layout)',
  'future-self-rerate': 'Future Self re-rate (special layout)',
  blueprint: 'Personal Blueprint generator (special layout)',
};

const question = (label = 'Questions'): FieldSpec => ({
  key: '', label, type: 'objects', addLabel: 'Add question',
  blank: () => ({ id: uid('q'), prompt: '', helper: '', placeholder: '' }),
  itemLabel: (q, i) => `${i + 1}. ${q.prompt || 'New question'}`,
  fields: [
    { key: 'prompt', label: 'Question', type: 'text', required: true, full: true },
    { key: 'helper', label: 'Helper text', type: 'text' },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'id', label: 'Answer key', type: 'text', help: 'Saved answers are stored under this key — avoid changing it once clients have answered.' },
  ],
});
const titledItems = (key: string, label: string): FieldSpec => ({
  key, label, type: 'objects', addLabel: 'Add item',
  blank: () => ({ title: '', text: '', icon: 'leaf' }),
  fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'icon', label: 'Icon', type: 'icon' }, { key: 'text', label: 'Text', type: 'textarea', rows: 2 }],
});

function stageTabs(): EditorTab[] {
  return [
    {
      id: 'basics', label: 'Stage', fields: [
        { key: 'name', label: 'Stage name', type: 'text', required: true },
        { key: 'letter', label: 'Letter', type: 'text', required: true, help: 'S · H · I · F · T' },
        { key: 'tagline', label: 'Tagline', type: 'text', full: true },
        { key: 'sessionsLabel', label: 'Sessions label', type: 'text', placeholder: 'Sessions 1–3' },
        { key: 'portalWeeks', label: 'Portal weeks label', type: 'text', placeholder: 'Sessions 1 — 3 · Weeks 1 — 4' },
        { key: 'intro', label: 'Stage intro', type: 'textarea' },
        { key: 'meta', label: 'Stage facts', type: 'strings' },
        { key: 'quote', label: 'Quote', type: 'text' },
        { key: 'sideQuote', label: 'Side quote', type: 'text' },
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'color', label: 'Colour', type: 'color' },
        { key: 'image', label: 'Image', type: 'image' },
      ],
    },
    {
      id: 'copy', label: 'Descriptions', fields: [
        { key: 'methodDescription', label: 'Method page', type: 'textarea', rows: 2 },
        { key: 'journeyDescription', label: 'Journey page', type: 'textarea', rows: 2 },
        { key: 'brochureDescription', label: 'Brochure', type: 'textarea', rows: 2 },
        { key: 'coachingVerb', label: 'Coaching verb', type: 'text', placeholder: 'Understand' },
        { key: 'coachingDescription', label: 'Coaching description', type: 'textarea', rows: 2 },
        { key: 'coachingBullets', label: 'Coaching bullets', type: 'strings' },
      ],
    },
    {
      id: 'reflection', label: 'Stage reflection', fields: [
        { key: 'reflection.title', label: 'Reflection title', type: 'text' },
        { key: 'reflection.draft', label: 'Draft copy (shows a DRAFT tag)', type: 'boolean' },
        { key: 'reflection.description', label: 'Description', type: 'textarea', rows: 2 },
        { ...question('Reflection questions'), key: 'reflection.questions' },
      ],
    },
  ];
}

function lessonTabs(steps: StepLabel[], stageOpts: Opt[]): EditorTab[] {
  const lbl = (k: StepLabel['key'], fb: string) => steps.find((s) => s.key === k)?.label ?? fb;
  return [
    {
      id: 'overview', label: 'Overview', fields: [
        { key: 'title', label: 'Title', type: 'text', required: true },
        { key: 'shortTitle', label: 'Short title', type: 'text' },
        { key: 'stageId', label: 'Stage', type: 'select', options: stageOpts, required: true },
        { key: 'portalMinutes', label: 'Portal minutes', type: 'number', min: 1 },
        { key: 'subtitle', label: 'Subtitle', type: 'textarea', rows: 2 },
        { key: 'intro', label: 'Intro', type: 'textarea', rows: 2 },
        { key: 'about', label: 'About this lesson', type: 'textarea', rows: 3 },
        { key: 'heroQuote', label: 'Hero quote', type: 'text' },
        { key: 'sideQuote', label: 'Side quote', type: 'text' },
        { key: 'portalBlurb', label: 'Portal card blurb', type: 'textarea', rows: 2 },
        { key: 'image', label: 'Image', type: 'image' },
      ],
    },
    {
      id: 'learn', label: `1 · ${lbl('learn', 'Learn')}`, fields: [
        { key: 'videoUrl', label: 'Video URL', type: 'url', placeholder: 'https://youtube.com/watch?v=… or .mp4', full: true, help: 'YouTube, Vimeo or a direct video file. Leave empty until the video is ready.' },
        { key: 'videoTitle', label: 'Video title', type: 'text' },
        { key: 'videoDuration', label: 'Video duration', type: 'text', placeholder: '5:12' },
        { key: 'durationLabel', label: 'Duration label', type: 'text', placeholder: '5 min video' },
        { key: 'videoOverlay', label: 'Handwritten overlay', type: 'text' },
        { key: 'videoCaption', label: 'Caption', type: 'text', full: true },
        { key: 'learnLabel', label: '"You’ll learn" heading', type: 'text', full: true },
        { key: 'learn', label: 'You’ll learn', type: 'strings' },
        titledItems('learnCards', 'Learn cards'),
        { key: 'takeawaysLabel', label: 'Takeaways heading', type: 'text', full: true },
        titledItems('takeaways', 'Key takeaways'),
      ],
    },
    {
      id: 'reflect', label: `2 · ${lbl('reflect', 'Reflect')}`, fields: [
        { key: 'reflectionTitle', label: 'Reflection title', type: 'text' },
        { key: 'reflectionReminder', label: 'Reminder', type: 'text' },
        { key: 'reflectionIntro', label: 'Intro', type: 'textarea', rows: 2 },
        { ...question('Reflection questions'), key: 'reflections' },
      ],
    },
    {
      id: 'apply', label: `3 · ${lbl('apply', 'Apply')}`, fields: [
        { key: 'tool.kind', label: 'Tool type', type: 'readonly', format: (v) => TOOL_KINDS[v] ?? v, full: true },
        { key: 'tool.title', label: 'Tool title', type: 'text', required: true },
        { key: 'tool.subtitle', label: 'Subtitle', type: 'text' },
        { key: 'tool.badge', label: 'Badge', type: 'text', placeholder: 'PRACTICAL TOOL' },
        { key: 'tool.saveLabel', label: 'Save button label', type: 'text' },
        { key: 'tool.description', label: 'Description', type: 'textarea', rows: 2 },
        { key: 'tool.fields', label: 'Tool fields', type: 'fields', toolExtras: true },
        {
          key: 'tool.worksheet', label: 'Printable worksheet', type: 'group', nullable: true, blank: () => ({ title: '', intro: '', fields: [] }),
          fields: [{ key: 'title', label: 'Worksheet title', type: 'text' }, { key: 'intro', label: 'Intro', type: 'textarea', rows: 2 }, { key: 'fields', label: 'Worksheet fields', type: 'fields' }],
        },
        { key: 'tool.worksheetUrl', label: 'Worksheet PDF', type: 'file', accept: 'application/pdf', full: true, help: 'Upload a PDF or paste a link — offered as a download.' },
        { key: 'tool.config', label: 'Tool configuration', type: 'shape', help: 'Extra settings used by this tool (lists of values, step text, limits…).' },
        {
          key: 'tool.confirmation', label: 'Confirmation message', type: 'group', nullable: true, blank: () => ({ title: '', body: '', cta: '' }),
          fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'cta', label: 'Button', type: 'text' }, { key: 'body', label: 'Body', type: 'textarea', rows: 2 }],
        },
      ],
    },
    {
      id: 'next', label: `4 · ${lbl('next', 'Next Step')}`, fields: [
        { key: 'nextStep.prompt', label: 'Prompt', type: 'text' },
        { key: 'nextStep.placeholder', label: 'Placeholder', type: 'text' },
        { key: 'nextStep.helper', label: 'Helper', type: 'textarea', rows: 2 },
        { key: 'nextStep.shift', label: 'Your SHIFT text', type: 'textarea', rows: 2 },
        { key: 'nextStep.remember', label: 'Remember', type: 'strings' },
        { key: 'nextStep.checklist', label: 'Checklist', type: 'strings' },
        { key: 'nextStep.image', label: 'Image', type: 'image' },
        { key: 'nextStep.imageQuote', label: 'Image quote', type: 'text', full: true },
        titledItems('reminders', 'Reminders'),
        titledItems('celebrate', 'Celebrate'),
        { key: 'completeLabel', label: 'Complete button label', type: 'text' },
      ],
    },
  ];
}

function StepLabels() {
  return (
    <SingletonForm
      col="settings"
      saveLabel="Save step labels"
      fields={[{
        key: 'journeySteps', label: 'Lesson steps', type: 'custom',
        render: ({ value, onChange }) => (
          <div className="adm-steplabels">
            {(value as StepLabel[]).map((s, i) => (
              <div key={s.key} className="adm-card stack gap-8" style={{ padding: 14 }}>
                <span className="label-caps muted">Step {i + 1}</span>
                <TextInput label="Label" value={s.label} onChange={(v) => onChange((value as StepLabel[]).map((x, j) => (j === i ? { ...x, label: v } : x)))} />
                <TextInput label="Sub-label" value={s.sub} onChange={(v) => onChange((value as StepLabel[]).map((x, j) => (j === i ? { ...x, sub: v } : x)))} />
              </div>
            ))}
          </div>
        ),
      }]}
    />
  );
}

/** Admin › Journey Builder — stages → lessons (Learn / Reflect / Apply / Next Step) + checkpoints. */
export default function JourneyBuilder() {
  const stagesQ = useList('stages');
  const lessonsQ = useList('lessons');
  const settings = useSettings();
  const stageCrud = useCrud('stages');
  const lessonCrud = useCrud('lessons');
  const qc = useQueryClient();
  const toast = useToast();
  const stages = useMemo(() => stagesQ.data ?? [], [stagesQ.data]);
  const lessons = useMemo(() => lessonsQ.data ?? [], [lessonsQ.data]);
  const [sel, setSel] = useState<Sel | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{ kind: 'stage' | 'lesson'; id: string; stageId?: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const lessonsOf = (stageId: string) => lessons.filter((l) => l.stageId === stageId).sort((a, b) => a.order - b.order || a.sort - b.sort);
  const current = sel ?? (stages[0] ? { kind: 'stage' as const, id: stages[0].id } : null);
  const isOpen = (id: string) => !closed.has(id) && (open.has(id) || (current?.kind === 'stage' && current.id === id) || (current && 'id' in current && current.kind === 'lesson' && lessons.find((l) => l.id === current.id)?.stageId === id) || (current?.kind === 'new-lesson' && current.stageId === id));
  const toggleOpen = (id: string) => {
    const was = !!isOpen(id);
    setOpen((s) => { const n = new Set(s); if (was) n.delete(id); else n.add(id); return n; });
    setClosed((s) => { const n = new Set(s); if (was) n.add(id); else n.delete(id); return n; });
  };

  const reorderStages = async (ids: string[]) => {
    try { await stageCrud.reorder.mutateAsync(ids); toast('Stage order saved'); } catch (e) { toast(errMsg(e), true); }
  };
  const reorderLessons = async (stageId: string, ids: string[]) => {
    try {
      await Promise.all(ids.map((id, i) => {
        const l = lessons.find((x) => x.id === id);
        return l && l.order !== i + 1 ? lessonCrud.update.mutateAsync({ id, patch: { order: i + 1 } }) : null;
      }));
      const withNew = lessons.map((l) => (l.stageId === stageId ? { ...l, order: ids.indexOf(l.id) + 1 } : l));
      await lessonCrud.reorder.mutateAsync(orderedLessons(withNew, stages).map((l) => l.id));
      toast('Lesson order saved');
    } catch (e) { toast(errMsg(e), true); }
  };
  const toggleActive = async (kind: 'stage' | 'lesson', r: Rec<Stage> | Rec<Lesson>) => {
    try {
      await (kind === 'stage' ? stageCrud : lessonCrud).update.mutateAsync({ id: r.id, patch: { active: !r.active } });
      toast(r.active ? 'Hidden from the site' : 'Live on the site');
    } catch (e) { toast(errMsg(e), true); }
  };
  const duplicateLesson = async (l: Rec<Lesson>) => {
    try {
      const copy = await client.action('duplicate', { col: 'lessons', id: l.id });
      const max = Math.max(0, ...lessonsOf(l.stageId).map((x) => x.order));
      await lessonCrud.update.mutateAsync({ id: copy.id, patch: { order: max + 1 } });
      await qc.invalidateQueries({ queryKey: ['c'] });
      setSel({ kind: 'lesson', id: copy.id });
      toast('Lesson duplicated — the copy is inactive until you switch it on');
    } catch (e) { toast(errMsg(e), true); }
  };

  const stageOpts = stages.map((s) => ({ value: s.id, label: `${s.letter} · ${s.name}` }));
  const selStage = current?.kind === 'stage' ? stages.find((s) => s.id === current.id) : undefined;
  const selLesson = current?.kind === 'lesson' ? lessons.find((l) => l.id === current.id) : undefined;
  const steps = settings?.journeySteps ?? [];

  const dropProps = (kind: 'stage' | 'lesson', id: string, list: string[], commit: (ids: string[]) => void, stageId?: string) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => { e.stopPropagation(); setDrag({ kind, id, stageId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); },
    onDragOver: (e: DragEvent) => { if (drag && drag.kind === kind && (kind === 'stage' || drag.stageId === stageId)) { e.preventDefault(); e.stopPropagation(); setOver(id); } },
    onDrop: (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (drag && drag.kind === kind && drag.id !== id && list.includes(drag.id)) commit(move(list, list.indexOf(drag.id), list.indexOf(id)));
      setDrag(null); setOver(null);
    },
    onDragEnd: () => { setDrag(null); setOver(null); },
  });

  return (
    <AdminShell tab="cms" title="Journey Builder" sub={<p className="adm-band-sub">The five SHIFT stages, their 15 lessons and the session checkpoints — exactly what clients see in their journey.</p>}>
      <AdminSection title="Lesson steps" sub="The four steps every lesson follows." id="steps">
        <StepLabels />
      </AdminSection>

      <AdminSection title="Stages & lessons" sub="Drag to reorder (or use the arrows). Select a stage or lesson to edit it." id="tree">
        {stagesQ.isLoading || lessonsQ.isLoading ? (
          <Loading />
        ) : (
          <div className="adm-jb">
            <nav className="adm-tree" aria-label="Journey structure">
              <ul>
                {stages.map((s, si) => {
                  const ls = lessonsOf(s.id);
                  const expanded = !!isOpen(s.id);
                  const selected = current?.kind === 'stage' && current.id === s.id;
                  const ids = stages.map((x) => x.id);
                  return (
                    <li key={s.id} className="adm-tree-stage" {...dropProps('stage', s.id, ids, (n) => void reorderStages(n))}>
                      <div className={`adm-tree-row ${selected ? 'sel' : ''} ${over === s.id && drag?.kind === 'stage' ? 'is-over' : ''} ${s.active ? '' : 'is-inactive'}`}>
                        <button type="button" className="adm-mini" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${s.name}`} onClick={() => toggleOpen(s.id)}><Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} /></button>
                        <button type="button" className="adm-tree-btn" aria-current={selected ? 'true' : undefined} onClick={() => { setSel({ kind: 'stage', id: s.id }); setOpen((o) => new Set(o).add(s.id)); setClosed((c) => { const n = new Set(c); n.delete(s.id); return n; }); }}>
                          <span className="adm-tree-letter" style={{ background: COLOR_HEX[s.color] }}>{s.letter}</span>
                          <span className="adm-ellipsis">{s.name}</span>
                          <span className="faint body-sm">{ls.length}</span>
                        </button>
                        <MoveButtons label={s.name} first={si === 0} last={si === stages.length - 1} onUp={() => void reorderStages(move(ids, si, si - 1))} onDown={() => void reorderStages(move(ids, si, si + 1))} />
                        <Switch small hideLabel label={`${s.active ? 'Deactivate' : 'Activate'} ${s.name}`} checked={s.active} onChange={() => void toggleActive('stage', s)} />
                      </div>
                      {expanded && (
                        <ul className="adm-tree-lessons">
                          {ls.map((l, li) => {
                            const lsel = current?.kind === 'lesson' && current.id === l.id;
                            const lids = ls.map((x) => x.id);
                            return (
                              <li key={l.id} {...dropProps('lesson', l.id, lids, (n) => void reorderLessons(s.id, n), s.id)}>
                                <div className={`adm-tree-row ${lsel ? 'sel' : ''} ${over === l.id && drag?.kind === 'lesson' ? 'is-over' : ''} ${l.active ? '' : 'is-inactive'}`}>
                                  <button type="button" className="adm-tree-btn" aria-current={lsel ? 'true' : undefined} onClick={() => setSel({ kind: 'lesson', id: l.id })}>
                                    <span className="adm-tree-n">{l.order}</span>
                                    <span className="adm-ellipsis">{l.title}</span>
                                  </button>
                                  <MoveButtons label={l.title} first={li === 0} last={li === ls.length - 1} onUp={() => void reorderLessons(s.id, move(lids, li, li - 1))} onDown={() => void reorderLessons(s.id, move(lids, li, li + 1))} />
                                  <button type="button" className="adm-mini" aria-label={`Duplicate ${l.title}`} title="Duplicate" onClick={() => void duplicateLesson(l)}><Icon name="copy" size={14} /></button>
                                  <Switch small hideLabel label={`${l.active ? 'Deactivate' : 'Activate'} ${l.title}`} checked={l.active} onChange={() => void toggleActive('lesson', l)} />
                                </div>
                              </li>
                            );
                          })}
                          <li><button type="button" className="adm-tree-add" onClick={() => setSel({ kind: 'new-lesson', stageId: s.id })}><Icon name="plus" size={14} /> Add lesson to {s.name}</button></li>
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="adm-tree-add" style={{ marginLeft: 4 }} onClick={() => setSel({ kind: 'new-stage' })}><Icon name="plus" size={14} /> Add stage</button>
            </nav>

            <div className="stack gap-16" style={{ minWidth: 0 }}>
              {current?.kind === 'stage' && selStage && (
                <>
                  <div className="row gap-12" style={{ flexWrap: 'wrap' }}><span className="adm-tree-letter" style={{ width: 36, height: 36, fontSize: 18, background: COLOR_HEX[selStage.color] }}>{selStage.letter}</span><h3 className="h3">{selStage.name}</h3><TonePill tone="beige">Stage</TonePill></div>
                  <RecordForm key={selStage.id} col="stages" record={selStage as any} tabs={stageTabs()} />
                </>
              )}
              {current?.kind === 'lesson' && selLesson && (
                <>
                  <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
                    <h3 className="h3">{selLesson.title}</h3>
                    <TonePill tone="beige">Lesson {selLesson.order} · {stages.find((s) => s.id === selLesson.stageId)?.name}</TonePill>
                    <Button size="sm" variant="ghost" icon="copy" onClick={() => void duplicateLesson(selLesson)}>Duplicate</Button>
                  </div>
                  <RecordForm key={selLesson.id} col="lessons" record={selLesson as any} tabs={lessonTabs(steps, stageOpts)} />
                </>
              )}
              {current?.kind === 'new-stage' && (
                <>
                  <h3 className="h3">New stage</h3>
                  <RecordForm key="new-stage" col="stages" record={null} blank={blankStage as any} tabs={stageTabs()} onSaved={(r) => setSel({ kind: 'stage', id: r.id })} />
                </>
              )}
              {current?.kind === 'new-lesson' && (
                <>
                  <h3 className="h3">New lesson · {stages.find((s) => s.id === current.stageId)?.name}</h3>
                  <RecordForm
                    key={`new-lesson-${current.stageId}`}
                    col="lessons"
                    record={null}
                    blank={() => blankLesson(current.stageId, Math.max(0, ...lessonsOf(current.stageId).map((l) => l.order)) + 1) as any}
                    tabs={lessonTabs(steps, stageOpts)}
                    onSaved={(r) => setSel({ kind: 'lesson', id: r.id })}
                  />
                </>
              )}
              {!current && <p className="body-sm muted">Add your first stage to begin.</p>}
            </div>
          </div>
        )}
      </AdminSection>

      <CrudTable
        col="checkpoints"
        title="Session checkpoints"
        description="Cards shown between stages in the client portal (SHIFT notes, Wheel re-rates, intention markers)."
        blank={() => ({ afterStageId: stages[0]?.id ?? '', sessionNumber: 1, kind: 'note', title: '', description: '', ctaLabel: '', icon: 'star', color: 'blush' })}
        fields={[
          { key: 'title', label: 'Title', type: 'text', required: true, full: true },
          { key: 'afterStageId', label: 'Shown after stage', type: 'select', options: stageOpts, required: true },
          { key: 'sessionNumber', label: 'Session number', type: 'number', min: 1 },
          { key: 'kind', label: 'Type', type: 'select', required: true, options: [{ value: 'note', label: 'SHIFT note' }, { value: 'wheel', label: 'Wheel re-rate' }, { value: 'marker', label: 'Intention marker' }] },
          { key: 'ctaLabel', label: 'Button label', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
          { key: 'icon', label: 'Icon', type: 'icon' },
          { key: 'color', label: 'Colour', type: 'color' },
        ]}
        addLabel="Add checkpoint"
        columns={[
          { label: 'Checkpoint', render: (c) => <strong style={{ fontWeight: 500 }}>{c.title}</strong> },
          { label: 'After stage', render: (c) => stages.find((s) => s.id === c.afterStageId)?.name ?? c.afterStageId },
          { label: 'Session', render: (c) => c.sessionNumber },
          { label: 'Type', render: (c) => <TonePill tone={c.color}>{c.kind}</TonePill> },
        ]}
      />
    </AdminShell>
  );
}
