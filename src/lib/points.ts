import type { PointsConfig, PointsReward, RoundingRule } from '@/types/domain'

/** Points calculation (spec §4.2 Points Program). */
export function applyRounding(value: number, rule: RoundingRule): number {
  // Strip floating-point noise (e.g. 4.2 * 10 = 42.00000000000001) before rounding.
  const clean = Math.round(value * 1e6) / 1e6
  switch (rule) {
    case 'up':
      return Math.ceil(clean)
    case 'down':
      return Math.floor(clean)
    case 'nearest':
      return Math.round(clean)
  }
}

export interface PointsCalculation {
  points: number
  rawPoints: number
  belowMinimum: boolean
  capped: boolean
}

export function calculatePoints(config: PointsConfig, purchaseAmount: number | null): PointsCalculation {
  if (config.awardingMethod === 'fixed') {
    const raw = config.pointsPerScan ?? 0
    return cap(config, raw, false)
  }
  const amount = purchaseAmount ?? 0
  if (config.minimumPurchase !== null && amount < config.minimumPurchase) {
    return { points: 0, rawPoints: 0, belowMinimum: true, capped: false }
  }
  if (config.ratio.spend <= 0) return { points: 0, rawPoints: 0, belowMinimum: false, capped: false }
  const raw = applyRounding((amount * config.ratio.points) / config.ratio.spend, config.rounding)
  return cap(config, raw, false)
}

function cap(config: PointsConfig, raw: number, belowMinimum: boolean): PointsCalculation {
  const max = config.maxPointsPerTransaction
  if (max !== null && raw > max) return { points: max, rawPoints: raw, belowMinimum, capped: true }
  return { points: raw, rawPoints: raw, belowMinimum, capped: false }
}

export function sortedRewards(config: PointsConfig): PointsReward[] {
  return [...config.rewards].sort((a, b) => a.pointsRequired - b.pointsRequired)
}

/** Next reward = cheapest reward the balance has not reached yet. */
export function nextReward(config: PointsConfig, balance: number): { reward: PointsReward; pointsNeeded: number } | null {
  const reward = sortedRewards(config).find((r) => r.pointsRequired > balance)
  return reward ? { reward, pointsNeeded: reward.pointsRequired - balance } : null
}

export interface ManualPointsPreview extends PointsCalculation {
  currentBalance: number
  amount: number | null
  newBalance: number
  nextReward: PointsReward | null
  pointsStillNeeded: number | null
}

/** Preview shown before "Credit X points" (spec §4.2 condition). */
export function buildPointsPreview(config: PointsConfig, balance: number, amount: number | null): ManualPointsPreview {
  const calc = calculatePoints(config, amount)
  const newBalance = balance + calc.points
  const next = nextReward(config, newBalance)
  return {
    ...calc,
    currentBalance: balance,
    amount,
    newBalance,
    nextReward: next?.reward ?? null,
    pointsStillNeeded: next?.pointsNeeded ?? null,
  }
}

export function currencyCode(config: PointsConfig): string {
  return config.currency === 'other' ? config.customCurrency || '—' : config.currency
}
