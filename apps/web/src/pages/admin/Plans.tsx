import { Link } from 'react-router-dom';
import type { Plan } from '@shift/core';
import { useList, useSettings } from '@/data';
import { Price } from '@/ui/kit';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { Dash, TonePill } from './components/controls';
import type { EditorTab, FieldSpec } from './components/RecordEditor';
import { PlanPill } from './components/shared';
import { Icon } from '@/ui/Icon';

/* eslint-disable @typescript-eslint/no-explicit-any */

const blankPlan = (): Plan => ({
  packageLabel: 'Package', name: '', subtitle: '', displayAlias: '', aliasTagline: '', description: '', brandCardCopy: '', brandCardCta: '',
  sessions: 5, sessionLengthMin: 60, durationLabel: '', supportLabel: '', price: null, badge: '', color: 'sage', image: 'sprout',
  coverage: {}, coverageNotes: {}, bonus: { title: '', description: '' }, leaveWith: [], features: [], scriptLine: '',
});

/** Per stage: tick the lessons this package covers, plus an optional short note. */
function CoverageEditor({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  const stages = useList('stages').data ?? [];
  const lessons = useList('lessons').data ?? [];
  const coverage: Record<string, string[]> = draft.coverage ?? {};
  const notes: Record<string, string> = draft.coverageNotes ?? {};
  return (
    <div className="stack gap-12">
      <p className="body-sm muted">Choose which lessons of each SHIFT stage this package includes. Shown on the Coaching page and in the client's portal map.</p>
      {stages.map((s) => {
        const ls = lessons.filter((l) => l.stageId === s.id).sort((a, b) => a.order - b.order);
        const sel = coverage[s.id] ?? [];
        return (
          <fieldset key={s.id} className="adm-fieldset">
            <legend><span className="adm-tree-letter" style={{ width: 22, height: 22, fontSize: 12, marginRight: 6 }}>{s.letter}</span>{s.name}</legend>
            <div className="checks-2">
              {ls.map((l) => (
                <label key={l.id} className="check">
                  <input
                    type="checkbox"
                    checked={sel.includes(l.id)}
                    onChange={() => {
                      const next = sel.includes(l.id) ? sel.filter((x) => x !== l.id) : ls.filter((x) => sel.includes(x.id) || x.id === l.id).map((x) => x.id);
                      setDraft({ ...draft, coverage: { ...coverage, [s.id]: next } });
                    }}
                  />
                  {l.title}{!l.active && <span className="faint body-sm"> (inactive)</span>}
                </label>
              ))}
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label className="field-label" htmlFor={`cn-${s.id}`}>Short note (optional — shown instead of the lesson list, e.g. for Foundation)</label>
              <input id={`cn-${s.id}`} className="input" value={notes[s.id] ?? ''} onChange={(e) => {
                const v = e.target.value;
                const n = { ...notes };
                if (v) n[s.id] = v; else delete n[s.id];
                setDraft({ ...draft, coverageNotes: n });
              }} />
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

const planTabs: EditorTab[] = [
  {
    id: 'basics', label: 'Basics', fields: [
      { key: 'name', label: 'Package name', type: 'text', required: true, placeholder: 'e.g. Momentum' },
      { key: 'packageLabel', label: 'Package label', type: 'text', placeholder: 'Package 2' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Build Your SHIFT' },
      { key: 'scriptLine', label: 'Handwritten line', type: 'text', placeholder: 'Go further.' },
      { key: 'displayAlias', label: 'Brand alias', type: 'text', placeholder: 'SHIFT Grow' },
      { key: 'aliasTagline', label: 'Alias tagline', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'brandCardCopy', label: 'Brand card copy', type: 'textarea', rows: 2 },
      { key: 'brandCardCta', label: 'Brand card call-to-action', type: 'text' },
    ],
  },
  {
    id: 'details', label: 'Sessions & price', fields: [
      { key: 'sessions', label: 'Number of sessions', type: 'number', required: true, min: 1 },
      { key: 'sessionLengthMin', label: 'Session length (minutes)', type: 'number', min: 15 },
      { key: 'durationLabel', label: 'Duration', type: 'text', placeholder: '3 months' },
      { key: 'supportLabel', label: 'Support level', type: 'text', placeholder: 'Dedicated support' },
      { key: 'price', label: 'Price', type: 'price' },
      { key: 'badge', label: 'Badge', type: 'text', placeholder: 'MOST POPULAR', help: 'Leave empty for no badge.' },
      { key: 'color', label: 'Colour', type: 'color' },
      { key: 'image', label: 'Header image', type: 'image' },
    ],
  },
  { id: 'coverage', label: 'Stage coverage', fields: [{ key: 'coverage', label: 'Coverage', type: 'custom', render: (p) => <CoverageEditor draft={p.draft} setDraft={p.setDraft} /> }] },
  {
    id: 'outcomes', label: 'Bonus & outcomes', fields: [
      { key: 'bonus.title', label: 'Bonus resource title', type: 'text' },
      { key: 'bonus.description', label: 'Bonus resource description', type: 'text' },
      { key: 'leaveWith', label: "You'll leave with…", type: 'strings' },
      { key: 'features', label: "What's included (features)", type: 'strings', multiline: true },
    ],
  },
];

const productFields: FieldSpec[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, full: true },
  { key: 'kind', label: 'Type', type: 'select', required: true, options: [{ value: 'free', label: 'Free (Discover SHIFT)' }, { value: 'bundle', label: 'Toolkit bundle' }, { value: 'journey', label: 'The SHIFT Journey' }] },
  { key: 'tag', label: 'Tag', type: 'text', placeholder: 'BEST VALUE' },
  { key: 'price', label: 'Price', type: 'price' },
  { key: 'note', label: 'Small note', type: 'text', placeholder: 'Lifetime access' },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'bullets', label: 'Bullets', type: 'strings' },
  { key: 'ctaLabel', label: 'Button label', type: 'text' },
  { key: 'href', label: 'Button link', type: 'text', placeholder: '/journey' },
];

/** Admin › Plans & Pricing — 1:1 packages and self-paced products. */
export default function Plans() {
  const s = useSettings();
  const currencyNote = (
    <span className="row gap-8"><Icon name="coins" size={15} /> Prices are shown in <strong>{s?.currency ?? 'AED'}</strong> — <Link to="/admin/cms/settings">change currency</Link></span>
  );
  return (
    <AdminShell tab="cms" title="Plans & Pricing" sub={<p className="adm-band-sub">Changes here update the Coaching, Enrolment and Brochure pages instantly.</p>}>
      <CrudTable
        col="plans"
        title="1:1 coaching packages"
        description={currencyNote}
        blank={blankPlan as any}
        tabs={planTabs}
        addLabel="Add package"
        searchText={(p) => `${p.name} ${p.displayAlias}`}
        columns={[
          { label: 'Package', render: (p) => <span className="stack"><strong style={{ fontWeight: 500 }}>{p.name}</strong><span className="body-sm muted">{p.packageLabel} · {p.subtitle}</span></span> },
          { label: 'Alias', render: (p) => p.displayAlias || <Dash /> },
          { label: 'Sessions', render: (p) => <PlanPill plan={p} /> },
          { label: 'Duration', render: (p) => p.durationLabel || <Dash /> },
          { label: 'Price', render: (p) => <Price amount={p.price} /> },
          { label: 'Badge', render: (p) => (p.badge ? <TonePill tone="deep">{p.badge}</TonePill> : <Dash />) },
        ]}
      />
      <CrudTable
        col="products"
        title="Self-paced products"
        description="Discover SHIFT (free), the toolkit bundle and The SHIFT Journey."
        blank={() => ({ kind: 'journey', name: '', tag: '', price: null, description: '', bullets: [], ctaLabel: '', href: '', note: '' })}
        fields={productFields}
        addLabel="Add product"
        columns={[
          { label: 'Product', render: (p) => <strong style={{ fontWeight: 500 }}>{p.name}</strong> },
          { label: 'Type', render: (p) => <TonePill tone={p.kind === 'free' ? 'sage' : p.kind === 'bundle' ? 'tan' : 'blush'}>{p.kind}</TonePill> },
          { label: 'Tag', render: (p) => p.tag || <Dash /> },
          { label: 'Price', render: (p) => <Price amount={p.price} /> },
          { label: 'Button', render: (p) => p.ctaLabel || <Dash /> },
        ]}
      />
    </AdminShell>
  );
}
