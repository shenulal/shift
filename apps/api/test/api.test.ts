import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { processOutbox, renderEmailHtml, type Mailer, type MailMessage } from '../src/email';
import { ADMIN_PW, CLIENT_PW, createTestDb, json, login, makeApp, seedDemo, type TestDb } from './helpers';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);

function multipart(filename: string, contentType: string, body: Buffer) {
  const boundary = '----shifttest' + Math.random().toString(16).slice(2);
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    body,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

let t: TestDb;
let app: FastifyInstance;
let admin: string;
let sarah: string;

beforeAll(async () => {
  t = await createTestDb();
  await seedDemo(t.store);
  app = await makeApp(t);
  admin = await login(app, 'edel@shiftwithedel.com', ADMIN_PW);
  sarah = await login(app, 'sarah.k@example.com', CLIENT_PW);
});
afterAll(async () => {
  await app?.close();
  await t?.close();
});

describe('basics', () => {
  it('GET /api/health', async () => {
    const res = await app.inject('/api/health');
    expect(res.statusCode).toBe(200);
    expect(json(res)).toMatchObject({ ok: true, db: 'up' });
  });

  it('unknown collection → 404 JSON, unknown route → 404 JSON', async () => {
    const res = await app.inject('/api/c/secrets');
    expect(res.statusCode).toBe(404);
    expect(json(res).error).toMatch(/Unknown collection/);
    expect((await app.inject('/api/c/__proto__')).statusCode).toBe(404);
    expect((await app.inject('/api/nope')).statusCode).toBe(404);
  });

  it('sends security headers', async () => {
    const res = await app.inject('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('bad where JSON → 400', async () => {
    const res = await app.inject(`/api/c/plans?where=${encodeURIComponent('{bad')}`);
    expect(res.statusCode).toBe(400);
  });
});

describe('public reads', () => {
  it('lists plans; inactive plans are hidden from the public but visible to the admin', async () => {
    const before = json<{ id: string }[]>(await app.inject('/api/c/plans'));
    expect(before.length).toBeGreaterThan(0);
    const target = before[0].id;
    const off = await app.inject({ method: 'PATCH', url: `/api/c/plans/${target}`, headers: { cookie: admin }, payload: { active: false } });
    expect(off.statusCode).toBe(200);
    const pub = json<{ id: string }[]>(await app.inject('/api/c/plans'));
    expect(pub.map((p) => p.id)).not.toContain(target);
    expect((await app.inject(`/api/c/plans/${target}`)).statusCode).toBe(404);
    const adm = json<{ id: string }[]>(await app.inject({ url: '/api/c/plans', headers: { cookie: admin } }));
    expect(adm.map((p) => p.id)).toContain(target);
    await app.inject({ method: 'PATCH', url: `/api/c/plans/${target}`, headers: { cookie: admin }, payload: { active: true } });
  });

  it('supports where filters', async () => {
    const res = await app.inject(`/api/c/lessons?where=${encodeURIComponent(JSON.stringify({ stageId: 's' }))}`);
    expect(res.statusCode).toBe(200);
    const rows = json<{ stageId: string }[]>(res);
    expect(rows.every((r) => r.stageId === 's')).toBe(true);
  });

  it('visitors cannot read admin-only or dynamic data', async () => {
    expect((await app.inject('/api/c/leads')).statusCode).toBe(401);
    expect((await app.inject('/api/c/pipelineStages')).statusCode).toBe(401);
    expect((await app.inject({ url: '/api/c/pipelineStages', headers: { cookie: sarah } })).statusCode).toBe(403);
    expect((await app.inject('/api/c/users')).statusCode).toBe(401);
  });
});

describe('auth', () => {
  it('admin login → me → logout', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'EDEL@shiftwithedel.com ', password: ADMIN_PW } });
    expect(res.statusCode).toBe(200);
    expect(json(res).user).toMatchObject({ id: 'edel', role: 'admin' });
    expect(json(res).user).not.toHaveProperty('passwordHash');
    const c = res.cookies.find((x) => x.name === 'sid')!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe('Lax');
    expect(c.path).toBe('/');
    expect(new Date(c.expires!).getTime()).toBeGreaterThan(Date.now() + 29 * 86400_000);
    const cookie = `sid=${c.value}`;
    const me = await app.inject({ url: '/api/auth/me', headers: { cookie } });
    expect(json(me).user).toMatchObject({ id: 'edel', email: 'edel@shiftwithedel.com' });
    // the web client sends Content-Type: application/json with no body
    const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie, 'content-type': 'application/json' } });
    expect(out.statusCode).toBe(204);
    expect(json(await app.inject({ url: '/api/auth/me', headers: { cookie } })).user).toBeNull();
  });

  it('rejects wrong passwords and forged cookies', async () => {
    const bad = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'edel@shiftwithedel.com', password: 'wrong-password' } });
    expect(bad.statusCode).toBe(401);
    expect(json(bad).error).toBe('Incorrect email or password');
    const unknown = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'ghost@example.com', password: 'whatever1' } });
    expect(unknown.statusCode).toBe(401);
    const forged = await app.inject({ url: '/api/auth/me', headers: { cookie: 'sid=abc.def' } });
    expect(json(forged).user).toBeNull();
  });

  it('register creates a signed-in client; duplicates are rejected', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { name: 'New Person', email: 'new.person@example.com', password: 'long-enough-1' } });
    expect(res.statusCode).toBe(201);
    expect(json(res).user).toMatchObject({ role: 'client', email: 'new.person@example.com', initials: 'NP' });
    const cookie = `sid=${res.cookies.find((x) => x.name === 'sid')!.value}`;
    expect(json(await app.inject({ url: '/api/auth/me', headers: { cookie } })).user.email).toBe('new.person@example.com');
    const dup = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { name: 'X', email: 'SARAH.K@example.com', password: 'long-enough-1' } });
    expect(dup.statusCode).toBe(409);
    const weak = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { name: 'X', email: 'weak@example.com', password: 'short' } });
    expect(weak.statusCode).toBe(400);
  });

  it('changes own password (and admin can set a client password)', async () => {
    const reg = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { name: 'Pat', email: 'pat@example.com', password: 'first-password' } });
    const cookie = `sid=${reg.cookies.find((x) => x.name === 'sid')!.value}`;
    const wrong = await app.inject({ method: 'POST', url: '/api/auth/password', headers: { cookie }, payload: { currentPassword: 'nope-nope', newPassword: 'second-password' } });
    expect(wrong.statusCode).toBe(400);
    const ok = await app.inject({ method: 'POST', url: '/api/auth/password', headers: { cookie }, payload: { currentPassword: 'first-password', newPassword: 'second-password' } });
    expect(ok.statusCode).toBe(200);
    await expect(login(app, 'pat@example.com', 'first-password')).rejects.toThrow();
    await login(app, 'pat@example.com', 'second-password');
    const userId = json(await app.inject({ url: '/api/auth/me', headers: { cookie } })).user.id;
    const byClient = await app.inject({ method: 'POST', url: '/api/auth/password', headers: { cookie: sarah }, payload: { userId, newPassword: 'hijacked-pass' } });
    expect(byClient.statusCode).toBe(403);
    const byAdmin = await app.inject({ method: 'POST', url: '/api/auth/password', headers: { cookie: admin }, payload: { userId, newPassword: 'set-by-coach-1' } });
    expect(byAdmin.statusCode).toBe(200);
    await login(app, 'pat@example.com', 'set-by-coach-1');
  });

  it('blocks cross-origin state-changing requests', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { origin: 'https://evil.example', cookie: admin } });
    expect(res.statusCode).toBe(403);
    const same = await app.inject({ method: 'POST', url: '/api/actions/trackEvent', headers: { origin: 'http://localhost:5204', host: 'localhost:5204' }, payload: { type: 'visit' } });
    expect(same.statusCode).toBe(200);
  });
});

describe('permissions over HTTP', () => {
  it('client cannot read leads (403) or write plans (403)', async () => {
    expect((await app.inject({ url: '/api/c/leads', headers: { cookie: sarah } })).statusCode).toBe(403);
    const patch = await app.inject({ method: 'PATCH', url: '/api/c/plans/momentum', headers: { cookie: sarah }, payload: { name: 'Hacked' } });
    expect(patch.statusCode).toBe(403);
    const create = await app.inject({ method: 'POST', url: '/api/c/plans', headers: { cookie: sarah }, payload: { name: 'Mine' } });
    expect(create.statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/c/plans/reorder', headers: { cookie: sarah }, payload: { ids: ['momentum'] } })).statusCode).toBe(403);
    expect((await app.inject({ method: 'POST', url: '/api/actions/overview', headers: { cookie: sarah }, payload: {} })).statusCode).toBe(403);
  });

  it('client only sees their own work, even when asking for someone else’s', async () => {
    const own = json<{ userId: string }[]>(await app.inject({ url: '/api/c/work', headers: { cookie: sarah } }));
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((w) => w.userId === 'sarah')).toBe(true);
    const sneaky = json<{ userId: string }[]>(await app.inject({ url: `/api/c/work?where=${encodeURIComponent(JSON.stringify({ userId: 'aisha' }))}`, headers: { cookie: sarah } }));
    expect(sneaky.every((w) => w.userId === 'sarah')).toBe(true);
    const all = json<{ userId: string }[]>(await app.inject({ url: '/api/c/work', headers: { cookie: admin } }));
    expect(all.length).toBeGreaterThanOrEqual(own.length);
  });

  it('client cannot create records for another user or move their own to someone else', async () => {
    const other = await app.inject({ method: 'POST', url: '/api/c/goals', headers: { cookie: sarah }, payload: { userId: 'aisha', statement: 'x' } });
    expect(other.statusCode).toBe(403);
    const [goal] = json<{ id: string }[]>(await app.inject({ url: '/api/c/goals', headers: { cookie: sarah } }));
    const moved = await app.inject({ method: 'PATCH', url: `/api/c/goals/${goal.id}`, headers: { cookie: sarah }, payload: { userId: 'aisha', ownerId: 'aisha', progress: 50 } });
    expect(moved.statusCode).toBe(200);
    expect(json(moved)).toMatchObject({ userId: 'sarah', ownerId: 'sarah', progress: 50 });
  });

  it('passwordHash is never returned or writable', async () => {
    const users = await app.inject({ url: '/api/c/users', headers: { cookie: admin } });
    expect(users.body).not.toContain('passwordHash');
    expect(users.body).not.toContain('$2');
    const one = await app.inject({ url: '/api/c/users/sarah', headers: { cookie: admin } });
    expect(json(one)).not.toHaveProperty('passwordHash');
    const mine = await app.inject({ url: '/api/c/users', headers: { cookie: sarah } });
    expect(json<unknown[]>(mine)).toHaveLength(1);
    expect(mine.body).not.toContain('passwordHash');
    // admin cannot set a hash through CRUD
    const set = await app.inject({ method: 'PATCH', url: '/api/c/users/aisha', headers: { cookie: admin }, payload: { passwordHash: 'x', phone: '+971 1' } });
    expect(set.statusCode).toBe(200);
    expect((await t.store.get('users', 'aisha'))!.passwordHash).not.toBe('x');
    // cannot probe hashes through filters
    expect((await app.inject({ url: `/api/c/users?where=${encodeURIComponent(JSON.stringify({ passwordHash: 'x' }))}`, headers: { cookie: admin } })).statusCode).toBe(400);
    // createClient action result has no hash either
    const created = await app.inject({ method: 'POST', url: '/api/actions/createClient', headers: { cookie: admin }, payload: { name: 'Zed Client', email: 'zed@example.com' } });
    expect(created.statusCode).toBe(200);
    expect(created.body).not.toContain('passwordHash');
  });
});

describe('actions', () => {
  it('submitEnquiry (public) creates a lead and a queued outbox email', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/actions/submitEnquiry', payload: { data: { name: 'Hana Test', email: 'hana@example.com', phone: '501234567', location: 'Dubai', support: ['Life transitions'], goal: 'Clarity', source: 'LinkedIn' } } });
    expect(res.statusCode).toBe(200);
    const { leadId } = json(res);
    const lead = await t.store.get('leads', leadId);
    expect(lead).toMatchObject({ email: 'hana@example.com', source: 'linkedin', stageId: 'ps-enquiry' });
    const [mail] = await t.store.list('outbox', { where: { to: 'hana@example.com' } });
    expect(mail).toMatchObject({ status: 'queued', subject: 'Thank you for your enquiry' });
    expect(mail.body).toContain('Hi Hana');
  });

  it('validation errors come back as 400 { error }', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/actions/submitEnquiry', payload: { data: { email: 'x@y.z' } } });
    expect(res.statusCode).toBe(400);
    expect(json(res).error).toMatch(/required/);
  });

  it('unknown / prototype action names → 404; client actions need a session', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/actions/nope', payload: {} })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/actions/constructor', payload: {} })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/actions/saveWork', payload: { context: 'lesson:f1', patch: {} } })).statusCode).toBe(401);
  });

  it('admin overview', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/actions/overview', headers: { cookie: admin, 'content-type': 'application/json' } });
    expect(res.statusCode).toBe(200);
    expect(json(res)).toMatchObject({ activeClients: 3, callsThisWeek: 1 });
  });

  it('saveWork via HTTP writes to the signed-in user only', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/actions/saveWork', headers: { cookie: sarah }, payload: { context: 'lesson:f2', patch: { reflections: { r9: 'api' } }, userId: 'aisha' } });
    expect(res.statusCode).toBe(200);
    expect(json(res)).toMatchObject({ userId: 'sarah', context: 'lesson:f2' });
  });
});

describe('email worker', () => {
  it('marks queued emails "logged" without SMTP', async () => {
    const before = await t.store.list('outbox', { where: { status: 'queued' } });
    expect(before.length).toBeGreaterThan(0);
    const logs: string[] = [];
    const r = await processOutbox(t.store, { mailer: null, mailFrom: 'x@y.z', log: (m) => logs.push(m) });
    expect(r.logged).toBe(before.length);
    expect(await t.store.list('outbox', { where: { status: 'queued' } })).toHaveLength(0);
    expect((await t.store.get('outbox', before[0].id))!.status).toBe('logged');
    expect(logs[0]).toContain('to=');
  });

  it('sends via the mailer with the template sender and branded HTML, retrying failures', async () => {
    await app.inject({ method: 'POST', url: '/api/actions/submitEnquiry', payload: { data: { name: 'Mail Test', email: 'mail@example.com', phone: '1', location: 'Dubai', support: ['x'], goal: 'g', source: 'Instagram' } } });
    const sent: MailMessage[] = [];
    let fail = true;
    const mailer: Mailer = {
      async send(m) {
        if (fail) throw new Error('smtp down');
        sent.push(m);
      },
    };
    const first = await processOutbox(t.store, { mailer, mailFrom: 'fallback@x.y', log: () => undefined });
    expect(first.failed).toBeGreaterThan(0);
    const [queued] = await t.store.list('outbox', { where: { to: 'mail@example.com' } });
    expect(queued).toMatchObject({ status: 'queued', attempts: 1, lastError: 'smtp down' });
    fail = false;
    await processOutbox(t.store, { mailer, mailFrom: 'fallback@x.y', log: () => undefined });
    const msg = sent.find((m) => m.to === 'mail@example.com')!;
    expect(msg.from).toEqual({ name: 'Edel · SHIFT', address: 'hello@shiftwithedel.com' });
    expect(msg.html).toContain('SHIFT');
    expect(msg.html).toContain('<p');
    expect((await t.store.get('outbox', queued.id))!.status).toBe('sent');
  });

  it('escapes HTML in bodies', () => {
    const html = renderEmailHtml({ subject: 's', body: 'Hi <script>x</script>\n\nSecond' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('admin CRUD', () => {
  it('create, reorder and delete FAQs', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/c/faqs', headers: { cookie: admin }, payload: { question: 'New question?', answer: 'Yes.' } });
    expect(created.statusCode).toBe(201);
    const id = json(created).id as string;
    const faqs = json<{ id: string }[]>(await app.inject({ url: '/api/c/faqs', headers: { cookie: admin } }));
    const reversed = faqs.map((f) => f.id).reverse();
    const re = await app.inject({ method: 'POST', url: '/api/c/faqs/reorder', headers: { cookie: admin }, payload: { ids: reversed } });
    expect(re.statusCode).toBe(204);
    const after = json<{ id: string }[]>(await app.inject('/api/c/faqs'));
    expect(after.map((f) => f.id)).toEqual(reversed);
    expect(after[0].id).toBe(id);
    const del = await app.inject({ method: 'DELETE', url: `/api/c/faqs/${id}`, headers: { cookie: admin, 'content-type': 'application/json' } });
    expect(del.statusCode).toBe(204);
    expect((await app.inject(`/api/c/faqs/${id}`)).statusCode).toBe(404);
    expect((await app.inject({ method: 'DELETE', url: `/api/c/faqs/${id}`, headers: { cookie: admin } })).statusCode).toBe(404);
  });

  it('master records need their title field; singletons cannot be deleted or duplicated', async () => {
    expect((await app.inject({ method: 'POST', url: '/api/c/faqs', headers: { cookie: admin }, payload: { answer: 'no question' } })).statusCode).toBe(400);
    const [settings] = json<{ id: string }[]>(await app.inject('/api/c/settings'));
    expect((await app.inject({ method: 'DELETE', url: `/api/c/settings/${settings.id}`, headers: { cookie: admin } })).statusCode).toBe(409);
  });
});

describe('uploads', () => {
  it('rejects visitors (401) and clients (403)', async () => {
    const m = multipart('a.png', 'image/png', PNG);
    expect((await app.inject({ method: 'POST', url: '/api/uploads', ...m })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/uploads', payload: m.payload, headers: { ...m.headers, cookie: sarah } })).statusCode).toBe(403);
  });

  it('rejects wrong mime types and spoofed content', async () => {
    const svg = multipart('x.svg', 'image/svg+xml', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
    expect((await app.inject({ method: 'POST', url: '/api/uploads', payload: svg.payload, headers: { ...svg.headers, cookie: admin } })).statusCode).toBe(415);
    const fake = multipart('x.png', 'image/png', Buffer.from('<html>not a png</html>'));
    expect((await app.inject({ method: 'POST', url: '/api/uploads', payload: fake.payload, headers: { ...fake.headers, cookie: admin } })).statusCode).toBe(415);
    const json415 = await app.inject({ method: 'POST', url: '/api/uploads', headers: { cookie: admin }, payload: { file: 'x' } });
    expect(json415.statusCode).toBe(415);
  });

  it('rejects files over 10 MB', async () => {
    const big = multipart('big.png', 'image/png', Buffer.concat([PNG, Buffer.alloc(10 * 1024 * 1024 + 10)]));
    const res = await app.inject({ method: 'POST', url: '/api/uploads', payload: big.payload, headers: { ...big.headers, cookie: admin } });
    expect(res.statusCode).toBe(413);
  });

  it('stores an admin PNG and serves it from /uploads', async () => {
    const m = multipart('logo.png', 'image/png', PNG);
    const res = await app.inject({ method: 'POST', url: '/api/uploads', payload: m.payload, headers: { ...m.headers, cookie: admin } });
    expect(res.statusCode).toBe(201);
    const { url } = json<{ url: string }>(res);
    expect(url).toMatch(/^\/uploads\/\d{4}-\d{2}\/[0-9a-f]{32}\.png$/);
    const file = await app.inject(url);
    expect(file.statusCode).toBe(200);
    expect(file.headers['content-type']).toBe('image/png');
    expect(file.rawPayload.equals(PNG)).toBe(true);
    expect((await app.inject('/uploads/../package.json')).statusCode).toBe(404);
  });
});

describe('fresh DB per test file', () => {
  beforeEach(() => undefined);
  it('the seed is idempotent and keeps edits', async () => {
    await app.inject({ method: 'PATCH', url: '/api/c/plans/momentum', headers: { cookie: admin }, payload: { name: 'Momentum (edited)' } });
    const { seedDatabase } = await import('../src/seed');
    const report = await seedDatabase(t.store, { demo: true, adminPassword: 'other-admin-pw', clientPassword: 'other-client-pw', rounds: 4 });
    expect(report.written).toEqual({});
    expect(report.passwords.map((p) => p.email)).toEqual(['zed@example.com']); // only the passwordless client created above
    expect((await t.store.get('plans', 'momentum'))!.name).toBe('Momentum (edited)');
    await login(app, 'edel@shiftwithedel.com', ADMIN_PW); // unchanged
  });
});

describe('server features', () => {
  it('rate-limits login', async () => {
    const limited = await makeApp(t, { rateLimits: { login: 2 } });
    try {
      const attempt = () => limited.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'edel@shiftwithedel.com', password: 'wrong-password' } });
      expect((await attempt()).statusCode).toBe(401);
      expect((await attempt()).statusCode).toBe(401);
      const third = await attempt();
      expect(third.statusCode).toBe(429);
      expect(json(third).error).toMatch(/rate limit/i);
    } finally {
      await limited.close();
    }
  });

  it('serves the SPA from WEB_DIST with history fallback, but never for /api', async () => {
    const { mkdtempSync, writeFileSync, mkdirSync } = await import('node:fs');
    const path = await import('node:path');
    const dist = mkdtempSync(path.join(inject('tmpRoot'), 'web-'));
    writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>SHIFT</title><div id="root"></div>');
    mkdirSync(path.join(dist, 'assets'));
    writeFileSync(path.join(dist, 'assets', 'app-abc123.js'), 'console.log(1)');
    const web = await makeApp(t, {}, { WEB_DIST: dist });
    try {
      const deep = await web.inject('/coaching/packages');
      expect(deep.statusCode).toBe(200);
      expect(deep.headers['content-type']).toContain('text/html');
      expect(deep.body).toContain('<title>SHIFT</title>');
      const asset = await web.inject('/assets/app-abc123.js');
      expect(asset.statusCode).toBe(200);
      expect(asset.headers['cache-control']).toContain('immutable');
      const api = await web.inject('/api/unknown');
      expect(api.statusCode).toBe(404);
      expect(json(api)).toEqual({ error: 'Not found' });
      expect(json(await web.inject('/api/c/faqs')).length).toBeGreaterThan(0);
    } finally {
      await web.close();
    }
  });
});
