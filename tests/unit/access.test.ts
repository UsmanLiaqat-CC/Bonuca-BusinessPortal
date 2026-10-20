import { describe, expect, it } from 'vitest'
import { PREVIEW_LOCK_MESSAGE, checkLimit, evaluate } from '@/lib/access'
import { resolvePlanState } from '@/lib/plan'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'
import { NOW, ctx, sub } from '../fixtures'

const FREE = sub({ selection: 'free', planId: 'free' })
const TRIAL = sub({ selection: 'trial', planId: 'pro', trialEndsAt: '2026-11-01T00:00:00Z' })
const PREVIEW = sub({ selection: 'none' })

describe('access rules (spec §2, §3, §4.6)', () => {
  it('uses the exact Preview Mode message for locked actions', () => {
    expect(PREVIEW_LOCK_MESSAGE).toBe('Select a free trial, free plan, or paid plan to use this feature.')
    const d = evaluate(ctx('owner', PREVIEW), 'programs.manage')
    expect(d).toEqual({ allowed: false, reason: 'preview', message: PREVIEW_LOCK_MESSAGE })
  })

  it('keeps every tab viewable in Preview Mode (read-only tour) but locks mutations', () => {
    const c = ctx('owner', PREVIEW)
    for (const p of ['dashboard.view', 'programs.view', 'customers.view', 'analytics.view', 'settings.view'] as const) expect(evaluate(c, p).allowed).toBe(true)
    for (const p of ['programs.manage', 'customers.add', 'employees.invite', 'qr.manage', 'notifications.manage', 'settings.edit', 'scanner.transact'] as const) {
      expect(evaluate(c, p)).toMatchObject({ allowed: false, message: PREVIEW_LOCK_MESSAGE })
    }
  })

  it('never preview-locks plan selection (the way out of Preview Mode)', () => {
    expect(evaluate(ctx('owner', PREVIEW), 'subscription.manage').allowed).toBe(true)
  })

  it('hides the Dashboard, billing, analytics and settings from Employees', () => {
    const c = ctx('employee', FREE)
    for (const p of ['dashboard.view', 'subscription.view', 'analytics.view', 'settings.view', 'programs.manage'] as const) {
      expect(evaluate(c, p)).toMatchObject({ allowed: false, reason: 'role' })
    }
    for (const p of ['scanner.use', 'scanner.transact', 'customers.view', 'account.view'] as const) expect(evaluate(c, p).allowed).toBe(true)
    expect(evaluate(c, 'customers.viewFull').allowed).toBe(false)
  })

  it('gives Managers employee management only when the Owner permits it', () => {
    expect(evaluate(ctx('manager', FREE), 'employees.invite').allowed).toBe(false)
    expect(evaluate(ctx('manager', FREE, { managers: true }), 'employees.invite').allowed).toBe(true)
    expect(evaluate(ctx('manager', FREE, { managers: true }), 'employees.inviteManager').allowed).toBe(false)
    expect(evaluate(ctx('manager', FREE), 'subscription.manage').allowed).toBe(false)
    expect(evaluate(ctx('manager', FREE), 'notifications.ai').allowed).toBe(false)
  })

  it('shows the leaderboard to employees only when enabled', () => {
    expect(evaluate(ctx('employee', FREE), 'leaderboard.view').allowed).toBe(false)
    expect(evaluate(ctx('employee', FREE, { leaderboard: true }), 'leaderboard.view').allowed).toBe(true)
  })

  it('gates AI commentary to the Pro feature set (trial included)', () => {
    expect(evaluate(ctx('owner', FREE), 'analytics.aiCommentary')).toMatchObject({ allowed: false, reason: 'plan' })
    expect(evaluate(ctx('owner', TRIAL), 'analytics.aiCommentary').allowed).toBe(true)
  })

  it('enforces Free plan limits', () => {
    const plan = resolvePlanState(FREE, DEV_PLAN_CATALOG, NOW)
    expect(checkLimit(plan, 'programs', 0).allowed).toBe(true)
    expect(checkLimit(plan, 'programs', 1)).toMatchObject({ allowed: false, reason: 'limit' })
    expect(checkLimit(plan, 'customers', 15).allowed).toBe(false)
  })
})
