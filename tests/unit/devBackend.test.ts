import { describe, expect, it } from 'vitest'
import { PREVIEW_LOCK_MESSAGE } from '@/lib/access'
import { defaultProgramDraft } from '@/lib/factories'
import { IntegrationNotConnectedError } from '@/services/integrations'
import { DevBackend } from '@/services/dev/devBackend'
import { memoryStore } from '@/services/dev/devDb'
import { createDisconnectedIntegrations } from '@/services/integrations'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'
import { createBackend } from '../test-utils'

const fresh = () => new DevBackend({ store: memoryStore(), integrations: createDisconnectedIntegrations(), catalog: DEV_PLAN_CATALOG })

async function onboard(b: DevBackend, plan: 'free' | 'trial' | 'preview') {
  const d = await b.register({ fullName: 'Ann Owner', email: 'ann@test.dev', password: 'secret123', country: 'DE', phone: '', acceptTerms: true, language: 'en' })
  if (d.delivered) throw new Error('unexpected')
  await b.verifyEmail(d.devCode!)
  await b.createBusiness({ name: 'Ann Café', category: 'cafe', logo: null, address: { street: '', postalCode: '', city: '', country: '' }, openingHours: null, primaryColor: '#1747F8', language: 'en' })
  await b.choosePlan(plan)
  await b.finishOnboarding()
}

describe('dev backend enforces access in logic (spec §2)', () => {
  it('registration requires verification before a business can be created', async () => {
    const b = fresh()
    await b.register({ fullName: 'A', email: 'a@test.dev', password: 'secret123', country: 'DE', phone: '', acceptTerms: true, language: 'en' })
    await expect(b.createBusiness({ name: 'X', category: 'cafe', logo: null, address: { street: '', postalCode: '', city: '', country: '' }, openingHours: null, primaryColor: '#1747F8', language: 'en' })).rejects.toThrow(/Verify your email/)
    await expect(b.verifyEmail('000000')).rejects.toThrow(/not correct/)
  })

  it('Preview Mode blocks real mutations with the exact message and reads demo data', async () => {
    const b = fresh()
    await onboard(b, 'preview')
    await expect(b.createProgram({ ...defaultProgramDraft('stamp'), name: 'X' })).rejects.toThrow(PREVIEW_LOCK_MESSAGE)
    await expect(b.addCustomer({ name: 'Z', email: '', phone: '', birthday: '' })).rejects.toThrow(PREVIEW_LOCK_MESSAGE)
    expect((await b.listPrograms()).some((p) => p.name === 'Coffee Card')).toBe(true)
  })

  it('Free Plan allows one program, then the limit applies', async () => {
    const b = fresh()
    await onboard(b, 'free')
    await b.createProgram({ ...defaultProgramDraft('stamp'), name: 'One' })
    await expect(b.createProgram({ ...defaultProgramDraft('stamp'), name: 'Two' })).rejects.toThrow(/allows up to 1 programs/)
  })

  it('trial allows several programs of the same type; publish requires full fields', async () => {
    const b = fresh()
    await onboard(b, 'trial')
    const p1 = await b.createProgram({ ...defaultProgramDraft('stamp'), name: 'Card A' })
    await b.createProgram({ ...defaultProgramDraft('stamp'), name: 'Card B' })
    expect((await b.listPrograms()).filter((p) => p.type === 'stamp')).toHaveLength(2)
    expect(p1.status).toBe('draft')
    expect(p1.joinQrToken).toBeNull()
    await expect(b.programLifecycle(p1.id, 'publish')).rejects.toThrow(/Complete the required fields/)
    const draft = { ...defaultProgramDraft('stamp'), name: 'Card A' }
    draft.visuals.logo = 'data:image/png;base64,AA'
    if (draft.type === 'stamp') draft.config.rewardDescription = '1 Free Coffee'
    await b.updateProgram(p1.id, draft)
    const published = await b.programLifecycle(p1.id, 'publish')
    expect(published).toMatchObject({ status: 'active' })
    expect(published.joinQrToken).toBeTruthy()
    expect((await b.programLifecycle(p1.id, 'disable')).status).toBe('paused')
    expect((await b.programLifecycle(p1.id, 'archive')).status).toBe('archived')
  })

  it('changing plans never deletes data', async () => {
    const b = fresh()
    await onboard(b, 'trial')
    await b.createProgram({ ...defaultProgramDraft('stamp'), name: 'Keep me' })
    await b.dev.expireTrial()
    const session = await b.getSession()
    expect(session?.subscription?.selection).toBe('trial')
    expect((await b.listPrograms()).map((p) => p.name)).toContain('Keep me')
  })

  it('employees cannot create programs or see the dashboard; customer info is limited', async () => {
    const b = createBackend()
    await b.login('employee@sample.dev', 'Bonuca123')
    await expect(b.createProgram({ ...defaultProgramDraft('stamp'), name: 'X' })).rejects.toThrow(/role/)
    await expect(b.getDashboard()).rejects.toThrow(/role/)
    const customers = await b.listCustomers()
    expect(customers.every((c) => c.email === '' && c.phone === '' && c.notes === '')).toBe(true)
  })

  it('invite flow: invite → accept with own password → role-based access', async () => {
    const b = createBackend()
    await b.login('owner@sample.dev', 'Bonuca123')
    const { invite, delivery } = await b.inviteEmployee('new@sample.dev', 'employee')
    expect(delivery.delivered).toBe(false)
    await b.logout()
    await b.acceptInvite(invite.token, { fullName: 'New Person', password: 'secret123' })
    const s = await b.getSession()
    expect(s?.user).toMatchObject({ email: 'new@sample.dev', role: 'employee' })
    await expect(b.acceptInvite(invite.token, { fullName: 'Again', password: 'secret123' })).rejects.toThrow(/already been accepted/)
  })

  it('managers cannot invite managers', async () => {
    const b = createBackend()
    await b.login('manager@sample.dev', 'Bonuca123')
    await expect(b.inviteEmployee('m2@sample.dev', 'manager')).rejects.toThrow(/role/)
  })

  it('sending a notification fails truthfully and the campaign stays a draft', async () => {
    const b = createBackend()
    await b.login('owner@sample.dev', 'Bonuca123')
    const n = await b.saveNotification(null, { type: 'happy_hour', origin: 'manual', title: 'Hi', message: 'Msg', offer: '', duration: '', programIds: [] })
    await expect(b.sendNotification(n.id)).rejects.toBeInstanceOf(IntegrationNotConnectedError)
    expect((await b.listNotifications()).find((x) => x.id === n.id)?.status).toBe('draft')
  })

  it('AI drafts can only be saved by the Owner', async () => {
    const b = createBackend()
    await b.login('manager@sample.dev', 'Bonuca123')
    await expect(b.saveNotification(null, { type: 'other', origin: 'ai_campaign', title: 'AI', message: 'm', offer: '', duration: '', programIds: [] })).rejects.toThrow(/role/)
  })

  it('Super Admin override is read-only to the business but resolves to paid features', async () => {
    const b = createBackend()
    await b.login('owner@sample.dev', 'Bonuca123')
    await b.dev.setOverride({ kind: 'free_access', planId: 'pro', endsAt: '2099-01-01T00:00:00Z' })
    const s = await b.getSession()
    expect(s?.subscription?.override?.kind).toBe('free_access')
  })

  it('review fixes: employee scanner lookup is limited; invite tokens hidden from managers; owner role cannot be invited', async () => {
    const b = createBackend()
    await b.login('employee@sample.dev', 'Bonuca123')
    const c = (await b.listCustomers())[0]!
    await b.logout()
    await b.login('owner@sample.dev', 'Bonuca123')
    const detail = await b.getCustomer(c.id)
    const code = detail!.memberships[0]!.membership.passCode
    await b.inviteEmployee('mgr2@sample.dev', 'employee')
    await expect(b.inviteEmployee('x@sample.dev', 'owner' as never)).rejects.toThrow(/Invalid role/)
    await b.logout()
    await b.login('employee@sample.dev', 'Bonuca123')
    const ctx = await b.lookupPass(code)
    expect(ctx?.target.customer).toMatchObject({ email: '', phone: '', notes: '' })
    await b.logout()
    await b.login('manager@sample.dev', 'Bonuca123')
    expect((await b.listEmployees()).invites.every((i) => i.token === '')).toBe(true)
  })

  it('review fixes: plan cannot be changed locally while overridden; employees cannot finish onboarding', async () => {
    const b = createBackend()
    await b.login('owner@sample.dev', 'Bonuca123')
    await b.dev.setOverride({ kind: 'unlimited', planId: 'pro', endsAt: null })
    await expect(b.choosePlan('free')).rejects.toThrow(/managed by Bonuca/)
    await b.logout()
    await b.login('employee@sample.dev', 'Bonuca123')
    await expect(b.finishOnboarding()).rejects.toThrow(/role/)
  })
})
