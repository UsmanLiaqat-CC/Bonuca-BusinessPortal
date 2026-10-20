import type {
  AccessMode,
  PlanCatalog,
  PlanDefinition,
  PlanLimits,
  Subscription,
  SuperAdminOverride,
} from '@/types/domain'

/**
 * Plan resolution (spec §2). Pure — never mutates or deletes data; a mode change
 * only changes which features are accessible (§2 condition).
 */
export interface PlanState {
  mode: AccessMode
  /** Effective plan whose features/limits apply. null in Preview Mode. */
  plan: PlanDefinition | null
  limits: PlanLimits | null
  /** Active Super Admin override (read-only for the business). */
  override: SuperAdminOverride | null
  trialEndsAt: string | null
  /** True when a trial existed and has ended (account reverted). */
  trialExpired: boolean
}

export const UNLIMITED: PlanLimits = { customers: null, programs: null, locations: null, employees: null }

export function findPlan(catalog: PlanCatalog, planId: string | null): PlanDefinition | null {
  if (!planId) return null
  if (catalog.free.plan.id === planId) return catalog.free.plan
  return catalog.paid.find((p) => p.id === planId) ?? null
}

function isOverrideActive(override: SuperAdminOverride | null, now: Date): override is SuperAdminOverride {
  return !!override && (override.endsAt === null || new Date(override.endsAt) > now)
}

export function resolvePlanState(sub: Subscription, catalog: PlanCatalog, now: Date = new Date()): PlanState {
  const base = { trialEndsAt: sub.trialEndsAt, trialExpired: false }

  if (isOverrideActive(sub.override, now)) {
    const plan = findPlan(catalog, sub.override.planId) ?? catalog.paid[0] ?? catalog.free.plan
    const limits = sub.override.kind === 'unlimited' ? UNLIMITED : plan.limits
    return { ...base, mode: plan.kind === 'free' ? 'free' : 'paid', plan, limits, override: sub.override }
  }

  const free = (): PlanState => ({
    ...base,
    mode: 'free',
    plan: catalog.free.plan,
    limits: catalog.free.plan.limits,
    override: null,
  })
  const preview = (trialExpired = false): PlanState => ({
    ...base,
    trialExpired,
    mode: 'preview',
    plan: null,
    limits: null,
    override: null,
  })

  switch (sub.selection) {
    case 'paid': {
      const plan = findPlan(catalog, sub.planId)
      return plan ? { ...base, mode: 'paid', plan, limits: plan.limits, override: null } : preview()
    }
    case 'trial': {
      if (sub.trialEndsAt && new Date(sub.trialEndsAt) > now) {
        const plan = findPlan(catalog, catalog.trial.grantsPlanId)
        return { ...base, mode: 'trial', plan, limits: plan?.limits ?? UNLIMITED, override: null }
      }
      // §2: on expiry no data is deleted; revert to Free if enabled, otherwise Preview.
      return catalog.free.enabled ? { ...free(), trialExpired: true } : preview(true)
    }
    case 'free':
      return free()
    case 'none':
      return preview()
  }
}

export function hasPlanFeature(state: PlanState, feature: keyof PlanDefinition['features']): boolean {
  return state.mode !== 'preview' && !!state.plan?.features[feature]
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000))
}
