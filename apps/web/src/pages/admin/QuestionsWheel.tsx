import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useList } from '@/data';
import { WheelOfLife } from '@/ui/charts';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection, TonePill } from './components/controls';
import { SingletonForm } from './components/RecordEditor';
import { COLOR_HEX } from './components/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

const PATHS = [
  { value: 'discover', label: 'Discover SHIFT (free)' },
  { value: 'tools', label: 'Guided SHIFT Tools' },
  { value: 'journey', label: 'The SHIFT Journey' },
  { value: 'coaching', label: '1:1 Coaching' },
];

function WheelPreview() {
  const areas = (useList('wheelAreas').data ?? []).filter((a) => a.active);
  const [scores, setScores] = useState<Record<string, number>>({});
  const value = Object.fromEntries(areas.map((a, i) => [a.id, scores[a.id] ?? [7, 5, 6, 4, 8, 5, 6, 7][i % 8]]));
  return (
    <div className="adm-card stack gap-8">
      <div className="label-caps muted">Live preview — active areas</div>
      <WheelOfLife areas={areas} value={value} onChange={setScores} size={300} />
    </div>
  );
}

/** Admin › Questions & Wheel — Wheel of Life, Discover SHIFT free tool, the six questions and the quiz. */
export default function QuestionsWheel() {
  return (
    <AdminShell tab="cms" title="Questions & Wheel" sub={<p className="adm-band-sub">The Wheel of Life areas and scale, the free Discover SHIFT tool and the Find Your SHIFT quiz.</p>}>
      <div className="adm-note"><Icon name="info" size={16} /><span>Lesson reflection questions live with each lesson — edit them in the <Link to="/admin/cms/journey">Journey Builder</Link>.</span></div>

      <div className="adm-split-wide">
        <CrudTable
          col="wheelAreas"
          title="Wheel of Life areas"
          description="Rename, add, remove or reorder — used by the free tool, intake form, lessons and client progress."
          noSearch
          blank={() => ({ name: '', short: '', icon: 'leaf', color: 'sage' })}
          fields={[
            { key: 'name', label: 'Area name', type: 'text', required: true },
            { key: 'short', label: 'Short name', type: 'text', required: true },
            { key: 'icon', label: 'Icon', type: 'icon' },
            { key: 'color', label: 'Colour', type: 'color' },
          ]}
          addLabel="Add area"
          columns={[
            { label: 'Area', render: (a) => <span className="row gap-8"><span className="icon-circle sm" style={{ background: COLOR_HEX[a.color] }}><Icon name={a.icon} size={15} /></span>{a.name}</span> },
            { label: 'Short', render: (a) => a.short },
          ]}
        />
        <WheelPreview />
      </div>

      <AdminSection title="Wheel scale" sub="Used everywhere a client rates their Wheel." id="scale">
        <SingletonForm
          col="settings"
          saveLabel="Save scale"
          fields={[
            { key: 'wheel.min', label: 'Lowest score', type: 'number', min: 0 },
            { key: 'wheel.max', label: 'Highest score', type: 'number', min: 2, max: 20 },
            { key: 'wheel.lowLabel', label: 'Low label', type: 'text', placeholder: 'not satisfied' },
            { key: 'wheel.highLabel', label: 'High label', type: 'text', placeholder: 'very satisfied' },
          ]}
        />
      </AdminSection>

      <CrudTable
        col="freeQuestions"
        title="The six powerful questions"
        description="The questions in the free Discover SHIFT flow."
        blank={() => ({ number: 7, label: '', theme: '', question: '', helper: '', caption: '', captionIcon: 'bulb', summaryLabel: '', image: 'notebook', photoNote: '', fieldType: 'textarea', options: [], color: 'sage' })}
        wide
        tabs={[
          {
            id: 'q', label: 'Question', fields: [
              { key: 'question', label: 'Question', type: 'textarea', rows: 2, required: true },
              { key: 'number', label: 'Number', type: 'number', min: 1 },
              { key: 'label', label: 'Label', type: 'text', placeholder: 'Question One' },
              { key: 'theme', label: 'Theme', type: 'text', placeholder: 'Awareness' },
              { key: 'summaryLabel', label: 'Summary label', type: 'text', placeholder: 'What matters to me' },
              { key: 'helper', label: 'Helper text', type: 'textarea', rows: 2 },
              { key: 'caption', label: 'Caption', type: 'text' },
              { key: 'captionIcon', label: 'Caption icon', type: 'icon' },
              { key: 'fieldType', label: 'Answer type', type: 'select', options: [{ value: 'textarea', label: 'Free text' }, { value: 'checkboxes', label: 'Checkboxes' }], required: true },
              { key: 'options', label: 'Options', type: 'strings', showIf: (d) => d.fieldType === 'checkboxes' },
            ],
          },
          {
            id: 'look', label: 'Look', fields: [
              { key: 'image', label: 'Photo', type: 'image' },
              { key: 'photoNote', label: 'Words on the photo', type: 'text', full: true },
              { key: 'color', label: 'Colour', type: 'color' },
            ],
          },
        ]}
        addLabel="Add question"
        searchText={(q) => `${q.question} ${q.theme}`}
        columns={[
          { label: '#', render: (q) => <span className="serif">{q.number}</span> },
          { label: 'Question', render: (q) => <span className="body-sm">{q.question}</span> },
          { label: 'Theme', render: (q) => <TonePill tone={q.color}>{q.theme}</TonePill> },
          { label: 'Answer', render: (q) => (q.fieldType === 'checkboxes' ? `${q.options.length} options` : 'Free text') },
        ]}
      />

      <AdminSection title="Discover SHIFT — free tool texts" sub="Landing, intro, wheel, results, email capture and what's next. Line breaks are kept." id="freetool">
        <SingletonForm col="freeTool" saveLabel="Save free tool texts" fields={[{ key: 'landing', label: 'Landing page', type: 'shape' }, { key: 'intro', label: 'Intro', type: 'shape' }, { key: 'wheel', label: 'Wheel step', type: 'shape' }, { key: 'results', label: 'Results', type: 'shape' }, { key: 'emailCapture', label: 'Email capture', type: 'shape' }, { key: 'next', label: "What's next", type: 'shape' }]} />
      </AdminSection>

      <CrudTable
        col="quiz"
        title="Find Your SHIFT quiz"
        description={<>Each answer points to a path. The result copy for each path is edited on the <Link to="/admin/cms/content?page=path">Your Path page</Link>.</>}
        blank={() => ({ question: '', options: PATHS.map((p) => ({ label: '', path: p.value })) })}
        fields={[
          { key: 'question', label: 'Question', type: 'text', required: true, full: true },
          {
            key: 'options', label: 'Answers', type: 'objects', addLabel: 'Add answer',
            blank: () => ({ label: '', path: 'discover' }),
            itemLabel: (o, i) => `${i + 1}. ${o.label || 'New answer'} → ${PATHS.find((p) => p.value === o.path)?.label ?? o.path}`,
            fields: [{ key: 'label', label: 'Answer', type: 'text', required: true }, { key: 'path', label: 'Leads to', type: 'select', options: PATHS }],
          },
        ]}
        addLabel="Add quiz question"
        columns={[
          { label: 'Question', render: (q) => q.question },
          { label: 'Answers', render: (q) => q.options.length },
        ]}
      />
    </AdminShell>
  );
}
