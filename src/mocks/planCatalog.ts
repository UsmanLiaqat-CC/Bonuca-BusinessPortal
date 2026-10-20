import type { PlanCatalog } from '@/types/domain'

/**
 * Development stand-in for the plan configuration owned by the Bonuca Super Admin portal.
 * Values are the specification's *examples* (§2) — not confirmed numbers (OI-03, OI-04, OI-05).
 * Paid pricing is intentionally null: the spec supplies no prices, so none are invented.
 */
export const DEV_PLAN_CATALOG: PlanCatalog = {
  free: {
    enabled: true,
    plan: {
      id: 'free',
      name: 'Free',
      kind: 'free',
      priceLabel: null,
      limits: { customers: 15, programs: 1, locations: 1, employees: 1 },
      features: { aiCommentary: false },
    },
  },
  trial: { enabled: true, days: 14, grantsPlanId: 'pro' },
  paid: [
    {
      id: 'pro',
      name: 'Pro',
      kind: 'paid',
      priceLabel: null,
      limits: { customers: null, programs: null, locations: null, employees: null },
      features: { aiCommentary: true },
    },
  ],
}
