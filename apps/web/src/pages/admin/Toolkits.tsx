import type { Toolkit } from '@shift/core';
import { useList } from '@/data';
import { Loading, Price } from '@/ui/kit';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection } from './components/controls';
import { RecordForm, type EditorTab } from './components/RecordEditor';
import { COLOR_HEX, uid } from './components/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

const blankToolkit = (): Toolkit => ({ name: '', tagline: '', shortTagline: '', description: '', color: 'sage', icon: 'leaf', image: 'stones', imageNote: '', price: 79, ctaLabel: '', tools: [] });

const tabs: EditorTab[] = [
  {
    id: 'basics', label: 'Toolkit', fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Calm' },
      { key: 'price', label: 'Price', type: 'price', nullable: false, help: 'Shown as "{price} each" on the Tools page.' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'shortTagline', label: 'Short tagline (cards)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'ctaLabel', label: 'Button label', type: 'text', placeholder: 'Get the Calm Toolkit' },
      { key: 'icon', label: 'Icon', type: 'icon' },
      { key: 'color', label: 'Colour', type: 'color' },
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'imageNote', label: 'Words on the image', type: 'text', placeholder: 'Pause · Breathe · Reset' },
    ],
  },
  {
    id: 'tools', label: 'Tools inside', fields: [
      {
        key: 'tools', label: 'Tools', type: 'objects', addLabel: 'Add tool',
        help: 'Reorder, duplicate or switch individual tools off. Inactive tools are hidden from buyers.',
        blank: () => ({ id: uid('tool'), name: '', description: '', icon: 'leaf', content: '', active: true }),
        itemLabel: (t, i) => `${i + 1}. ${t.name || 'New tool'}`,
        fields: [
          { key: 'name', label: 'Tool name', type: 'text', required: true },
          { key: 'description', label: 'One-line description', type: 'text' },
          { key: 'icon', label: 'Icon', type: 'icon' },
          { key: 'active', label: 'Active', type: 'boolean' },
          { key: 'content', label: 'Content (what buyers see — line breaks are kept)', type: 'textarea', rows: 8 },
        ],
      },
    ],
  },
];

function BundleSettings() {
  const q = useList('products');
  const bundle = q.data?.find((p) => p.kind === 'bundle');
  if (q.isLoading) return <Loading h={160} />;
  if (!bundle) return <p className="body-sm muted">No bundle product exists — add one under Plans &amp; Pricing › Self-paced products.</p>;
  return (
    <RecordForm
      key={bundle.id}
      col="products"
      record={bundle as any}
      saveLabel="Save bundle"
      fields={[
        { key: 'name', label: 'Bundle name', type: 'text', required: true, full: true },
        { key: 'price', label: 'Bundle price', type: 'price' },
        { key: 'tag', label: 'Tag', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'bullets', label: 'Bullets', type: 'strings' },
        { key: 'ctaLabel', label: 'Button label', type: 'text' },
      ]}
    />
  );
}

/** Admin › Toolkits — the Guided SHIFT toolkits, their tools and the bundle. */
export default function Toolkits() {
  return (
    <AdminShell tab="cms" title="Toolkits" sub={<p className="adm-band-sub">Inactive toolkits disappear from the Tools page; people who bought them keep access.</p>}>
      <CrudTable
        col="toolkits"
        title="Guided SHIFT toolkits"
        blank={blankToolkit as any}
        tabs={tabs}
        wide
        addLabel="Add toolkit"
        searchText={(t) => `${t.name} ${t.tagline}`}
        columns={[
          { label: 'Toolkit', render: (t) => <span className="row gap-12"><span className="icon-circle sm" style={{ background: COLOR_HEX[t.color] }}><Icon name={t.icon} size={16} /></span><strong style={{ fontWeight: 500 }}>{t.name}</strong></span> },
          { label: 'Tagline', render: (t) => <span className="body-sm">{t.tagline}</span> },
          { label: 'Tools', render: (t) => `${t.tools.filter((x) => x.active).length} of ${t.tools.length} active` },
          { label: 'Price', render: (t) => <Price amount={t.price} /> },
        ]}
      />
      <AdminSection title="Bundle — all toolkits" sub="The Complete Guided SHIFT Toolkit Collection offer shown on the Tools page." id="bundle">
        <BundleSettings />
      </AdminSection>
    </AdminShell>
  );
}
