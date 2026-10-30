import type { BusinessDataset, Campaign, Customer, ISODate, LifecycleStatus, RewardInstance } from '@/types/domain'
import { createId } from './ids'
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

const DEMO_FIRST = ['Lena', 'Marco', 'Aylin', 'Jonas', 'Sofia', 'Emre', 'Clara', 'Daniel', 'Mira', 'Tobias']
const DEMO_LAST = ['Becker', 'Rossi', 'Yildiz', 'Hoffmann', 'Conti', 'Kaya', 'Weber', 'Fischer', 'Demir', 'Schulz']

/**
 * Demo data for a campaign that has no linked customers yet (development environment): a handful of realistic
 * customers claim it over the last days, a few have already redeemed. Real claims come from the campaign QR.
 */
export function seedCampaignDemo(ds: BusinessDataset, campaign: Campaign, now: Date = new Date()): number {
  if (campaign.status !== 'active' || campaign.kind === undefined) return 0
  if (campaignLinked(ds, campaign.id, now).length > 0) return 0
  const program = campaign.kind === 'stamp_acquisition' ? ds.programs.find((p) => p.id === campaign.linkedProgramId) : undefined
  if (campaign.kind === 'stamp_acquisition' && (!program || program.status !== 'active')) return 0
  const staff = ds.users.find((u) => u.role === 'employee') ?? ds.users[0]
  let next = ds.customers.reduce((max, x) => Math.max(max, Number(x.customerNumber.replace(/\D/g, '')) || 0), 10000)
  const count = 6
  for (let i = 0; i < count; i++) {
    const at = new Date(now.getTime() - (i * 1.5 + 0.5) * 86_400_000).toISOString()
    const first = DEMO_FIRST[(i + campaign.id.length) % DEMO_FIRST.length]!
    const last = DEMO_LAST[(i * 3 + campaign.name.length) % DEMO_LAST.length]!
    next += 1
    const customer: Customer = { id: createId('cus'), businessId: ds.business.id, customerNumber: `C-${next}`, name: `${first} ${last}`, email: `${first}.${last}@example.com`.toLowerCase(), phone: '', birthday: '', notes: '', createdAt: at }
    ds.customers.push(customer)
    const redeemed = i % 3 === 1
    const reward = (partial: Partial<RewardInstance> & Pick<RewardInstance, 'source' | 'name'>): RewardInstance => ({
      id: createId('rwd'), businessId: ds.business.id, customerId: customer.id, programId: null, campaignId: campaign.id, description: '', pointsRewardId: null, pointsCost: null, winbackStage: null, passCode: null,
      issuedAt: at, availableFrom: null, expiresAt: null, redeemedAt: redeemed ? new Date(new Date(at).getTime() + 3_600_000 * 20).toISOString() : null, status: redeemed ? 'redeemed' : 'available', ...partial,
    })
    if (campaign.kind === 'stamp_acquisition' && program) {
      ds.memberships.push({ id: createId('mem'), customerId: customer.id, programId: program.id, passCode: `BNC-${createId('p').slice(-8).toUpperCase()}`, joinedAt: at, stamps: campaign.startingStamps, points: 0, visits: 0, totalSpend: 0, tierIndex: 0, lastActivityAt: null, viaCampaignId: campaign.id })
      if (campaign.welcomeGift.enabled) {
        const r = reward({ source: 'welcome_gift', name: campaign.welcomeGift.rewardName, description: campaign.welcomeGift.description, programId: program.id })
        ds.rewards.push(r)
        if (redeemed && staff) ds.transactions.push({ id: createId('txn'), businessId: ds.business.id, customerId: customer.id, programId: program.id, campaignId: null, employeeId: staff.id, kind: 'reward_redeemed', stampsAdded: 0, pointsAdded: 0, purchaseAmount: null, rewardId: r.id, createdAt: r.redeemedAt!, durationMs: null, entry: 'scan', balanceAfter: null })
      }
    } else if (campaign.kind === 'voucher') {
      const r = reward({ source: 'voucher', name: campaign.voucherReward, passCode: `BNC-${createId('v').slice(-8).toUpperCase()}`, availableFrom: new Date(`${campaign.validFrom}T00:00:00`).toISOString(), expiresAt: new Date(`${campaign.validTo}T23:59:59`).toISOString() })
      ds.rewards.push(r)
      if (redeemed && staff) ds.transactions.push({ id: createId('txn'), businessId: ds.business.id, customerId: customer.id, programId: null, campaignId: campaign.id, employeeId: staff.id, kind: 'voucher_redeemed', stampsAdded: 0, pointsAdded: 0, purchaseAmount: null, rewardId: r.id, createdAt: r.redeemedAt!, durationMs: null, entry: 'scan', balanceAfter: null })
    }
  }
  return count
}
