# Implementation Plan

Every requirement ID in `requirements-traceability.md` is assigned to exactly one phase.

| Phase | Scope | Requirement IDs |
|---|---|---|
| P0 — Foundation | Vite/TS strict/Tailwind setup, design tokens (light/dark), i18n infrastructure, theme provider, domain types, access & plan logic, service interfaces, dev backend + demo dataset, app shell, role-aware navigation, route guards, Preview/override banners | SYS-01, SYS-02, SYS-03, SYS-05, ACC-01…ACC-09, EXP-01…EXP-03, BRD-02…BRD-05, BRD-07, SET-02 |
| P1 — Auth & onboarding | Landing, registration, email verification, business profile, plan selection, first program, invite acceptance | ONB-01…ONB-15, EMP-04 (accept side) |
| P2 — Loyalty programs | Program list, 4 type forms with conditional fields, lifecycle (publish/enable/disable/archive), campaigns (acquisition + voucher), live preview, master-field warning | PRG-01…PRG-13, WAL-06, WAL-08 |
| P3 — Wallet cards | Template vs scratch selection, master field list, per-type dynamic content, wallet integration status | WAL-01…WAL-05, WAL-07, WAL-09, SYS-04 |
| P4 — Scanner & QR | Printable QR (5 use cases, PNG/PDF), scan flow (camera/BarcodeDetector + dev manual entry), stamp/points/visit/redeem/voucher/win-back, success animation, recent scans | QR-01…QR-08, PRG-11 |
| P5 — Customers & employees | Customer list/search/profile/notes/add, signup field config; employee list, invite, permissions toggle, leaderboard + badges, visibility toggle | CUS-01…CUS-04, EMP-01…EMP-06 |
| P6 — Engagement | Notifications (manual, win-back, AI campaign, AI bonus drafts), rewards (states, surprise config) | NOT-01…NOT-05, RWD-01…RWD-03 |
| P7 — Insight & account | Dashboard stats & charts, analytics metrics/heatmap/AI commentary gating, branding, subscription & billing, settings sections | DSH-01…DSH-07, ANL-01…ANL-03, BRD-01, BRD-06, SUB-01…SUB-04, SET-01, SET-03 |
| P8 — Verification | Unit/integration (Vitest + RTL), e2e (Playwright), lint, typecheck, build, browser visual check, spec compliance review, docs | all |

Phases P0–P7 are implemented in order. P8 runs at the end (tests are written per phase but executed together).
