import { describe, expect, it } from 'vitest'
import { rewardStatus } from '@/lib/rewards'
import { searchCustomers } from '@/lib/customerSearch'
import type { Customer, RewardInstance } from '@/types/domain'
import { NOW } from '../fixtures'

const base: RewardInstance = {
  id: 'r', businessId: 'b', customerId: 'c', programId: null, campaignId: null, source: 'voucher', name: 'X', description: '',
  pointsRewardId: null, pointsCost: null, winbackStage: null, passCode: null, issuedAt: '2026-10-01T00:00:00Z',
  availableFrom: null, expiresAt: null, redeemedAt: null, status: 'available',
}

describe('reward states (spec §4.8)', () => {
  it('derives Available, Redeemed, Pending and Expired', () => {
    expect(rewardStatus(base, NOW)).toBe('available')
    expect(rewardStatus({ ...base, status: 'redeemed' }, NOW)).toBe('redeemed')
    expect(rewardStatus({ ...base, availableFrom: '2026-11-01T00:00:00Z' }, NOW)).toBe('pending')
    expect(rewardStatus({ ...base, expiresAt: '2026-10-10T00:00:00Z' }, NOW)).toBe('expired')
  })
})

describe('customer search (spec §4.5)', () => {
  const c = (patch: Partial<Customer>): Customer => ({ id: 'x', businessId: 'b', customerNumber: 'C-10001', name: '', email: '', phone: '', birthday: '', notes: '', createdAt: '', ...patch })
  const list = [c({ id: '1', name: 'Anna Schmidt', email: 'anna@example.com', phone: '+49 151 1234567', customerNumber: 'C-10001' }), c({ id: '2', name: 'Ben Rossi', customerNumber: 'C-10002' })]
  it.each([
    ['name', 'anna'],
    ['email', 'ANNA@EXAMPLE'],
    ['phone', '1234567'],
    ['customer ID', 'c-10001'],
  ])('finds by %s', (_label, q) => {
    expect(searchCustomers(list, q).map((x) => x.id)).toEqual(['1'])
  })
  it('returns everyone for an empty query', () => {
    expect(searchCustomers(list, '  ')).toHaveLength(2)
  })
})
