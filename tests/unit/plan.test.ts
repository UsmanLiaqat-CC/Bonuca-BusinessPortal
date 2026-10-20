import { describe, expect, it } from 'vitest'
import { resolvePlanState } from '@/lib/plan'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'
import { NOW, sub } from '../fixtures'

describe('plan resolution (spec §2)', () => {
  it('no selection → Preview Mode', () => {
    expect(resolvePlanState(sub(), DEV_PLAN_CATALOG, NOW).mode).toBe('preview')
  })
  it('active trial grants paid features', () => {
    const s = resolvePlanState(sub({ selection: 'trial', trialEndsAt: '2026-10-25T00:00:00Z' }), DEV_PLAN_CATALOG, NOW)
    expect(s.mode).toBe('trial')
    expect(s.plan?.id).toBe('pro')
  })
  it('expired trial reverts to Free when Free is enabled', () => {
    const s = resolvePlanState(sub({ selection: 'trial', trialEndsAt: '2026-10-01T00:00:00Z' }), DEV_PLAN_CATALOG, NOW)
    expect(s).toMatchObject({ mode: 'free', trialExpired: true })
  })
  it('expired trial reverts to Preview when Free is disabled', () => {
    const catalog = { ...DEV_PLAN_CATALOG, free: { ...DEV_PLAN_CATALOG.free, enabled: false } }
    const s = resolvePlanState(sub({ selection: 'trial', trialEndsAt: '2026-10-01T00:00:00Z' }), catalog, NOW)
    expect(s).toMatchObject({ mode: 'preview', trialExpired: true })
  })
  it('active Super Admin override wins and unlimited removes limits', () => {
    const s = resolvePlanState(sub({ selection: 'free', planId: 'free', override: { kind: 'unlimited', planId: 'pro', endsAt: null } }), DEV_PLAN_CATALOG, NOW)
    expect(s.mode).toBe('paid')
    expect(s.override?.kind).toBe('unlimited')
    expect(s.limits?.customers).toBeNull()
  })
  it('ended override falls back to the underlying selection', () => {
    const s = resolvePlanState(sub({ selection: 'free', planId: 'free', override: { kind: 'free_access', planId: 'pro', endsAt: '2026-10-01T00:00:00Z' } }), DEV_PLAN_CATALOG, NOW)
    expect(s).toMatchObject({ mode: 'free', override: null })
  })
})
