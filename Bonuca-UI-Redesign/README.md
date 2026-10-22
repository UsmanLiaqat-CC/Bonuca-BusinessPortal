# Bonuca Business Portal — UI Redesign (HTML)

This folder holds the redesigned HTML for every screen of the Bonuca Business Portal:

| Folder | Screens | Notes |
|---|---|---|
| `common/` | 9 | Landing, login, register, verify email, 3 onboarding steps |
| `manager/` | 59 | Full portal as **Mia Manager** (role: Manager) |
| `owner/` | 60 | Full portal as **Sam Owner** (role: Owner); one extra screen, `57-settings-billing` |
| **Total** | **128** | Each HTML file has the same name as its original screenshot |

Everything is plain **HTML + CSS + JavaScript**. There is no framework, no build step and no internet dependency (fonts are bundled locally).

---

## 1. How to open it

**Option A, quickest:** double-click `index.html`. It lists all 128 screens with links.

**Option B, local server (recommended):**

```bash
cd Bonuca-UI-Redesign
npx serve .            # or: python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`).

Each screen can also be opened on its own, for example `manager/pages/01-dashboard.html`.

---

## 2. Folder structure

```text
Bonuca-UI-Redesign/
├── index.html                  ← master list of all screens
├── README.md                   ← this file
├── common/
│   ├── index.html              ← list of Common screens
│   └── pages/01-landing.html … 09-onboarding-first-program.html
├── manager/
│   ├── index.html
│   └── pages/01-dashboard.html … 59-dashboard-dark-mode.html
├── owner/
│   ├── index.html
│   └── pages/01-dashboard.html … 60-dashboard-dark-mode.html
├── shared/
│   ├── design-tokens/tokens.css   ← colours, fonts, spacing, radii, shadows, motion (light + dark)
│   ├── styles/app.css             ← all component styles + animations + responsive rules
│   ├── assets/fonts/              ← Inter, Inter Tight, JetBrains Mono (woff2, offline)
│   └── scripts/
│       ├── core.js                ← icons + reusable UI components (cards, fields, charts, wallet pass, modal…)
│       ├── data.js                ← sample data (programs, 64 customers, 78 rewards, scans…)
│       ├── screens-common.js      ← landing / auth / onboarding screens
│       ├── screens-programs.js    ← dashboard, programs, campaigns, wallet cards
│       ├── screens-ops.js         ← QR scanner, printable QR, customers, employees
│       ├── screens-admin.js       ← notifications, rewards, analytics, branding, subscription, settings
│       └── app.js                 ← page registry, app shell (sidebar/topbar), theme, interactions
├── references/
│   ├── original-sample-screenshots/   ← the 3 style references you supplied
│   └── original-screens/{common,manager,owner}/  ← your original screenshots (for comparison)
└── tools/
    ├── build-pages.js          ← regenerates every page HTML from the registry
    └── check-pages.js          ← opens every page in headless Chrome and reports errors
```

### How a page works

Every page file is a small HTML shell:

```html
<body data-role="manager" data-page="01-dashboard">
  <script src="../../shared/scripts/core.js"></script> … <script src="../../shared/scripts/app.js"></script>
</body>
```

`app.js` reads `data-role` and `data-page`, finds the screen in its **page registry** (`PAGES` in `app.js`), and renders it inside the shared shell. The page's state is set by the screen options, such as which modal is open, which tab is active, which scanner state to show, or dark mode.

This means:
- **One change to a component** (for example a card style in `app.css` or the sidebar in `app.js`) **updates all 128 screens.**
- Manager and Owner use the same screen code. Role differences come from `ctx.owner` (see section 6).

---

## 3. Design system

Built from your 3 reference screenshots, combined with Bonuca's own platform colours (from the Branding screen).

| What we took from the references | How it's used |
|---|---|
| Off-white canvas with soft **pink/blue glow** blobs | `.ambient` background on every page |
| **Black ink** primary elements (sign-in button, active states) | Active sidebar item, tab thumb, feature stat card, "Redeem" buttons |
| **Yellow highlight** underline ("request one") | Highlighted word in every page title; links; trial ring; scanner beam |
| Big **tight-tracked bold headings** | `Inter Tight` 700, letter-spacing −0.035em |
| Clean rounded cards, very soft shadows | `--radius-card: 22px`, `--shadow-card` |
| Trend badges, progress bars, donut, line/bar charts (dashboard refs) | Stat cards, donut "Membership Distribution", gradient bars |
| Mint green for positive values | `Active` badges, success states, progress |

**Brand accent stays Bonuca Blue `#1747F8`** for primary buttons, charts and focus rings.

### Main tokens (`shared/design-tokens/tokens.css`)

| Token | Light | Dark |
|---|---|---|
| `--color-background` | `#F3F3F1` | `#010414` (from Branding screen) |
| `--color-surface` | `#FFFFFF` | `#0B1029` |
| `--color-text-primary` | `#0A0A0A` | `#FFFFFF` |
| `--color-accent` | `#1747F8` | `#2F5BFF` |
| `--color-ink` | `#0B0B0F` | `#FFFFFF` |
| `--color-highlight` | `#FFD43B` | `#FFD43B` |
| `--color-mint` | `#22B07D` | `#22B07D` |
| `--wallet-gradient` | `#0A112F → #000` | same |
| `--radius-card / control / pill` | 22 / 12 / 999 px | |
| `--font-display / body / mono` | Inter Tight / Inter / JetBrains Mono | |

To re-brand, change these variables. Every screen follows.

### Dark mode

Every screen supports light, dark and system themes through the theme switch in the top bar (sun / moon / monitor). The choice is saved in `localStorage`. The `…-dashboard-dark-mode` pages are forced into dark mode, matching the originals.

---

## 4. Animations & micro-interactions

| Where | Effect |
|---|---|
| All pages | Cards fade and slide up in sequence (staggered) |
| Stat cards | Numbers count up; icon tilts on hover; card lifts on hover |
| Charts | Bars grow, lines draw in, donut segments sweep, heatmap cells pop; hover tooltips |
| Buttons | Ripple on click, press scale, lift on hover |
| Tabs / segmented controls | Sliding "thumb" indicator |
| Modals | Spring scale-in with blurred backdrop; close on Esc, × or backdrop click |
| Wallet pass | Light sheen sweeps across; stamps pop in one by one |
| QR codes | Scanning beam passes over every QR |
| QR Scanner | Pulsing scan button with moving beam; "Add stamp" fills the next stamp, then goes to Confirmed; green success burst |
| Forms | Invalid fields shake with a red border; focus ring glow |
| Status badges | "Active" has a pulsing live dot |
| Login / landing | Floating wallet cards |

`prefers-reduced-motion` is respected: all motion is switched off for users who ask for that.

---

## 5. Working interactions (prototype behaviour)

- **Sidebar navigation** links to the real pages. The active item is highlighted. On mobile (under 900px) the sidebar becomes a slide-in drawer opened with the ☰ button.
- **Login:** "Use" fills in a sample account. Log In opens the Owner or Manager dashboard. The password eye toggles visibility.
- **Register:** full client-side validation (name, email format, password 8+ chars with a letter and a number, country, terms). On success it goes to Verify.
- **Verify email:** 6 separate OTP boxes with auto-advance, backspace and paste. Code `495875` continues to onboarding.
- **Programs list:** status filter tabs (All / Active / Draft …) filter the cards. "Create Program" and "Create campaign" open type pickers that link to the right form.
- **Program forms:** typing the name or reward updates the phone preview live. The stamp-icon picker changes the stamps. iPhone/Android toggle. Points form has "Add reward". **Edit → Save** opens the "Update every issued wallet pass?" dialog when the name changed.
- **Campaign form:** the Welcome Gift toggle shows or hides its fields.
- **Customers:** live search across name / ID / email / phone, pagination (16 per page), row click opens the profile, "Add customer" modal.
- **Rewards:** state tabs (All 78 / Available 42 / Redeemed 29 / Pending 7 / Expired 0) filter the table, with pagination.
- **Surprise rewards:** probability slider ("about 1 in N scans" updates live), add and remove reward-pool chips, the enable toggle dims the settings.
- **QR Scanner:** the scan button, manual code (`BNC-…`) and the dev "pick a stored pass" dropdown move between the 6 scanner states. The points amount recalculates points and the new balance live.
- **Dashboard / Analytics:** every Chart/Table switch toggles between the chart and a data table.
- **Settings › Opening hours:** a toggle per day. Closed days dim.
- **Branding / Brand colours:** typing a hex colour updates the swatch and the live preview.
- **Toasts** confirm actions (save, copy link, download PNG/PDF, send…).

All data is **sample data** (in `shared/scripts/data.js`) and matches the values in your original screenshots. Nothing is sent anywhere.

---

## 6. Role differences kept (Manager vs Owner)

| Screen | Manager | Owner |
|---|---|---|
| Top bar | Mia Manager · Manager chip | Sam Owner · Owner chip |
| Employees › "Managers may manage employees" | Disabled, with lock note "Your role does not have access" | Editable |
| Invite modal › Role | Manager option locked (Employees only) | Can invite Manager or Employee |
| Notifications › AI tools | Locked (Owner-only notice, disabled buttons) | Enabled |
| Subscription & Billing | Plan buttons locked; invoices hidden | Plan buttons active; Invoices / Payment history / Billing info cards |
| Settings menu | No "Billing" item (screens 57–58 = Wallet, Language) | Has "Billing" (57) → Wallet (58) → Language (59) |
| Dark-mode dashboard | `59-dashboard-dark-mode` | `60-dashboard-dark-mode` |

All business texts, required/optional markers, field labels, helper texts, statuses, columns and "not connected" notices from the originals are kept.

---

## 7. Complete screen list

Original screenshot name → HTML file (the same name with `.html`).

### Common (9): `common/pages/`
01-landing · 02-landing-download-app · 03-login · 04-register · 05-register-validation · 06-verify-email · 07-onboarding-business-profile · 08-onboarding-plan-selection · 09-onboarding-first-program

### Manager (59) and Owner (60): `manager/pages/`, `owner/pages/`

| # | Screen | # | Screen |
|---|---|---|---|
| 01 | dashboard | 31 | scanner-points-preview |
| 02 | dashboard-table-view | 32 | scanner-tier |
| 03 | programs-list | 33 | scanner-membership |
| 04 | programs-choose-type (modal) | 34 | qr-codes |
| 05 | campaigns-choose-type (modal) | 35 | customers |
| 06 | program-new-stamp | 36 | customers-add-dialog (modal) |
| 07 | program-new-membership | 37 | customer-profile |
| 08 | program-new-tier | 38 | customer-signup-fields |
| 09 | program-new-points | 39 | employees |
| 10 | program-detail-coffee | 40 | employees-invite-dialog (modal) |
| 11 | program-detail-vip | 41 | notifications-campaigns |
| 12 | program-detail-club | 42 | notifications-new-campaign (modal) |
| 13 | program-detail-points | 43 | notifications-winback |
| 14 | program-detail-lunch (draft) | 44 | notifications-ai-tools |
| 15 | program-edit | 45 | rewards |
| 16 | program-edit-master-field-warning (modal) | 46 | rewards-surprise |
| 17 | campaign-new-acquisition | 47 | analytics |
| 18 | campaign-new-acquisition-welcome-gift | 48 | branding |
| 19 | campaign-new-voucher | 49 | subscription |
| 20 | campaign-detail-acquisition | 50 | settings-business |
| 21 | campaign-detail-voucher | 51 | settings-address |
| 22 | wallet-cards | 52 | settings-hours |
| 23 | wallet-design-coffee | 53 | settings-logo |
| 24 | wallet-design-vip | 54 | settings-brand-colors |
| 25 | wallet-design-club | 55 | settings-employees |
| 26 | wallet-design-points | 56 | settings-notifications |
| 27 | wallet-design-android-preview | 57 | Manager: settings-wallet · Owner: **settings-billing** |
| 28 | scanner | 58 | Manager: settings-language · Owner: settings-wallet |
| 29 | scanner-stamp-card | 59 | Manager: dashboard-dark-mode · Owner: settings-language |
| 30 | scanner-confirmed | 60 | Owner only: dashboard-dark-mode |

---

## 8. Using it in your project

**If your project is plain HTML:** copy the `shared/` folder plus the pages you need. Keep the relative paths (`../../shared/...`), or change them to match your folder layout.

**If your project uses React / Vue / Next.js:** use this as the visual spec and the source for styles:
1. Copy `shared/design-tokens/tokens.css` and `shared/styles/app.css` into your global styles. The class names (`.card`, `.btn-primary`, `.badge.green`, `.field`, `.tabs`, `.pass` …) can be used directly in JSX or templates.
2. Each function in `core.js` (`card()`, `field()`, `pass()`, `barChart()`, `modal()`…) maps one-to-one to a component you'd create. The markup it returns is the markup your component should render.
3. Each `S.<screen>` function in the `screens-*.js` files shows the exact layout and content of that page.
4. Swap `data.js` for your real API data.

**Fonts:** bundled in `shared/assets/fonts/` (Inter, Inter Tight, JetBrains Mono, all SIL Open Font License).

---

## 9. Regenerating and checking pages

```bash
node tools/build-pages.js       # rebuilds every page HTML file + index pages from the registry in app.js
npm i -D playwright && npx playwright install chromium
node tools/check-pages.js       # opens all 128 pages, fails if any page throws a JS error or renders empty
node tools/check-pages.js shots # same, and also saves a full-page PNG of each screen into ./shots/
```

To **add a new screen**, add one line to `PAGES` in `shared/scripts/app.js` (for example `['61-my-screen', 'dashboard', { … }]`), write or reuse a screen function, then run `build-pages.js`.

---

## 10. QA done and known limitations

**Checked:** all 128 pages were opened in headless Chromium at 1440×900. **0 JavaScript errors and 0 empty pages.** A sample of screens was compared visually against the originals (dashboard light and dark, login, program form, scanner, employees).

**Known limitations**
- This is a front-end prototype. Logins, saving, sending, Stripe, the Apple/Google Wallet push and the camera scanner are not connected, and the same "not connected" notices as in the originals are shown.
- QR codes are decorative patterns, not scannable codes. Use a real QR library in production.
- Opening the files straight from disk (`file://`) works. Theme memory (`localStorage`) may not persist in some browsers' file mode, so use a local server for that.
- "Option B — Start from Scratch", Pro-plan exclusivity and the AI tools are shown exactly as "pending confirmation" in the originals. No new behaviour was invented.
