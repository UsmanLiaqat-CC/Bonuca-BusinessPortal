# Bonuca Business Portal

React web dashboard for the business side of Bonuca: the Owner, Manager and Employee experience described in
`../Bonuca_Business_Portal_Spec.docx`. This covers onboarding, plans and Preview Mode, loyalty programs, campaigns, wallet cards, the
QR scanner, customers, employees, notifications, rewards, analytics, branding, subscription and settings.

This is a **frontend only**. No backend, mobile app or Super Admin portal is included. Until the real Bonuca
API exists, the portal runs on an in-browser **development backend**, which is clearly bannered in the UI.

## Stack

Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS 4 · React Router 7 · TanStack Query · react-hook-form + zod ·
Recharts · qrcode · jsPDF · Vitest + Testing Library · Playwright · oxlint. See `docs/architecture.md`.

## Prerequisites

Node.js 20+ (developed on Node 25) and npm. To run end-to-end tests, Playwright's Chromium must be installed (`npx playwright install chromium`).

## Setup and commands

```bash
npm install
cp .env.example .env.local      # optional; defaults work for development
npm run dev                     # http://localhost:5174
npm run build                   # type-check + production build to dist/
npm run preview                 # serve the built bundle
npm run typecheck
npm run lint
npm test                        # unit + integration
npm run test:e2e                # Playwright journeys (starts its own server)
```

### Development accounts

On first run the dev backend seeds **Sample Business (development)**, currently on a Free Trial, with these logins:

| Role | Email | Password |
|---|---|---|
| Owner | owner@sample.dev | Bonuca123 |
| Manager | manager@sample.dev | Bonuca123 |
| Employee | employee@sample.dev | Bonuca123 |

You can also register a new business with **Start Free**. No email is sent: the 6-digit code appears on screen,
labelled as a development code. The **Dev tools** button (bottom-left, development only) simulates Super Admin overrides
and trial expiry, and resets local data.

## Environment variables (`.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_DATA_SOURCE` | Backend adapter. Only `dev` exists. Any other value fails loudly rather than pretending a backend is connected. |
| `VITE_ENABLE_DEV_TOOLS` | Shows the dev tools panel, sample logins and the sample-pass picker on the scanner. |
| `VITE_JOIN_BASE_URL` | Base URL encoded in printed QR codes. While unset, QR codes use a non-routable development URL and are labelled. |
| `VITE_APP_STORE_URL`, `VITE_PLAY_STORE_URL` | "Download App" links. While unset, the dialog says they are not configured. |

All `VITE_*` values are public: never put secrets in them.

## Routes

| Route | Screen | Spec § |
|---|---|---|
| `/` | Landing (Start Free, Log In, Download App, language) | 1.1 |
| `/register`, `/verify-email`, `/login`, `/accept-invite/:token` | Registration, email verification, login, invite acceptance | 1.2–1.3, 4.6 |
| `/onboarding/business`, `/onboarding/plan`, `/onboarding/first-program` | Business profile, plan selection / Preview, first program | 1.4–1.7 |
| `/app/dashboard` | Dashboard (Owner/Manager) | 4.1 |
| `/app/programs`, `/app/programs/new/:type`, `/app/programs/:id(/edit)`, `/app/campaigns/...` | Loyalty programs and campaigns | 4.2 |
| `/app/wallet-cards(/:id)` | Wallet Cards | 4.3 |
| `/app/scanner`, `/app/scanner/qr-codes` | QR Scanner, printable QR codes | 4.4 |
| `/app/customers(/:id)`, `/app/customers/signup-fields` | Customers | 4.5 |
| `/app/employees`, `/app/account` | Employees, Employee account | 4.6, 3.2 |
| `/app/notifications` | Manual campaigns, win-back, AI tools | 4.7 |
| `/app/rewards` | Reward states, surprise rewards | 4.8 |
| `/app/analytics` | Analytics, heatmap, AI commentary | 4.9 |
| `/app/branding` | Business branding and Bonuca tokens | 4.10 |
| `/app/subscription` | Subscription & Billing | 4.11 |
| `/app/settings/:section` | Settings | 4.12 |

## Demo-mode limitations and external dependencies

- **Data** lives in this browser's localStorage (`bonuca.dev.db.v1`). Nothing is shared across devices, and there is no real-time sync.
- **Not connected:** email delivery, Stripe checkout/invoices/payments, App Store / Google Play purchases, Apple/Google
  Wallet pass issuance and updates, wallet push notifications, and the AI service. Every one of these shows a truthful
  "not connected" state. Nothing reports success it didn't achieve.
- **Camera scanning** uses the browser `BarcodeDetector` API where available. Otherwise use the labelled manual
  code entry (or the development sample-pass picker).
- **Preview Mode** shows a generated demo dataset. Every page is labelled "Demo data", and locked actions show
  "Select a free trial, free plan, or paid plan to use this feature."
- **Translations:** the shell, navigation, auth, onboarding, common actions and banners are translated into DE/TR/FR/IT
  (provisional, pending review). Feature-screen copy is currently English-only.

## Specification tracking

- `docs/requirements-traceability.md` lists every requirement with its status and verification evidence.
- `docs/open-items.md` covers items the spec leaves unconfirmed, plus the provisional decisions made during the build.
- `docs/implementation-plan.md` maps phases to requirement IDs.

## Extending safely

1. Find (or add) the requirement ID in the traceability doc. If the spec is ambiguous, add an `OI-xx` instead of guessing.
2. Put rules in `src/lib` (pure, unit-tested) and validation in `src/schemas`, then expose them through `BusinessBackend`.
   Gate actions with a `Permission` in `lib/access.ts`, and use `GuardedButton` / `RequirePermission` in the UI.
3. To connect a real backend: implement `BusinessBackend` (and the gateways in `services/integrations.ts`) against the
   real API contract, select it in `services/container.ts`, and keep server-side authorization authoritative.
4. Run `npm run typecheck && npm run lint && npm test && npm run test:e2e`, then update the traceability row.
