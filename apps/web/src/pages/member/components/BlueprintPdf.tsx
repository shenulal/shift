/**
 * The SHIFT Blueprint as a real 4-page A4 PDF (react-pdf). Imported lazily from the Blueprint page so the
 * PDF engine is code-split. Uses the built-in Helvetica / Times fonts (no remote fonts).
 */
import { Circle, Defs, Document, G, LinearGradient, Line, Page, Path, Polygon, Rect, Stop, StyleSheet, Svg, Text, View, pdf } from '@react-pdf/renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { fillTemplate } from '@shift/core';
import { Icon } from '@/ui/Icon';
import type { BlueprintData } from './blueprint';
import { VALUE_ICONS, workIcon } from './BlueprintPages';

const C = { ink: '#22281f', text: '#2f322e', muted: '#6b6e66', line: '#e4dcd1', box: '#f8f2ea', blush: '#f6ebe7', sage: '#eef1eb', sageStrong: '#6e7d69', deep: '#2e3b32', rose: '#d29b94', page: '#fffdf9' };
const TONES: Record<string, string> = { sage: '#e3e8df', taupe: '#efe6dd', beige: '#f2ebe2', blush: '#f6ebe7', peach: '#f8ece1', blue: '#e9eff4', rose: '#f6e4e1', tan: '#f3eadc', green: '#e5ece2', lavender: '#f1eff7', deep: '#e3e8df', charcoal: '#e6e6e1' };

/** Font families: the built-in PDF standard fonts. */
const BUILTIN = { sans: 'Helvetica', serif: 'Times-Roman', italic: 'Times-Italic' };
const F = BUILTIN;
const makeStyles = () => StyleSheet.create({
  page: { backgroundColor: C.page, paddingTop: 34, paddingBottom: 34, paddingHorizontal: 36, fontFamily: F.sans, fontSize: 9.5, color: C.text },
  logo: { fontFamily: F.serif, fontSize: 15, letterSpacing: 6, color: C.ink },
  title: { fontFamily: F.serif, fontSize: 26, color: C.ink, marginTop: 6 },
  subtitle: { fontSize: 10, color: C.muted, marginTop: 3 },
  h: { fontFamily: F.serif, fontSize: 13, color: C.ink, marginBottom: 6 },
  box: { backgroundColor: C.box, borderRadius: 8, padding: 10 },
  quote: { fontFamily: F.italic, fontSize: 14, color: C.ink, lineHeight: 1.35 },
  script: { fontFamily: F.italic, fontSize: 15, color: C.ink },
  small: { fontSize: 8.5, color: C.muted },
  bullet: { flexDirection: 'row', marginTop: 2 },
  row: { flexDirection: 'row' },
});
const st = makeStyles();

const iconCache = new Map<string, string[]>();
/** Path data of a brand line icon (re-uses the app's icon set). */
function iconPaths(name: string) {
  if (!iconCache.has(name)) {
    const svg = renderToStaticMarkup(<Icon name={name} />);
    iconCache.set(name, Array.from(svg.matchAll(/ d="([^"]+)"/g)).map((m) => m[1]));
  }
  return iconCache.get(name)!;
}
function PdfIcon({ name, size = 14, color = C.ink, bg }: { name: string; size?: number; color?: string; bg?: string }) {
  const box = size * 2;
  return (
    <View style={{ width: box, height: box, borderRadius: box / 2, backgroundColor: bg ?? C.blush, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {iconPaths(name).map((d, i) => <Path key={i} d={d} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
      </Svg>
    </View>
  );
}

function Logo() {
  return <Text style={st.logo}>SHIFT</Text>;
}

function LeafDeco({ top = 18, right = 22 }: { top?: number; right?: number }) {
  return (
    <Svg width={46} height={64} viewBox="0 0 50 70" style={{ position: 'absolute', top, right }}>
      <Path d="M25 68C24 50 22 30 30 4" stroke="#6f7c63" strokeWidth={1.4} fill="none" />
      <Path d="M26 50c-8-2-16-10-16-20 8 2 14 9 16 20zM27 38c6-4 14-6 18-14-8 0-15 5-18 14zM28 24c-6-3-10-9-9-16 6 3 9 9 9 16z" fill="#8d9a85" />
    </Svg>
  );
}

function Sunset({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e9c7b4" />
          <Stop offset="0.6" stopColor="#f3d9c4" />
          <Stop offset="1" stopColor="#fbeee0" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={400} height={150} fill="url(#sky)" />
      <Circle cx={250} cy={74} r={16} fill="#fff8ea" />
      <Path d="M0 92 C 70 70 140 88 210 80 S 340 76 400 88 V150 H0Z" fill="#b9a6a3" />
      <Path d="M0 108 C 80 96 160 110 240 102 S 350 100 400 108 V150 H0Z" fill="#8e8584" />
      <Rect x={0} y={118} width={400} height={32} fill="#d8c3b6" opacity={0.7} />
      <Rect x={225} y={121} width={50} height={2} fill="#fff4e0" />
    </Svg>
  );
}

const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

function RingPdf({ pct, size = 70, color = C.deep }: { pct: number; size?: number; color?: string }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const c = size / 2;
  const v = Math.max(0, Math.min(99.99, pct));
  const a0 = -Math.PI / 2;
  const a1 = a0 + (v / 100) * 2 * Math.PI;
  const [x0, y0] = polar(c, c, r, a0);
  const [x1, y1] = polar(c, c, r, a1);
  const large = v > 50 ? 1 : 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={c} cy={c} r={r} stroke={C.line} strokeWidth={sw} fill="none" />
        {v > 0 && <Path d={`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />}
      </Svg>
      <Text style={{ position: 'absolute', top: size / 2 - 9, left: 0, width: size, textAlign: 'center', fontFamily: F.serif, fontSize: 15, color: C.ink }}>{Math.round(pct)}%</Text>
    </View>
  );
}

function RadarPdf({ d, size = 200 }: { d: BlueprintData; size?: number }) {
  const pad = 70;
  const W = size + pad * 2;
  const c = W / 2;
  const R = size / 2;
  const n = d.areas.length || 1;
  const max = 10;
  const pt = (i: number, v: number) => polar(c, c, (R * v) / max, -Math.PI / 2 + (i * 2 * Math.PI) / n);
  const poly = (vals: Record<string, number>) => d.areas.map((a, i) => pt(i, vals[a.id] ?? 0).join(',')).join(' ');
  return (
    <View style={{ width: W, height: W, alignSelf: 'center' }}>
      <Svg width={W} height={W} viewBox={`0 0 ${W} ${W}`}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((f) => <Polygon key={f} points={d.areas.map((_, i) => pt(i, max * f).join(',')).join(' ')} fill="none" stroke={C.line} strokeWidth={0.8} />)}
        {d.areas.map((a, i) => {
          const [x, y] = pt(i, max);
          return <Line key={a.id} x1={c} y1={c} x2={x} y2={y} stroke={C.line} strokeWidth={0.8} />;
        })}
        {d.wheelStart && <Polygon points={poly(d.wheelStart.scores)} fill="#f3dfdb" fillOpacity={0.6} stroke={C.rose} strokeWidth={1.5} />}
        {d.wheelNow && <Polygon points={poly(d.wheelNow.scores)} fill="#dfe6da" fillOpacity={0.7} stroke={C.deep} strokeWidth={1.5} />}
        {d.wheelNow && (
          <G>
            {d.areas.map((a, i) => {
              const [x, y] = pt(i, d.wheelNow!.scores[a.id] ?? 0);
              return <Circle key={a.id} cx={x} cy={y} r={2.5} fill={C.deep} />;
            })}
          </G>
        )}
      </Svg>
      {d.areas.map((a, i) => {
        const [x, y] = pt(i, max * 1.28);
        return <Text key={a.id} style={{ position: 'absolute', left: x - 45, top: y - 8, width: 90, textAlign: 'center', fontSize: 7.5, color: C.muted }}>{a.name}</Text>;
      })}
    </View>
  );
}

function Bullets({ items, size = 9 }: { items: string[]; size?: number }) {
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={st.bullet}>
          <Text style={{ width: 9, fontSize: size }}>•</Text>
          <Text style={{ flex: 1, fontSize: size, lineHeight: 1.35 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Logo />
      <Text style={st.title}>{title}</Text>
      <Text style={st.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function BlueprintDocument({ d, script }: { d: BlueprintData; script?: string }) {
  const s = d.section;
  const p = (k: string) => d.page(k);
  const p1 = p('p1');
  const p2 = p('p2');
  const p3 = p('p3');
  const p4 = p('p4');
  return (
    <Document title={d.tpl.title} author={d.name} subject={d.tpl.subtitle} creator="SHIFT Coaching">
      {p1 && (
        <Page size="A4" style={st.page}>
          <LeafDeco />
          {script && <Text style={{ ...st.script, position: 'absolute', top: 40, right: 80, fontSize: 14 }}>{script}</Text>}
          <Header title={p1.title} subtitle={p1.subtitle} />
          <View style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}><Sunset width={523} height={170} /></View>
          <View style={{ ...st.row, gap: 10, marginBottom: 10 }}>
            <View style={{ ...st.box, flex: 1.1, minHeight: 170 }}>
              <Text style={st.h}>{s('p1', 'futureSelf').title}</Text>
              <Text style={st.quote}>“{d.statement}”</Text>
            </View>
            <View style={{ ...st.box, flex: 1 }}>
              <Text style={st.h}>{s('p1', 'qualities').title}</Text>
              <View style={{ ...st.row, flexWrap: 'wrap', gap: 10 }}>
                {d.qualities.map((q, i) => (
                  <View key={q.name} style={{ alignItems: 'center', width: 60 }}>
                    <PdfIcon name={q.icon} size={14} bg={[C.sage, C.blush, '#f5efe8', '#e9eff4'][i % 4]} />
                    <Text style={{ fontSize: 8, marginTop: 3 }}>{q.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={{ ...st.row, gap: 10 }}>
            <View style={{ ...st.box, flex: 1.1 }}>
              <Text style={st.h}>{s('p1', 'values').title}</Text>
              <View style={{ ...st.row, flexWrap: 'wrap', gap: 8 }}>
                {d.values.map((v, i) => (
                  <View key={v} style={{ alignItems: 'center', width: 52 }}>
                    <PdfIcon name={VALUE_ICONS[i % VALUE_ICONS.length]} size={13} bg={[C.blush, C.sage, '#e9eff4', '#f8ece1'][i % 4]} />
                    <Text style={{ fontSize: 8, marginTop: 3 }}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ ...st.box, flex: 1 }}>
              <Text style={st.h}>{s('p1', 'priorities').title}</Text>
              {d.priorities.map((pr, i) => (
                <View key={pr.id} style={{ ...st.row, alignItems: 'center', marginBottom: 6, backgroundColor: '#fff', borderRadius: 6, padding: 5 }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: C.blush, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}><Text style={{ fontFamily: F.serif, fontSize: 10 }}>{i + 1}</Text></View>
                  <Text style={{ fontSize: 9 }}>{pr.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </Page>
      )}
      {p2 && (
        <Page size="A4" style={st.page}>
          <LeafDeco />
          <Header title={p2.title} subtitle={p2.subtitle} />
          {d.learnings.map((l) => (
            <View key={l.stageId} style={{ ...st.box, ...st.row, alignItems: 'center', marginBottom: 9, gap: 12 }} wrap={false}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: TONES[l.color] ?? C.sage, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: F.serif, fontSize: 20, color: C.ink }}>{l.letter}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.serif, fontSize: 13, color: C.ink }}>{l.name}</Text>
                {l.subtitle ? <Text style={{ ...st.small, marginBottom: 3 }}>{l.subtitle}</Text> : null}
                <Bullets items={l.bullets.length ? l.bullets : ['—']} size={9} />
              </View>
              <View style={{ width: 70, height: 70, borderRadius: 8, overflow: 'hidden' }}><Sunset width={70} height={70} /></View>
            </View>
          ))}
        </Page>
      )}
      {p3 && (
        <Page size="A4" style={st.page}>
          <LeafDeco />
          <Header title={p3.title} subtitle={p3.subtitle} />
          <View style={{ ...st.row, gap: 10, marginBottom: 14 }}>
            {[{ k: 'goal', v: d.goalPct, vars: { goal: d.goalPct } }, { k: 'habits', v: d.habitsPct, vars: { habits: d.habitsPct } }, { k: 'alignment', v: d.align.now, vars: { alignment: d.align.now } }].map((r) => (
              <View key={r.k} style={{ ...st.box, flex: 1, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: F.serif, fontSize: 12, color: C.ink }}>{s('p3', r.k).title}</Text>
                <RingPdf pct={r.v} />
                <Text style={{ ...st.small, textAlign: 'center' }}>{fillTemplate(s('p3', r.k).subtitle, r.vars)}</Text>
              </View>
            ))}
          </View>
          <View style={{ ...st.box, flexGrow: 1 }}>
            <Text style={st.h}>{s('p3', 'wheel').title}</Text>
            <Text style={st.small}>{s('p3', 'wheel').subtitle}</Text>
            {d.wheelStart ? <RadarPdf d={d} size={230} /> : <Text style={st.small}>—</Text>}
            <View style={{ ...st.row, justifyContent: 'center', gap: 18 }}>
              <View style={{ ...st.row, alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.rose }} /><Text style={st.small}>When I started</Text></View>
              {d.wheelNow && <View style={{ ...st.row, alignItems: 'center', gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.deep }} /><Text style={st.small}>Now</Text></View>}
            </View>
          </View>
        </Page>
      )}
      {p4 && (
        <Page size="A4" style={st.page}>
          <LeafDeco />
          <Header title={p4.title} subtitle={p4.subtitle} />
          <View style={{ ...st.row, flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            {d.works.map((w, i) => (
              <View key={w.key} style={{ ...st.box, width: '48.5%' }} wrap={false}>
                <View style={{ ...st.row, alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <PdfIcon name={workIcon(w.key, i)} size={11} />
                  <Text style={{ fontFamily: F.serif, fontSize: 12.5, color: C.ink }}>{w.title}</Text>
                </View>
                <Bullets items={w.items} />
              </View>
            ))}
          </View>
          <View style={{ ...st.box, backgroundColor: C.blush, ...st.row, gap: 10 }} wrap={false}>
            <PdfIcon name="heart" size={13} bg="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={st.h}>{s('p4', 'commitment').title}</Text>
              <Text style={{ ...st.quote, fontSize: 12 }}>“{d.commitment}”</Text>
            </View>
          </View>
          <View style={{ marginTop: 'auto', ...st.row, justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Text style={{ ...st.script, fontSize: 17 }}>{d.tpl.footerScript}</Text>
            <View style={{ ...st.box, width: 190 }}>
              <Text style={st.small}>{d.tpl.footerNote}</Text>
              <Text style={{ ...st.small, marginTop: 4, color: C.ink }}>Date: {d.date}</Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}

/** Builds the PDF and triggers a download. */
export async function downloadBlueprintPdf(d: BlueprintData, script?: string) {
  const blob = await pdf(<BlueprintDocument d={d} script={script} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SHIFT-Blueprint-${(d.name || 'me').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
