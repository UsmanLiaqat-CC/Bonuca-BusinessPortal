# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ground rules for this project

- **The specification is the source of truth:** `../Bonuca_Business_Portal_Spec.docx`. Do not add product features it does not describe, and do not drop or simplify ones it does. Use its labels and terminology. Never edit the docx.
- **Unconfirmed items stay unconfirmed.** Anything the spec flags as open (or that it leaves undefined) lives in `docs/open-items.md` as `OI-xx`. Code that implements a provisional answer cites its OI number in a comment. Never present such behaviour as final in the UI or docs.
- **Do not modify `../Bonuca-Admin`.** It is a separate project with its own git repo. Keep every portal file inside this folder.
- **Never fake an integration.** Email, Stripe, App Store/Google Play, Apple/Google Wallet pushes, notification delivery and AI are not connected. Their adapters must reject with `IntegrationNotConnectedError`, and the UI must say so. Do not invent API endpoints, prices, or "sent"/"paid"/"issued" states.
- **Traceability workflow.** Every requirement has an ID in `docs/requirements-traceability.md` (`ONB-`, `ACC-`, `PRG-`, `WAL-`, `QR-`, …). When you change behaviour, update that row's status and verification column. Mark a row `Verified` only when a named test (or recorded browser check) passes. New ambiguities go in `docs/open-items.md` Part B.
- **Verify every change:** `npm run typecheck && npm run lint && npm test`, plus `npm run test:e2e` for flow changes. Report failures as they are.

## Commands

```bash
npm install
npm run dev                      # Vite dev server on :5174 (dev backend seeds sample accounts)
npm run build                    # tsc -b && vite build
npm run typecheck                # tsc -b --noEmit (strict)
npm run lint                     # oxlint src tests (config: .oxlintrc.json)
npm test                         # vitest run — unit + integration (jsdom)
npx vitest run tests/unit/points.test.ts      # single file
npx vitest run -t "Preview Mode"              # by test name
npm run test:e2e                 # Playwright; starts its own Vite on :5175
npx playwright test -g "scans a pass"         # single e2e test
```

Development sample logins (seeded on first run, shown on `/login` when dev tools are enabled): `owner@sample.dev`, `manager@sample.dev`, `employee@sample.dev`, all with password `Bonuca123`. The floating **Dev tools** panel (`VITE_ENABLE_DEV_TOOLS`) simulates Super Admin overrides and trial expiry. It is development tooling, not product. Reset data by clearing the `bonuca.dev.db.v1` localStorage key or using "Reset all development data".

## Architecture

The stack is Vite 8, React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind 4, React Router 7, TanStack Query, react-hook-form + zod (a local `zodResolver` in `src/lib/forms.ts`, with no `@hookform/resolvers` dependency), Recharts, `qrcode` and jsPDF (lazily imported).

**Layers. Business rules never live in components:**

- `src/types/domain.ts` defines every specified entity: `BusinessDataset` is the aggregate for one business account.
- `src/lib/` holds pure, unit-tested rules:
  - `plan.ts` resolves Preview/Free/Trial/Paid/Override.
  - `access.ts` contains the role × plan permission matrix, `PREVIEW_LOCK_MESSAGE` (the exact spec wording) and plan limits.
  - `lifecycle.ts`: Draft → Publish → Active ⇄ Paused, plus Archive.
  - `scanEngine.ts` holds all transaction rules (stamps, points, tiers, vouchers, win-back, surprise rewards).
  - `points.ts`, `rewards.ts` (derived reward states), `metrics.ts` (dashboard/analytics), `walletContent.ts` (what a pass shows), and `gamification.ts`. Gamification must never be imported by access or the scan engine.
- `src/schemas/` contains zod schemas shared by forms **and** the backend layer. Program/campaign drafts need only a name; Publish (and edits to live items) enforces the full schema.
- `src/services/backend.ts` defines `BusinessBackend`, the single data contract every screen uses. Its only implementation is `services/dev/DevBackend`, an in-browser adapter over localStorage. It calls `authorize()` and `assertWithinLimit()` on every mutation, so access is enforced in logic as well as in the UI. In Preview Mode its reads return the generated demo dataset (`mocks/sampleDataset.ts`) and leave real data untouched. A production adapter would implement the same interface; `VITE_DATA_SOURCE` must stay `dev` until one exists.
- `src/services/integrations.ts` holds the external gateways (`ai`, `billing`, `notifications`, `wallet`). They are injected through `ServicesProvider`, so tests can pass fakes.
- `src/state/` holds the React context: services, the session (`useAccess()` exposes `can`/`evaluate`/`limit`), theme and toasts.
- `src/features/<feature>/` holds `pages/` (lazy routes), `components/` and `hooks.ts` (React Query wrappers around the backend). Mutations invalidate their query keys (`programs`, `customers`, `dashboard`, `session`, …).

**Routing and guards (`src/app/`):** `stageOf(session)` drives the flow anon → verify email → business profile → plan → first program → app, and `StageRoute`/`AppRoute` redirect to the correct step. Inside `/app`, `RequirePermission` blocks routes by role, and `NAV_ITEMS` (`components/layout/nav.ts`) filters the sidebar by permission.

**UI conventions:**

- Use `GuardedButton` for any action subject to role or plan. It stays visible, is `aria-disabled`, and explains the reason (the Preview message, a role lock, or a plan limit through `extra`).
- `PageHeader` automatically shows the "Demo data" badge in Preview Mode.
- Show truthful status for missing services with `IntegrationNotice`.
- The visual system is the UI redesign (`Bonuca-UI-Redesign/`, see `Bonuca-UI-Redesign-README.md`). Its `tokens.css` and `app.css` are copied to `src/styles/redesign/` (fonts bundled there too); `app.css` is loaded into the `components` cascade layer and its `.grid`/`.sticky` rules are dropped because they collide with Tailwind. Use the redesign classes (`.card`, `.btn-*`, `.field`, `.tabs`, `.seg`, `.badge`, `.callout`, `.pass`, `.t` …) through the shared components in `src/components/` rather than re-implementing them.
- Colours come only from tokens: `src/styles/tokens.css` maps the portal's `--bn-*` names onto the redesign tokens, exposed as Tailwind utilities (`bg-canvas`, `text-fg`, `bg-accent`, `border-line`, `bg-ink`, `text-faint` …) in `global.css`. The redesign colours are final (client decision 2026-10-21, OI-45) and replace the colour-picked spec values; the surface/border/status colours are provisional (OI-09). A business's own branding never overrides the Bonuca tokens.
- Charts are wrapped in `ChartCard`, whose Chart/Table toggle is required because the accent sits below 3:1 contrast on the dark surface. Trend/bar charts are single-series Bonuca Blue; the redesign's categorical series (`SERIES` in `charts.tsx`) are used only for the membership donut (OI-45).
- i18n: `src/i18n/locales/en.ts` is the typed source dictionary. The `de`/`tr`/`fr`/`it` files are provisional and must contain every key (a test enforces this). Add new UI strings to all five, or keep them English-only and note it. To add a language, add a locale file, register it in `src/i18n/index.tsx`, and extend `LanguageCode`.

**Tests:**

- `tests/unit/` covers the pure rules plus `DevBackend` enforcement.
- `tests/integration/` renders the real router using `renderApp(path, { login })` from `tests/test-utils.tsx`, with an in-memory seeded backend.
- `tests/e2e/` holds Playwright journeys. Tag mobile-viewport tests with `@responsive`.
- Fixed-date fixtures are in `tests/fixtures.ts`.
