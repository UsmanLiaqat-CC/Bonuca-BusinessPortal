import { describe, expect, it } from 'vitest'
import { programSchema } from '@/schemas/program'
import { campaignSchema } from '@/schemas/campaign'
import { registerSchema } from '@/schemas/auth'
import { customerSchema } from '@/schemas/customer'
import { defaultProgramDraft, DEFAULT_SIGNUP_FIELDS, defaultTier } from '@/lib/factories'
import type { ProgramDraft } from '@/services/backend'

const LOGO = 'data:image/png;base64,AAA'
const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) => (r.error?.issues ?? []).map((i) => i.path.join('.'))

describe('program setup validation (spec §4.2)', () => {
  it('requires the program logo on the template path', () => {
    const d = defaultProgramDraft('stamp')
    d.name = 'Coffee Card'
    if (d.type === 'stamp') d.config.rewardDescription = '1 Free Coffee'
    expect(issues(programSchema.safeParse(d))).toContain('visuals.logo')
    d.visuals.logo = LOGO
    expect(programSchema.safeParse(d).success).toBe(true)
  })

  it('Start from Scratch needs name + RGB background + text colour; logo optional (§4.3)', () => {
    const d = defaultProgramDraft('stamp')
    d.name = 'Coffee'
    d.designMode = 'custom'
    if (d.type === 'stamp') d.config.rewardDescription = 'x'
    expect(issues(programSchema.safeParse(d))).toContain('visuals.background')
    d.visuals.background = { kind: 'color', color: '#112233' }
    expect(programSchema.safeParse(d).success).toBe(true)
  })

  it('membership Discount Value is required only for discount benefit types', () => {
    const d = defaultProgramDraft('membership') as Extract<ProgramDraft, { type: 'membership' }>
    Object.assign(d, { name: 'VIP', visuals: { ...d.visuals, logo: LOGO } })
    d.config.benefitDescription = '10% off'
    expect(issues(programSchema.safeParse(d))).toContain('config.discountValue')
    d.config.benefitType = 'perk'
    expect(programSchema.safeParse(d).success).toBe(true)
    d.config.benefitType = 'percent_discount'
    d.config.discountValue = 120
    expect(issues(programSchema.safeParse(d))).toContain('config.discountValue')
  })

  it('tier program needs 2–5 tiers with increasing values when tiers are enabled', () => {
    const d = defaultProgramDraft('tier') as Extract<ProgramDraft, { type: 'tier' }>
    Object.assign(d, { name: 'Club', visuals: { ...d.visuals, logo: LOGO } })
    d.config.tiers = d.config.tiers.map((t) => ({ ...t, rewards: 'perk' }))
    expect(programSchema.safeParse(d).success).toBe(true)
    d.config.tiers = [defaultTier(0)].map((t) => ({ ...t, rewards: 'x' }))
    expect(issues(programSchema.safeParse(d))).toContain('config.tiers')
    d.config.tiersEnabled = false
    expect(programSchema.safeParse(d).success).toBe(true)
  })

  it('points: fixed method requires points per scan; "other" currency requires a code; ≥1 reward', () => {
    const d = defaultProgramDraft('points') as Extract<ProgramDraft, { type: 'points' }>
    Object.assign(d, { name: 'Pts', visuals: { ...d.visuals, logo: LOGO } })
    d.config.rewards = [{ id: 'r', name: 'Coffee', pointsRequired: 100, icon: null }]
    expect(programSchema.safeParse(d).success).toBe(true)
    d.config.awardingMethod = 'fixed'
    d.config.currency = 'other'
    d.config.rewards = []
    const p = issues(programSchema.safeParse(d))
    expect(p).toEqual(expect.arrayContaining(['config.pointsPerScan', 'config.customCurrency', 'config.rewards']))
  })

  it('expiry toggles reveal required day counts', () => {
    const d = defaultProgramDraft('stamp')
    Object.assign(d, { name: 'C', visuals: { ...d.visuals, logo: LOGO } })
    if (d.type === 'stamp') {
      d.config.rewardDescription = 'x'
      d.config.expiry = { enabled: true, days: null }
    }
    expect(issues(programSchema.safeParse(d))).toContain('config.expiry.days')
  })
})

describe('campaign validation (spec §4.2)', () => {
  it('welcome gift fields appear only when the toggle is on', () => {
    const base = { kind: 'stamp_acquisition' as const, linkedProgramId: 'p', name: 'Cup', startingStamps: 2, welcomeGift: { enabled: false, rewardName: '', description: '', validityDays: null, redemptionConditions: '' } }
    expect(campaignSchema.safeParse(base).success).toBe(true)
    expect(issues(campaignSchema.safeParse({ ...base, welcomeGift: { ...base.welcomeGift, enabled: true } }))).toContain('welcomeGift.rewardName')
  })
  it('voucher date range must be ordered and logo required', () => {
    const r = campaignSchema.safeParse({ kind: 'voucher', name: 'V', voucherReward: 'Coffee', validFrom: '2026-10-10', validTo: '2026-10-01', visuals: { logo: null, background: { kind: 'default' }, textColor: '#FFFFFF' } })
    expect(issues(r)).toEqual(expect.arrayContaining(['validTo', 'visuals.logo']))
  })
})

describe('registration & customer signup', () => {
  it('requires terms acceptance and a valid email', () => {
    const r = registerSchema.safeParse({ fullName: 'A', email: 'bad', password: 'abc12345', country: 'DE', phone: '', acceptTerms: false })
    expect(issues(r)).toEqual(expect.arrayContaining(['email', 'acceptTerms']))
  })
  it('customer fields follow the configured required/optional settings', () => {
    expect(customerSchema(DEFAULT_SIGNUP_FIELDS).safeParse({ name: '', email: '', phone: '', birthday: '' }).success).toBe(false)
    expect(customerSchema({ ...DEFAULT_SIGNUP_FIELDS, name: 'optional' }).safeParse({ name: '', email: '', phone: '', birthday: '' }).success).toBe(true)
    expect(customerSchema({ ...DEFAULT_SIGNUP_FIELDS, email: 'required' }).safeParse({ name: 'A', email: '', phone: '', birthday: '' }).success).toBe(false)
  })
})
