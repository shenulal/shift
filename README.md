# SHIFT Coaching

*A calmer mind. A clearer you. A brighter tomorrow.*

Marketing website, the self-paced **SHIFT Journey** member app, a 1:1 client portal and a coach **admin dashboard + CMS** for Edel — built from the 39 design images.

## What's inside

| Area | Routes | Notes |
|---|---|---|
| Public site | `/`, `/method`, `/about`, `/path` (+ Find Your SHIFT quiz), `/discover`, `/tools`, `/tools/:id`, `/journey`, `/coaching` (packages comparison), `/enquiry`, `/discovery-call`, `/enrol`, `/onboarding`, `/process`, `/complete`, `/brochure` (8-page brochure) | Images 1, 3, 16, 20–29, 32 |
| Free tool | `/discover/start` | Images 2 — Wheel of Life + 6 questions → First SHIFT + email capture |
| Member app | `/app` (My Journey), `/app/journey`, `/app/stage/:id`, `/app/lesson/:id?step=1-4`, `/app/stage/:id/reflection`, `/app/tools`, `/app/portal` (1:1 portal), `/app/checkpoint/:id`, `/app/blueprint` (4-page PDF), `/app/onboarding` | Images 4–19, 39 |
| Coach admin | `/admin` (Overview), `/admin/clients(/:id)`, `/admin/pipeline`, `/admin/analytics`, `/admin/preview`, `/admin/cms/{plans,toolkits,journey,questions,forms,content,branding,settings}` | Images 33–38 + full CMS |

## Architecture

```
packages/core   Domain model, MASTER vs DYNAMIC collection registry, Store port, seed (all copy from the designs),
                calculations, permissions, business actions, permission-checked CRUD. Shared by API and web.
apps/api        Fastify 5 + Drizzle + PostgreSQL: sessions/roles, generic CRUD + actions, uploads, email outbox worker.
apps/web        React 18 + Vite + React Router + TanStack Query. One SPA: public, member, admin.
```

- **Master data** (plans, products, toolkits + tools, stages, 15 lessons with steps/tools/questions, checkpoints, Wheel of Life areas, free-tool questions, quiz, forms, email templates, page copy, FAQs, client-journey & pipeline stages, lead sources, letters, Blueprint template, branding, settings) is edited in the admin with add / edit / delete (with "used by X" warning) / duplicate / reorder / active toggle. The site reads only from these collections, so a rename or price change shows everywhere at once. Inactive items disappear publicly; historical client data is kept.
- **Dynamic data** (wheel scores, free-tool answers, lesson work and reflections, tool submissions, habits and check-ins, goals, Future Self card, Blueprint, enquiries, bookings, purchases, form submissions, notes, outbox, analytics) is written only through core actions and is visible to its owner and the coach.
- The same core CRUD and actions run in two places: the API (PostgreSQL) and an in-browser demo store (`vite --mode demo`), so the review build behaves exactly like production.

## Run it

```bash
npm install
# Demo with no server (seeded data in localStorage; switch Visitor / Sarah / Edel from the top bar)
cd apps/web && npx vite --mode demo        # open http://localhost:5173/#/

# Full stack
cp apps/api/.env.example apps/api/.env     # set DATABASE_URL, COOKIE_SECRET
npm run db:push && SEED_DEMO=true npm run db:seed   # prints seeded passwords
npm run dev:api                            # API on :4000
npm run dev                                # web on :5173 (proxies /api)

# Docker (Postgres + app on :4000)
COOKIE_SECRET=$(openssl rand -hex 32) docker compose up --build
```

Tests: `npm test` (core) and `npm test -w @shift/api` (71 tests against a real PostgreSQL 16). Typecheck: `npm run typecheck`.

## Decisions taken from the audit

- Packages: **Foundation / Momentum / Transform** (5 / 10 / 15 sessions) with "Start / Build / Deepen Your SHIFT" subtitles; "SHIFT Start / Grow / Transform" kept as editable display aliases. Brochure page 6 is generated from the plans.
- One Wheel of Life everywhere: the lesson set from image 18.
- Transform has 3 lessons (15 total), ending with the Personal Blueprint.
- Intention order: Your Future Self → What Really Matters → From Wish to Intention. Know Yourself uses the Values Compass; Power of the Pause uses STOP.
- Demo clock is Monday 28 Sep 2026; seeded dates keep the weekdays from the designs (Mon 28 Sep, Wed 30 Sep, Thu 1 Oct, Fri 2 Oct, Sun 4 Oct).

## Before going live

1. **Card payments**: `purchase`/`enrol` currently mark card payments as paid. Route card payments through a gateway (`apps/api/src/payments.ts` has the interface) and grant access from the webhook — or disable the card option in Settings until then.
2. **Prices**: the 1:1 packages and The SHIFT Journey have no price in the designs (shown as "Price on enquiry"). Set them in Plans & Pricing.
3. **Content marked DRAFT in admin**: FAQ answers, intake/completion/feedback/check-in questions, 7 email templates, the quiz, stage reflection questions. Review and un-flag.
4. **Placeholders**: coaching agreement + privacy notice text (legal), lesson video URLs, worksheet PDFs, booking link, real photography (Branding › Images) and toolkit exercise content.
5. Set `TZ=Asia/Dubai` on the server (done in Docker) and real SMTP (`SMTP_URL`).
