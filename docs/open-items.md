# Open Items

Source: `../Bonuca_Business_Portal_Spec.docx` (the authoritative specification).

The specification refers to an "Open Items" list several times (§1.5, §4.10, §4.11), but **the document
contains no Open Items section**. The list below collects:

- **Part A** — items the specification itself explicitly flags as unconfirmed or as needing
  client/technical/legal/design review.
- **Part B** — gaps found while building the portal: the spec is silent or ambiguous, and the
  frontend needed a *provisional* behaviour to stay functional. These are **not** client-approved and
  must be confirmed.

"Can proceed?" says whether frontend work could continue safely without a decision, and how.

## Part A — Flagged by the specification

| ID | Spec § | Item | Why it matters | Can proceed? / What was built |
|---|---|---|---|---|
| OI-01 | 1.2 | Minimum password strength rule ("Confirm with dev the minimum strength rule"). | Registration validation. | Yes. Provisional rule: ≥ 8 characters with at least one letter and one digit. It lives in one schema (`features/auth/schemas.ts`), so it is a one-line change. |
| OI-02 | 1.5, 4.11 | Cross-platform subscription reconciliation (web Stripe ↔ iOS/Android IAP) under Apple's external-payment restrictions. Needs technical/legal review. | Decides how a plan bought on one surface is recognised on the other. | Partly. The web portal only starts **Stripe** checkout (through a `BillingGateway` interface that is not connected). It shows the subscription's purchase source read-only and never links to external payment for mobile purchases. No mobile purchase flow was built. |
| OI-03 | 2 | Exact Free Plan limits ("e.g. up to 15 customers, 1 program, 1 location, 1 employee — exact numbers configurable by Super Admin"). | Free-plan gating. | Yes. Limits come from a plan-catalog config (`mocks/planCatalog.ts`, shaped as Super Admin config) and default to the spec's example values. "Location" is not a managed entity anywhere in the spec, so that limit is stored but never enforced. |
| OI-04 | 2 | Free Trial length ("e.g. 14 days") and whether it is enabled. | Plan selection and trial expiry. | Yes. Configurable in the plan catalog; the default is 14 days, enabled. |
| OI-05 | 1.5, 4.11 | Paid plan names, tiers, prices and feature sets. The spec names only a "Pro" plan (§4.9). | Plan selection and the upgrade/downgrade UI. | Partly. The catalog has a single paid plan, **"Pro"**, with **price = not configured**, and the UI says so. No prices are invented. |
| OI-06 | 4.3 | Should "Start from Scratch" be an alternate skin for every program type, or only a standalone custom pass outside the three structured types? | Changes the design-system build. | Partly. Only the confirmed behaviour is built: a blank canvas with RGB pickers; Program Name, Background RGB and Text RGB required; Logo optional; no structural elements. It is offered as a per-program design option and labelled "Pending client confirmation" in the UI. |
| OI-07 | 4.3 | Can Apple/Google Wallet show several upcoming reward levels at once (Points Program)? Needs a technical spike. | Points pass layout. | Yes. The preview uses the documented **fallback**: balance + next reward + points needed + QR. The full multi-level breakdown appears only in the portal's customer profile. |
| OI-08 | 4.9 | AI commentary gating: "Pro-plan-exclusive … confirm the exact gating with the client". | Analytics access. | Yes, provisionally. AI commentary is gated to Pro (paid) and Free Trial; the heatmap is available on every non-preview plan. Gating lives in `lib/access.ts` (`analytics.aiCommentary`). No AI service is connected (see OI-20). |
| OI-09 | 4.10 | Card/Panel Surface colour is not in the brand guide. | Dashboard surfaces. | Yes. Provisional tokens follow the spec's own guidance ("one shade lighter than the page background"): Light `#FFFFFF`, Dark `#0B1024`. They are marked **PROVISIONAL** in `styles/tokens.css`. |
| OI-10 | 4.10 | All brand hex values were colour-picked from an image; the final tokens (especially the wallet gradient and any secondary/tertiary accents) need designer confirmation. | Style guide. | Yes. The exact supplied values are used as working references (`styles/tokens.css`). |
| OI-11 | 4.10 | Auto Branding (generate a scheme from an uploaded logo). The client marked it "???". | MVP scope. | **Not built.** It is exploratory only, so nothing in the UI presents it. |
| OI-12 | 4.12 | Customer-facing language (wallet text, notification copy) may need per-notification language handling. | Notifications and wallet content. | Partly. Only the dashboard UI language setting is built. Customer-facing copy is entered as typed by the business, with no language field. |
| OI-13 | 1.5 | Free Trial availability "if enabled by Super Admin". | Plan selection. | Yes. Driven by the catalog flag `trial.enabled`. |
| OI-14 | 4.10 | Official monogram/app-icon artwork (`#080808` background, blue monogram) was not supplied as a file. | Favicon and logo. | Yes. A placeholder "B" monogram in Bonuca Blue on `#080808` is used. Replace it with the official asset. |

## Part B — Gaps found during implementation (provisional, needs confirmation)

| ID | Spec § | Gap | Provisional behaviour built |
|---|---|---|---|
| OI-15 | 4.6 | Manager "limited settings": which settings are limited is not defined. | Managers can open Settings and edit Business information, Address, Opening hours, Notifications and Language. **Billing is Owner-only.** The Employees section requires the "Managers may manage employees" permission. Logo/Brand colours/Wallet customization are editable by Managers (program/branding work). |
| OI-16 | 4.6 | "employees if permitted": who grants it and how. | An Owner-only toggle under Settings → Employees: "Managers may manage employees" (default **off**). |
| OI-17 | 4.6 | Can a Manager invite another Manager? | No. Owners can invite Managers and Employees; permitted Managers can invite Employees only. |
| OI-18 | 3.2, 4.6 | Which fields count as "limited customer info" for Employees. | Employees see name, customer ID, program memberships (stamps/points/tier/benefit), available rewards and last visit. Email, phone, birthday and notes are hidden. |
| OI-19 | 4.7 | AI Campaigns and AI Bonus Generator name the "Owner". Does a Manager also get them? | Owner-only. |
| OI-20 | 4.7, 4.9 | No AI service, model, endpoint or contract is specified. | An `AiGateway` interface exists. The default adapter reports **"AI service not connected"**; no drafts are fabricated. The draft → review/edit → confirm UI is complete and is verified in tests with an injected fake adapter. |
| OI-21 | 4.7 | Is "Double Stamps" only a notification, or does it change stamp logic (2 stamps per scan)? | Treated as a notification type only. Transaction logic is unchanged. |
| OI-22 | 4.7 | Wallet-push delivery: there is no push/notification service contract. | Campaigns can be saved as drafts. "Send" calls a `NotificationGateway`, which reports "not connected". Campaigns are never marked Sent unless the gateway confirms. |
| OI-23 | 4.7 | Win-back automation runs server-side. Its schedule and stage semantics (one reward per stage, replaced or stacked) are unspecified. | Stages are thresholds with an offer each, and the reward escalates. The dev backend evaluates inactivity when data loads and when the config is saved. It creates **one active win-back reward per customer**, for the highest stage reached, replacing any lower unredeemed stage. Notification delivery is recorded as "not delivered (push not connected)". |
| OI-24 | 4.8 | The meaning of the **Pending** reward state is not defined. | Pending = a reward that exists but cannot be redeemed yet, e.g. a one-time voucher before its Valid From date. |
| OI-25 | 4.2 | Stamp Card: what happens when the card is full (reset / carry-over)? | When the stamp count reaches Number of Stamps Required, a reward becomes **Available** and the card resets to 0. |
| OI-26 | 4.2 | Points Program: when is a reward "earned", and when are points deducted? Reward Expiry implies vouchers are issued. | When a transaction takes the balance to or past a reward's Points Required, that reward becomes **Available** (if no Available instance already exists). Redeeming it deducts the points. Reward Expiry (if on) expires Available rewards after X days. |
| OI-27 | 4.2 | Points "Fixed per scan" needs a points-per-scan value that the field table does not list. | A conditional "Points per scan" field is shown only when Awarding Method = Fixed. |
| OI-28 | 4.2 | Tier Program with Upgrade Basis = Points/Total Spend: how points/spend are captured at scan. | Total Spend: the employee enters the purchase amount. Points: the employee enters the points to add. Visits: +1 per scan. |
| OI-29 | 4.2 | The campaign lifecycle is not defined (only "QR generated on publish"). | Campaigns reuse the program lifecycle (Draft → Publish → Active ⇄ Paused, Archive) for consistency. |
| OI-30 | 4.3 | No launch base template is listed for **Points Program** or campaign vouchers (templates: Digital Stamp Card, Membership Card, Tier Program Pass). | Points and voucher passes use the confirmed master fields + dynamic content (§4.3 table) in a generic layout, labelled "No launch base template — pending confirmation". |
| OI-31 | 4.6 | Badge criteria are not defined ("Scan King", "Fastest Scanner", "Customer Hero"). | Scan King = most scans; Fastest Scanner = lowest average scan-to-confirm time (min. 5 scans); Customer Hero = most distinct customers served. All in the last 30 days. |
| OI-32 | 4.10 | Fonts: the option list is not defined, and Apple/Google Wallet do not support custom pass fonts. Also, business branding "propagates across the dashboard" while the dashboard chrome uses Bonuca's brand. | Font choice offers System / Serif / Rounded and applies to business-branded surfaces in the portal (business header, previews). Bonuca chrome tokens are never overridden by business colours. The business logo and name appear in the portal header. |
| OI-33 | 4.6 | Removing or deactivating employees is not specified. | Not built (out of documented scope). |
| OI-34 | 4.9 | Analytics period and definitions (Retention, Visit frequency) are not defined. | Fixed "last 30 days" window. Retention = % of customers active in the previous 30 days who returned in the last 30. Visit frequency = average visits per active customer. |
| OI-35 | 4.5 | Is Name required at signup configurable ("required by default")? | Every signup field, Name included, can be set Required or Optional. Name defaults to Required; the others default to Optional. |
| OI-36 | 4.4 | Production QR scanning library and pass-code format. | Camera scanning uses the browser `BarcodeDetector` API where available. Otherwise a clearly labelled manual pass-code entry is used (development / camera-unavailable state). |
| OI-37 | 1.3 | Email delivery for verification and invites: no provider is specified. | The `AuthGateway` dev adapter **does not send email**. It shows the 6-digit code / invite link in a "Development — email not sent" panel. |
| OI-38 | 1.1 | "Download App" target: no store URLs supplied. | Uses `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL`. When these are unset, the button shows "App store links not configured yet". |
| OI-39 | 1.1, 4.12 | UI translations for German/Turkish/French/Italian need professional review. | Translations in `src/i18n/locales/*` are **provisional machine-quality drafts** covering the shell, navigation, auth/onboarding, common actions and the Preview message. Untranslated strings fall back to English (see the coverage note in README). |
| OI-40 | 4.2 | Point Expiry semantics ("unused points expire after X months"): per earning batch or after inactivity? | All points expire once X months pass without activity on that card. Applied at the next scan. |
| OI-41 | 4.2 | Tier Downgrade Rule: how progress is measured after dropping a tier. | The customer drops one tier and their progress resets to that tier's threshold, so they must earn the next tier again. |
| OI-42 | 4.2, 4.10 | Stamp Card "Background — required", while §4.10 says base-template passes use the default gradient when the colour isn't overridden. | The default Bonuca gradient counts as a valid background for every program type. A colour or image can replace it. |
| OI-43 | 3.1, 4.6 | §3.1 lists Subscription & Billing for Owner *and* Manager; §4.6 gives billing/subscription only to the Owner. | Managers can view the Subscription & Billing tab read-only. Plan changes, invoices, payment history and billing information are Owner-only. |
| OI-44 | 4.4 | Production scan-speed measurement (< 5 s target). | Each transaction records the scan-to-confirm duration (from opening the camera or entering a code to the confirmation). It feeds the leaderboard. Real-device validation is still needed. |
| OI-45 | 4.10 | The UI redesign (`Bonuca-UI-Redesign/`) uses an off-white canvas `#F3F3F1` instead of the spec's `#FBFBFB`, a dark-mode accent `#2F5BFF` instead of `#1747F8`, a yellow highlight `#FFD43B`, and multi-colour categorical chart series (membership donut). | **Decided 2026-10-21 by the client: the redesign colours are final.** They live in `src/styles/redesign/design-tokens/tokens.css` and are shown on the Branding screen. Every chart keeps its Chart/Table toggle. **Superseded 2026-10-23 by the client: the portal now uses the Bonuca Admin palette** (light `#F8FAFC`, dark `#0B0F19`, accent `#1747F8` / dark `#3875F6`, slate text/borders), Admin-style shell, KPI cards and date-filter chips. |
