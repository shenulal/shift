# SHIFT Coaching — build notes for contributors

Monorepo (npm workspaces):

- `packages/core` — domain types, master/dynamic collection registry, `Store` port, seed data (all copy from the 39 designs), calculations (`calc.ts`), permissions, business actions (`actions.ts`), permission-checked CRUD (`crud.ts`). **Read-only for UI work.** Tests: `npx vitest run` in packages/core.
- `apps/web` — React 18 + Vite + React Router 6 + TanStack Query. One SPA with three areas: public site, member app (`/app`), coach admin (`/admin`).
- `apps/api` — Fastify + Drizzle + PostgreSQL. Same core CRUD/actions over a Postgres store.

Design images: `/mnt/user-data/uploads/Shift Edel Project/ShiftEdel_01.jpeg … _39.jpeg`. Inventory: `docs/MASTER_DATA_INVENTORY` (on the design canvas).

## Data rules (the point of this project)

- Everything the coach can configure is a **MASTER** collection (plans, products, toolkits, stages, lessons, checkpoints, wheelAreas, freeTool, freeQuestions, quiz, forms, emails, pages, faqs, journeyStages, pipelineStages, leadSources, letters, blueprint, branding, settings). UI must **read copy, prices, names, questions, options from these collections — never hard-code them in JSX.** Only structural UI labels ("Save and Continue" etc. that are not in master data) may be literal.
- Public/member UI shows **active** items only → use `usePublicList(col)`. Admin uses `useList(col)` (includes inactive).
- Page copy lives in `pages` collection; read with `useContent('home')` (from `@/lib/content`) which also fills `{toolkit_price}`, `{duration}`, `{platform}`, `{validity}`, `{reschedule}`.
- Prices: `<Price amount={plan.price} />` (null → "Price on enquiry"), or `formatPrice()` from core. Currency comes from settings.
- **DYNAMIC** data is written only through actions: `useAction('saveWork')`, `saveWheel`, `saveHabit`, `deleteHabit`, `toggleHabitCheck`, `saveGoal`, `saveCard`, `submitForm`, `saveNote`, `submitEnquiry`, `submitFreeTool`, `bookDiscovery`, `purchase`, `enrol`, and admin actions `duplicate`, `usage`, `overview`, `moveLead`, `triggerEmail`, `assignPackage`, `resetProgress`, `createClient`. See `packages/core/src/actions.ts` for payloads. Generic admin CRUD: `useCrud(col)` → `create/update/remove/reorder` mutations.
- Work for a lesson is one `work` record per (user, context) where context = `lesson:<id>`, `stage:<stageId>`, `checkpoint:<id>`. `saveWork` merges `reflections`, `tool`, `nextStep` and keeps the max `step`.
- Demo clock: `now()` from core (pinned to Mon 28 Sep 2026 in the demo). Never use `new Date()` for "today" — use `now()`.

## UI kit (shared — do not edit; add area-specific components inside your own folder)

`@/ui/kit`: Button (variants primary/taupe/rose/sage/outline/ghost/soft/light/danger, `to` for links, `arrow`, `icon`, `caps`, `size`), IconButton, Kicker, Script (Allura), Pill, Num, IconCircle, SectionHead, Checklist, Price, Ring, ProgressBar, Stepper, Tabs, Field, TextInput, TextArea (word count), Select, Checkboxes (with Other), Slider, PhoneInput, FieldRenderer (renders master `FieldDef`), useAutosave + AutosaveIndicator, Modal, Confirm, ToastProvider/useToast, Empty, Loading, VideoPlayer, DraftTag, colorClass.
`@/ui/Icon` (line icons by name), `@/ui/Art` (placeholder nature photography by scene name or URL, with handwritten `quote` overlay and `note` text on objects), `@/ui/Logo`, `@/ui/charts` (WheelOfLife interactive, Radar, Bar).
CSS: `src/styles.css` (tokens + classes: wrap, section, grid-2/3/4/5, split, sidebar-layout, card, card-soft/sage/blush/taupe/deep, pill-*, btn-*, kicker, script, h-display/h1/h2/h3/h4, lead, table, tabs, c-<color>, etc.). Put area styles in `src/pages/<area>/<area>.css` and import it from your pages.

Brand: Playfair Display headings, Montserrat body + uppercase letter-spaced labels, Allura handwritten accents. Sage / taupe / beige / blush / white / charcoal, deep green pill buttons with arrow. Soft beige rounded cards. Line icons, no emoji.

## Running

- Demo (no server): `npx vite --mode demo --port <port>` inside `apps/web`, then open `http://localhost:<port>/#/…` (hash routing). Demo bar at the top switches Visitor / Sarah (client) / Edel (admin).
- Screenshots: `node /tmp/claude-0/-home-claude/d2a5c688-ec7b-574e-94e1-d09ad1811347/scratchpad/pw/shot.mjs "<url>" <out.png> <width> <height> <fullPage 1|0>` (Chromium at /opt/pw-browsers/chromium). Google Fonts don't load in the sandbox, so screenshots show fallback fonts — that's expected.
- Typecheck: `npx tsc -p apps/web/tsconfig.json --noEmit` from the repo root (fix only errors in files you own).
- Responsive: every page must work at 390px wide with no horizontal page scroll (wide tables go in `.scroll-x`).
- Accessibility: real buttons/links/labels, alt text or aria-hidden on art, 4.5:1 text contrast.
