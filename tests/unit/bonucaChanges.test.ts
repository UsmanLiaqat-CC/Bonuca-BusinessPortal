import { describe, expect, it } from 'vitest'
import { ROLE_LOCK_MESSAGE } from '@/lib/access'
import { customerHistory } from '@/lib/history'
import { giftStatus } from '@/lib/gifts'
import { normalizeDataset } from '@/services/dev/devBackend'
import type { BusinessDataset } from '@/types/domain'
import { createBackend } from '../test-utils'

/** BONUCA CHANGES doc: programs ↔ customers ↔ gifts, Award actions rules, Audit, customer sign-up. */

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10)

async function as(role: 'owner' | 'manager' | 'employee', backend = createBackend()) {
  await backend.login(`${role}@sample.dev`, 'Bonuca123')
  return backend
}

async function coffeeCustomer(b: ReturnType<typeof createBackend>) {
  const rows = await b.getProgramCustomers('prg_coffee')
  return rows[0]!
}

describe('program → its customers', () => {
  it('lists name, contact, customer number, progress, last visit and status; card counts match', async () => {
    const b = await as('owner')
    const rows = await b.getProgramCustomers('prg_coffee')
    const counts = await b.programCardCounts()
    expect(rows.length).toBeGreaterThan(0)
    expect(counts.prg_coffee).toBe(rows.length)
    expect(rows[0]).toMatchObject({ progress: expect.stringMatching(/^\d+ \/ 10 stamps$/), status: expect.stringMatching(/^(active|inactive)$/) })
    expect(rows[0]!.customer.customerNumber).toMatch(/^C-\d+$/)
  })
})

describe('surprise gift (customer profile)', () => {
  it('Owner gives a gift (not linked to any program); it appears in history; Owner can cancel it', async () => {
    const b = await as('owner')
    const { customer } = await coffeeCustomer(b)
    const before = (await b.getCustomer(customer.id))!.memberships.map((m) => [m.membership.stamps, m.membership.points])
    const gift = await b.giveGift(customer.id, { name: 'Free cake', description: 'Thanks!', terms: '', availableFrom: '', expiresOn: inDays(10) })
    expect(giftStatus(gift)).toBe('available')
    const detail = (await b.getCustomer(customer.id))!
    expect(detail.gifts.some((g) => g.id === gift.id)).toBe(true)
    expect(detail.history.some((h) => h.description === 'Gift given: Free cake' && h.by === 'Sam Owner')).toBe(true)
    // Never changes stamps or points.
    expect(detail.memberships.map((m) => [m.membership.stamps, m.membership.points])).toEqual(before)
    const cancelled = await b.cancelGift(gift.id)
    expect(giftStatus(cancelled)).toBe('cancelled')
    await expect(b.cancelGift(gift.id)).rejects.toThrow(/already cancelled/)
  })

  it('a future start date schedules the gift; an employee cannot give or cancel gifts', async () => {
    const owner = await as('owner')
    const { customer } = await coffeeCustomer(owner)
    const scheduled = await owner.giveGift(customer.id, { name: 'Later', description: '', terms: '', availableFrom: inDays(3), expiresOn: inDays(9) })
    expect(giftStatus(scheduled)).toBe('scheduled')
    const emp = await as('employee', owner)
    await expect(emp.giveGift(customer.id, { name: 'X', description: '', terms: '', availableFrom: '', expiresOn: inDays(5) })).rejects.toThrow(ROLE_LOCK_MESSAGE)
    await expect(emp.cancelGift(scheduled.id)).rejects.toThrow(ROLE_LOCK_MESSAGE)
  })

  it('an employee scanning the customer sees the gift and must press Redeem; who/when/where are recorded', async () => {
    const owner = await as('owner')
    const { customer, membership } = await coffeeCustomer(owner)
    const gift = await owner.giveGift(customer.id, { name: 'Cookie', description: '', terms: '', availableFrom: '', expiresOn: inDays(5) })
    const emp = await as('employee', owner)
    const ctx = await emp.lookupPass(membership.passCode)
    expect(ctx!.gifts.map((g) => g.id)).toContain(gift.id)
    // Looking the customer up redeems nothing.
    expect((await emp.getAwardCustomer(customer.id))!.gifts.map((g) => g.id)).toContain(gift.id)
    await emp.confirmScan({ passCode: membership.passCode, action: { type: 'redeem_gift', giftId: gift.id }, durationMs: null, entry: 'scan' })
    const after = await as('owner', emp)
    const g = (await after.getCustomer(customer.id))!.gifts.find((x) => x.id === gift.id)!
    expect(g).toMatchObject({ status: 'redeemed', redeemedBy: 'usr_seed_2', redeemedLocation: 'Sample Street 1, Berlin' })
    expect(g.redeemedAt).toBeTruthy()
  })
})

describe('Award actions permissions', () => {
  it('employees can add +1 and redeem, but not remove stamps or add several at once', async () => {
    const owner = await as('owner')
    const { membership } = await coffeeCustomer(owner)
    const emp = await as('employee', owner)
    await expect(emp.confirmScan({ passCode: membership.passCode, action: { type: 'remove_stamp', count: 1 }, durationMs: null, entry: 'scan' })).rejects.toThrow(ROLE_LOCK_MESSAGE)
    await expect(emp.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp', count: 3 }, durationMs: null, entry: 'scan' })).rejects.toThrow(ROLE_LOCK_MESSAGE)
    const r = await emp.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp' }, durationMs: null, entry: 'search' })
    expect(r.transaction).toMatchObject({ stampsAdded: 1, entry: 'search' })
    const mgr = await as('manager', emp)
    const removed = await mgr.confirmScan({ passCode: membership.passCode, action: { type: 'remove_stamp', count: 1 }, durationMs: null, entry: 'scan' })
    expect(removed.transaction).toMatchObject({ kind: 'stamp_removed', stampsAdded: -1 })
  })

  it('a customer with several programs gets one card per program on the award screen', async () => {
    const b = await as('owner')
    const customers = await b.listCustomers()
    let multi = null
    for (const c of customers) {
      const a = await b.getAwardCustomer(c.id)
      if (a && a.cards.length > 1) {
        multi = a
        break
      }
    }
    expect(multi).not.toBeNull()
    expect(new Set(multi!.cards.map((x) => x.program.id)).size).toBe(multi!.cards.length)
  })
})

describe('Settings → Audit', () => {
  it('records Manager and Employee actions (not the Owner) and is hidden from employees', async () => {
    const owner = await as('owner')
    const { membership, customer } = await coffeeCustomer(owner)
    await owner.giveGift(customer.id, { name: 'Owner gift', description: '', terms: '', availableFrom: '', expiresOn: inDays(5) })
    const emp = await as('employee', owner)
    await emp.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp' }, durationMs: null, entry: 'scan' })
    await expect(emp.listAudit()).rejects.toThrow(ROLE_LOCK_MESSAGE)
    const mgr = await as('manager', emp)
    const log = await mgr.listAudit()
    expect(log[0]).toMatchObject({ userName: 'Eli Employee', role: 'employee', module: 'Award actions' })
    expect(log[0]!.details).toContain(customer.name)
    expect(log[0]!.details).toContain('scanned')
    expect(log.some((e) => e.details.includes('Owner gift'))).toBe(false)
  })
})

describe('customer sign-up after the first scan of a join QR', () => {
  it('shows the program page, validates the form and creates the customer with a card', async () => {
    const owner = await as('owner')
    const page = await owner.getJoinPage('join-prg_coffee')
    expect(page).toMatchObject({ businessName: 'Brew & Bean Café', program: { name: 'Coffee Card' } })
    await expect(owner.joinProgram('join-prg_coffee', { name: '', email: '', birthday: '', acceptTerms: true })).rejects.toThrow(/Name is required/)
    await expect(owner.joinProgram('join-prg_coffee', { name: 'Sarah Cole', email: '', birthday: '', acceptTerms: false })).rejects.toThrow(/terms/)
    const before = (await owner.programCardCounts()).prg_coffee ?? 0
    const r = await owner.joinProgram('join-prg_coffee', { name: 'Sarah Cole', email: 'sarah@email.com', birthday: '', acceptTerms: true })
    expect(r.customer).toMatchObject({ name: 'Sarah Cole', email: 'sarah@email.com' })
    expect(r.membership).toMatchObject({ programId: 'prg_coffee', stamps: 0 })
    expect((await owner.programCardCounts()).prg_coffee).toBe(before + 1)
    // Unknown or draft programs are not open for sign-up.
    expect(await owner.getJoinPage('nope')).toBeNull()
  })
})

describe('new campaigns start with demo linked customers', () => {
  it('publishing a voucher or stamp acquisition campaign links demo customers (some already redeemed)', async () => {
    const b = await as('owner')
    const voucher = await b.createCampaign({ kind: 'voucher', name: 'Spring voucher', voucherReward: 'Free muffin', validFrom: inDays(-1), validTo: inDays(30), visuals: { logo: 'data:image/png;base64,AAAA', background: { kind: 'default' }, textColor: '#FFFFFF' } })
    expect(await b.getCampaignLinked(voucher.id)).toHaveLength(0)
    await b.campaignLifecycle(voucher.id, 'publish')
    const linked = await b.getCampaignLinked(voucher.id)
    expect(linked).toHaveLength(6)
    expect(linked.some((r) => r.rewardStatus === 'redeemed' && r.redeemedBy)).toBe(true)
    expect((await b.listCampaignRows()).find((r) => r.id === voucher.id)).toMatchObject({ customers: 6 })
    const acq = await b.createCampaign({ kind: 'stamp_acquisition', name: 'Window poster', linkedProgramId: 'prg_coffee', startingStamps: 1, welcomeGift: { enabled: true, rewardName: 'Free cookie', description: '', validityDays: 30, redemptionConditions: '' } })
    await b.campaignLifecycle(acq.id, 'publish')
    const rows = await b.getCampaignLinked(acq.id)
    expect(rows).toHaveLength(6)
    expect(rows.every((r) => r.stampsGiven === 1)).toBe(true)
  })
})

describe('Campaigns tab', () => {
  it('lists stamp acquisition, one-time voucher and win-back with offer, period and counts', async () => {
    const b = await as('owner')
    const rows = await b.listCampaignRows()
    expect(rows.map((r) => r.kind).sort()).toEqual(['stamp_acquisition', 'voucher', 'voucher', 'winback'])
    const cup = rows.find((r) => r.id === 'cmp_cuplid')!
    expect(cup.offer).toBe('2 starting stamps + Free cookie')
    expect(cup.customers).toBeGreaterThan(0)
    expect(cup.redeemed).toBeLessThanOrEqual(cup.customers)
    expect(rows.find((r) => r.kind === 'winback')).toMatchObject({ name: 'Win-back', period: 'Always on', status: 'active' })
    expect(rows.find((r) => r.id === 'cmp_freecoffee')!.offer).toMatch(/voucher$/)
    // Newest first.
    expect([...rows].sort((a, c) => c.createdAt.localeCompare(a.createdAt)).map((r) => r.id)).toEqual(rows.map((r) => r.id))
    const linked = await b.getCampaignLinked('cmp_cuplid')
    expect(linked[0]).toMatchObject({ stampsGiven: 2, rewardStatus: expect.stringMatching(/not_redeemed|redeemed|expired/) })
  })

  it('claiming a QR campaign: one claim per customer; paused takes no new claims; ended says so', async () => {
    const b = await as('owner')
    const before = (await b.getCampaignLinked('cmp_freecoffee')).length
    expect(await b.getCampaignJoin('cmp-freecoffee')).toMatchObject({ state: 'open' })
    const r = await b.claimCampaign('cmp-freecoffee', { name: 'Lea Neu', email: 'lea@example.com', birthday: '', acceptTerms: true })
    expect(r.reward).toMatchObject({ source: 'voucher', campaignId: 'cmp_freecoffee' })
    expect((await b.getCampaignLinked('cmp_freecoffee')).length).toBe(before + 1)
    await expect(b.claimCampaign('cmp-freecoffee', { name: 'Lea Neu', email: 'LEA@example.com', birthday: '', acceptTerms: true })).rejects.toThrow(/already claimed/)
    await b.campaignLifecycle('cmp_freecoffee', 'disable')
    expect(await b.getCampaignJoin('cmp-freecoffee')).toMatchObject({ state: 'paused' })
    await expect(b.claimCampaign('cmp-freecoffee', { name: 'Max', email: '', birthday: '', acceptTerms: true })).rejects.toThrow(/paused/)
    // Paused: a customer who already has the voucher can still redeem it.
    expect((await b.lookupPass(r.reward!.passCode!))!.unavailableReason).toBeNull()
    await b.campaignLifecycle('cmp_freecoffee', 'end')
    expect(await b.getCampaignJoin('cmp-freecoffee')).toMatchObject({ state: 'ended' })
    await expect(b.claimCampaign('cmp-freecoffee', { name: 'Max', email: '', birthday: '', acceptTerms: true })).rejects.toThrow('This campaign has ended.')
    expect((await b.listCampaignRows()).find((x) => x.id === 'cmp_freecoffee')!.status).toBe('ended')
  })

  it('stamp acquisition claim gives the stamp card with starting stamps and the welcome gift', async () => {
    const b = await as('owner')
    const r = await b.claimCampaign('cmp-cuplid', { name: 'Ida New', email: 'ida@example.com', birthday: '', acceptTerms: true })
    expect(r.membership).toMatchObject({ programId: 'prg_coffee', stamps: 2, viaCampaignId: 'cmp_cuplid' })
    expect(r.reward).toMatchObject({ source: 'welcome_gift', name: 'Free cookie' })
    const profile = (await b.getCustomer(r.customer.id))!
    expect(profile.campaigns.map((x) => x.id)).toContain('cmp_cuplid')
  })

  it('win-back campaign: pause, resume, end; switched-off stages never fire', async () => {
    const b = await as('owner')
    await b.winbackLifecycle('disable')
    expect((await b.listCampaignRows()).find((r) => r.kind === 'winback')!.status).toBe('paused')
    await b.winbackLifecycle('enable')
    await b.winbackLifecycle('end')
    expect((await b.listCampaignRows()).find((r) => r.kind === 'winback')!.status).toBe('ended')
    await expect(b.winbackLifecycle('enable')).rejects.toThrow('This campaign has ended.')
    const emp = await as('employee', b)
    await expect(emp.listCampaignRows()).rejects.toThrow(ROLE_LOCK_MESSAGE)
  })
})

describe('one Active program per type', () => {
  it('a second program of the same type cannot be published or enabled while one is active', async () => {
    const b = await as('owner')
    const draft = (await b.listPrograms()).find((p) => p.id === 'prg_lunch')!
    expect(draft.type).toBe('stamp')
    await expect(b.programLifecycle('prg_lunch', 'publish')).rejects.toThrow(/Only one active Stamp Card at a time/)
    // Drafts of the same type are unlimited.
    const { toDraft } = await import('@/lib/factories')
    await b.createProgram({ ...toDraft(draft), name: 'Another stamp draft' })
    // Pausing the active one frees the slot.
    await b.programLifecycle('prg_coffee', 'disable')
    expect((await b.programLifecycle('prg_lunch', 'publish')).status).toBe('active')
    await expect(b.programLifecycle('prg_coffee', 'enable')).rejects.toThrow(/Only one active/)
  })
})

describe('Allow Multiple Stamps', () => {
  it('off: one stamp per scan; on: up to the limit', async () => {
    const owner = await as('owner')
    const { membership } = (await owner.getProgramCustomers('prg_coffee')).find((r) => r.membership.stamps <= 5)!
    // Sample Coffee Card allows up to 5.
    await expect(owner.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp', count: 6 }, durationMs: null, entry: 'scan' })).rejects.toThrow(/At most 5 stamps per scan/)
    const r = await owner.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp', count: 2 }, durationMs: null, entry: 'scan' })
    expect(r.transaction.stampsAdded).toBe(2)
    // Turn it off: back to one stamp per scan.
    const { toDraft } = await import('@/lib/factories')
    const coffee = (await owner.listPrograms()).find((p) => p.id === 'prg_coffee')!
    if (coffee.type !== 'stamp') throw new Error('expected stamp')
    await owner.updateProgram('prg_coffee', { ...toDraft(coffee), config: { ...coffee.config, multipleStamps: { enabled: false, max: 3 } } } as never)
    await expect(owner.confirmScan({ passCode: membership.passCode, action: { type: 'add_stamp', count: 2 }, durationMs: null, entry: 'scan' })).rejects.toThrow(/one stamp per scan/)
  })
})

describe('User Type and permission presets', () => {
  it('Staff / Manager / Admin presets; invite stores them and the activated account uses them', async () => {
    const { presetFor } = await import('@/lib/teamPermissions')
    expect(presetFor('employee')).toEqual(['scan', 'redeem'])
    expect(presetFor('manager')).toEqual(expect.arrayContaining(['scan', 'redeem', 'customers.add', 'customers.view', 'customers.edit', 'programs.manage', 'dashboard']))
    expect(presetFor('admin')).toContain('settings')
    const owner = await as('owner')
    const { invite } = await owner.inviteEmployee('newstaff@example.com', 'employee', ['scan', 'redeem', 'customers.view'])
    expect(invite.permissions).toEqual(['scan', 'redeem', 'customers.view'])
    await owner.logout()
    await owner.acceptInvite(invite.token, { fullName: 'New Staff', password: 'secret123' })
    const s = (await owner.getSession())!
    expect(s.user).toMatchObject({ role: 'employee', permissions: ['scan', 'redeem', 'customers.view'] })
    // Ticked "View customers": full customer info, but no dashboard.
    const first = (await owner.listCustomers())[0]!
    expect(first.email.length + first.phone.length).toBeGreaterThan(0)
    await expect(owner.getDashboard()).rejects.toThrow(ROLE_LOCK_MESSAGE)
  })

  it('only the owner invites Managers/Admins and changes a member’s permissions', async () => {
    const owner = await as('owner')
    const { users } = await owner.listEmployees()
    const mgr = users.find((u) => u.role === 'manager')!
    await owner.updateMemberAccess(mgr.id, 'manager', ['scan', 'redeem'])
    const asMgr = await as('manager', owner)
    await expect(asMgr.getDashboard()).rejects.toThrow(ROLE_LOCK_MESSAGE)
    await expect(asMgr.inviteEmployee('x@example.com', 'admin')).rejects.toThrow(ROLE_LOCK_MESSAGE)
    await expect(asMgr.updateMemberAccess(mgr.id, 'admin', ['scan'])).rejects.toThrow(ROLE_LOCK_MESSAGE)
  })
})

describe('history and stored data', () => {
  it('history leaves out rows where nothing changed ("0 stamps")', async () => {
    const b = await as('owner')
    const { customer } = await coffeeCustomer(b)
    const rows = (await b.getCustomer(customer.id))!.history
    expect(rows.every((r) => r.change !== '+0' && r.change !== '+0 pts')).toBe(true)
    const ds = { users: [], programs: [], campaigns: [], gifts: [], transactions: [{ id: 't', businessId: '', customerId: 'c', programId: null, campaignId: null, employeeId: 'u', kind: 'points', stampsAdded: 0, pointsAdded: 0, purchaseAmount: 1, rewardId: null, createdAt: '2026-01-01T00:00:00Z', durationMs: null }] } as unknown as BusinessDataset
    expect(customerHistory(ds, 'c')).toHaveLength(0)
  })

  it('data saved before this change gets gifts, audit and program sign-up defaults on load', () => {
    const ds = { business: { branding: { logo: 'L' } }, programs: [{ id: 'p' }] } as unknown as BusinessDataset
    normalizeDataset(ds)
    expect(ds.gifts).toEqual([])
    expect(ds.audit).toEqual([])
    expect(ds.programs[0]).toMatchObject({ expiresOn: null, location: null, signupPage: { logo: 'L', fields: { email: 'optional', birthday: 'optional' } } })
  })
})
