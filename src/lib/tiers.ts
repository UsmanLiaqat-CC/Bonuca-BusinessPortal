import type { Membership, TierConfig, TierDefinition, UpgradeBasis } from '@/types/domain'

/** Tier program helpers (spec §4.2). */
export const DEFAULT_TIER_NAMES = ['Member', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const

export function tierMetric(m: Pick<Membership, 'visits' | 'points' | 'totalSpend'>, basis: UpgradeBasis): number {
  switch (basis) {
    case 'visits':
      return m.visits
    case 'points':
      return m.points
    case 'spend':
      return m.totalSpend
  }
}

/** Highest tier whose required value is met. */
export function computeTierIndex(config: TierConfig, value: number): number {
  let index = 0
  config.tiers.forEach((t, i) => {
    if (value >= t.requiredValue) index = i
  })
  return index
}

export function nextTierProgress(
  config: TierConfig,
  tierIndex: number,
  value: number,
): { next: TierDefinition; remaining: number } | null {
  const next = config.tiers[tierIndex + 1]
  if (!next) return null
  return { next, remaining: Math.max(0, next.requiredValue - value) }
}

export function basisUnit(basis: UpgradeBasis): string {
  return basis === 'visits' ? 'visits' : basis === 'points' ? 'points' : 'spend'
}
