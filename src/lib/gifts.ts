import type { Gift, GiftStatus } from '@/types/domain'

/** Scheduled / Expired are derived from the dates; Cancelled and Redeemed are stored. */
export function giftStatus(gift: Gift, now: Date = new Date()): GiftStatus {
  if (gift.status === 'cancelled') return 'cancelled'
  if (gift.status === 'redeemed') return 'redeemed'
  if (new Date(gift.expiresAt) < now) return 'expired'
  if (gift.availableFrom && new Date(gift.availableFrom) > now) return 'scheduled'
  return 'available'
}

export const GIFT_STATUS_LABEL: Record<GiftStatus, string> = {
  scheduled: 'Scheduled',
  available: 'Available',
  redeemed: 'Redeemed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}
