# QA — screen-by-screen verification against the specification

Run (2026-10-20) on the live dev server with Playwright (headed, slow-motion) against `../Bonuca_Business_Portal_Spec.docx`.
Final full run: **49/49 e2e passed** (`npm run test:e2e`), **92/92 unit + integration passed** (`npm test`), typecheck, lint and build clean.
Screenshots of every phase are in `docs/qa/screenshots/`.

Re-run one phase live: `SLOWMO=250 npx playwright test tests/e2e/qa-phase4-programs.spec.ts --project=desktop --headed --workers=1`

| Phase | Spec § | Spec file | What is checked (every option) | Result |
|---|---|---|---|---|
| 1 | §1.1–1.7 | `qa-phase1-onboarding.spec.ts` | Start Free / Log In / Download App; 5 languages on landing; each registration field + validation (name, email, password rule, country, phone optional, Terms); verification required, wrong code rejected, resend; 6 business categories, 5 languages, no currency field, default brand colour, optional hours; Free / Trial / Pro (price not configured) / Stripe not connected / Skip; first program 4 types + skip → Dashboard | 7/7 ✓ |
| 2 | §2 | `qa-phase2-plans.spec.ts` | Preview: demo data label on tabs, Create Program / Add customer / Invite / New campaign / Settings Save locked with exact message, leaving Preview via Free; Free limit (1 program); Trial banner + expiry → Free, data kept; Super Admin override banner with end date, no plan controls | 4/4 ✓ |
| 3 | §3, §4.6 | `qa-phase3-roles.spec.ts` | Owner all 12 tabs; Manager: billing read-only, invites Employees only, no AI, no Billing settings; Employee: Scanner / Customer Info / Account only, Dashboard/Analytics/Settings/Subscription/Programs blocked, no email column, leaderboard, logout | 3/3 ✓ |
| 4 | §4.2 | `qa-phase4-programs.spec.ts` | Stamp: logo/icon/hero, colour vs image background, contrast suggestion, stamps, 6 icons, reward types, expiry toggle, T&C, publish → QR, Enable/Disable, Archive; draft vs publish validation; Membership: benefit types, discount only for discounts, % ≤ 100, validity date; Tier: 2–5 tiers with default names, 3 bases, per-tier fields, downgrade, enable/disable tiers; Points: 8 currencies + other, ratio, fixed/manual, 3 rounding rules, min, cap, add/remove rewards, point & reward expiry; Acquisition campaign: linked card, 0/1/2/3/Custom, welcome gift fields, QR PNG/PDF; Voucher: date order, logo, QR; several programs of same type + status filters | 7/7 ✓ |
| 5 | §4.3 | `qa-phase5-wallet.spec.ts` | 3 base templates; template vs Start from Scratch (RGB background required, pending-confirmation label, no structure); master field list (7 rows); dynamic content; iPhone/Android; tier and points pass content; master-field edit warning on Active program | 3/3 ✓ |
| 6 | §4.4 | `qa-phase6-scanner.spec.ts` | Stamp add + confirmation + animation + "wallet update not sent"; Points manual: below minimum, cap, full 7-line preview, Credit X points; Membership benefit + visit; Tier visit; Paused → temporarily unavailable; Voucher redeemed once then locked; Win-back panel (name, days inactive, reward, status) → Redeem Reward; printable QR: register + programs, 5 placements, PDF | 8/8 ✓ |
| 7 | §4.5, §4.7, §4.8 | `qa-phase7-engagement.spec.ts` | Customer search by ID / name / email / phone, empty result, profile sections, notes save; signup fields required/optional + Add customer respects them; 7 campaign types, draft, edit, send → not connected, stays Draft; win-back 14/30/40/60 defaults, order validation, add stage, save, log "Not delivered"; AI Campaign + AI Bonus → "AI service not connected", no fake draft; reward states Available/Redeemed/Pending/Expired; Surprise rewards off by default, pool required, save | 6/6 ✓ |
| 8 | §4.1, §4.9–4.12 | `qa-phase8-insights-settings.spec.ts` | 9 dashboard stats + 5 charts + table view; analytics 5 metrics, heatmap, top members, AI commentary not connected; branding colours + 3 fonts + Bonuca tokens, no Auto Branding; subscription plan, Stripe not connected, invoices/payments/billing truthful, mobile IAP note; settings 10 sections, saves, hours validation, 5 languages; light/dark theme | 6/6 ✓ |

Earlier journeys (`journeys.spec.ts`, desktop + mobile) also pass: 5/5.

## Defects found and fixed during QA / review
- Employee scanner lookup returned customer email/phone/notes (now limited, test added).
- Managers could read pending invite tokens (now Owner-only, test added); invite role validated server-side; accept-invite validates password.
- Plan could be changed locally while managed by Bonuca / bought on mobile / paid (now rejected, test added); `finishOnboarding` now Owner-only.
- `redeem_reward` accepted rewards from another program or vouchers; win-back redeem ignored paused programs; membership expiry date off by timezone; DST-unsafe day arithmetic — all fixed.
- Dialog focus jumped on parent re-render; camera restarted on every render and could stay on after unmount; scan animation/chime replayed; editor form state leaked between program types; duplicate program on publish retry; notes draft leaked between customers — fixed.
- Table rows not keyboard-accessible; locked-action tooltip not dismissable with Escape; mobile drawer had no dialog semantics/Escape — fixed.
- Tier badge was computed but not shown on the pass preview — fixed.
- Sample accounts were seeded even when dev tools are disabled — now only with `VITE_ENABLE_DEV_TOOLS`.

## Not testable end-to-end here (external dependencies — UI states this truthfully)
Email delivery, Stripe checkout/invoices, App Store / Google Play, Apple/Google Wallet pass push, notification delivery, AI. See `docs/open-items.md` for spec questions awaiting the client.
