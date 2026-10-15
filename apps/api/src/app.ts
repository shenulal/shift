import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import type pg from 'pg';
import { ActionError, setToday } from '@shift/core';
import { authPlugin, purgeExpiredSessions } from './auth';
import { usingDevSecret, type Config } from './config';
import { createDb, createPool, type Db } from './db/client';
import { PgStore } from './db/store';
import { createSmtpMailer, startEmailWorker, type Mailer } from './email';
import { createPaymentProvider, type PaymentProvider } from './payments';
import { apiRoutes, MAX_UPLOAD_BYTES, stripSecrets } from './routes';
import { LocalDiskStorage, type FileStorage } from './storage';

declare module 'fastify' {
  interface FastifyInstance {
    store: PgStore;
    db: Db;
    payments: PaymentProvider;
  }
}

export interface BuildOptions {
  config: Config;
  /** Use an existing pool (tests). Otherwise one is created from DATABASE_URL and closed with the app. */
  pool?: pg.Pool;
  storage?: FileStorage;
  /** Override the SMTP mailer (tests). Defaults to SMTP_URL, or null (log only). */
  mailer?: Mailer | null;
  /** Start the background email worker. Defaults to true unless NODE_ENV=test or EMAIL_POLL_MS=0. */
  emailWorker?: boolean;
  rateLimits?: Partial<{ login: number; register: number; actions: number; uploads: number }>;
}

/** pg advisory-lock key so only one API instance drains the outbox at a time. */
const EMAIL_LOCK_KEY = 5_141_070_001;

/** Build the Fastify app (no listen). Shared by server.ts and the tests. */
export async function buildApp(opts: BuildOptions): Promise<FastifyInstance> {
  const { config } = opts;
  if (config.demoToday) setToday(config.demoToday);

  const app = Fastify({
    logger: { level: config.logLevel },
    trustProxy: config.trustProxy,
    bodyLimit: 5 * 1024 * 1024,
  });

  if (config.isProd && usingDevSecret(config)) throw new Error('COOKIE_SECRET must be set in production');
  if (!config.isProd && usingDevSecret(config) && config.nodeEnv !== 'test') app.log.warn('COOKIE_SECRET not set — using an insecure development secret');

  const ownPool = !opts.pool;
  const pool = opts.pool ?? createPool(config.databaseUrl);
  const db = createDb(pool);
  const store = new PgStore(db);
  app.decorate('store', store);
  app.decorate('db', db);
  app.decorate('payments', createPaymentProvider());

  // ── body parsing: JSON with empty-body tolerance (the web client sends Content-Type on body-less POST/DELETE)
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const text = typeof body === 'string' ? body : body.toString('utf8');
    if (!text.trim()) return done(null, undefined);
    try {
      done(null, JSON.parse(text, (k, v) => {
        if (k === '__proto__' || (k === 'constructor' && v && typeof v === 'object' && 'prototype' in v)) throw new Error('Forbidden key');
        return v;
      }));
    } catch {
      const err = new Error('Invalid JSON body') as FastifyError;
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  // ── security headers
  const imgSrc = ["'self'", 'data:', 'blob:', 'https:'];
  if (config.publicUrl) imgSrc.push(new URL(config.publicUrl).origin);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc,
        mediaSrc: ["'self'", 'blob:', 'https:'],
        connectSrc: ["'self'", 'data:', 'blob:'],
        workerSrc: ["'self'", 'blob:'],
        frameSrc: ["'self'", 'blob:', 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    // Uploaded images must load from the Vite dev server (other port = same site) and from a separate front-end origin.
    crossOriginResourcePolicy: { policy: config.corsOrigins.length ? 'cross-origin' : 'same-site' },
    hsts: config.isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
  });

  await app.register(cookie, { secret: config.cookieSecret, hook: 'onRequest' });
  if (config.corsOrigins.length) {
    await app.register(cors, { origin: config.corsOrigins, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'] });
  }
  await app.register(rateLimit, { global: false });
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

  // ── CSRF defence in depth (cookies are SameSite=Lax): state-changing API calls from a browser must come from our origin.
  const allowedOrigins = new Set([...config.corsOrigins, ...(config.publicUrl ? [new URL(config.publicUrl).origin] : [])]);
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' || !req.url.startsWith('/api/')) return;
    const origin = req.headers.origin;
    if (!origin) return;
    let host = '';
    try {
      host = new URL(origin).host;
    } catch {
      /* invalid origin → rejected below */
    }
    if (allowedOrigins.has(origin) || (host && host === req.headers.host)) return;
    return reply.status(403).send({ error: 'Cross-origin request blocked' });
  });

  // ── errors → { error } JSON with a sensible status; no stack traces leave the server in production.
  //    Must be set before routes are added (Fastify binds the handler at route registration).
  app.setErrorHandler((err: FastifyError | ActionError | Error, req, reply) => {
    if (err instanceof ActionError) return reply.status(err.status).send({ error: err.message });
    const status = (err as FastifyError).statusCode;
    if (status && status >= 400 && status < 500) return reply.status(status).send({ error: err.message });
    req.log.error({ err }, 'request failed');
    return reply.status(500).send({ error: config.isProd ? 'Something went wrong — please try again' : err.message || 'Internal error' });
  });

  // ── auth (session cookie → request.actor) + /api/auth routes. Called directly (not registered) so its hook is global.
  await authPlugin(app, {
    db,
    store,
    secureCookies: config.isProd,
    loginRateLimit: opts.rateLimits?.login ?? 10,
    registerRateLimit: opts.rateLimits?.register ?? 5,
  });

  // Never send a password hash, whatever a core action returns.
  app.addHook('preSerialization', async (req, _reply, payload) => (req.url.startsWith('/api/') ? stripSecrets(payload) : payload));
  app.addHook('onSend', async (req, reply, payload) => {
    if (req.url.startsWith('/api/') && !reply.hasHeader('cache-control')) reply.header('Cache-Control', 'no-store');
    return payload;
  });

  // ── uploads
  mkdirSync(config.uploadDir, { recursive: true });
  const storage = opts.storage ?? new LocalDiskStorage(config.uploadDir, config.publicUrl);
  await apiRoutes(app, {
    store,
    storage,
    actionRateLimit: opts.rateLimits?.actions ?? 120,
    uploadRateLimit: opts.rateLimits?.uploads ?? 30,
  });

  // ── static: built SPA (optional) and uploaded files
  const webDist = config.webDist && existsSync(path.join(config.webDist, 'index.html')) ? config.webDist : null;
  if (config.webDist && !webDist) app.log.warn(`WEB_DIST=${config.webDist} has no index.html — not serving the web app`);
  if (webDist) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
      wildcard: false,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res, filePath) => {
        res.header('Cache-Control', filePath.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
  }
  await app.register(fastifyStatic, {
    root: config.uploadDir,
    prefix: '/uploads/',
    decorateReply: !webDist,
    index: false,
    dotfiles: 'deny',
    setHeaders: (res) => res.header('Cache-Control', 'public, max-age=31536000, immutable'),
  });

  const NON_SPA = /^\/(api|uploads)(\/|\?|$)/;
  app.setNotFoundHandler((req, reply) => {
    if (webDist && (req.method === 'GET' || req.method === 'HEAD') && !NON_SPA.test(req.url)) {
      reply.header('Cache-Control', 'no-cache');
      return reply.sendFile('index.html', webDist);
    }
    return reply.status(404).send({ error: 'Not found' });
  });

  // ── background jobs
  const runWorker = opts.emailWorker ?? (config.nodeEnv !== 'test' && config.emailPollMs > 0);
  const mailer = opts.mailer !== undefined ? opts.mailer : config.smtpUrl ? createSmtpMailer(config.smtpUrl) : null;
  if (runWorker && !mailer && config.isProd) app.log.warn('SMTP_URL not set — queued emails will be marked "logged" and NOT delivered');
  const worker = runWorker
    ? startEmailWorker({
        store,
        mailer,
        mailFrom: config.mailFrom,
        intervalMs: config.emailPollMs,
        logBodies: !config.isProd,
        lock: (fn) => store.withAdvisoryLock(EMAIL_LOCK_KEY, fn),
        log: { info: (m) => app.log.info(m), error: (m) => app.log.error(m) },
      })
    : null;
  const purge = runWorker ? setInterval(() => purgeExpiredSessions(db).catch(() => undefined), 60 * 60 * 1000) : null;
  purge?.unref();

  app.addHook('onClose', async () => {
    if (purge) clearInterval(purge);
    await worker?.stop();
    if (ownPool) await pool.end();
  });

  return app;
}
