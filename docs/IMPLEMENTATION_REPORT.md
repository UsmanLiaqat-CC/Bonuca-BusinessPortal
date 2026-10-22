# Bonuca UI Redesign — Gap-Fix Implementation Report

Scope: the HTML prototype in `Bonuca-UI-Redesign/` (not the React app in `src/`).
Source-of-truth order: client spec PDF > `Bonuca_Gap_Fix_Implementation_Prompt.md` > QA spec docx > existing prototype.
Baseline before any change: commit `24938b1` (128 screens, 0 render errors).

## How to verify

Run from `Bonuca-Business-Portal/`:

```bash
node Bonuca-UI-Redesign/tools/build-pages.js          # regenerate page shells + indexes
node Bonuca-UI-Redesign/tools/check-pages.js          # every page × 375/1440px × light/dark: console errors, empty renders, dead links
node Bonuca-UI-Redesign/tools/journeys/phase1.js      # Phase 1 checklist journeys
```

`tools/package.json` (`{"type":"commonjs"}`) was added because the portal's `package.json` is an ES module package and the existing CommonJS tools could not run.

---

## Phase 1 — Auth, Roles & Access States

### Files created
| File | Purpose | Client spec |
|---|---|---|
| `common/pages/10-forgot-password.html` | Email input → Send reset link | Authentication: "Forgot password" |
| `common/pages/11-forgot-password-sent.html` | Confirmation + dev notice (email not connected) with reset link | same |
| `common/pages/12-reset-password.html` | New password + confirm (same rule as Register) → Log in | same |
| `common/pages/13-accept-invitation.html` | Business name, role, password + confirm, **Accept** → Log in | "Employees receive an email. They create their own password." |
| `owner/pages/61-dashboard-preview-mode.html` | Dashboard in Preview Mode (reference screen) | Access logic §1 Preview Mode |
| `tools/journeys/phase1.js`, `tools/package.json` | Phase 1 tests; CommonJS for tools | — |

### Files modified
| File | Change |
|---|---|
| `shared/scripts/app.js` | Page registry (new screens); role access map (`billing` Owner-only, `team` Owner or permitted Manager); nav filtered by role; Preview Mode state (`?preview=1`, carried on every internal link) with central locking of write actions + exact message; Super Admin override state (`?override[=YYYY-MM-DD]`) with read-only banner on Owner 01 / 49 / 57; `toast()` accepts an icon |
| `shared/scripts/data.js` | Team rows carry a per-Manager "Can manage employees" flag (demo: Mia = ON) |
| `shared/scripts/screens-common.js` | Login "Forgot password?" link + confirmation toasts; forgot / reset / accept-invitation screens; plan selection "Skip for now" → Preview Mode |
| `shared/scripts/screens-ops.js` | Employees: per-Manager "Can manage employees" toggle (Owner editable, Manager read-only); locked state when not permitted; invite dialog dev notice links to the invitation; **leaderboard/badges removed (E8)** |
| `shared/scripts/screens-admin.js` | Subscription: Manager sees a locked state (no plan data); Preview Mode plan choice exits preview; override makes plan actions read-only. Settings: Employees item/section only when permitted; per-Manager toggle; "Show leaderboard" toggle removed (E8); language picker usable in preview |
| `shared/styles/app.css` | Removed unused `.podium` / `.pod` rules (leaderboard) |
| `tools/check-pages.js` | Now checks 375 + 1440px, light + dark, dead links, horizontal overflow; auto-includes an `employee/` folder once it exists |

### Extras removed (Section 2)
- **E8** Employee leaderboard / gamification badges — the plan said "not built", but it existed on `39-employees`, `40-…`, `55-settings-employees` (owner + manager). Removed.
- **E10** Manager access to Subscription / Billing — removed from Manager nav, sidebar "View plans" link and settings; `manager/49-subscription.html` kept (no renumbering) but shows "Your role does not have access to this feature."

### Test checklist
| Item | Result |
|---|---|
| Forgot → sent → reset → login flow navigates end-to-end (incl. validation errors) | PASS |
| Invitation link opens accept screen; role shown correctly (Employee / Manager) | PASS |
| Manager nav has no Subscription/Billing; Owner has both | PASS |
| "Can manage employees": Owner editable, Manager read-only; without it the Manager loses Employees nav + screens | PASS |
| Preview mode: every locked action on every section shows the exact message; logout + plans always reachable; choosing a plan exits preview | PASS |
| Preview mode is Owner-only and does not affect normal mode | PASS |
| Override banner visible on 01 / 49 / 57, not editable, end date optional; plan actions read-only | PASS |
| Plan selection shows Free / Free Trial / paid + Skip for now | PASS |
| Full matrix: 133 pages × (375, 1440) × (light, dark) = 532 renders | 0 failures, 0 console errors, 0 dead links |

Review: `ecc:code-reviewer` found no critical/high issues. Fixed from its findings: override plan actions now read-only; Settings › Employees guarded when not permitted (this also fixed a crash the new test exposed); invalid override dates no longer render "Invalid Date"; `?preview=0` no longer enables preview; keyboard use of locked selects shows the message.

### Console errors
None.

### Known pre-existing issues (not introduced by Phase 1; for Phase 8)
- 375px horizontal overflow on 33 existing screens (program/campaign details, wallet designs, QR codes, analytics, opening hours, landing, verify-email); `06-verify-email` also overflows at 1440px. Baseline had 37 at 375px; removing the leaderboard fixed 4.
- 375px top bar: the theme switcher overlaps the business name (same in baseline).

### Open questions for the client
1. ❓ Demo Manager has "Can manage employees" **ON** — confirm the default for new Managers (demo shows ON so the Manager screens stay reviewable).
2. ❓ After accepting an invitation the user goes to Log in. Employee screens arrive in Phase 7; confirm employees should then land on the scanner.
3. ❓ Choosing **Pro** in Preview Mode cannot complete (Stripe not connected) and shows a notice; Free / Free Trial leave Preview Mode immediately.
4. ❓ Super Admin override is shown through a URL state (`?override=YYYY-MM-DD`) since the business cannot set it; in the real product it comes from the Super Admin portal.
5. ❓ Accept-invitation shows only business name + role (client lists nothing else); confirm whether the invited email should also be shown.

---

## Phase 2 — Stamp Card  (commit `0ae7c36`, review fixes in `5f33b60`)

### Files created
`manager/pages/60-scanner-stamp-reward-ready.html`, `owner/pages/62-scanner-stamp-reward-ready.html`, `tools/journeys/phase2.js`.

### Files modified
`app.js` (registry, `ctx.page(name)` role-aware links, `multiStamp` permission, `ctx.nav` keeps preview/override state), `data.js` (Coffee Card `multi: {on, max}`, Employee "Can award multiple stamps", stamp scan demo customers), `screens-programs.js` (Allow Multiple Stamps + Max stamps per scan; Active ⇄ Inactive lifecycle), `screens-ops.js` (scanner stepper, reward-ready state, permission column + invite option), `core.js` (Inactive status; "1 stamp to go" wording).

### Extras removed
E5 stamp-card Expiry Rule · E11 Archive / Paused wording (lifecycle = Active ⇄ Inactive; Draft kept pending ❓).

### Test checklist
| Item | Result |
|---|---|
| Toggle OFF → scanner shows no quantity control | PASS |
| Toggle ON, max 3 → stepper capped at 3; Unlimited → no cap | PASS |
| Employee without permission → no stepper (shared rule; employee screens in Phase 7) | PASS |
| 9/10 + 2 stamps → reward ready, new card 1/10 | PASS |
| Redeem requires a tap; wallet preview updates | PASS |
| Setting changeable while running, no master-field warning | PASS |

Review (`ecc:code-reviewer`): no critical/high. Fixed: carry-over beyond one card (now modulo, shows N × reward), crash on `?c=constructor`, bare 60/62 default (client example 9+2), state lost on scripted navigation.

### Open questions
- ❓ Can a Manager (with "Can manage employees") edit an employee's "Can award multiple stamps"? Built: yes.
- ❓ Program lifecycle: is Active ⇄ Inactive enough or is Draft needed? Draft kept for now.

---

## Phase 3 — Points Program  (commit `5f33b60`)

### Files created
Manager `61-scanner-points-redeem`, `62-points-transactions`; Owner `63-scanner-points-redeem`, `64-points-transactions`; `tools/journeys/phase3.js`.

### Files modified
`data.js` (points `cfg`, points demo customer, transaction log), `screens-programs.js` (points form per client list; Transactions link on points detail; E3), `screens-ops.js` (`calcPoints`, credit view in client order, redeem state, log screen, profile link), `core.js` (pass label "Points still required"), `screens-admin.js` (wallet settings copy), `app.css` (global `[hidden]` reset — hidden fields previously stayed visible when a component set `display`).

### Extras removed
E3 wallet "Start from Scratch" (blank canvas) option.

### Test checklist
| Item | Result |
|---|---|
| 12.50 USD @ 1 USD = 10 points → 125 points (full client view: 237 → 362, Free Burger at 500, 138 still required) | PASS |
| 285 CZK @ 10 CZK = 1 point, round down → 28 (up/nearest → 29) | PASS |
| Below min purchase → 0 points with message | PASS |
| Above max → capped with message | PASS |
| Currency never selectable in scanner; Fixed method needs no amount | PASS |
| Redeem deducts correctly; log row created for credit and redeem | PASS |
| Log linked from points detail and customer profile | PASS |
| Wallet pass: balance, progress, next reward, points still required, QR, name, logo | PASS |

### Open questions
- ❓ P3.3 Manual points: built as **purchase amount** entry (client's later email); first email said employees type points directly.
- ❓ P3.6 Multiple reward levels on the wallet pass depend on an Apple/Google technical spike; fallback (balance + next reward + QR) is built.
- ~~Points program detail "Edit" opened the stamp-card edit screen~~ — fixed in the post-Phase-8 audit: every program detail opens its own edit form.

---

## Phase 4 — Tier & Membership
Tier program: 2–5 tiers (Member default, Silver 10, Gold 25, Platinum 50, optional Diamond), upgrade by visits / points / total spending (currency + amount at scan), automatic level-up with per-tier wallet colour. Membership: Name, Benefit, visuals, Terms — permanent, no validity (E6); a scan records a visit. **Removed extras:** downgrade rule, "Enable Tiers" toggle (E4/E7). Test: journey `phase4` 10/10.
❓ Diamond default value; tier edit form; whether a spend/points scan counts as a visit.

## Phase 5 — Campaigns, vouchers, win-back
Acquisition campaign: starting stamps 0/1/2/3/custom, welcome-gift presets issued as a separate voucher pass. One-time voucher: print formats, claims list, "Already redeemed" on a second scan. Win-back: stages 14/30/40/60 days, each with message + reward; scanner shows Customer / Inactive for / Active reward / Status; redeem records a visit and resets the timer. Test: `phase5` 10/10.
❓ Existing card holder scanning an acquisition QR (built: "You already have this card").

## Phase 6 — Gifts
Gifts module replaces random "surprise rewards" (E2): manual gift from a profile (7 client presets + Custom), group gifts (6 groups with recipient counts), automatic rules (7 conditions), all client fields, five statuses, activity log, scanner confirm (never auto-redeemed, single-use blocked). Test: `phase6` 11/11.
❓ "Most active" = top 10; "New customers" = last 30 days; minimum purchase currency; Cancel action added.

## Phase 7 — Employee role
14 employee screens (scanner home, limited customer info, recent scans, account, every scan flow in ≤ 3 taps), no Dashboard/Analytics/Settings/Billing/Employees/Programs, no plan status. Scan success animation (≈0.8 s) for all roles. Test: `phase7` 10/10.
❓ Trial card shown to employees (built: hidden); recent scans scope (built: own scans).

## Phase 8 — Verification and fixes
P8.1–P8.10 verified against the client spec. Heatmap AI commentary is Pro-only (locked in Preview Mode and on Free); notification campaign types follow the client list; QR formats (Table/Counter/Sticker/Flyer/Window; Poster/Flyer/Cup/Receipt/Advertisement); subscription adds downgrade + cancel. E1 AI tools removed from MVP navigation (page 44 kept as a notice). Horizontal overflow at 375 px: 76 → 0. Test: `phase8` 15/15.

## Post-Phase-8 screen-by-screen audit and fixes
Five area audits (Playwright, 1,284 checks: 935 PASS / 196 PARTIAL / 153 FAIL) were followed by four fix passes, a manual browser pass in Chrome against `localhost:8080`, and more fixes. Fixed, among others: Terms & Conditions now shown on the pass back (Front/Back); every Publish/Save validates with inline errors; uploads (logo, icon, hero, stamp icon) update the pass; per-program edit forms; Active/Inactive updates badge and counts; Preview Mode locks dialog submits; Branding reaches wallet passes; win-back add/remove/save; draft campaigns; language + plan kept in demo memory; Manager/Employee permissions take effect; stamps, recent scans, gifts and campaigns persist for the tab; real PNG/PDF QR download; login checks the sample password; neutral black dark theme (client preference, replaces the navy palette).

## Final regression (post-fix)
| Check | Result |
|---|---|
| Journeys phase1–8 | 8/8 · 9/9 · 11/11 · 10/10 · 10/10 · 11/11 · 10/10 · 15/15 — 0 console errors |
| Full render matrix (165 pages × 375/1440 px × light/dark = 660) | 0 failures (last full run before the black-theme/campaign changes; quick run 165/165 after) |
| 375 px horizontal overflow, all 165 pages | none |

## Open questions for the client (❓)
Draft status; manual points entry (amount vs points); several reward levels on the wallet pass; existing-card-holder rule; Manager "Can manage employees" default; Manager billing visibility; plan names and prices (Free / Business ≈ €25 / Pro ≈ €50–60 are examples); Manager "limited settings"; interface translation (language is saved but screens are English-only); whether Name may be optional at signup; wallet/notification language (business vs customer); Terms & Privacy text; QR print sizes; accept-invitation email display.

## Prototype limits (not connected)
Email, Stripe / App Store, Apple/Google Wallet push, notification delivery, camera scanning and AI are simulated and labelled as such. All data is demo data kept per browser tab.

---

## Screen index (role → number → screen → purpose)

After Phase 8: Common 13 · Manager 68 · Owner 70 · Employee 14 = 165 screens. File numbers are never renumbered; Owner/Manager 46 `rewards-surprise` is now the Gifts module and 44 `notifications-ai-tools` is a notice page.

### Common

| # | Screen | Purpose |
|---|---|---|
| 01 | landing | Public landing page with plans and language |
| 02 | landing-download-app | Download-the-app dialog (store links coming soon) |
| 03 | login | Log in (sample accounts, forgot-password link) |
| 04 | register | Create an account: name, email, password, country, terms |
| 05 | register-validation | Register form showing validation errors |
| 06 | verify-email | Enter the 6-digit email code |
| 07 | onboarding-business-profile | Step 1: business name, category, logo, colour, language, address, opening hours |
| 08 | onboarding-plan-selection | Step 2: choose Free, Free Trial, Business or Pro, or skip to Preview Mode |
| 09 | onboarding-first-program | Step 3: create the first program with live preview |
| 10 | forgot-password | Request a password reset email |
| 11 | forgot-password-sent | Reset email sent confirmation |
| 12 | reset-password | Set a new password |
| 13 | accept-invitation | Invited team member sets a password |

### Manager

| # | Screen | Purpose |
|---|---|---|
| 01 | dashboard | Stats and charts: members, scans, programs, wallet cards |
| 02 | dashboard-table-view | Dashboard charts as tables |
| 03 | programs-list | Programs and campaigns list with status filters |
| 04 | programs-choose-type | Choose a program type |
| 05 | campaigns-choose-type | Choose a campaign type |
| 06 | program-new-stamp | New stamp card with live wallet preview and Terms on the back |
| 07 | program-new-membership | New membership card (permanent benefit) |
| 08 | program-new-tier | New tier program (2–5 tiers, requirement type) |
| 09 | program-new-points | New points program (currency, earning rule, rewards, expiry) |
| 10 | program-detail-coffee | Stamp card detail: lifecycle, QR, setup, pass preview |
| 11 | program-detail-vip | Membership detail |
| 12 | program-detail-club | Tier program detail |
| 13 | program-detail-points | Points program detail |
| 14 | program-detail-lunch | Draft stamp card detail |
| 15 | program-edit | Edit a program (form per program type) |
| 16 | program-edit-master-field-warning | Warning when master fields change on a live program |
| 17 | campaign-new-acquisition | New stamp-card acquisition campaign with starting stamps |
| 18 | campaign-new-acquisition-welcome-gift | Acquisition campaign with welcome gift (two passes) |
| 19 | campaign-new-voucher | New one-time voucher campaign |
| 20 | campaign-detail-acquisition | Acquisition campaign detail |
| 21 | campaign-detail-voucher | Voucher campaign detail and claims |
| 22 | wallet-cards | Base templates and every program's pass |
| 23 | wallet-design-coffee | Stamp card pass design (front/back, iPhone/Android) |
| 24 | wallet-design-vip | Membership pass design |
| 25 | wallet-design-club | Tier pass design with per-tier colours |
| 26 | wallet-design-points | Points pass design |
| 27 | wallet-design-android-preview | Android pass preview |
| 28 | scanner | Scanner home with development pass picker |
| 29 | scanner-stamp-card | Stamp scan: add stamps (stepper if permitted), rewards, gift note |
| 30 | scanner-confirmed | Scan confirmed result |
| 31 | scanner-points-preview | Points credit view in the client's field order |
| 32 | scanner-tier | Tier scan: record visit, automatic upgrade |
| 33 | scanner-membership | Membership scan: record visit |
| 34 | qr-codes | Printable QR codes with print formats, PNG/PDF |
| 35 | customers | Customer list with search |
| 36 | customers-add-dialog | Add customer following signup settings |
| 37 | customer-profile | Customer profile: programs, rewards, gifts, notes, history |
| 38 | customer-signup-fields | Required / optional / off per signup field |
| 39 | employees | Team list, invite, permissions |
| 40 | employees-invite-dialog | Invite a Manager or Employee |
| 41 | notifications-campaigns | Manual push campaigns (drafts) |
| 42 | notifications-new-campaign | New campaign dialog (client campaign types) |
| 43 | notifications-winback | Win-back stages (14/30/40/60 days) and log |
| 44 | notifications-ai-tools | Notice: AI Campaigns is a future feature |
| 45 | rewards | All rewards and gifts with status filters |
| 46 | rewards-surprise | Gifts: manual, group, automatic rules, activity log |
| 47 | analytics | Analytics, heatmap, Pro-only AI commentary |
| 48 | branding | Logo, colours, background, font |
| 49 | subscription | Plan, upgrade/downgrade, cancel, invoices, billing info |
| 50 | settings-business | Business information |
| 51 | settings-address | Business address |
| 52 | settings-hours | Opening hours |
| 53 | settings-logo | Business logo |
| 54 | settings-brand-colors | Brand colours |
| 55 | settings-employees | Team permissions |
| 56 | settings-notifications | Notification settings summary |
| 57 | settings-wallet | Wallet customisation |
| 58 | settings-language | Interface language |
| 59 | dashboard-dark-mode | Dashboard in dark mode |
| 60 | scanner-stamp-reward-ready | Reward ready: explicit redeem, new card with carry-over |
| 61 | scanner-points-redeem | Redeem points for a reward |
| 62 | points-transactions | Points transaction log (11 client columns) |
| 63 | scanner-voucher | Voucher scan: redeem once |
| 64 | scanner-winback | Win-back scan: redeem reward |
| 65 | gift-assign-dialog | Assign a gift from a customer profile |
| 66 | gift-new-group | Group gift (6 client groups) |
| 67 | gift-rules | Automatic gift rules (7 conditions) |
| 68 | scanner-gift | Gift scan: explicit confirm |

### Owner

| # | Screen | Purpose |
|---|---|---|
| 01 | dashboard | Stats and charts: members, scans, programs, wallet cards |
| 02 | dashboard-table-view | Dashboard charts as tables |
| 03 | programs-list | Programs and campaigns list with status filters |
| 04 | programs-choose-type | Choose a program type |
| 05 | campaigns-choose-type | Choose a campaign type |
| 06 | program-new-stamp | New stamp card with live wallet preview and Terms on the back |
| 07 | program-new-membership | New membership card (permanent benefit) |
| 08 | program-new-tier | New tier program (2–5 tiers, requirement type) |
| 09 | program-new-points | New points program (currency, earning rule, rewards, expiry) |
| 10 | program-detail-coffee | Stamp card detail: lifecycle, QR, setup, pass preview |
| 11 | program-detail-vip | Membership detail |
| 12 | program-detail-club | Tier program detail |
| 13 | program-detail-points | Points program detail |
| 14 | program-detail-lunch | Draft stamp card detail |
| 15 | program-edit | Edit a program (form per program type) |
| 16 | program-edit-master-field-warning | Warning when master fields change on a live program |
| 17 | campaign-new-acquisition | New stamp-card acquisition campaign with starting stamps |
| 18 | campaign-new-acquisition-welcome-gift | Acquisition campaign with welcome gift (two passes) |
| 19 | campaign-new-voucher | New one-time voucher campaign |
| 20 | campaign-detail-acquisition | Acquisition campaign detail |
| 21 | campaign-detail-voucher | Voucher campaign detail and claims |
| 22 | wallet-cards | Base templates and every program's pass |
| 23 | wallet-design-coffee | Stamp card pass design (front/back, iPhone/Android) |
| 24 | wallet-design-vip | Membership pass design |
| 25 | wallet-design-club | Tier pass design with per-tier colours |
| 26 | wallet-design-points | Points pass design |
| 27 | wallet-design-android-preview | Android pass preview |
| 28 | scanner | Scanner home with development pass picker |
| 29 | scanner-stamp-card | Stamp scan: add stamps (stepper if permitted), rewards, gift note |
| 30 | scanner-confirmed | Scan confirmed result |
| 31 | scanner-points-preview | Points credit view in the client's field order |
| 32 | scanner-tier | Tier scan: record visit, automatic upgrade |
| 33 | scanner-membership | Membership scan: record visit |
| 34 | qr-codes | Printable QR codes with print formats, PNG/PDF |
| 35 | customers | Customer list with search |
| 36 | customers-add-dialog | Add customer following signup settings |
| 37 | customer-profile | Customer profile: programs, rewards, gifts, notes, history |
| 38 | customer-signup-fields | Required / optional / off per signup field |
| 39 | employees | Team list, invite, permissions |
| 40 | employees-invite-dialog | Invite a Manager or Employee |
| 41 | notifications-campaigns | Manual push campaigns (drafts) |
| 42 | notifications-new-campaign | New campaign dialog (client campaign types) |
| 43 | notifications-winback | Win-back stages (14/30/40/60 days) and log |
| 44 | notifications-ai-tools | Notice: AI Campaigns is a future feature |
| 45 | rewards | All rewards and gifts with status filters |
| 46 | rewards-surprise | Gifts: manual, group, automatic rules, activity log |
| 47 | analytics | Analytics, heatmap, Pro-only AI commentary |
| 48 | branding | Logo, colours, background, font |
| 49 | subscription | Plan, upgrade/downgrade, cancel, invoices, billing info |
| 50 | settings-business | Business information |
| 51 | settings-address | Business address |
| 52 | settings-hours | Opening hours |
| 53 | settings-logo | Business logo |
| 54 | settings-brand-colors | Brand colours |
| 55 | settings-employees | Team permissions |
| 56 | settings-notifications | Notification settings summary |
| 57 | settings-billing | Billing summary (Owner) |
| 58 | settings-wallet | Wallet customisation |
| 59 | settings-language | Interface language |
| 60 | dashboard-dark-mode | Dashboard in dark mode |
| 61 | dashboard-preview-mode | Preview Mode: demo data, writes locked |
| 62 | scanner-stamp-reward-ready | Reward ready: explicit redeem, new card with carry-over |
| 63 | scanner-points-redeem | Redeem points for a reward |
| 64 | points-transactions | Points transaction log (11 client columns) |
| 65 | scanner-voucher | Voucher scan: redeem once |
| 66 | scanner-winback | Win-back scan: redeem reward |
| 67 | gift-assign-dialog | Assign a gift from a customer profile |
| 68 | gift-new-group | Group gift (6 client groups) |
| 69 | gift-rules | Automatic gift rules (7 conditions) |
| 70 | scanner-gift | Gift scan: explicit confirm |

### Employee

| # | Screen | Purpose |
|---|---|---|
| 01 | scanner-home | Employee scanner home |
| 02 | scan-result | Employee stamp scan |
| 03 | customer-info | Employee limited customer info |
| 04 | recent-scans | Employee's own recent scans |
| 05 | account | Employee account and logout |
| 06 | scan-confirmed | Employee scan confirmed |
| 07 | scan-points | Employee points credit |
| 08 | scan-points-redeem | Employee points redeem |
| 09 | scan-reward-ready | Employee reward ready |
| 10 | scan-tier | Employee tier scan |
| 11 | scan-membership | Employee membership scan |
| 12 | scan-voucher | Employee voucher scan |
| 13 | scan-winback | Employee win-back scan |
| 14 | scan-gift | Employee gift scan |
