import type {
  BusinessDataset,
  Campaign,
  Customer,
  Gift,
  Membership,
  PointsProgram,
  Program,
  RewardInstance,
  Transaction,
  TransactionKind,
  VoucherCampaign,
} from '@/types/domain'
import { addDays, addMonths, daysBetween } from './dates'
import { createId } from './ids'
import { buildPointsPreview, calculatePoints, sortedRewards } from './points'
import { rewardStatus } from './rewards'
import { giftStatus } from './gifts'
import { computeTierIndex, tierMetric } from './tiers'

/**
 * QR scan transaction engine (spec §4.2, §4.4, §4.7, §4.8). Pure: returns a new dataset.
 * Provisional rules are documented in docs/open-items.md (OI-23, OI-25, OI-26, OI-28, OI-40, OI-41).
 */

export class ScanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScanError'
  }
}

export type ScanTarget =
  | { kind: 'membership'; customer: Customer; membership: Membership; program: Program }
  | { kind: 'voucher'; customer: Customer; reward: RewardInstance; campaign: VoucherCampaign }

export interface ScanContext {
  target: ScanTarget
  /** Set when the program/voucher cannot transact (paused, archived, expired, redeemed, pending). */
  unavailableReason: string | null
  daysInactive: number | null
  /** Active win-back reward for this customer (§4.4 win-back reactivation scan). */
  activeWinback: RewardInstance | null
  /** Rewards the employee can redeem on this card. */
  redeemableRewards: RewardInstance[]
  /** Surprise gifts available to this customer (not linked to any program). */
  gifts: Gift[]
}

export type ScanAction =
  | { type: 'add_stamp'; count?: number }
  | { type: 'remove_stamp'; count: number }
  | { type: 'redeem_bonus' }
  | { type: 'redeem_gift'; giftId: string }
  | { type: 'credit_points'; purchaseAmount: number | null }
  | { type: 'record_visit'; purchaseAmount: number | null; points: number | null }
  | { type: 'redeem_reward'; rewardId: string }
  | { type: 'redeem_winback'; rewardId: string }
  | { type: 'redeem_voucher' }

export interface ScanInput {
  passCode: string
  action: ScanAction
  employeeId: string
  durationMs: number | null
  /** How the employee reached the customer on Award actions (shown in history). */
  entry?: 'scan' | 'search'
  /** Where a gift was redeemed (business location). */
  location?: string | null
}

export interface ScanResult {
  transaction: Transaction
  summary: string
  issuedRewards: RewardInstance[]
  surprise: RewardInstance | null
}

function lastActivityOf(ds: BusinessDataset, customerId: string): string | null {
  let last: string | null = null
  for (const t of ds.transactions) {
    if (t.customerId === customerId && (!last || t.createdAt > last)) last = t.createdAt
  }
  return last
}

export function daysInactive(ds: BusinessDataset, customerId: string, now: Date): number | null {
  const last = lastActivityOf(ds, customerId)
  return last ? daysBetween(last, now) : null
}

export function resolvePass(ds: BusinessDataset, rawCode: string): ScanTarget | null {
  const code = rawCode.trim().toUpperCase()
  const membership = ds.memberships.find((m) => m.passCode === code)
  if (membership) {
    const customer = ds.customers.find((c) => c.id === membership.customerId)
    const program = ds.programs.find((p) => p.id === membership.programId)
    if (customer && program) return { kind: 'membership', customer, membership, program }
  }
  const reward = ds.rewards.find((r) => r.passCode === code && r.source === 'voucher')
  if (reward) {
    const customer = ds.customers.find((c) => c.id === reward.customerId)
    const campaign = ds.campaigns.find((c): c is VoucherCampaign => c.id === reward.campaignId && c.kind === 'voucher')
    if (customer && campaign) return { kind: 'voucher', customer, reward, campaign }
  }
  return null
}

export function programUnavailable(program: Program, now: Date): string | null {
  if (program.status === 'paused') return 'This program is temporarily unavailable.'
  if (program.status === 'archived') return 'This program has been archived.'
  if (program.status === 'draft') return 'This program is not published.'
  if (program.expiresOn && new Date(`${program.expiresOn}T23:59:59`) < now) return 'This program has ended.'
  if (program.type === 'membership' && program.config.validity.kind === 'expires_on') {
    if (new Date(`${program.config.validity.date}T23:59:59`) < now) return 'This membership has expired.'
  }
  return null
}

function campaignUnavailable(campaign: Campaign, reward: RewardInstance, now: Date): string | null {
  // Paused stops new claims only: customers who already have the reward can still redeem it.
  if (campaign.status === 'ended') return 'This campaign has ended.'
  if (campaign.status !== 'active' && campaign.status !== 'paused') return 'This campaign is not active.'
  const status = rewardStatus(reward, now)
  if (status === 'redeemed') return 'Redeemed — this voucher has already been used.'
  if (status === 'expired') return 'This voucher has expired.'
  if (status === 'pending') return 'This voucher is not valid yet.'
  return null
}

export function buildScanContext(ds: BusinessDataset, code: string, now: Date = new Date()): ScanContext | null {
  const target = resolvePass(ds, code)
  if (!target) return null
  const customerRewards = ds.rewards.filter(
    (r) => r.customerId === target.customer.id && rewardStatus(r, now) === 'available',
  )
  const activeWinback = customerRewards.find((r) => r.source === 'winback') ?? null
  const redeemableRewards =
    target.kind === 'membership'
      ? customerRewards.filter((r) => r.programId === target.program.id && r.source !== 'voucher')
      : []
  return {
    target,
    unavailableReason:
      target.kind === 'membership'
        ? programUnavailable(target.program, now)
        : campaignUnavailable(target.campaign, target.reward, now),
    daysInactive: daysInactive(ds, target.customer.id, now),
    activeWinback,
    redeemableRewards,
    gifts: (ds.gifts ?? []).filter((g) => g.customerId === target.customer.id && giftStatus(g, now) === 'available'),
  }
}

/** Manual points preview for the scanner (spec §4.2 condition). */
export function pointsPreview(program: PointsProgram, membership: Membership, amount: number | null) {
  return buildPointsPreview(program.config, membership.points, amount)
}

interface Draft {
  ds: BusinessDataset
  now: Date
  issued: RewardInstance[]
}

function issueReward(d: Draft, partial: Omit<RewardInstance, 'id' | 'businessId' | 'issuedAt' | 'redeemedAt' | 'status'>) {
  const reward: RewardInstance = {
    ...partial,
    id: createId('rwd'),
    businessId: d.ds.business.id,
    issuedAt: d.now.toISOString(),
    redeemedAt: null,
    status: 'available',
  }
  d.ds.rewards.push(reward)
  d.issued.push(reward)
  return reward
}

function rewardBase(customerId: string, programId: string | null) {
  return {
    customerId,
    programId,
    campaignId: null,
    description: '',
    pointsRewardId: null,
    pointsCost: null,
    winbackStage: null,
    passCode: null,
    availableFrom: null,
    expiresAt: null,
  }
}

/** Issue Available rewards for every reward threshold the balance has reached (OI-26). */
function issuePointsRewards(d: Draft, program: PointsProgram, m: Membership) {
  for (const r of sortedRewards(program.config)) {
    if (m.points < r.pointsRequired) break
    const exists = d.ds.rewards.some(
      (x) => x.customerId === m.customerId && x.pointsRewardId === r.id && rewardStatus(x, d.now) === 'available',
    )
    if (exists) continue
    const exp = program.config.rewardExpiry
    issueReward(d, {
      ...rewardBase(m.customerId, program.id),
      source: 'points',
      name: r.name,
      pointsRewardId: r.id,
      pointsCost: r.pointsRequired,
      expiresAt: exp.enabled && exp.days ? addDays(d.now, exp.days).toISOString() : null,
    })
  }
}

function maybeSurprise(d: Draft, program: Program, customerId: string, rng: () => number): RewardInstance | null {
  const s = program.surprise
  if (!s.enabled || s.pool.length === 0 || s.probabilityPercent <= 0) return null
  if (rng() * 100 >= s.probabilityPercent) return null
  const name = s.pool[Math.floor(rng() * s.pool.length)] ?? s.pool[0]!
  return issueReward(d, { ...rewardBase(customerId, program.id), source: 'surprise', name })
}

function applyInactivityRules(program: Program, m: Membership, now: Date) {
  if (!m.lastActivityAt) return
  const idle = daysBetween(m.lastActivityAt, now)
  if (program.type === 'stamp') {
    const e = program.config.expiry
    if (e.enabled && e.days && idle >= e.days) m.stamps = 0
  }
  if (program.type === 'points') {
    const e = program.config.pointExpiry
    // OI-40: unused points expire after X months without activity.
    if (e.enabled && e.months && addMonths(new Date(m.lastActivityAt), e.months) <= now) m.points = 0
  }
  if (program.type === 'tier') {
    const c = program.config
    if (c.tiersEnabled && c.downgrade.enabled && c.downgrade.inactivityDays && idle >= c.downgrade.inactivityDays && m.tierIndex > 0) {
      // OI-41: drop one tier and reset progress to that tier's threshold.
      m.tierIndex -= 1
      const floor = c.tiers[m.tierIndex]?.requiredValue ?? 0
      if (c.upgradeBasis === 'visits') m.visits = floor
      else if (c.upgradeBasis === 'points') m.points = floor
      else m.totalSpend = floor
    }
  }
}

export function applyScan(
  source: BusinessDataset,
  input: ScanInput,
  now: Date = new Date(),
  rng: () => number = Math.random,
): { dataset: BusinessDataset; result: ScanResult } {
  const ds = structuredClone(source)
  const context = buildScanContext(ds, input.passCode, now)
  if (!context) throw new ScanError('No customer pass matches this code.')
  const d: Draft = { ds, now, issued: [] }
  const { target } = context
  const nowIso = now.toISOString()

  let kind: TransactionKind
  let stampsAdded = 0
  let pointsAdded = 0
  let purchaseAmount: number | null = null
  let rewardId: string | null = null
  let summary: string
  let surprise: RewardInstance | null = null
  let programId: string | null = null
  let campaignId: string | null = null
  let balanceAfter: number | null = null
  let giftId: string | null = null

  const action = input.action

  if (action.type === 'redeem_gift') {
    // A gift is never linked to a program: redeeming it does not touch stamps or points.
    const gift = (ds.gifts ?? []).find((g) => g.id === action.giftId && g.customerId === target.customer.id)
    if (!gift || giftStatus(gift, now) !== 'available') throw new ScanError('This gift is not available.')
    gift.status = 'redeemed'
    gift.redeemedAt = nowIso
    gift.redeemedBy = input.employeeId
    gift.redeemedLocation = input.location ?? null
    kind = 'gift_redeemed'
    giftId = gift.id
    summary = `Gift redeemed: ${gift.name}.`
  } else if (action.type === 'redeem_winback') {
    const reward = ds.rewards.find((r) => r.id === action.rewardId && r.customerId === target.customer.id)
    if (!reward || reward.source !== 'winback' || rewardStatus(reward, now) !== 'available') {
      throw new ScanError('No active win-back reward to redeem.')
    }
    if (target.kind === 'membership' && context.unavailableReason) throw new ScanError(context.unavailableReason)
    reward.status = 'redeemed'
    reward.redeemedAt = nowIso
    kind = 'winback_redeemed'
    rewardId = reward.id
    programId = target.kind === 'membership' ? target.program.id : null
    if (target.kind === 'membership') {
      const m = ds.memberships.find((x) => x.id === target.membership.id)!
      m.visits += 1
      m.lastActivityAt = nowIso
    }
    summary = `Win-back reward redeemed: ${reward.name}. Visit recorded.`
  } else if (target.kind === 'voucher') {
    if (action.type !== 'redeem_voucher') throw new ScanError('Vouchers can only be redeemed.')
    if (context.unavailableReason) throw new ScanError(context.unavailableReason)
    const reward = ds.rewards.find((r) => r.id === target.reward.id)!
    reward.status = 'redeemed'
    reward.redeemedAt = nowIso
    kind = 'voucher_redeemed'
    rewardId = reward.id
    campaignId = target.campaign.id
    summary = `Voucher redeemed: ${reward.name}.`
  } else {
    if (context.unavailableReason) throw new ScanError(context.unavailableReason)
    const program = target.program
    programId = program.id
    const m = ds.memberships.find((x) => x.id === target.membership.id)!
    applyInactivityRules(program, m, now)

    if (action.type === 'redeem_reward') {
      const reward = ds.rewards.find(
        (r) => r.id === action.rewardId && r.customerId === m.customerId && r.programId === program.id && r.source !== 'voucher' && r.source !== 'winback',
      )
      if (!reward || rewardStatus(reward, now) !== 'available') throw new ScanError('This reward is not available.')
      if (reward.pointsCost !== null) {
        if (m.points < reward.pointsCost) throw new ScanError('Not enough points to redeem this reward.')
        m.points -= reward.pointsCost
      }
      reward.status = 'redeemed'
      reward.redeemedAt = nowIso
      kind = 'reward_redeemed'
      rewardId = reward.id
      summary = `Reward redeemed: ${reward.name}.`
    } else if (program.type === 'stamp') {
      const required = program.config.stampsRequired
      if (action.type === 'add_stamp') {
        const count = action.count ?? 1
        if (!Number.isInteger(count) || count < 1) throw new ScanError('Choose how many stamps to add.')
        if (m.stamps >= required) throw new ScanError('The card is full. Redeem the bonus first.')
        const added = Math.min(count, required - m.stamps)
        m.stamps += added
        m.visits += 1
        stampsAdded = added
        kind = 'stamp'
        summary = m.stamps >= required ? `Card full (${m.stamps}/${required}). The bonus can be redeemed.` : `+${added} stamp${added > 1 ? 's' : ''} (${m.stamps}/${required}).`
        surprise = maybeSurprise(d, program, m.customerId, rng)
      } else if (action.type === 'remove_stamp') {
        if (!Number.isInteger(action.count) || action.count < 1) throw new ScanError('Choose how many stamps to remove.')
        if (m.stamps === 0) throw new ScanError('There are no stamps to remove.')
        const removed = Math.min(action.count, m.stamps)
        m.stamps -= removed
        stampsAdded = -removed
        kind = 'stamp_removed'
        summary = `-${removed} stamp${removed > 1 ? 's' : ''} (${m.stamps}/${required}).`
      } else if (action.type === 'redeem_bonus') {
        // Redeem bonus is only possible on a full card (e.g. 10/10); the card then starts again.
        if (m.stamps < required) throw new ScanError(`The bonus is available when the card is full (${m.stamps}/${required}).`)
        const reward = issueReward(d, { ...rewardBase(m.customerId, program.id), source: 'stamp_card', name: program.config.rewardDescription })
        reward.status = 'redeemed'
        reward.redeemedAt = nowIso
        d.issued.pop()
        m.stamps -= required
        kind = 'reward_redeemed'
        rewardId = reward.id
        summary = `Bonus redeemed: ${program.config.rewardDescription}.`
      } else {
        throw new ScanError('Stamp cards accept +1 stamp, Redeem bonus or reward redemption.')
      }
    } else if (program.type === 'points') {
      if (action.type !== 'credit_points') throw new ScanError('Points programs accept "Credit points" or reward redemption.')
      if (program.config.awardingMethod === 'manual') {
        if (action.purchaseAmount === null || !(action.purchaseAmount >= 0)) throw new ScanError('Enter the purchase amount.')
        purchaseAmount = action.purchaseAmount
      }
      const calc = calculatePoints(program.config, purchaseAmount)
      m.points += calc.points
      m.visits += 1
      if (purchaseAmount !== null) m.totalSpend += purchaseAmount
      pointsAdded = calc.points
      kind = 'points'
      summary = calc.belowMinimum
        ? 'Purchase below the minimum amount — no points credited.'
        : `${calc.points} points credited. New balance: ${m.points}.`
      issuePointsRewards(d, program, m)
      surprise = maybeSurprise(d, program, m.customerId, rng)
    } else {
      // membership + tier: record a visit (§4.4 "add stamp/point/visit").
      if (action.type !== 'record_visit') throw new ScanError('Use "Record visit" for this program.')
      m.visits += 1
      kind = 'visit'
      summary = 'Visit recorded.'
      if (program.type === 'tier' && program.config.tiersEnabled) {
        const c = program.config
        if (c.upgradeBasis === 'spend') {
          if (action.purchaseAmount === null || !(action.purchaseAmount >= 0)) throw new ScanError('Enter the purchase amount.')
          purchaseAmount = action.purchaseAmount
          m.totalSpend += action.purchaseAmount
        } else if (c.upgradeBasis === 'points') {
          if (action.points === null || !(action.points >= 0)) throw new ScanError('Enter the points to add.')
          m.points += action.points
          pointsAdded = action.points
        }
        const before = m.tierIndex
        m.tierIndex = Math.max(m.tierIndex, computeTierIndex(c, tierMetric(m, c.upgradeBasis)))
        if (m.tierIndex > before) summary = `Visit recorded — upgraded to ${c.tiers[m.tierIndex]?.name}.`
      }
      surprise = maybeSurprise(d, program, m.customerId, rng)
    }
    m.lastActivityAt = nowIso
    balanceAfter = program.type === 'stamp' ? m.stamps : program.type === 'points' ? m.points : m.visits
  }

  const transaction: Transaction = {
    id: createId('txn'),
    businessId: ds.business.id,
    customerId: target.customer.id,
    programId,
    campaignId,
    employeeId: input.employeeId,
    kind,
    stampsAdded,
    pointsAdded,
    purchaseAmount,
    rewardId,
    createdAt: nowIso,
    durationMs: input.durationMs,
    entry: input.entry ?? 'scan',
    balanceAfter,
    giftId,
  }
  ds.transactions.push(transaction)
  return { dataset: ds, result: { transaction, summary, issuedRewards: d.issued, surprise } }
}

/**
 * Win-back automation (spec §4.7, OI-23): for each inactive customer, ensure one active win-back
 * reward for the highest stage reached. Lower unredeemed stages are closed (expired), never deleted.
 */
export function evaluateWinBack(source: BusinessDataset, now: Date = new Date()): BusinessDataset {
  if (!source.winback.enabled || source.winback.endedAt || source.winback.stages.length === 0) return source
  const ds = structuredClone(source)
  const stages = [...ds.winback.stages].sort((a, b) => a.days - b.days)
  for (const customer of ds.customers) {
    const idle = daysInactive(ds, customer.id, now)
    if (idle === null) continue
    let stageIndex = -1
    stages.forEach((s, i) => {
      if (idle >= s.days && s.enabled !== false) stageIndex = i
    })
    if (stageIndex < 0) continue
    const lastVisit = lastActivityOf(ds, customer.id)!
    const active = ds.rewards.filter(
      (r) => r.customerId === customer.id && r.source === 'winback' && rewardStatus(r, now) === 'available',
    )
    // Already handled this inactivity period at this stage or higher?
    const handled = ds.rewards.some(
      (r) => r.customerId === customer.id && r.source === 'winback' && (r.winbackStage ?? -1) >= stageIndex && r.issuedAt > lastVisit,
    )
    if (handled) continue
    for (const r of active) r.expiresAt = now.toISOString()
    const stage = stages[stageIndex]!
    const reward: RewardInstance = {
      id: createId('rwd'),
      businessId: ds.business.id,
      ...rewardBase(customer.id, null),
      source: 'winback',
      name: stage.offer,
      description: `Win-back stage ${stageIndex + 1} (${stage.days} days inactive)`,
      winbackStage: stageIndex,
      issuedAt: now.toISOString(),
      redeemedAt: null,
      status: 'available',
    }
    ds.rewards.push(reward)
    ds.winbackEvents.push({
      id: createId('wbe'),
      customerId: customer.id,
      stage: stageIndex,
      rewardId: reward.id,
      createdAt: now.toISOString(),
      delivered: false,
    })
  }
  return ds
}
