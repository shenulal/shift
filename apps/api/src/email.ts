import nodemailer from 'nodemailer';
import { fillTemplate, type Rec, type OutboxEmail, type Store } from '@shift/core';

/**
 * Outbox worker. Core actions queue emails as `outbox` records (status 'queued'); this worker delivers them.
 *  - SMTP_URL set → sent via nodemailer, status 'sent', sentAt = now.
 *  - no SMTP_URL  → logged to the console, status 'logged' (development / staging).
 * Failures stay 'queued' with `attempts`/`lastError` and are retried up to MAX_ATTEMPTS times.
 */

export const MAX_ATTEMPTS = 5;

export interface MailMessage {
  from: { name: string; address: string } | string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(msg: MailMessage): Promise<void>;
  close?(): void;
}

export function createSmtpMailer(smtpUrl: string): Mailer {
  const transport = nodemailer.createTransport(smtpUrl);
  return {
    async send(msg) {
      await transport.sendMail({ from: msg.from, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html, disableFileAccess: true, disableUrlAccess: true });
    },
    close: () => transport.close(),
  };
}

type OutboxRec = Rec<OutboxEmail> & { attempts?: number; lastError?: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface Brand {
  wordmark: string;
  subMark: string;
  tagline: string;
  colors: { deep: string; ground: string; charcoal: string; sage: string; white: string };
}

const DEFAULT_BRAND: Brand = {
  wordmark: 'SHIFT', subMark: 'COACHING', tagline: 'A calmer mind. A clearer you. A brighter tomorrow.',
  colors: { deep: '#2E3B32', ground: '#F7F4EF', charcoal: '#4E514A', sage: '#949F8E', white: '#FBFAF6' },
};

/** Simple branded HTML version of a plain-text body: SHIFT header, paragraphs, optional button, footer tagline. */
export function renderEmailHtml(opts: { subject: string; body: string; preheader?: string; cta?: { label: string; url: string } | null; brand?: Brand }): string {
  const b = opts.brand ?? DEFAULT_BRAND;
  const c = b.colors;
  const paragraphs = opts.body
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.65">${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  const button = opts.cta
    ? `<p style="margin:24px 0 8px"><a href="${esc(opts.cta.url)}" style="display:inline-block;background:${c.deep};color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:999px;font-size:13px;letter-spacing:.12em;text-transform:uppercase">${esc(opts.cta.label)}</a></p>`
    : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.subject)}</title></head>
<body style="margin:0;padding:0;background:${c.ground};color:${c.charcoal};font-family:Montserrat,Helvetica,Arial,sans-serif;font-size:15px">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${c.ground}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${c.white};border-radius:16px">
<tr><td style="padding:28px 32px 8px;text-align:center;border-bottom:1px solid #e6e0d8">
<div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;letter-spacing:.2em;color:${c.deep}">${esc(b.wordmark)}</div>
<div style="font-size:10px;letter-spacing:.42em;color:${c.sage};margin:4px 0 18px">${esc(b.subMark)}</div>
</td></tr>
<tr><td style="padding:28px 32px 12px">
${paragraphs}
${button}
</td></tr>
<tr><td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #e6e0d8;font-size:12px;color:${c.sage};font-style:italic">${esc(b.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
}

async function loadBrand(store: Store): Promise<{ brand: Brand; vars: Record<string, string> }> {
  const [branding] = await store.list('branding');
  const [settings] = await store.list('settings');
  const brand: Brand = branding
    ? { wordmark: branding.wordmark, subMark: branding.subMark, tagline: branding.taglines?.primary ?? DEFAULT_BRAND.tagline, colors: { ...DEFAULT_BRAND.colors, ...branding.colors } }
    : DEFAULT_BRAND;
  const vars: Record<string, string> = settings ? { booking_link: settings.discoveryCall?.bookingUrl ?? '', portal_link: `https://${settings.website}/app` } : {};
  return { brand, vars };
}

export interface ProcessResult { sent: number; logged: number; failed: number }

export async function processOutbox(store: Store, opts: { mailer: Mailer | null; mailFrom: string; log?: (msg: string) => void; batch?: number; logBodies?: boolean }): Promise<ProcessResult> {
  const log = opts.log ?? ((m) => console.log(m));
  const queued = ((await store.list('outbox', { where: { status: 'queued' } })) as OutboxRec[]).filter((m) => (m.attempts ?? 0) < MAX_ATTEMPTS).slice(0, opts.batch ?? 25);
  const result: ProcessResult = { sent: 0, logged: 0, failed: 0 };
  if (!queued.length) return result;
  const { brand, vars } = await loadBrand(store);
  const templates = new Map((await store.list('emails')).map((t) => [t.key, t]));

  for (const m of queued) {
    const tpl = templates.get(m.templateKey);
    if (!opts.mailer) {
      log(`[email] (no SMTP_URL — logged, not sent) to=${m.to} subject="${m.subject}"${opts.logBodies === false ? '' : `\n${m.body}\n`}`);
      await store.update('outbox', m.id, { status: 'logged', sentAt: new Date().toISOString() } as never);
      result.logged++;
      continue;
    }
    const from = tpl?.fromEmail ? { name: tpl.fromName || brand.wordmark, address: tpl.fromEmail } : opts.mailFrom;
    const ctaUrl = tpl?.ctaUrl ? fillTemplate(tpl.ctaUrl, vars) : '';
    const cta = tpl?.ctaLabel && /^https?:\/\//.test(ctaUrl) ? { label: tpl.ctaLabel, url: ctaUrl } : null;
    try {
      await opts.mailer.send({ from, to: m.to, subject: m.subject, text: m.body, html: renderEmailHtml({ subject: m.subject, body: m.body, preheader: tpl?.preheader, cta, brand }) });
      await store.update('outbox', m.id, { status: 'sent', sentAt: new Date().toISOString() } as never);
      result.sent++;
    } catch (err) {
      const attempts = (m.attempts ?? 0) + 1;
      await store.update('outbox', m.id, { attempts, lastError: err instanceof Error ? err.message.slice(0, 500) : String(err) } as never);
      log(`[email] send failed (attempt ${attempts}/${MAX_ATTEMPTS}) to=${m.to}: ${err instanceof Error ? err.message : err}`);
      result.failed++;
    }
  }
  return result;
}

/** Poll the outbox every `intervalMs`. `lock` (PgStore.withAdvisoryLock) keeps multiple API instances from double-sending. */
export function startEmailWorker(opts: {
  store: Store;
  mailer: Mailer | null;
  mailFrom: string;
  intervalMs: number;
  logBodies?: boolean;
  lock?: (fn: () => Promise<void>) => Promise<unknown>;
  log: { info: (m: string) => void; error: (m: string) => void };
}): { stop: () => Promise<void> } {
  let running: Promise<void> | null = null;
  let stopped = false;
  const tick = () => {
    if (running || stopped) return;
    const job = async () => {
      await processOutbox(opts.store, { mailer: opts.mailer, mailFrom: opts.mailFrom, log: opts.log.info, logBodies: opts.logBodies });
    };
    running = (opts.lock ? opts.lock(job).then(() => undefined) : job())
      .catch((err) => opts.log.error(`[email] worker error: ${err instanceof Error ? err.message : err}`))
      .finally(() => {
        running = null;
      });
  };
  const timer = setInterval(tick, opts.intervalMs);
  timer.unref();
  setTimeout(tick, 1000).unref();
  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      if (running) await running;
      opts.mailer?.close?.();
    },
  };
}
