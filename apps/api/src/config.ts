import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Directory of the api package (apps/api), used to resolve relative paths in env vars. */
export const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface Config {
  databaseUrl: string;
  port: number;
  host: string;
  nodeEnv: 'development' | 'production' | 'test';
  isProd: boolean;
  cookieSecret: string;
  /** Extra origins allowed to call the API with credentials (comma separated). Same-origin needs nothing. */
  corsOrigins: string[];
  uploadDir: string;
  /** Absolute public base URL of this server, e.g. https://shiftwithedel.com. Upload URLs are prefixed with it ('' = relative). */
  publicUrl: string;
  smtpUrl: string | null;
  mailFrom: string;
  webDist: string | null;
  demoToday: string | null;
  trustProxy: boolean;
  emailPollMs: number;
  logLevel: string;
}

export class ConfigError extends Error {}

/** Load apps/api/.env if present (real environment variables win). Used by server.ts and the db scripts. */
export function loadDotEnv(file = path.join(API_ROOT, '.env')) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* no .env — fine */
  }
}

const DEV_SECRET = 'dev-only-cookie-secret-change-me-0123456789';

function resolveDir(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(API_ROOT, p);
}

/** Read and validate configuration from an env-like object. Throws ConfigError listing every problem. */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const errors: string[] = [];
  const nodeEnv = (env.NODE_ENV ?? 'development') as Config['nodeEnv'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) errors.push(`NODE_ENV must be development, production or test (got "${nodeEnv}")`);
  const isProd = nodeEnv === 'production';

  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) errors.push('DATABASE_URL is required (e.g. postgres://shift:shift@localhost:5432/shift)');
  else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) errors.push('DATABASE_URL must start with postgres:// or postgresql://');

  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) errors.push('PORT must be an integer 0-65535');

  let cookieSecret = env.COOKIE_SECRET ?? '';
  if (!cookieSecret) {
    if (isProd) errors.push('COOKIE_SECRET is required in production (32+ random characters, e.g. `openssl rand -hex 32`)');
    cookieSecret = DEV_SECRET;
  } else if (cookieSecret.length < 32) errors.push('COOKIE_SECRET must be at least 32 characters');

  const publicUrl = (env.PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (publicUrl && !/^https?:\/\//.test(publicUrl)) errors.push('PUBLIC_URL must be an absolute http(s) URL');

  const corsOrigins = (env.CORS_ORIGIN ?? '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
  for (const o of corsOrigins) if (!/^https?:\/\/[^/]+$/.test(o)) errors.push(`CORS_ORIGIN entry "${o}" must be an origin like https://app.example.com`);

  const smtpUrl = env.SMTP_URL?.trim() || null;
  if (smtpUrl && !/^smtps?:\/\//.test(smtpUrl)) errors.push('SMTP_URL must start with smtp:// or smtps://');

  const demoToday = env.DEMO_TODAY?.trim() || null;
  if (demoToday && Number.isNaN(Date.parse(demoToday))) errors.push('DEMO_TODAY must be an ISO date-time, e.g. 2026-09-28T08:30:00+04:00');

  const emailPollMs = Number(env.EMAIL_POLL_MS ?? 15000);
  if (!Number.isFinite(emailPollMs) || emailPollMs < 0) errors.push('EMAIL_POLL_MS must be a non-negative number (0 disables the worker)');

  if (errors.length) throw new ConfigError(`Invalid configuration:\n  - ${errors.join('\n  - ')}`);

  return {
    databaseUrl,
    port,
    host: env.HOST ?? '0.0.0.0',
    nodeEnv,
    isProd,
    cookieSecret,
    corsOrigins,
    uploadDir: resolveDir(env.UPLOAD_DIR ?? './uploads'),
    publicUrl,
    smtpUrl,
    mailFrom: env.MAIL_FROM ?? 'SHIFT Coaching <no-reply@localhost>',
    webDist: env.WEB_DIST ? resolveDir(env.WEB_DIST) : null,
    demoToday,
    trustProxy: env.TRUST_PROXY === 'true' || env.TRUST_PROXY === '1',
    emailPollMs,
    logLevel: env.LOG_LEVEL ?? (nodeEnv === 'test' ? 'silent' : 'info'),
  };
}

/** For CLI scripts (migrate, seed) that only need the database. */
export function databaseUrlFromEnv(env: Record<string, string | undefined> = process.env): string {
  const url = env.DATABASE_URL ?? '';
  if (!/^postgres(ql)?:\/\//.test(url)) throw new ConfigError('DATABASE_URL is required (postgres://user:pass@host:5432/db)');
  return url;
}

export const usingDevSecret = (c: Config) => c.cookieSecret === DEV_SECRET;
