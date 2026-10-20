import type { BusinessDataset, PlanCatalog, Subscription } from '@/types/domain'
import { buildSampleDataset } from '@/mocks/sampleDataset'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'
import { defaultSubscription } from '@/lib/factories'
import { resolvePlanState } from '@/lib/plan'
import type { AccessContext } from '@/lib/access'
import type { Role } from '@/types/domain'

export const NOW = new Date('2026-10-20T12:00:00Z')

export function sampleDataset(now = NOW): BusinessDataset {
  return buildSampleDataset({
    businessId: 'biz_test',
    businessName: 'Test Café',
    seed: 1,
    now,
    staff: [
      { id: 'u_owner', fullName: 'Olive Owner', email: 'o@test.dev', role: 'owner' },
      { id: 'u_emp', fullName: 'Eve Employee', email: 'e@test.dev', role: 'employee' },
    ],
  })
}

export function sub(patch: Partial<Subscription> = {}): Subscription {
  return { ...defaultSubscription(), ...patch }
}

export function ctx(role: Role, subscription: Subscription, opts: { managers?: boolean; leaderboard?: boolean; catalog?: PlanCatalog } = {}): AccessContext {
  return {
    role,
    plan: resolvePlanState(subscription, opts.catalog ?? DEV_PLAN_CATALOG, NOW),
    permissions: { managersCanManageEmployees: !!opts.managers, showLeaderboardToEmployees: !!opts.leaderboard },
  }
}
