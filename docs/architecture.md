# Architecture

## Stack and why

| Concern | Choice | Reason |
|---|---|---|
| Build / dev | Vite 8, TypeScript ~6.0 (strict) | Matches the sibling `Bonuca-Admin` toolchain; fast dev server |
| UI | React 19, Tailwind CSS 4 (token-driven), lucide-react icons | Same family as Admin; Tailwind utilities generated from design tokens |
| Routing | React Router 7 (`createBrowserRouter`, lazy routes) | Required by the brief; code-split per page |
| Server state | TanStack Query 5 | Loading/error/refetch states and cache invalidation over an async backend contract |
| Forms | react-hook-form 7 + zod 4 | Complex conditional forms (tiers, rewards lists). A 30-line local `zodResolver` replaces `@hookform/resolvers`, whose v6 has unresolvable optional peer deps |
| Charts | Recharts 3 | Single-series charts with tooltips |
| QR | `qrcode` (render), `jspdf` (PDF export, lazy-loaded) | Printable PNG/PDF QR codes (§4.2, §4.4) |
| Tests | Vitest 5 + Testing Library (jsdom), Playwright | Unit/integration in jsdom; real-browser journeys |
| Lint | oxlint (react, typescript, jsx-a11y, import plugins) | Same linter as Admin |

## Layers

```
src/types/domain.ts      Typed entities from the spec (Business, Program union, Campaign union, Customer,
                         Membership, Transaction, RewardInstance, NotificationCampaign, Subscription, …)
src/lib/                 Pure business rules — no React, fully unit tested
  plan.ts                Preview / Free / Trial / Paid / Super Admin Override resolution (§2)
  access.ts              Role × plan permission matrix, exact Preview message, plan limits, authorize()
  lifecycle.ts           Draft → Publish → Active ⇄ Paused, Archive (§4.2)
  scanEngine.ts          Stamp/points/visit/redeem/voucher/win-back/surprise transaction rules (§4.4, §4.7, §4.8)
  points.ts tiers.ts rewards.ts metrics.ts walletContent.ts gamification.ts color.ts …
src/schemas/             zod validation shared by forms and the backend layer
src/services/
  backend.ts             BusinessBackend — the one data contract for the whole UI
  integrations.ts        AI / Billing (Stripe) / Notification push / Wallet gateways (all "not connected")
  dev/                   DevBackend (localStorage) — development adapter, seeds sample accounts
  container.ts           Wires the adapter selected by VITE_DATA_SOURCE (only "dev" exists)
src/mocks/               Sample/demo datasets and Super-Admin-style plan catalog (development only)
src/state/               React contexts: services, session/access, theme, toasts
src/i18n/                Typed dictionaries (en source; de/tr/fr/it provisional) + provider
src/components/          Shared UI: ui/ (primitives), layout/ (shell, nav), feedback/ (GuardedButton,
                         banners, query states), forms/ (image, colour, opening hours), data-display/
src/features/<feature>/  pages/ (lazy routes), components/, hooks.ts (React Query)
src/app/                 Router, stage guards, providers, route error boundary
```

### Data flow

Page → feature hook (`useQuery`/`useMutation`) → `BusinessBackend` method → (dev) `DevBackend`, which:
1. resolves the session user, business dataset and `PlanState`;
2. calls `authorize(accessContext, permission)` and `assertWithinLimit(...)` — the **same** rules the UI
   uses, so restrictions are enforced in application logic, not only by hiding controls;
3. validates with the shared zod schemas;
4. applies pure functions from `src/lib` on a cloned dataset and persists it.

In Preview Mode, reads return a freshly generated demo dataset (never persisted); all mutations except
plan selection are rejected with the exact spec message. Real business data is never deleted by mode changes.

### Access model

`evaluate(ctx, permission)` returns `{allowed}` or a reason (`role` | `preview` | `plan` | `limit`) with a
user-facing message. `GuardedButton` renders denied actions visible but `aria-disabled`, showing the reason
on hover/focus/click. `RequirePermission` blocks routes by role; navigation is filtered by the same permissions.
Frontend checks are not a substitute for server-side authorization in a production API.

### Onboarding stages

`stageOf(session)`: `anon → verify → business → plan → first_program → app`. `StageRoute` redirects any
URL to the correct step; `AppRoute` provides the `BusinessSessionProvider` for `/app/*`.

## Design tokens & theming

`src/styles/tokens.css` defines Bonuca platform tokens for light (`#FBFBFB / #0A0A0A / #1747F8`) and dark
(`#010414 / #FFFFFF / #1747F8`), the wallet gradient `#0A112F → #000000`, and **provisional** surface,
border, muted and status colours (OI-09). `global.css` maps them to Tailwind utilities via `@theme inline`.
`ThemeProvider` resolves System/Light/Dark and sets `data-theme` on `<html>`. Business branding (logo,
primary/secondary/background, font) is stored per business and used on business-branded surfaces and wallet
previews; it never overrides Bonuca chrome tokens.

Charts use a single hue (Bonuca Blue). The palette validator passes in light mode; on the provisional
dark surface Bonuca Blue measures 2.96:1 (< 3:1), so every chart ships a Chart/Table toggle as relief.

## Integration boundaries

| Dependency | Interface | Current adapter behaviour |
|---|---|---|
| Business API / auth | `BusinessBackend` | `DevBackend` in localStorage (clearly bannered) |
| Email (verification, invites) | via `EmailDelivery` result | not sent; code/link shown in a "Development" callout |
| Stripe (web checkout, invoices, payments, billing info) | `BillingGateway` | rejects `IntegrationNotConnectedError` |
| App Store / Google Play | — | not part of the web portal; purchase source displayed read-only |
| Apple/Google Wallet pass push | `WalletGateway` | not connected; UI states updates are not sent |
| Wallet push notifications | `NotificationGateway` | rejects; campaigns stay Draft |
| AI (campaign drafts, bonus generator, heatmap commentary) | `AiGateway` | rejects; no draft fabricated |
| QR scanning | browser `BarcodeDetector` + camera | falls back to labelled manual code entry |

## Error handling

- `lib/errors.ts` — `ValidationError`, `NotFoundError`, `AuthError`, and `errorMessage()` (single mapping
  to user-facing text, including `AccessDeniedError` and `IntegrationNotConnectedError`).
- `QueryState` renders loading / error-with-retry for every query; `EmptyState` for empty lists.
- Mutations surface errors through toasts or inline `role="alert"` messages.
- `RouteError` is the router error boundary.

## Testing

- `tests/unit` — rules (access, plan, lifecycle, points, rewards, search, metrics, wallet content, schemas,
  scan engine, gamification, i18n completeness) and `DevBackend` enforcement.
- `tests/integration` — the real router and providers with an in-memory seeded backend (`renderApp`).
- `tests/e2e` — Playwright journeys (desktop + Pixel 7 for `@responsive`).
