import { describe, expect, it } from 'vitest'
import { applyScan, buildScanContext, evaluateWinBack, ScanError } from '@/lib/scanEngine'
import { rewardStatus } from '@/lib/rewards'
import { defaultProgramDraft } from '@/lib/factories'
import type { BusinessDataset, Program } from '@/types/domain'
import { NOW, sampleDataset } from '../fixtures'

function passFor(ds: BusinessDataset, programId: string) {
  return ds.memberships.find((m) => m.programId === programId)!
}
const scan = (ds: BusinessDataset, passCode: string, action: Parameters<typeof applyScan>[1]['action'], rng = () => 0.99) =>
  applyScan(ds, { passCode, action, employeeId: 'u_emp', durationMs: 2000 }, NOW, rng)

describe('scan engine (spec §4.2, §4.4)', () => {
  it('+1 stamp fills the card; Redeem bonus only on a full card (10/10), then the card starts again', () => {
    let ds = sampleDataset()
    const m = passFor(ds, 'prg_coffee')
    ds.memberships.find((x) => x.id === m.id)!.stamps = 9
    expect(() => scan(ds, m.passCode, { type: 'redeem_bonus' })).toThrow(/when the card is full/)
    const added = scan(ds, m.passCode, { type: 'add_stamp' })
    ds = added.dataset
    expect(ds.memberships.find((x) => x.id === m.id)!.stamps).toBe(10)
    expect(added.result.issuedRewards).toHaveLength(0)
    expect(added.result.transaction).toMatchObject({ kind: 'stamp', stampsAdded: 1, durationMs: 2000, employeeId: 'u_emp', balanceAfter: 10, entry: 'scan' })
    expect(() => scan(ds, m.passCode, { type: 'add_stamp' })).toThrow(/Redeem the bonus first/)
    const bonus = scan(ds, m.passCode, { type: 'redeem_bonus' })
    ds = bonus.dataset
    expect(ds.memberships.find((x) => x.id === m.id)!.stamps).toBe(0)
    expect(bonus.result.transaction).toMatchObject({ kind: 'reward_redeemed', balanceAfter: 0 })
    expect(ds.rewards.find((r) => r.id === bonus.result.transaction.rewardId)).toMatchObject({ name: '1 Free Coffee', source: 'stamp_card', status: 'redeemed' })
  })

  it('remove stamp (-N) never goes below zero and is recorded as a removal', () => {
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_coffee')
    ds.memberships.find((x) => x.id === m.id)!.stamps = 2
    const { dataset, result } = scan(ds, m.passCode, { type: 'remove_stamp', count: 5 })
    expect(dataset.memberships.find((x) => x.id === m.id)!.stamps).toBe(0)
    expect(result.transaction).toMatchObject({ kind: 'stamp_removed', stampsAdded: -2, balanceAfter: 0 })
  })

  it('a surprise gift is redeemed on press, records who and where, and never changes stamps or points', () => {
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_coffee')
    ds.memberships.find((x) => x.id === m.id)!.stamps = 4
    ds.gifts = [
      { id: 'g1', businessId: ds.business.id, customerId: m.customerId, name: 'Cake', description: '', terms: '', availableFrom: null, expiresAt: '2099-01-01T00:00:00.000Z', status: 'open', createdBy: 'u_owner', createdAt: NOW.toISOString(), redeemedAt: null, redeemedBy: null, redeemedLocation: null, cancelledAt: null, cancelledBy: null },
    ]
    expect(buildScanContext(ds, m.passCode, NOW)?.gifts.map((g) => g.id)).toEqual(['g1'])
    const { dataset, result } = applyScan(ds, { passCode: m.passCode, action: { type: 'redeem_gift', giftId: 'g1' }, employeeId: 'u_emp', durationMs: null, entry: 'search', location: 'Main St' }, NOW)
    expect(dataset.memberships.find((x) => x.id === m.id)!.stamps).toBe(4)
    expect(dataset.gifts[0]).toMatchObject({ status: 'redeemed', redeemedBy: 'u_emp', redeemedLocation: 'Main St' })
    expect(result.transaction).toMatchObject({ kind: 'gift_redeemed', programId: null, entry: 'search', stampsAdded: 0, pointsAdded: 0 })
    expect(() => applyScan(dataset, { passCode: m.passCode, action: { type: 'redeem_gift', giftId: 'g1' }, employeeId: 'u_emp', durationMs: null }, NOW)).toThrow(/not available/)
  })

  it('a paused program scans as temporarily unavailable — no new stamps', () => {
    const ds = sampleDataset()
    ds.programs.find((p) => p.id === 'prg_coffee')!.status = 'paused'
    const m = passFor(ds, 'prg_coffee')
    expect(buildScanContext(ds, m.passCode, NOW)?.unavailableReason).toMatch(/temporarily unavailable/)
    expect(() => scan(ds, m.passCode, { type: 'add_stamp' })).toThrow(ScanError)
  })

  it('manual points: credits calculated points and issues reached rewards; redeeming deducts points', () => {
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_points')
    const ms = ds.memberships.find((x) => x.id === m.id)!
    ms.points = 90
    ds.rewards = ds.rewards.filter((r) => r.customerId !== m.customerId)
    const r1 = scan(ds, m.passCode, { type: 'credit_points', purchaseAmount: 2.5 })
    expect(r1.result.transaction.pointsAdded).toBe(25)
    const issued = r1.result.issuedRewards.find((r) => r.source === 'points')!
    expect(issued.name).toBe('Free Coffee')
    const r2 = scan(r1.dataset, m.passCode, { type: 'redeem_reward', rewardId: issued.id })
    expect(r2.dataset.memberships.find((x) => x.id === m.id)!.points).toBe(15)
    expect(r2.dataset.rewards.find((r) => r.id === issued.id)!.status).toBe('redeemed')
  })

  it('manual points requires a purchase amount', () => {
    const ds = sampleDataset()
    expect(() => scan(ds, passFor(ds, 'prg_points').passCode, { type: 'credit_points', purchaseAmount: null })).toThrow(/purchase amount/)
  })

  it('membership cards never track stamps or points', () => {
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_vip')
    const before = ds.memberships.find((x) => x.id === m.id)!
    const { dataset } = scan(ds, m.passCode, { type: 'record_visit', purchaseAmount: null, points: null })
    const after = dataset.memberships.find((x) => x.id === m.id)!
    expect(after.stamps).toBe(before.stamps)
    expect(after.points).toBe(before.points)
    expect(after.visits).toBe(before.visits + 1)
    expect(() => scan(ds, m.passCode, { type: 'add_stamp' })).toThrow(ScanError)
  })

  it('tier visits upgrade the customer when the threshold is reached', () => {
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_club')
    const ms = ds.memberships.find((x) => x.id === m.id)!
    ms.visits = 9
    ms.tierIndex = 0
    const { dataset, result } = scan(ds, m.passCode, { type: 'record_visit', purchaseAmount: null, points: null })
    expect(dataset.memberships.find((x) => x.id === m.id)!.tierIndex).toBe(1)
    expect(result.summary).toMatch(/Silver/)
  })

  it('one-time voucher can only be redeemed once', () => {
    const ds = sampleDataset()
    const v = ds.rewards.find((r) => r.source === 'voucher' && r.campaignId === 'cmp_freecoffee' && r.status === 'available')!
    const { dataset } = scan(ds, v.passCode!, { type: 'redeem_voucher' })
    expect(dataset.rewards.find((r) => r.id === v.id)!.status).toBe('redeemed')
    expect(() => scan(dataset, v.passCode!, { type: 'redeem_voucher' })).toThrow(/already been used/)
  })

  it('pending voucher (before Valid From) cannot be redeemed', () => {
    const ds = sampleDataset()
    const v = ds.rewards.find((r) => r.campaignId === 'cmp_brunch')!
    expect(rewardStatus(v, NOW)).toBe('pending')
    expect(() => scan(ds, v.passCode!, { type: 'redeem_voucher' })).toThrow(/not valid yet/)
  })

  it('win-back: inactive customer gets a reward; redeeming records a visit and resets inactivity', () => {
    let ds = sampleDataset()
    ds = evaluateWinBack(ds, NOW)
    const wb = ds.rewards.find((r) => r.source === 'winback' && rewardStatus(r, NOW) === 'available')
    expect(wb).toBeDefined()
    const membership = ds.memberships.find((m) => m.customerId === wb!.customerId)!
    const ctx = buildScanContext(ds, membership.passCode, NOW)!
    expect(ctx.activeWinback?.id).toBe(wb!.id)
    expect(ctx.daysInactive).toBeGreaterThanOrEqual(14)
    const { dataset, result } = scan(ds, membership.passCode, { type: 'redeem_winback', rewardId: wb!.id })
    expect(result.transaction.kind).toBe('winback_redeemed')
    expect(buildScanContext(dataset, membership.passCode, NOW)!.daysInactive).toBe(0)
    expect(dataset.rewards.find((r) => r.id === wb!.id)!.status).toBe('redeemed')
  })

  it('surprise rewards default to off and only trigger when enabled', () => {
    for (const t of ['stamp', 'membership', 'tier', 'points'] as const) expect(defaultProgramDraft(t).surprise.enabled).toBe(false)
    const ds = sampleDataset()
    const m = passFor(ds, 'prg_coffee')
    expect(scan(ds, m.passCode, { type: 'add_stamp' }, () => 0).result.surprise).toBeNull()
    const p = ds.programs.find((x) => x.id === 'prg_coffee') as Program
    p.surprise = { enabled: true, probabilityPercent: 50, pool: ['Free cookie'] }
    expect(scan(ds, m.passCode, { type: 'add_stamp' }, () => 0).result.surprise?.name).toBe('Free cookie')
  })

  it('unknown codes throw', () => {
    expect(() => scan(sampleDataset(), 'BNC-NOPE', { type: 'add_stamp' })).toThrow(/No customer pass/)
  })
})
