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
