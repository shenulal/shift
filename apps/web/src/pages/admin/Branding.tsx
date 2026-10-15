import type { CSSProperties } from 'react';
import type { Branding as BrandingT } from '@shift/core';
import { Script } from '@/ui/kit';
import { Art } from '@/ui/Art';
import { AdminShell } from './components/AdminShell';
import { ImagePicker, UploadButton } from './components/controls';
import { SingletonForm, type FieldSpec } from './components/RecordEditor';
import { humanise } from './components/util';

/* eslint-disable @typescript-eslint/no-explicit-any */

const FONTS = {
  heading: ['Playfair Display', 'Cormorant Garamond', 'Lora', 'Libre Baskerville', 'DM Serif Display', 'EB Garamond', 'Merriweather', 'Marcellus'],
  body: ['Montserrat', 'Lato', 'Open Sans', 'Nunito Sans', 'Raleway', 'Work Sans', 'Inter', 'Poppins', 'Jost'],
  script: ['Allura', 'Great Vibes', 'Parisienne', 'Dancing Script', 'Sacramento', 'Pinyon Script', 'Alex Brush'],
};
const opts = (l: string[]) => l.map((f) => ({ value: f, label: f }));

const COLOR_HELP: Record<string, string> = {
  sage: 'Soft green accents', taupe: 'Warm accents', beige: 'Cards & panels', blush: 'Soft pink accents', white: 'Page white', charcoal: 'Body text',
  deep: 'Buttons, header band', ground: 'Page background', peach: 'Peach accents', blue: 'Blue accents', rose: 'Rose accents',
};
const HEX = /^#[0-9a-f]{6}$/i;

function ColorsEditor({ value, onChange }: { value: BrandingT['colors']; onChange: (v: BrandingT['colors']) => void }) {
  return (
    <fieldset className="adm-fieldset">
      <legend>Colour palette</legend>
      <div className="adm-colors">
        {(Object.keys(value) as (keyof BrandingT['colors'])[]).map((k) => (
          <div key={k} className="adm-color">
            <input type="color" aria-label={`${k} colour picker`} value={HEX.test(value[k]) ? value[k] : '#000000'} onChange={(e) => onChange({ ...value, [k]: e.target.value.toUpperCase() })} />
            <div className="stack gap-4" style={{ minWidth: 0, flex: 1 }}>
              <label className="field-label" htmlFor={`hex-${k}`} style={{ textTransform: 'capitalize' }}>{k} <span className="faint body-sm" style={{ fontWeight: 400, textTransform: 'none' }}>· {COLOR_HELP[k]}</span></label>
              <input id={`hex-${k}`} className="input" value={value[k]} aria-invalid={!HEX.test(value[k])} onChange={(e) => onChange({ ...value, [k]: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function LogoEditor({ draft, setDraft }: { draft: any; setDraft: (d: any) => void }) {
  return (
    <fieldset className="adm-fieldset">
      <legend>Logo</legend>
      <div className="row gap-16" style={{ flexWrap: 'wrap' }}>
        <div className="adm-card" style={{ padding: 16, minWidth: 160, display: 'flex', justifyContent: 'center' }}>
          {draft.logoUrl ? <img src={draft.logoUrl} alt="Current logo" style={{ maxHeight: 56 }} /> : <span className="serif" style={{ fontSize: 26, letterSpacing: '0.2em' }}>{draft.wordmark}</span>}
        </div>
        <div className="stack gap-8">
          <p className="body-sm muted">{draft.logoUrl ? 'Your uploaded logo replaces the wordmark everywhere.' : 'No logo uploaded — the leaf wordmark below is used.'}</p>
          <div className="wrap-row gap-8">
            <UploadButton label={draft.logoUrl ? 'Replace logo' : 'Upload logo'} onUploaded={(url) => setDraft({ ...draft, logoUrl: url })} />
            {draft.logoUrl && <button type="button" className="link body-sm" onClick={() => setDraft({ ...draft, logoUrl: null })}>Remove logo</button>}
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function ImageSlots({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <fieldset className="adm-fieldset">
      <legend>Page images</legend>
      <p className="body-sm muted" style={{ marginBottom: 12 }}>Choose a scene or upload a photo for each slot. Uploaded photos replace the placeholder art site-wide.</p>
      <div className="adm-slots">
        {Object.keys(value).map((k) => <ImagePicker key={k} label={humanise(k)} value={value[k]} onChange={(v) => onChange({ ...value, [k]: v })} allowEmpty={false} />)}
      </div>
    </fieldset>
  );
}

function BrandPreview({ d }: { d: any }) {
  const c = d.colors ?? {};
  const style = {
    '--deep': c.deep, '--sage': c.sage, '--taupe': c.taupe, '--beige': c.beige, '--blush': c.blush, '--white': c.white, '--charcoal': c.charcoal, '--ground': c.ground,
    '--font-heading': `'${d.fonts?.heading}', Georgia, serif`, '--font-body': `'${d.fonts?.body}', Arial, sans-serif`, '--font-script': `'${d.fonts?.script}', cursive`,
    background: c.ground, fontFamily: 'var(--font-body)', color: c.charcoal,
  } as CSSProperties;
  return (
    <div className="adm-brand-preview" style={style}>
      {d.logoUrl ? <img src={d.logoUrl} alt="Logo preview" style={{ maxHeight: 40, alignSelf: 'flex-start' }} /> : (
        <div className="stack" style={{ fontFamily: 'var(--font-heading)' }}><span style={{ fontSize: 26, letterSpacing: '0.3em', color: c.deep }}>{d.wordmark}</span><span style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.42em' }}>{d.subMark}</span></div>
      )}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: c.deep }}>{d.taglines?.primary}</h3>
      <div className="wrap-row gap-8">
        <span className="btn btn-primary btn-sm" style={{ background: c.deep, color: c.white }}>Primary button →</span>
        <span className="btn btn-sm" style={{ background: c.taupe, color: '#fff' }}>Taupe</span>
        <span className="btn btn-sm" style={{ background: c.sage, color: '#fff' }}>Sage</span>
      </div>
      <div style={{ background: c.beige, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>{d.taglines?.trio}</div>
        <p style={{ fontSize: 14, marginTop: 6 }}>{d.taglines?.secondary}</p>
      </div>
      <div style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Art src={d.images?.hero ?? 'sunset-sea'} className="ratio-16x9" quote={d.taglines?.small} quoteSize={28} />
      </div>
      <Script size={30} style={{ fontFamily: 'var(--font-script)', color: c.deep }}>{d.taglines?.tertiary}</Script>
      <div className="wrap-row gap-8">
        {Object.entries(c).map(([k, v]) => <span key={k} title={k} style={{ width: 26, height: 26, borderRadius: 99, background: v as string, border: '1px solid rgba(0,0,0,.1)' }} />)}
      </div>
    </div>
  );
}

const fields: FieldSpec[] = [
  { key: 'logoUrl', label: 'Logo', type: 'custom', render: ({ draft, setDraft }) => <LogoEditor draft={draft} setDraft={setDraft} /> },
  { key: 'wordmark', label: 'Wordmark', type: 'text', required: true },
  { key: 'subMark', label: 'Sub-mark', type: 'text' },
  { key: 'colors', label: 'Colours', type: 'custom', render: ({ value, onChange }) => <ColorsEditor value={value} onChange={onChange} /> },
  { key: 'fonts.heading', label: 'Heading font', type: 'select', options: opts(FONTS.heading) },
  { key: 'fonts.body', label: 'Body font', type: 'select', options: opts(FONTS.body) },
  { key: 'fonts.script', label: 'Handwritten (script) font', type: 'select', options: opts(FONTS.script) },
  { key: 'taglines', label: 'Taglines', type: 'shape' },
  { key: 'images', label: 'Images', type: 'custom', render: ({ value, onChange }) => <ImageSlots value={value} onChange={onChange} /> },
];

/** Admin › Branding — logo, palette, fonts, taglines and image slots. Saving updates CSS variables site-wide. */
export default function Branding() {
  return (
    <AdminShell tab="cms" title="Branding" sub={<p className="adm-band-sub">Saved colours and fonts apply across the whole site instantly.</p>}>
      <SingletonForm col="branding" fields={fields} preview={(d) => <BrandPreview d={d} />} saveLabel="Save branding" />
    </AdminShell>
  );
}
