# @shift/api — SHIFT Coaching production API

A thin, secure HTTP adapter over `@shift/core`. **All business rules live in core** (`packages/core`: permissions,
CRUD rules, actions, calculations). This package adds PostgreSQL persistence, cookie sessions, uploads, the email
outbox worker and static hosting of the SPA. It implements exactly the contract the web app's
`apps/web/src/data/http.ts` expects.

Stack: Node 20+ (Docker image uses Node 22), TypeScript (ESM, run with `tsx` — core is consumed as TS source),
Fastify 5, Drizzle ORM + `pg`, bcryptjs, nodemailer, vitest.

> Fastify 5 rather than 4: Fastify 4 is end-of-life and every 4.x release is affected by published advisories
> (fixed only in ≥ 5.12.5), as are the 4.x-era `@fastify/static` and `nodemailer` < 10.0.6. All dependencies are pinned.

## Quick start (local)

```bash
# 1. PostgreSQL 14+ (any of these)
docker run -d --name shift-pg -e POSTGRES_USER=shift -e POSTGRES_PASSWORD=shift -e POSTGRES_DB=shift -p 5432:5432 postgres:16

# 2. env
cp apps/api/.env.example apps/api/.env          # edit DATABASE_URL etc. (loaded automatically; real env vars win)

# 3. schema + data (from the repo root)
npm install
npm run db:push                                  # applies drizzle/ migrations (idempotent)
SEED_DEMO=true npm run db:seed                   # master content + demo clients; prints the passwords

# 4. run
npm run dev:api                                  # API on :4000 (tsx watch)
npm run dev                                      # web on :5173, proxies /api → :4000
```

Demo logins after `SEED_DEMO=true npm run db:seed`: `edel@shiftwithedel.com / shift-admin-2026` (admin),
`sarah.k@example.com / shift-client-2026` (client). Use `DEMO_TODAY=2026-09-28T08:30:00+04:00` so the seeded schedule
lines up with "today".

## Scripts (`npm run <script> -w @shift/api`)

| script | what it does |
|---|---|
| `dev` | `tsx watch src/server.ts` |
| `start` | `tsx src/server.ts` (production) |
| `typecheck` | `tsc --noEmit` over src + tests |
| `test` | vitest against a real, throwaway PostgreSQL (see Tests) |
| `db:push` / `db:migrate` | apply SQL migrations in `drizzle/` (tracked in `drizzle.__drizzle_migrations`; safe on every deploy) |
| `db:generate` | regenerate migrations from `src/db/schema.ts` after a schema change (drizzle-kit, via `scripts/drizzle-kit.mjs`) |
| `db:seed` | load core's `masterSeed()` (+ `demoSeed()` when `SEED_DEMO=true`). Flags: `-- --reset` truncate everything first; `-- --overwrite` replace existing seed rows |

`db:seed` is idempotent: by default it only inserts rows whose id is missing, so the coach's edits survive re-running
it. Users without a password get `SEED_ADMIN_PASSWORD` (default `shift-admin-2026`) or `SEED_CLIENT_PASSWORD`
(default `shift-client-2026`); the passwords are printed. Without demo data an admin account is created from
`settings.adminAccount`.

## Environment

| var | default | notes |
|---|---|---|
| `DATABASE_URL` | — (required) | `postgres://user:pass@host:5432/db` |
| `PORT` / `HOST` | `4000` / `0.0.0.0` | |
| `NODE_ENV` | `development` | `production` → Secure cookies, HSTS, generic 500 messages, COOKIE_SECRET required |
| `COOKIE_SECRET` | dev-only fallback | **required in production**, ≥ 32 chars (`openssl rand -hex 32`) — signs the session cookie |
| `PUBLIC_URL` | `''` | prefixed to upload URLs. Empty = relative `/uploads/…` (same-origin prod). Set to the API origin in dev |
| `CORS_ORIGIN` | — | comma-separated origins, only if the SPA runs on a different origin than the API |
| `UPLOAD_DIR` | `./uploads` | relative to `apps/api`; mount a persistent volume in production |
| `SMTP_URL` | — | `smtps://user:pass@host:465`. Unset → emails are marked `logged` and printed, not sent |
| `MAIL_FROM` | `SHIFT Coaching <no-reply@localhost>` | fallback sender when a template has no `fromEmail` |
| `WEB_DIST` | — | e.g. `../web/dist`: serve the built SPA with history fallback |
| `DEMO_TODAY` | — | pins core's `now()` (demo only) |
| `TZ` | system | core formats times in local time — run in the coach's zone (`Asia/Dubai`) |
| `TRUST_PROXY` | `false` | `true` behind a load balancer so rate limits see the client IP |
| `EMAIL_POLL_MS` | `15000` | outbox polling interval; `0` disables the worker |
| `BCRYPT_ROUNDS` | `12` | |
| `LOG_LEVEL` | `info` | pino level |
| `PAYMENT_PROVIDER` | `manual` | see Payments |
| `SEED_DEMO`, `SEED_ADMIN_PASSWORD`, `SEED_CLIENT_PASSWORD` | | `db:seed` only |

Config is validated at boot (`src/config.ts`); the process exits listing every problem.

## Endpoints

All JSON. Errors are `{ "error": "message" }` with a meaningful status (400 validation, 401 not signed in,
403 not allowed, 404, 409 conflict, 413 too large, 415 wrong file type, 429 rate limited, 500).

| method & path | auth | maps to |
|---|---|---|
| `GET /api/health` | – | `{ ok, db }` (503 if the DB is down) |
| `POST /api/auth/login` `{email,password}` | – (10/min/IP) | `{ user }` + `sid` cookie |
| `POST /api/auth/logout` | – | 204, session deleted |
| `GET /api/auth/me` | – | `{ user \| null }` |
| `POST /api/auth/register` `{name,email,password}` | – (5/min/IP) | 201 `{ user }`, creates a **client** and signs in |
| `POST /api/auth/password` `{currentPassword,newPassword}` | signed in | change own password (other sessions signed out) |
| `POST /api/auth/password` `{userId,newPassword}` | admin | set a client's password (e.g. after `createClient`) |
| `GET /api/c/:col?where=<json>` | per core | `listRecords` (public: active master items only) |
| `GET /api/c/:col/:id` | per core | `getRecord` |
| `POST /api/c/:col` | per core | `createRecord` → 201 |
| `PATCH /api/c/:col/:id` | per core | `updateRecord` |
| `DELETE /api/c/:col/:id` | per core | `deleteRecord` → 204 |
| `POST /api/c/:col/reorder` `{ids}` | per core | `reorderRecords` → 204 |
| `POST /api/actions/:name` | per action | core `runAction` (120/min/IP) |
| `POST /api/uploads` (multipart `file`) | admin | `{ url }` — PNG/JPEG/GIF/WebP/PDF ≤ 10 MB |
| `GET /uploads/*` | – | uploaded files |
| `GET /*` | – | SPA (`WEB_DIST`) with history fallback |

`:col` must be a key of core's `COLLECTIONS`; `:name` an own key of `ACTIONS`.

## Architecture

```
src/
  server.ts        listen + graceful shutdown (only file that binds a port)
  app.ts           buildApp(): plugins, security headers, hooks, error handler, static, worker
  config.ts        env → validated Config
  auth.ts          sessions, bcrypt, request.actor, /api/auth/*
  routes.ts        /api/c/*, /api/actions/*, /api/uploads, /api/health; body sanitising
  db/schema.ts     Drizzle tables: c_<collection> ×38 + sessions
  db/store.ts      PgStore implements core's Store
  db/client.ts     pool, drizzle, migrator
  email.ts         outbox worker + branded HTML
  storage.ts       FileStorage: LocalDiskStorage (+ documented S3Storage stub), magic-byte sniffing
  payments.ts      PaymentProvider: ManualProvider (+ card gateway TODO)
  seed.ts          db:seed
drizzle/0000_init.sql   generated migration
```

**PgStore.** One table per collection (`c_wheel_areas`, …): `id text pk, sort int, active bool, owner_id text
(indexed), data jsonb (GIN-indexed), created_at, updated_at`. Records round-trip as `{ ...data, id, sort, active,
ownerId, createdAt, updatedAt }`. `where` maps meta keys to columns and everything else to `data @> {...}`
containment; arrays mean IN. Ordered by `sort, created_at`. `insert` assigns `newId()` and `sort = max+1`; `ownerId`
defaults to the collection's owner field (`userId`). `update` shallow-merges into `data`. `reorder` runs in a
transaction. User emails are unique (case-insensitive index). `test/store.contract.ts` runs the same behavioural
suite against core's MemoryStore and PgStore.

**Auth.** 32-byte random token in an httpOnly, signed, `SameSite=Lax` `sid` cookie (Secure in production, 30 days);
only `sha256(token)` is stored (`sessions` table). Login rotates the session; password change signs out other
sessions; expired sessions are purged hourly. The actor is resolved once per request (`request.actor`, hash removed).

**Email.** Core actions queue `outbox` rows (`queued`). The worker (every `EMAIL_POLL_MS`, guarded by a Postgres
advisory lock so only one instance sends) delivers via SMTP with the template's `fromName <fromEmail>` (else
`MAIL_FROM`), a text part and a simple branded HTML part, then marks `sent`. Without `SMTP_URL` it marks `logged`.
Failures stay `queued` with `attempts`/`lastError`, retried up to 5 times.

**Payments.** `src/payments.ts` defines `PaymentProvider { createCheckout, handleWebhook }`. `ManualProvider`
(bank transfer / payment link) leaves the purchase as core created it; the coach marks it paid in the admin. A card
gateway (Stripe / Telr / Network International) is documented there as a TODO — **see the warning below**.

## Security notes

- Permission rules are core's (`permissions.ts`, `crud.ts`, `runAction`) — the API never re-implements them.
- Generic CRUD bodies are sanitised: `passwordHash` is never writable (passwords only via `/api/auth/password`);
  non-admins cannot set `ownerId`, `role`, `id`, timestamps, nor change the owner field (`userId`) on update.
  `where` cannot filter on `passwordHash`. Every `/api` response is scrubbed of `passwordHash` (defence in depth).
- Login timing does not reveal whether an email exists; passwords 8–72 bytes; bcrypt cost 12.
- Registration never claims an existing account (including passwordless ones the coach created) → 409.
- Rate limits: login 10/min, register 5/min, actions 120/min, uploads 30/min per IP (set `TRUST_PROXY=true` behind a proxy).
- CSRF: SameSite=Lax cookies **and** non-GET `/api` requests with a foreign `Origin` are rejected (403).
- Helmet: strict CSP (`script-src 'self'`, Google Fonts allowed, YouTube/Vimeo frames), HSTS in production,
  `frame-ancestors 'none'`, nosniff, no-referrer. API responses are `Cache-Control: no-store`.
- Uploads: admin only, ≤ 10 MB, declared type must be PNG/JPEG/GIF/WebP/PDF **and** match the file's magic bytes
  (SVG/HTML rejected), random file names, served with nosniff.
- JSON bodies with `__proto__` / `constructor.prototype` keys are rejected. 500s never expose internals in production.
- **Before taking card payments:** core's `purchase`/`enrol` actions currently mark card purchases `paid` and grant
  access immediately. Route card payments through a `PaymentProvider` (purchase `pending` until the signed webhook
  confirms) — or disable the card option in Settings → payment options until then.

## Deployment

- **Docker** (repo root): `COOKIE_SECRET=$(openssl rand -hex 32) docker compose up --build` → PostgreSQL 16 + the
  app on :4000 (API + SPA). The image runs migrations on start, seeds when `SEED_ON_START=true` (idempotent), runs
  as the `node` user, stores uploads in the `/data/uploads` volume and has a health check. Put TLS in front
  (Caddy / nginx / a load balancer) and set `PUBLIC_URL`, `SMTP_URL`, `TRUST_PROXY=true`.
- **Single instance with local uploads.** For several instances, switch `FileStorage` to S3 (see `src/storage.ts`);
  the email worker is already multi-instance safe; rate-limit counters are per instance (add a Redis store to
  `@fastify/rate-limit` if needed).
- Back up PostgreSQL (`pg_dump`) and the uploads volume.
- After first deploy, sign in as the admin and change the seeded password.

## Tests

`npm test -w @shift/api` — vitest. `test/global-setup.ts` `initdb`s a throwaway PostgreSQL 16 cluster in a temp dir
(binaries from `PG_BIN`, default `/usr/lib/postgresql/16/bin`; when run as root it runs as the `postgres` OS user),
starts it on a free port and tears it down afterwards. Each test file gets its own database. Set
`TEST_DATABASE_URL` to use an existing server instead (e.g. a CI service container).

- `test/store.test.ts` — the shared Store contract against MemoryStore and PgStore (incl. core actions on both), schema checks.
- `test/api.test.ts` — HTTP behaviour via `app.inject`: health, public/inactive visibility, login/logout/me/register/password,
  permissions (403s, owner scoping), password-hash scrubbing, actions, email worker, CRUD + reorder + delete, uploads,
  CSRF origin check, rate limiting, SPA fallback, idempotent seed.
