import type { BusinessDataset, Campaign, ISODate, LifecycleStatus, RewardInstance } from '@/types/domain'
import { rewardStatus } from './rewards'
import { formatDate } from './dates'

/**
 * Campaigns tab (BONUCA CHANGES doc): Stamp card acquisition, One-time voucher and Win-back in one list.
 * Win-back is the business's win-back automation shown as a campaign ("Always on").
 */
export type CampaignKind = Campaign['kind'] | 'winback'
export const WINBACK_ID = 'winback'

export const CAMPAIGN_KIND_LABEL: Record<CampaignKind, string> = {
  stamp_acquisition: 'Stamp acquisition',
  voucher: 'One-time voucher',
  winback: 'Win-back',
}

export interface CampaignRow {
  id: string
  kind: CampaignKind
  name: string
  status: LifecycleStatus
  offer: string
  period: string
  /** Linked customers: claimed (QR types) or triggered (win-back). */
  customers: number
  redeemed: number
  createdAt: ISODate
}

export type LinkedRewardStatus = 'not_redeemed' | 'redeemed' | 'expired' | 'none'

export interface CampaignLinkedRow {
  customerId: string
  customerName: string
  date: ISODate
  rewardStatus: LinkedRewardStatus
  redeemedAt: ISODate | null
  redeemedBy: string | null
  /** Stamp acquisition only. */
  stampsGiven: number | null
}

export function winbackStatus(ds: BusinessDataset): LifecycleStatus {
  const w = ds.winback
  if (w.endedAt) return 'ended'
  if (w.enabled) return 'active'
  return w.stages.some((s) => s.offer.trim()) ? 'paused' : 'draft'
}

function linkedStatus(reward: RewardInstance | undefined, now: Date): LinkedRewardStatus {
  if (!reward) return 'none'
  const s = rewardStatus(reward, now)
  return s === 'redeemed' ? 'redeemed' : s === 'expired' ? 'expired' : 'not_redeemed'
}

function redeemer(ds: BusinessDataset, reward: RewardInstance | undefined): string | null {
  if (!reward || reward.status !== 'redeemed') return null
  const tx = ds.transactions.find((t) => t.rewardId === reward.id)
  return tx ? (ds.users.find((u) => u.id === tx.employeeId)?.fullName ?? null) : null
}

export function campaignLinked(ds: BusinessDataset, campaignId: string, now: Date = new Date()): CampaignLinkedRow[] {
  const name = new Map(ds.customers.map((c) => [c.id, c.name || c.customerNumber]))
  const row = (customerId: string, date: string, reward: RewardInstance | undefined, stampsGiven: number | null): CampaignLinkedRow => ({
    customerId,
    customerName: name.get(customerId) ?? 'Unknown customer',
    date,
    rewardStatus: linkedStatus(reward, now),
    redeemedAt: reward?.status === 'redeemed' ? reward.redeemedAt : null,
    redeemedBy: redeemer(ds, reward),
    stampsGiven,
  })
  let rows: CampaignLinkedRow[]
  if (campaignId === WINBACK_ID) {
    rows = ds.winbackEvents.map((ev) => row(ev.customerId, ev.createdAt, ds.rewards.find((r) => r.id === ev.rewardId), null))
  } else {
    const campaign = ds.campaigns.find((c) => c.id === campaignId)
    if (!campaign) return []
    if (campaign.kind === 'stamp_acquisition') {
      rows = ds.memberships
        .filter((m) => m.viaCampaignId === campaignId)
        .map((m) => row(m.customerId, m.joinedAt, ds.rewards.find((r) => r.campaignId === campaignId && r.customerId === m.customerId && r.source === 'welcome_gift'), campaign.startingStamps))
    } else {
      rows = ds.rewards.filter((r) => r.campaignId === campaignId && r.source === 'voucher').map((r) => row(r.customerId, r.issuedAt, r, null))
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

function offerOf(ds: BusinessDataset, c: Campaign | null): string {
  if (!c) {
    const stages = ds.winback.stages.filter((s) => s.enabled !== false && s.offer.trim())
    const first = stages[0]
    if (!first) return 'No offer set'
    return `${first.offer} after ${first.days} days away${stages.length > 1 ? ` (+${stages.length - 1} more stages)` : ''}`
  }
  if (c.kind === 'voucher') return c.voucherReward ? `${c.voucherReward} voucher` : 'Voucher reward not set'
  const stamps = `${c.startingStamps} starting stamp${c.startingStamps === 1 ? '' : 's'}`
  return c.welcomeGift.enabled && c.welcomeGift.rewardName ? `${stamps} + ${c.welcomeGift.rewardName}` : stamps
}

function periodOf(c: Campaign | null): string {
  if (!c) return 'Always on'
  if (c.kind === 'voucher') return c.validFrom || c.validTo ? `${formatDate(c.validFrom || null)} – ${formatDate(c.validTo || null)}` : 'Dates not set'
  return c.publishedAt ? `${formatDate(c.publishedAt)} – no end date` : 'Not published'
}

/** All campaigns plus the win-back campaign, newest first. */
export function campaignRows(ds: BusinessDataset, now: Date = new Date()): CampaignRow[] {
  const count = (id: string) => {
    const linked = campaignLinked(ds, id, now)
    return { customers: linked.length, redeemed: linked.filter((r) => r.rewardStatus === 'redeemed').length }
  }
  const rows: CampaignRow[] = ds.campaigns.map((c) => ({ id: c.id, kind: c.kind, name: c.name, status: c.status, offer: offerOf(ds, c), period: periodOf(c), createdAt: c.createdAt, ...count(c.id) }))
  rows.push({ id: WINBACK_ID, kind: 'winback', name: 'Win-back', status: winbackStatus(ds), offer: offerOf(ds, null), period: periodOf(null), createdAt: ds.business.createdAt, ...count(WINBACK_ID) })
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Campaigns a customer is linked to (customer profile → Campaigns section). */
export function customerCampaigns(ds: BusinessDataset, customerId: string): { id: string; kind: CampaignKind; name: string; status: LifecycleStatus; date: ISODate }[] {
  const out: { id: string; kind: CampaignKind; name: string; status: LifecycleStatus; date: ISODate }[] = []
  for (const c of ds.campaigns) {
    const linked = campaignLinked(ds, c.id).find((r) => r.customerId === customerId)
    if (linked) out.push({ id: c.id, kind: c.kind, name: c.name, status: c.status, date: linked.date })
  }
  const wb = ds.winbackEvents.filter((e) => e.customerId === customerId).at(-1)
  if (wb) out.push({ id: WINBACK_ID, kind: 'winback', name: 'Win-back', status: winbackStatus(ds), date: wb.createdAt })
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

/** Vouchers end automatically after their end date. Returns true when something changed. */
export function endExpiredCampaigns(ds: BusinessDataset, now: Date): boolean {
  let changed = false
  for (const c of ds.campaigns) {
    if (c.kind === 'voucher' && (c.status === 'active' || c.status === 'paused') && c.validTo && new Date(`${c.validTo}T23:59:59`) < now) {
      c.status = 'ended'
      changed = true
    }
  }
  return changed
}
