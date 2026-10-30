# BONUCA CHANGES — developer comments

One comment per section of the Google Doc, to be placed under that section. Page numbers follow the doc's PDF export (17 pages).
Screenshots are real captures of the business portal (development build, sample data) in `docs/screenshots/bonuca-changes/`.

Status key: ✅ done and tested · ⚠️ partly done · ❌ not started

---

## Pages 1–2 — Remove the "Wallet Cards" tab; wallet card inside each program ✅

- "Wallet Cards" menu item and page removed. Old links (`/app/wallet-cards`, `/app/wallet-cards/<id>`) now open Loyalty Programs.
- "Base templates" section removed. Businesses only pick a program type when they create a program.
- Each program card in Loyalty Programs shows its pass thumbnail, name, type, status and number of active cards. The count opens that program's customers.
- Opening a program shows tabs: Overview · Rules · Rewards · **Wallet card** · Customers. Wallet card holds the design, a live preview and the active cards count. Branding logo and colours are the defaults; changes apply to that program only.
- The create-program flow has a Wallet design step with live preview before publishing.
- New wallet card layout follows the reference image (logo tile, brand, card type, stamp row "6 / 10 STAMPS", reward, QR "Show to redeem").
- Kept: existing programs and passes, Branding, QR Scanner, the "Wallet Cards" count on the Dashboard.

Screenshots: `02-loyalty-programs-with-wallet-passes.png`, `03-program-wallet-card-section.png`, `04-program-customers-table.png`

## Page 3 — Colour scheme and icons for cards ✅

- Dashboard, program, customer and wallet KPI cards use the Bonuca Admin colour scheme and illustrated icons.

Screenshots: `01-dashboard-scan-qr-and-customer-cards.png`, `15-customer-profile-details-programs-history.png`

## Page 4 — "Members" → "Customer" on cards ✅

- Card and chart labels now say customers (Total Customers, New Customers, Customers per Program, "Customer since" on passes, etc.). Team members and the tier name "Member" are unchanged.

Screenshot: `01-dashboard-scan-qr-and-customer-cards.png`

## Pages 5–7 — Program creation sequence; programs ↔ customers ↔ gifts; first-scan page ✅

- Create program is now 5 steps: Basics → Program rules (with expiry date) → Wallet design → Valid location (optional) → Sign-up page details (background/font colours, hero image, logo, fields Name / Email / Birthday).
- Valid location is saved with the program. Nearby notifications need the wallet push service, which is not connected yet.
- Program → Customers tab: name, email or phone, customer number, progress, last visit, status, with search. Clicking a customer opens the profile.
- Customer profile: details, linked programs (one card each), history across programs with program filter (what changed, program, who, date/time, scanned or search), rewards and gifts.
- Surprise gift from the profile (Owner/Manager only): name, description, expiry, optional terms, optional start date. Statuses Scheduled / Available / Redeemed / Expired / Cancelled. Not linked to any program; never changes stamps or points. Staff see it when they scan the customer and must press Redeem; who, when and where are recorded.
- After the first scan of a program's join QR the customer sees the landing page, then the "Almost there" sign-up form, then their card.
- Not connected yet: the wallet/push notification to the customer for a gift (the UI says so).

Screenshots: `05`–`10` (create steps), `15-customer-profile-details-programs-history.png`, `16-give-gift-dialog.png`, `17-customer-rewards-and-gifts.png`, `12-customer-first-scan-landing-page.png`, `13-customer-signup-form-almost-there.png`, `14-customer-card-after-signup.png`

## Page 8 — iPhone / Android / sign-up page views; "program is live" with QR ✅

- The live preview has three views: iPhone, Android and Sign-up page.
- After Publish, a "program is live" screen shows the QR, the sign-up link, Download, Print, Copy signup link, Done and View program. "Send QR + link to me" reports that email is not connected yet.

Screenshots: `07-create-program-step-3-wallet-design-live-preview.png`, `09-create-program-step-5-signup-page-preview.png`, `11-program-published-live-with-qr.png`

## Pages 9–10 — Simplify "Award actions" (QR Scanner) ✅

- One screen, "Award actions", with tabs Scan (default) and Search. The camera starts on its own; a button appears only if camera permission is denied. The Dashboard has a "Scan QR" button that opens the same screen.
- Search by name, email, phone or customer number. A scan or a search result opens the same customer screen.
- Customers in several programs see their programs as cards; staff pick one. One program opens directly.
- Stamp: count and +1 stamp. Redeem bonus is enabled only at a full card (e.g. 10/10). Remove stamp (-1) and the amount dropdown are visible to Owner and Manager only.
- Points: purchase amount, points it will give, "Credit X points". Nothing is saved before the button is pressed.
- Active reward or gift is shown with Redeem; nothing is redeemed just by scanning.
- History rows: what changed (+1, -1, Redeemed), who, date/time, balance after, scanned or search. Rows like "0 stamps" are left out.

Screenshots: `18`–`24` (Owner), `27-award-actions-employee-add-and-redeem-only.png`

## Page 11 — Languages; Settings updates; Audit tab ⚠️

- Settings: Employees, Notifications, Billing and Wallet customization removed (each still has its own menu page). ✅
- Audit tab: user, role, action, module, date & time, details; filters for user, role, module, action and date range. Records Manager and Employee activity. ✅
- Languages ⚠️: English, German, Turkish, French and Italian can be chosen at first open and in Settings, but much page text is still English-only and needs translating. The Admin portal is a separate project and was not changed.

Screenshots: `25-settings-sections-after-removal.png`, `26-settings-audit-tab-with-filters.png`

## Pages 12–15 — Campaigns tab: developer flow ✅

- Removed from Loyalty Programs: "Create campaign" button and the campaigns table; subtitle is now "Programs are what customers join." Removed from Notifications: the Win-back tab; "New campaign" renamed "New notification"; subtitle updated.
- New sidebar item **Campaigns** under Loyalty Programs: Create campaign (Stamp card acquisition, One-time voucher, Win-back, each with "Draft with AI"), search, Type and Status filters, table (Campaign, Type, Status, Offer, Period, Customers, Redeemed, Created, View + "…" menu with Edit / Pause-Resume / End), newest first, row click opens View.
- View page: summary, campaign QR with download (QR types), Win-back stages with on/off toggle, message and offer, Edit / Pause / Resume / End, Linked customers table with search and reward-status filter. The customer profile has a Campaigns section.
- Claiming by QR: one claim per customer (a second scan gives nothing new). Paused stops new claims but existing rewards can still be redeemed. Ended (manual, or automatically after the voucher end date) shows "This campaign has ended."
- Not connected yet: "Draft with AI" (reports that the AI service is not connected) and win-back push delivery.

Screenshots: `28`–`39`

## Pages 16–17 — ❌ Not started

To do next (e.g. stamps-per-scan limit set by the Admin, employee invite email with activation link).

---

### Testing

- Typecheck, lint and production build: pass.
- Unit + integration tests: 114 of 115 pass. The one failure ("adds sample accounts to existing data…") already failed before these changes.
- New tests cover gifts, audit, program customers, Award actions permissions, sign-up, campaigns (claim once, paused, ended, win-back) and the new navigation.
- Browser walk-through of every flow above (the screenshots) completed without errors.
- Older Playwright end-to-end specs: 18 pass, 28 fail because they still check removed screens (Wallet Cards page, old scanner, one-page program form, old Settings). They need rewriting for the new flow.
