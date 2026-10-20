import type { RewardInstance, RewardStatus } from '@/types/domain'

/** Reward state (spec §4.8). Pending = not yet redeemable (OI-24); Expired = past expiry. */
export function rewardStatus(reward: RewardInstance, now: Date = new Date()): RewardStatus {
  if (reward.status === 'redeemed') return 'redeemed'
  if (reward.expiresAt && new Date(reward.expiresAt) <= now) return 'expired'
  if (reward.availableFrom && new Date(reward.availableFrom) > now) return 'pending'
  return 'available'
}

export const REWARD_STATUSES: readonly RewardStatus[] = ['available', 'redeemed', 'pending', 'expired']

export function countByStatus(rewards: RewardInstance[], now: Date = new Date()): Record<RewardStatus, number> {
  const counts: Record<RewardStatus, number> = { available: 0, redeemed: 0, pending: 0, expired: 0 }
  for (const r of rewards) counts[rewardStatus(r, now)]++
  return counts
}
