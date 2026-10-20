import { describe, expect, it } from 'vitest'
import { applyRounding, buildPointsPreview, calculatePoints } from '@/lib/points'
import { defaultPointsConfig } from '@/lib/factories'
import type { PointsConfig } from '@/types/domain'

const cfg = (patch: Partial<PointsConfig> = {}): PointsConfig => ({
  ...defaultPointsConfig('EUR'),
  rewards: [
    { id: 'a', name: 'Free Coffee', pointsRequired: 100, icon: null },
    { id: 'b', name: 'Free Dessert', pointsRequired: 250, icon: null },
  ],
  ...patch,
})

describe('points calculation (spec §4.2)', () => {
  it('applies the rounding rule', () => {
    expect(applyRounding(4.5, 'down')).toBe(4)
    expect(applyRounding(4.1, 'up')).toBe(5)
    expect(applyRounding(4.5, 'nearest')).toBe(5)
    expect(applyRounding(42.00000000000001, 'up')).toBe(42)
  })
  it('manual: amount × ratio with rounding', () => {
    expect(calculatePoints(cfg({ ratio: { spend: 1, points: 10 }, rounding: 'down' }), 4.25).points).toBe(42)
    expect(calculatePoints(cfg({ ratio: { spend: 2, points: 3 }, rounding: 'up' }), 5).points).toBe(8)
  })
  it('purchases below the minimum earn no points', () => {
    expect(calculatePoints(cfg({ minimumPurchase: 5 }), 4.99)).toMatchObject({ points: 0, belowMinimum: true })
  })
  it('caps points per transaction', () => {
    expect(calculatePoints(cfg({ maxPointsPerTransaction: 100 }), 50)).toMatchObject({ points: 100, rawPoints: 500, capped: true })
  })
  it('fixed per scan awards the same points', () => {
    expect(calculatePoints(cfg({ awardingMethod: 'fixed', pointsPerScan: 15 }), null).points).toBe(15)
  })
  it('preview shows new balance, next reward and points still needed', () => {
    const p = buildPointsPreview(cfg(), 80, 3)
    expect(p).toMatchObject({ currentBalance: 80, points: 30, newBalance: 110, pointsStillNeeded: 140 })
    expect(p.nextReward?.name).toBe('Free Dessert')
  })
})
