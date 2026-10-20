# Requirements Traceability

Source of truth: `../Bonuca_Business_Portal_Spec.docx` (13 pages, §0 "How the systems connect" through §4.12).
Every requirement in the spec that applies to the **React web dashboard** has a row here. Rows that
belong to other systems (mobile app, Super Admin portal, customer wallet experience, backend
services) are listed with status **Out of Scope (other system)** so nothing disappears silently.

**Status snapshot (2026-10-20):** after implementation and verification (`npm test`: 13 files / 92 tests, `npm run test:e2e`: 49 tests incl. QA phases 1–8 in `docs/qa/README.md`, browser screenshots in `docs/qa/screenshots`).

**Statuses:** Not Started · In Progress · Implemented · Verified · Blocked by Dependency · Awaiting Clarification · Out of Scope (other system)

**Verified** means an automated test (unit/integration/e2e — the file is named in the Verification column)
or a recorded browser check passed. **Implemented** means the code exists but has no dedicated
automated check.

Roles: O = Owner, M = Manager, E = Employee. Plan modes: PV = Preview, FR = Free, TR = Trial, PD = Paid, SO = Super Admin Override.

## §0 How the systems connect

| ID | Requirement | Screen / module | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| SYS-01 | One business account, one dataset shared by web and mobile. | `services/backend.ts` (single `BusinessBackend` interface) | all | Implemented | Architecture review — single `BusinessBackend` interface | Real API required for cross-device sharing |
| SYS-02 | Roles control what is visible, not which app is used. | `lib/access.ts` | O/M/E | Verified | unit: access.test.ts | — |
| SYS-03 | Super Admin can override plan/billing; business sees a read-only result (e.g. "managed by Bonuca" banner). | `components/feedback/OverrideBanner` | all | Verified | integration: previewAndPlans.test.tsx (override banner) | Super Admin portal (other system) |
| SYS-04 | Wallet passes are generated/updated from portal actions; customers never edit passes. | scanner / programs → `WalletGateway` | — | Blocked by Dependency | Wallet integration not connected; UI states this | Apple/Google Wallet integration not available |
| SYS-05 | Changes to wallet, customer or subscription state stay in sync across web and mobile in real time; no offline/per-device version. | `services/` boundary; React Query invalidation | — | Blocked by Dependency | Needs real-time production backend | Real-time backend required |

## §1 Landing → Registration → Onboarding

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| ONB-01 | Landing primary actions: "Start Free" (begins registration), "Log In", "Download App". | `/` LandingPage | public | Verified | e2e: journeys.spec.ts (Start Free → registration); Download App dialog reviewed in code | OI-38 store URLs |
| ONB-02 | Language selectable on the landing page, or defaults to device/browser language. | `/` LanguageSelect, `i18n` | public | Verified | unit: insights.test.ts (i18n); detectLanguage uses browser language | OI-39 |
| ONB-03 | Registration fields: Full Name*, Email*(validated), Password*, Country*(dropdown), Phone (optional), Terms & Privacy checkbox*. | `/register` | public | Verified | integration: forms.test.tsx; unit: schemas.test.ts | OI-01 password rule |
| ONB-04 | Country is used to suggest default language/currency later — not a global currency. | `/register`, onboarding defaults, points currency default | — | Implemented | Country suggests interface language (business profile) and points currency (new programs) | — |
| ONB-05 | "Create Account" sends a verification email. | `/register` → `AuthGateway` | public | Blocked by Dependency | Email not connected — dev code shown (integration: forms.test.tsx) | OI-37 email provider |
| ONB-06 | Verification by link / 6-digit code; cannot proceed past registration until verified. | `/verify-email`, `RequireVerified` guard | — | Verified | integration: forms.test.tsx; e2e: journeys.spec.ts; unit: devBackend.test.ts | OI-37 |
| ONB-07 | Business profile: Business Name*, Category* (Café, Restaurant, Barber Shop, Beauty Salon, Bakery, Other), Logo (skippable), Address (later), Opening Hours (structured, later), Primary Brand Color (RGB, default applied), Preferred Interface Language* (EN, DE, TR, FR, IT +more). | `/onboarding/business` | O | Verified | e2e: journeys.spec.ts (required fields); optional fields reviewed in code | — |
| ONB-08 | No account-wide currency field; currency is per program. | `/onboarding/business` (absent), Points form | — | Implemented | No currency field on business profile (code review) | — |
| ONB-09 | Plan selection shows Free Plan, Free Trial (if enabled by Super Admin) and Paid Plans with pricing. | `/onboarding/plan` | O | Implemented | PlanSelectionPage + PlanOptions; prices shown as "not configured" (OI-05) | OI-05 prices, OI-13 |
| ONB-10 | "Skip for now" always available → Preview Mode. | `/onboarding/plan` | O | Verified | e2e: journeys.spec.ts (Skip for now → Preview) | — |
| ONB-11 | Choosing Free activates instantly, no payment details. | `/onboarding/plan` | O | Verified | e2e: journeys.spec.ts (Choose Free Plan) | — |
| ONB-12 | Choosing Paid on web opens Stripe checkout (mobile uses the app stores — not this app). | `/onboarding/plan` → `BillingGateway` | O | Blocked by Dependency | Stripe not connected — integration: previewAndPlans.test.tsx asserts truthful error | Stripe not connected; OI-02 |
| ONB-13 | Optional first program quick-create: type (Stamp/Membership/Tier/Points) + essential fields (name, reward, key rule). | `/onboarding/first-program` | O | Implemented | FirstProgramPage quick-create (draft) | — |
| ONB-14 | "I'll do this later" skip is always available. | `/onboarding/first-program` | O | Verified | e2e: journeys.spec.ts (I'll do this later) | — |
| ONB-15 | Onboarding ends on the Dashboard tab. | router | O | Verified | e2e: journeys.spec.ts (lands on /app/dashboard) | — |

## §2 Access Levels & Plan Logic

| ID | Requirement | Screen / module | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| ACC-01 | Preview Mode: read-only tour of every tab using demo/sample data. | `mocks/demoDataset`, backend preview routing, `DemoBadge` | PV | Verified | integration: previewAndPlans.test.tsx; e2e: journeys.spec.ts; unit: devBackend.test.ts | — |
| ACC-02 | Preview locks: creating programs, adding customers, inviting employees, live QR/wallet generation, campaigns, live setting changes, scanner with real data. Buttons stay visible but disabled. | `lib/access.ts`, `GuardedButton` | PV | Verified | unit: access.test.ts, devBackend.test.ts; integration: previewAndPlans.test.tsx | — |
| ACC-03 | Exact disabled message: "Select a free trial, free plan, or paid plan to use this feature." | `lib/access.ts` `PREVIEW_LOCK_MESSAGE` | PV | Verified | unit: access.test.ts; integration + e2e assert exact text | — |
| ACC-04 | Free Plan: real usage within configured limits (e.g. 15 customers, 1 program, 1 location, 1 employee). | `lib/access.ts` `checkLimit` + backend enforcement | FR | Verified | unit: access.test.ts, devBackend.test.ts (program limit) | OI-03 |
| ACC-05 | Free Trial: all paid features for a configurable period; on expiry no data deleted; reverts to Free if enabled, otherwise Preview. | `lib/plan.ts` `resolveAccessMode` | TR | Verified | unit: plan.test.ts | OI-04 |
| ACC-06 | Paid Plan: full features and limits. | `lib/plan.ts` | PD | Verified | unit: plan.test.ts | OI-05 |
| ACC-07 | Super Admin Override (free grant, billing paused, custom duration, unlimited): business cannot edit; read-only banner. | `OverrideBanner`, `lib/plan.ts` | SO | Verified | unit: plan.test.ts; integration: previewAndPlans.test.tsx | Super Admin portal |
| ACC-08 | No data deleted when moving between modes — only feature access changes. | `lib/plan.ts` (pure), dev backend never deletes on mode change | all | Verified | unit: devBackend.test.ts (data kept after trial expiry) | — |
| ACC-09 | Enforced in application logic, not only by hiding UI. | dev backend calls `authorize()` on every mutation | all | Verified | unit: devBackend.test.ts | Real server-side authorization needed in production |

## §3 Mobile App vs Web Dashboard

| ID | Requirement | Screen / module | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| EXP-01 | Owner/Manager management tabs on web: Dashboard, Customers, Loyalty Programs, Rewards, Analytics, Employees, Notifications, Settings, Subscription & Billing, QR Scanner (plus the §4 tabs Wallet Cards and Branding). | `components/layout/nav.ts` | O/M | Verified | integration: navigation.test.tsx | — |
| EXP-02 | Web gives a spacious, detailed layout (mobile app is a separate product). | Layout | — | Verified | Browser screenshots (desktop/mobile) + e2e @responsive | Mobile app out of scope |
| EXP-03 | Employee interface: QR Scanner, Customer Info (limited), Add stamp/point/visit, Redeem Reward, Recent Scans, Account & Logout. No billing, subscription, analytics or settings. | nav + route guards | E | Verified | integration: navigation.test.tsx; unit: devBackend.test.ts (limited customer info) | OI-18 |

## §4.1 Dashboard

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| DSH-01 | Stat cards: Total Members, New Members Today / This Week / This Month. | `/app/dashboard` | O/M | Verified | unit: insights.test.ts | — |
| DSH-02 | Stat cards: Total Scans, Active Programs, Wallet Cards. | `/app/dashboard` | O/M | Verified | unit: insights.test.ts | — |
| DSH-03 | Membership Distribution, Visits, Returning Customers. | `/app/dashboard` | O/M | Verified | unit: insights.test.ts | — |
| DSH-04 | Charts: Customer Growth, Daily Scans, Monthly Growth, Top Programs. | `/app/dashboard` | O/M | Verified | Browser screenshots (light/dark); ChartCard table view | — |
| DSH-05 | Employees do not see the Dashboard tab. | nav + guard | E | Verified | integration: navigation.test.tsx | — |
| DSH-06 | In Preview Mode everything is labelled demo data. | `DemoBadge` | PV | Verified | integration: previewAndPlans.test.tsx (Demo data badge) | — |
| DSH-07 | Override banner (non-editable, with end date if any). | `OverrideBanner` | SO | Verified | integration: previewAndPlans.test.tsx | — |

## §4.2 Loyalty Programs

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| PRG-01 | Several programs at once, including several of the same type. | `/app/programs` | O/M | Verified | unit: devBackend.test.ts (two stamp cards) | Free limit OI-03 |
| PRG-02 | Lifecycle Draft → Active (Publish) → Suspend/Paused; Draft invisible and has no QR. | `lib/lifecycle.ts` | O/M | Verified | unit: lifecycle.test.ts, devBackend.test.ts | — |
| PRG-03 | Suspended: join QR stops enrolling; existing members scanned as "temporarily unavailable"; no new stamps/points. | scanner + backend | O/M/E | Verified | unit: scanEngine.test.ts (paused → temporarily unavailable) | — |
| PRG-04 | Enable/Disable toggle (Active ⇄ Paused) on every program screen + separate Archive action. | `/app/programs/:id` | O/M | Implemented | LifecycleControls on program & campaign detail (code review) | — |
| PRG-05 | First "Publish" generates the printable join QR. | backend `publishProgram` | O/M | Verified | unit: devBackend.test.ts; e2e: journeys.spec.ts (QR shown after publish) | OI-36 |
| PRG-06 | Stamp Card fields: Name*, Logo*, Icon (defaults to Logo), Background* (RGB colour OR image, not both), Hero/Strip, Text Colour* (default, contrast auto-suggest), Number of Stamps*, Stamp Icon (icon set or upload; default coffee cup), Reward Description*, Reward Type* (Free item / % discount / Fixed discount / Custom), T&C, Expiry Rule (toggle + days). | `ProgramForm` stamp section | O/M | Verified | unit: schemas.test.ts; integration: forms.test.tsx; e2e publish | — |
| PRG-07 | Membership fields: Name*, visual controls (Logo*), Benefit Description*, Benefit Type* (% / Fixed / Perk only), Discount Value (only for discount types), Validity* (Permanent / Expires on date / Renews annually), T&C. | `ProgramForm` membership | O/M | Verified | unit: schemas.test.ts; integration: forms.test.tsx | — |
| PRG-08 | Membership Cards never track stamps or points. | backend scan logic | — | Verified | unit: scanEngine.test.ts | — |
| PRG-09 | Tier fields: Name*, Logo*/Icon/Hero, Enable Tiers*, Number of Tiers* (2–5), Upgrade Basis* (Visits/Points/Total Spend), per tier: Name* (defaults Member/Silver/Gold/Platinum/Diamond), Required Value*, Wallet Colour*, Badge, Rewards & Benefits*; Downgrade Rule (toggle + inactivity). | `ProgramForm` tier | O/M | Verified | unit: schemas.test.ts, scanEngine.test.ts | OI-28 |
| PRG-10 | Points fields: Name*, visual controls (Logo*), Currency* (EUR, USD, GBP, CZK, TRY, CHF, PLN, other), Ratio*, Awarding Method* (Fixed/Manual), Rounding* (up/down/nearest), Minimum Purchase, Max Points per Transaction, Rewards List* (≥1: name, points, icon), Point Expiry (toggle + months), Reward Expiry (toggle + days). | `ProgramForm` points | O/M | Verified | unit: schemas.test.ts, points.test.ts; integration: forms.test.tsx | OI-26, OI-27 |
| PRG-11 | Employee never picks a currency mid-scan; Manual awarding shows full preview (customer, current balance, amount, points to add, new balance, next reward, points still needed) before "Credit X points". | `/app/scanner` | O/M/E | Verified | unit: points.test.ts; integration: scannerAndTheme.test.tsx (full preview) | — |
| PRG-12 | Stamp acquisition campaign: Linked Stamp Card*, Campaign Name*, Starting Stamps* (0/1/2/3/Custom), Welcome Gift toggle → Reward Name, Description, Validity Period, Redemption Conditions; Campaign QR on publish (PNG/PDF). | `CampaignForm` | O/M | Verified | unit: schemas.test.ts (welcome gift conditional) | OI-29 |
| PRG-13 | One-time voucher campaign: Name*, Voucher Reward*, Valid From/To*, Logo*, Background, Text Colour; one shared QR; each claim redeemable once per customer. | `CampaignForm` + backend | O/M | Verified | unit: scanEngine.test.ts (single redemption), schemas.test.ts | — |

## §4.3 Wallet Cards

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| WAL-01 | No duplicate data entry — the wallet tab previews and fine-tunes fields entered in program setup. | `/app/wallet-cards` | O/M | Implemented | Wallet tab links back to program setup; no duplicate entry (code review) | — |
| WAL-02 | Option A Base Template (default): Digital Stamp Card, Membership Card, Tier Program Pass; structure not editable by the business. | `/app/wallet-cards/:id` | O/M | Implemented | WalletDesignPage (browser screenshot) | OI-30 (points/voucher) |
| WAL-03 | Option B Start from Scratch: blank canvas, RGB pickers, minimum Name + Background RGB + Text RGB, Logo optional, no structural elements. | `/app/wallet-cards/:id` | O/M | Awaiting Clarification | Confirmed minimum implemented (unit: schemas.test.ts, insights.test.ts); scope OI-06 | **Awaiting Clarification** OI-06 |
| WAL-04 | Master field list (Name, Logo, Icon, Background, Hero, Text/Label colour, auto QR not editable). | `WalletPassPreview` | — | Verified | unit: insights.test.ts; screenshot | — |
| WAL-05 | Per-type dynamic content (stamp grid + "X stamps to go"; benefit + Member Since; tier name/badge/colour + progress; points balance/progress/next reward/needed; voucher reward/dates/Redeemed flag). | `WalletPassPreview` | — | Verified | unit: insights.test.ts | OI-07 |
| WAL-06 | Live preview "iPhone / Android" updating on every master-field change in program setup. | `ProgramForm` + `WalletPassPreview` | O/M | Verified | integration: forms.test.tsx (live update + iPhone/Android) | — |
| WAL-07 | Push update mechanics (APNs webServiceURL / Google Wallet PATCH). | `WalletGateway` status | — | Blocked by Dependency | — | Wallet integration (backend) |
| WAL-08 | Warn before saving master-field edits on an Active program (retroactive to every issued pass). | `ProgramForm` confirm dialog | O/M | Implemented | ProgramForm master-field confirm dialog (code review) | — |
| WAL-09 | Default template uses the wallet gradient #0A112F → #000000 regardless of dashboard theme. | `tokens.css`, preview | — | Verified | unit: insights.test.ts | OI-10 |

## §4.4 QR System / Scanner

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| QR-01 | Printable QR codes: table, counter, sticker, flyer, window. | `/app/scanner/qr-codes` | O/M | Implemented | QrCodesPage + PNG/PDF export (code review) | OI-36, VITE_JOIN_BASE_URL |
| QR-02 | Per program, scanning does: add wallet card / register / join membership. | QR codes page | — | Implemented | Purpose labels per program type | Customer join flow (other system) |
| QR-03 | Employee scan flow: tap Scan → camera → identify customer + active program (Points Manual → amount step) → confirm add stamp / credit points / redeem reward. | `/app/scanner` | O/M/E | Verified | integration: scannerAndTheme.test.tsx; e2e: journeys.spec.ts | OI-36 camera |
| QR-04 | Wallet pass updates automatically after confirmation. | `WalletGateway` | — | Blocked by Dependency | — | Wallet integration |
| QR-05 | Target scan-to-confirm < 5 s (excluding manual entry). | scanner UX (single confirm step, duration recorded) | — | Implemented | Single confirm step; durationMs recorded (unit: scanEngine.test.ts) | Real device testing |
| QR-06 | Success animation ≈0.8 s (flip, green check, confetti, short sound); cosmetic only, never delays confirmation. | `ScanSuccess` | — | Verified | integration: scannerAndTheme.test.tsx (confirmation rendered with animation overlay) | — |
| QR-07 | Win-back reactivation scan shows name, days inactive, active win-back reward, redemption status; "Redeem Reward" marks redeemed, records a visit, resets the inactivity timer. | `/app/scanner` | O/M/E | Verified | unit: scanEngine.test.ts | OI-23 |
| QR-08 | Recent Scans (employee interface). | `/app/scanner` recent list | O/M/E | Implemented | ScannerPage recent scans list | — |

## §4.5 Customers

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| CUS-01 | Configurable signup fields: Name required by default; Email, Phone, Birthday optional & configurable. | `/app/customers/signup-fields` | O/M | Verified | unit: schemas.test.ts (configurable required/optional) | OI-35 |
| CUS-02 | Profile: visit history, rewards, membership/current tier, number of scans, notes, last visit. | `/app/customers/:id` | O/M (E limited) | Implemented | CustomerDetailPage (code review) | OI-18 |
| CUS-03 | Search by Name, Phone, Email, Customer ID. | `/app/customers` | O/M/E | Verified | unit: rewardsAndSearch.test.ts; integration: forms.test.tsx | — |
| CUS-04 | Adding real customers (locked in Preview; within Free limit). | `/app/customers` add dialog | O/M | Verified | unit: devBackend.test.ts (preview block); limit via access.test.ts | OI-03 |

## §4.6 Employees

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| EMP-01 | Owner: full access (billing/subscription, employees, customers, programs, analytics, scanner, settings). | `lib/access.ts` | O | Verified | unit: access.test.ts | — |
| EMP-02 | Manager: customers, programs, rewards, analytics, scanner, limited settings, employees if permitted. | `lib/access.ts` | M | Verified | unit: access.test.ts; integration: navigation.test.tsx | OI-15, OI-16 |
| EMP-03 | Employee: scanner, limited customer info, add stamps/points/visits, redeem rewards; no billing/subscription. | `lib/access.ts` | E | Verified | unit: access.test.ts, devBackend.test.ts | OI-18 |
| EMP-04 | Invite flow: Owner/Manager invites by email → email → invitee sets own password → role-based access. | `/app/employees`, `/accept-invite/:token` | O/M | Verified | unit: devBackend.test.ts (invite → accept) | OI-17, OI-37 |
| EMP-05 | Leaderboard (scan counts, speed) with badges (Scan King, Fastest Scanner, Customer Hero) visible to O/M, optionally to employees. | `/app/employees`, `/app/account` | O/M (+E optional) | Verified | unit: insights.test.ts (badges); access.test.ts (visibility) | OI-31 |
| EMP-06 | Gamification never affects permissions or transaction logic. | separate module, no imports from access/backend | — | Implemented | lib/gamification.ts not imported by access/scanEngine (code review) | — |

## §4.7 Notifications

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| NOT-01 | Manual campaigns: Happy Hour, New Item, Double Stamps, Birthday Reward, Holiday Campaign, Limited Offers, and similar wallet push notifications. | `/app/notifications` | O/M | Verified | unit: devBackend.test.ts (draft stays draft when push unavailable) | OI-21, OI-22 |
| NOT-02 | Win-back automation: configurable thresholds (e.g. 14/30/40/60) with escalating offers; each notification creates a matching active reward redeemable at next scan. | `/app/notifications` win-back | O/M | Verified | unit: scanEngine.test.ts (win-back reward created & redeemed) | OI-23 |
| NOT-03 | AI Campaigns: plain prompt → draft message + suggested offer. | `/app/notifications` AI | O | Blocked by Dependency | AI not connected — draft/review UI implemented; Owner-only verified in devBackend.test.ts | OI-19, OI-20 |
| NOT-04 | AI Bonus Generator: goal → offer terms, notification copy, duration for review/edit. | `/app/notifications` AI | O | Blocked by Dependency | AI not connected — draft/review UI implemented | OI-20 |
| NOT-05 | AI content is a draft only; must be reviewed and confirmed before sending. | `AiDraftEditor` | O | Implemented | AI output opens in composer as draft; nothing auto-sent (code review) | — |

## §4.8 Rewards

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| RWD-01 | States: Available, Redeemed, Pending, Expired. | `/app/rewards`, `lib/rewards.ts` | O/M | Verified | unit: rewardsAndSearch.test.ts, scanEngine.test.ts (pending voucher) | OI-24 |
| RWD-02 | Surprise rewards: frequency/probability + reward pool; customer never sees a schedule. | `/app/rewards` surprise config | O/M | Verified | unit: scanEngine.test.ts (surprise when enabled) | — |
| RWD-03 | Surprise Rewards default to off for every program. | program factory | — | Verified | unit: scanEngine.test.ts (defaults off) | — |

## §4.9 Analytics

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| ANL-01 | Visitors, Returning customers, Retention, Visit frequency, Reward redemptions, Top members, Most active days, Growth. | `/app/analytics` | O/M | Verified | unit: insights.test.ts; screenshot | OI-34 |
| ANL-02 | Day/time activity heatmap. | `/app/analytics` | O/M | Verified | unit: insights.test.ts; screenshot | — |
| ANL-03 | AI commentary explaining the pattern + suggested action; Pro-plan-exclusive (gating to confirm). | `/app/analytics` | O/M, Pro | Awaiting Clarification | Gating verified (unit: access.test.ts); AI not connected; OI-08 | **Awaiting Clarification** OI-08; OI-20 |

## §4.10 Branding

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| BRD-01 | Business Logo, Primary, Secondary, Background, Fonts propagate across dashboard, wallet cards, customer-facing surfaces. | `/app/branding` | O/M | Implemented | BrandingPage / Settings (code review) | OI-32 |
| BRD-02 | Bonuca tokens: Light bg #FBFBFB / text #0A0A0A / accent #1747F8; Dark bg #010414 / text #FFFFFF / accent #1747F8. | `styles/tokens.css` | — | Implemented | tokens.css matches spec values (code review); OI-10 | OI-10 |
| BRD-03 | Bonuca Blue is the primary accent (buttons, active nav, links, chart highlight, toggle ON, selected border). | components | — | Verified | Browser screenshots | — |
| BRD-04 | Light/Dark mode. | `ThemeProvider` | — | Verified | integration: scannerAndTheme.test.tsx; dark screenshot | — |
| BRD-05 | Card/Panel surface colour. | `tokens.css` (provisional) | — | Awaiting Clarification | — | OI-09 |
| BRD-06 | Auto Branding — unconfirmed, exploratory. | — | — | Awaiting Clarification | — | OI-11 (not built) |
| BRD-07 | Business branding separate from Bonuca's own brand. | tokens vs business settings | — | Implemented | Business branding stored separately; Bonuca tokens never overridden | — |

## §4.11 Subscription Management

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| SUB-01 | Upgrade, Downgrade, Cancel. | `/app/subscription` | O | Blocked by Dependency | UI + confirm flows implemented; Stripe not connected | Stripe not connected |
| SUB-02 | Invoices, payment history, billing information. | `/app/subscription` | O | Blocked by Dependency | Sections show truthful not-connected state | Stripe |
| SUB-03 | Web billed via Stripe; mobile via App Store/Google Play; the subscription reads the same on both. | `/app/subscription` source display | O | Implemented | Purchase source shown; mobile purchases not managed on web; OI-02 | OI-02 |
| SUB-04 | Override banner read-only with end date; business cannot edit. | `OverrideBanner` | SO | Verified | integration: previewAndPlans.test.tsx | — |

## §4.12 Settings

| ID | Requirement | Screen / route | Roles / plan | Status | Verification | Dependency / open item |
|---|---|---|---|---|---|---|
| SET-01 | Sections: Business information, Address, Opening hours, Logo, Brand colors, Employees, Notifications, Billing, Wallet customization, Language. | `/app/settings/:section` | O/M (limited) | Implemented | SettingsPage sections (code review) | OI-15 |
| SET-02 | Interface language selectable at first launch or anytime: EN, DE, TR, FR, IT; more addable later. | `i18n` | all | Verified | unit: insights.test.ts (i18n) | OI-39 |
| SET-03 | Customer-facing content language handling. | — | — | Awaiting Clarification | — | OI-12 |
