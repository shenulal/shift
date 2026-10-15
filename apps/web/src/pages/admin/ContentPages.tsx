import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Page, Rec } from '@shift/core';
import { useList } from '@/data';
import { Icon } from '@/ui/Icon';
import { AdminShell } from './components/AdminShell';
import { CrudTable } from './components/CrudTable';
import { AdminSection, TonePill } from './components/controls';
import { RecordEditor, SingletonForm } from './components/RecordEditor';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ROUTES: Record<string, string> = {
  global: '/', home: '/', method: '/method', about: '/about', path: '/path', tools: '/tools', journey: '/journey', coaching: '/coaching', enquiry: '/enquiry',
  discovery: '/discovery-call', enrolment: '/enrol', onboarding: '/onboarding', process: '/process', complete: '/complete', attract: '/', brochure: '/brochure', discover: '/discover',
};
const routeOf = (slug: string) => ROUTES[slug] ?? `/${slug}`;

const VarsNote = () => (
  <div className="adm-note">
    <Icon name="info" size={16} />
    <span>Line breaks are kept on the site. You can use <code>{'{toolkit_price}'}</code>, <code>{'{duration}'}</code>, <code>{'{platform}'}</code>, <code>{'{validity}'}</code>, <code>{'{reschedule}'}</code>, <code>{'{session_length}'}</code> and <code>{'{coach}'}</code> — they're filled from Settings and Toolkits. Prices, packages, toolkits and stages are edited in their own sections.</span>
  </div>
);

/** Admin › Content Pages — page copy (shape editor), FAQs and the discovery-call settings. */
export default function ContentPages() {
  const [params, setParams] = useSearchParams();
  const pages = useList('pages').data ?? [];
  const [editing, setEditing] = useState<{ rec: Rec<Page> | null; n: number } | null>(null);
  const wanted = params.get('page');
  useEffect(() => {
    if (!wanted || !pages.length) return;
    const p = pages.find((x) => x.slug === wanted);
    if (p) setEditing({ rec: p, n: Date.now() });
    setParams({}, { replace: true });
  }, [wanted, pages, setParams]);

  return (
    <AdminShell tab="cms" title="Content Pages" sub={<p className="adm-band-sub">Every headline, paragraph and list on the marketing pages.</p>}>
      <CrudTable
        col="pages"
        title="Pages"
        blank={() => ({ slug: '', title: '', navLabel: '', content: { title: '', body: '' } })}
        onEdit={(r) => setEditing({ rec: r, n: Date.now() })}
        addLabel="Add page"
        searchText={(p) => `${p.title} ${p.slug}`}
        columns={[
          { label: 'Page', render: (p) => <strong style={{ fontWeight: 500 }}>{p.title}</strong> },
          { label: 'Slug', render: (p) => <code className="body-sm">{p.slug}</code> },
          { label: 'Nav label', render: (p) => p.navLabel || <span className="faint">—</span> },
          { label: 'View', render: (p) => <Link className="adm-open" to={routeOf(p.slug)} target="_blank" rel="noreferrer">View page ↗</Link> },
        ]}
      />
      {editing && (
        <RecordEditor
          key={editing.n}
          open
          wide
          onClose={() => setEditing(null)}
          col="pages"
          record={editing.rec as any}
          blank={() => ({ slug: '', title: '', navLabel: '', content: { title: '', subtitle: '', body: '' } })}
          title={editing.rec ? `Edit page · ${editing.rec.title}` : 'New page'}
          sub={editing.rec ? <Link to={routeOf(editing.rec.slug)} target="_blank" rel="noreferrer">View page ↗</Link> : undefined}
          top={<VarsNote />}
          fields={[
            { key: 'title', label: 'Page name', type: 'text', required: true },
            { key: 'slug', label: 'Slug', type: 'text', required: true, help: 'The site looks pages up by slug — change with care.' },
            { key: 'navLabel', label: 'Nav label', type: 'text' },
            { key: 'content', label: 'Page content', type: 'shape' },
          ]}
        />
      )}

      <CrudTable
        col="faqs"
        title="FAQs"
        description="Shown on the discovery call page (and anywhere a general FAQ is used)."
        blank={() => ({ context: 'discovery', question: '', answer: '', draft: false })}
        fields={[
          { key: 'question', label: 'Question', type: 'text', required: true, full: true },
          { key: 'context', label: 'Where it shows', type: 'select', options: [{ value: 'discovery', label: 'Discovery call page' }, { value: 'general', label: 'General' }] },
          { key: 'draft', label: 'Draft copy', type: 'boolean' },
          { key: 'answer', label: 'Answer', type: 'textarea', rows: 4, required: true },
        ]}
        addLabel="Add FAQ"
        searchText={(f) => `${f.question} ${f.answer}`}
        columns={[
          { label: 'Question', render: (f) => <span>{f.question} {f.draft && <span className="draft-tag">DRAFT</span>}</span> },
          { label: 'Shows on', render: (f) => <TonePill tone={f.context === 'discovery' ? 'sage' : 'beige'}>{f.context}</TonePill> },
        ]}
      />

      <AdminSection title="Discovery call" sub="Duration, platform and booking link used on the discovery call page and in emails." id="discovery">
        <SingletonForm
          col="settings"
          saveLabel="Save discovery call"
          fields={[
            { key: 'discoveryCall.title', label: 'Title', type: 'text' },
            { key: 'discoveryCall.durationMin', label: 'Duration (minutes)', type: 'number', min: 5 },
            { key: 'discoveryCall.platformText', label: 'Platform', type: 'text', placeholder: 'Via Zoom or Microsoft Teams' },
            { key: 'discoveryCall.bookingUrl', label: 'Booking link', type: 'text', placeholder: 'https://calendly.com/…' },
          ]}
        />
      </AdminSection>
    </AdminShell>
  );
}
