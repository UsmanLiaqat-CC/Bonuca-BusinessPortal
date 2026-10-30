import type {
  AuditEntry,
  AuditModule,
  Business,
  BusinessDataset,
  Gift,
  Campaign,
  Customer,
  Invite,
  LanguageCode,
  PlanCatalog,
  Program,
  SignupFieldConfig,
  SuperAdminOverride,
  User,
  WinBackConfig,
} from '@/types/domain'
import type {
  BusinessBackend,
  BusinessProfileInput,
  BusinessUpdate,
  CampaignDraft,
  CustomerInput,
  EmailDelivery,
  GiftInput,
  JoinInput,
  NotificationDraft,
  ProgramDraft,
  RegisterInput,
  SessionInfo,
} from '../backend'
import type { Integrations } from '../integrations'
import { assertWithinLimit, authorize, type AccessContext, type Permission } from '@/lib/access'
import { resolvePlanState, type PlanState } from '@/lib/plan'
import { nextStatus, type LifecycleAction } from '@/lib/lifecycle'
import { applyScan, buildScanContext, evaluateWinBack, programUnavailable } from '@/lib/scanEngine'
import { analyticsStats, dashboardStats, type DateRange } from '@/lib/metrics'
import { buildLeaderboard } from '@/lib/gamification'
import { AuthError, NotFoundError, ValidationError } from '@/lib/errors'
import { createId, createToken, createVerificationCode } from '@/lib/ids'
import { addDays, daysBetween, formatDate } from '@/lib/dates'
import { DEFAULT_SIGNUP_FIELDS, defaultSignupPage, defaultSubscription, defaultWinBack } from '@/lib/factories'
import { giftStatus } from '@/lib/gifts'
import { customerHistory } from '@/lib/history'
import { isTeamPermission, presetFor, type TeamPermission } from '@/lib/teamPermissions'
import { campaignLinked, campaignRows, customerCampaigns, endExpiredCampaigns, WINBACK_ID } from '@/lib/campaigns'
import { currencyCode } from '@/lib/points'
import { programSchema } from '@/schemas/program'
import { campaignSchema } from '@/schemas/campaign'
import { customerSchema } from '@/schemas/customer'
import { notificationSchema, winBackSchema } from '@/schemas/notification'
import { acceptInviteSchema, registerSchema } from '@/schemas/auth'
import { buildPreviewDataset, buildSampleDataset } from '@/mocks/sampleDataset'
import { emptyDb, hashPassword, loadDb, saveDb, type DevDb, type KeyValueStore } from './devDb'

export interface DevBackendOptions {
  store: KeyValueStore
  integrations: Integrations
  catalog: PlanCatalog
  latencyMs?: number
  now?: () => Date
  /** Seed a sample business with Owner/Manager/Employee accounts on first run. */
  seed?: boolean
}

const SEED_PASSWORD = 'Bonuca123'
const TYPE_NAME = { stamp: 'Stamp Card', membership: 'Membership Card', tier: 'Tier Program', points: 'Points Program' } as const
const SEED_ACCOUNTS = [
  { email: 'owner@sample.dev', role: 'owner' as const, name: 'Sam Owner' },
  { email: 'manager@sample.dev', role: 'manager' as const, name: 'Mia Manager' },
  { email: 'employee@sample.dev', role: 'employee' as const, name: 'Eli Employee' },
]

interface Ctx {
  db: DevDb
  user: User
  ds: BusinessDataset
  plan: PlanState
  access: AccessContext
}

/**
 * In-browser development backend implementing the BusinessBackend contract.
 * Enforces role/plan access on every call (spec §2) using the same rules as the UI.
 * External effects (email, Stripe, wallet push, notifications, AI) go through not-connected gateways.
 */
export class DevBackend implements BusinessBackend {
  readonly isDevelopment = true
  private readonly opts: Required<Omit<DevBackendOptions, 'seed'>> & { seed: boolean }
  private dbCache: DevDb | null = null
  private ready: Promise<void> | null = null

  constructor(options: DevBackendOptions) {
    this.opts = { latencyMs: 0, now: () => new Date(), seed: false, ...options }
  }

  readonly dev = {
    seedAccounts: SEED_ACCOUNTS.map((a) => ({ email: a.email, password: SEED_PASSWORD, role: a.role })),
    setOverride: async (override: SuperAdminOverride | null) => {
      await this.mutate((c) => {
        c.ds.subscription.override = override
      })
    },
    expireTrial: async () => {
      await this.mutate((c) => {
        if (c.ds.subscription.selection === 'trial') c.ds.subscription.trialEndsAt = addDays(this.now(), -1).toISOString()
      })
    },
    resetAll: async () => {
      this.dbCache = emptyDb()
      if (this.opts.seed) await this.seed(this.dbCache)
      this.persist()
    },
  }

  /* ------------------------------------------------------------------ infrastructure */

  private now(): Date {
    return this.opts.now()
  }

  private async delay(): Promise<void> {
    if (this.opts.latencyMs > 0) await new Promise((r) => setTimeout(r, this.opts.latencyMs))
  }

  private async db(): Promise<DevDb> {
    if (!this.ready) {
      this.ready = (async () => {
        const loaded = loadDb(this.opts.store)
        if (loaded) {
          for (const ds of Object.values(loaded.datasets)) normalizeDataset(ds)
          this.dbCache = loaded
          // Data saved by a build without dev tools has no sample accounts: add them (sample business only).
          if (this.opts.seed && !loaded.credentials.some((c) => c.email === SEED_ACCOUNTS[0]!.email) && !loaded.datasets.biz_sample) {
            await this.seed(loaded)
            this.persist()
          }
        } else {
          this.dbCache = emptyDb()
          if (this.opts.seed) await this.seed(this.dbCache)
          this.persist()
        }
      })()
    }
    await this.ready
    return this.dbCache!
  }

  private persist(): void {
    if (this.dbCache) saveDb(this.opts.store, this.dbCache)
  }

  private async seed(db: DevDb): Promise<void> {
    const businessId = 'biz_sample'
    const staff = SEED_ACCOUNTS.map((a, i) => ({ id: `usr_seed_${i}`, fullName: a.name, email: a.email, role: a.role }))
    const ds = buildSampleDataset({ businessId, businessName: 'Brew & Bean Café', seed: 7, now: this.now(), staff })
    ds.business.permissions.managersCanManageEmployees = true
    db.datasets[businessId] = ds
    for (const s of staff) {
      db.credentials.push({ userId: s.id, email: s.email, passwordHash: await hashPassword(s.email, SEED_PASSWORD) })
    }
  }

  private findUser(db: DevDb, userId: string): { user: User; ds: BusinessDataset | null } | null {
    const unattached = db.unattachedUsers.find((u) => u.id === userId)
    if (unattached) return { user: unattached, ds: null }
    for (const ds of Object.values(db.datasets)) {
      const user = ds.users.find((u) => u.id === userId)
      if (user) return { user, ds }
    }
    return null
  }

  private async sessionUser(): Promise<{ db: DevDb; user: User; ds: BusinessDataset | null }> {
    const db = await this.db()
    const found = db.sessionUserId ? this.findUser(db, db.sessionUserId) : null
    if (!found) throw new AuthError('Please log in again.')
    return { db, ...found }
  }

  private async ctx(): Promise<Ctx> {
    const { db, user, ds } = await this.sessionUser()
    if (!ds) throw new AuthError('Complete your business profile first.')
    // Simulates the server-side win-back automation (spec §4.7) whenever data is read.
    const evaluated = evaluateWinBack(ds, this.now())
    if (evaluated !== ds) {
      db.datasets[ds.business.id] = evaluated
      this.persist()
    }
    // Vouchers end automatically after their end date (Campaigns tab status rules).
    if (endExpiredCampaigns(db.datasets[ds.business.id]!, this.now())) this.persist()
    // Work on a copy: a failed mutation must not leave partial changes behind.
    const current = structuredClone(db.datasets[ds.business.id]!)
    const self = current.users.find((u) => u.id === user.id) ?? user
    const plan = resolvePlanState(current.subscription, this.opts.catalog, this.now())
    return { db, user: self, ds: current, plan, access: { role: self.role, plan, permissions: current.business.permissions, grants: self.permissions ?? null } }
  }

  /** Preview Mode reads demo data (spec §2); real data is untouched. */
  private readable(c: Ctx): BusinessDataset {
    return c.plan.mode === 'preview' ? buildPreviewDataset(this.now()) : c.ds
  }

  private async read<T>(permission: Permission, fn: (ds: BusinessDataset, c: Ctx) => T): Promise<T> {
    await this.delay()
    const c = await this.ctx()
    authorize(c.access, permission)
    return structuredClone(fn(this.readable(c), c))
  }

  private async mutate<T>(fn: (c: Ctx) => T, permission?: Permission): Promise<T> {
    await this.delay()
    const c = await this.ctx()
    if (permission) authorize(c.access, permission)
    const result = fn(c)
    c.db.datasets[c.ds.business.id] = c.ds
    this.persist()
    return structuredClone(result)
  }

  private sessionInfo(user: User, ds: BusinessDataset | null): SessionInfo {
    return structuredClone({
      user,
      business: ds?.business ?? null,
      subscription: ds?.subscription ?? null,
      catalog: this.opts.catalog,
    })
  }

  /** Settings → Audit records what Managers and Employees do (the Owner's own actions are not listed). */
  private audit(c: Ctx, module: AuditModule, action: string, details: string): void {
    if (c.user.role === 'owner') return
    const entry: AuditEntry = { id: createId('aud'), userId: c.user.id, userName: c.user.fullName, role: c.user.role, action, module, details, createdAt: this.now().toISOString() }
    c.ds.audit.push(entry)
  }

  /* ------------------------------------------------------------------ auth */

  async getSession(): Promise<SessionInfo | null> {
    const db = await this.db()
    if (!db.sessionUserId) return null
    const found = this.findUser(db, db.sessionUserId)
    if (!found) return null
    if (found.ds) {
      const evaluated = evaluateWinBack(found.ds, this.now())
      if (evaluated !== found.ds) {
        db.datasets[found.ds.business.id] = evaluated
        this.persist()
      }
    }
    const ds = found.ds ? db.datasets[found.ds.business.id]! : null
    return this.sessionInfo(found.user, ds)
  }

  async register(input: RegisterInput): Promise<EmailDelivery> {
    await this.delay()
    const parsed = registerSchema.safeParse(input)
    if (!parsed.success) throw ValidationError.fromZod(parsed.error)
    const db = await this.db()
    const email = input.email.trim().toLowerCase()
    if (db.credentials.some((c) => c.email === email)) throw new ValidationError('An account with this email already exists.')
    const user: User = {
      id: createId('usr'),
      businessId: null,
      fullName: input.fullName.trim(),
      email,
      phone: input.phone.trim(),
      country: input.country,
      role: 'owner',
      emailVerified: false,
      language: input.language,
      createdAt: this.now().toISOString(),
    }
    db.unattachedUsers.push(user)
    db.credentials.push({ userId: user.id, email, passwordHash: await hashPassword(email, input.password) })
    const code = createVerificationCode()
    db.verification[user.id] = code
    db.sessionUserId = user.id
    this.persist()
    return { delivered: false, devCode: code }
  }

  async verifyEmail(code: string): Promise<void> {
    await this.delay()
    const { db, user } = await this.sessionUser()
    if (user.emailVerified) return
    if (db.verification[user.id] !== code.trim()) throw new ValidationError('That code is not correct. Check the code and try again.')
    user.emailVerified = true
    delete db.verification[user.id]
    this.persist()
  }

  async resendVerification(): Promise<EmailDelivery> {
    await this.delay()
    const { db, user } = await this.sessionUser()
    const code = createVerificationCode()
    db.verification[user.id] = code
    this.persist()
    return { delivered: false, devCode: code }
  }

  async login(email: string, password: string): Promise<SessionInfo> {
    await this.delay()
    const db = await this.db()
    const normalized = email.trim().toLowerCase()
    const cred = db.credentials.find((c) => c.email === normalized)
    if (!cred || cred.passwordHash !== (await hashPassword(normalized, password))) {
      throw new AuthError('Email or password is incorrect.')
    }
    db.sessionUserId = cred.userId
    this.persist()
    const found = this.findUser(db, cred.userId)
    if (!found) throw new AuthError('Account not found.')
    return this.sessionInfo(found.user, found.ds)
  }

  async logout(): Promise<void> {
    const db = await this.db()
    db.sessionUserId = null
    this.persist()
  }

  async getInvite(token: string) {
    await this.delay()
    const db = await this.db()
    for (const ds of Object.values(db.datasets)) {
      const invite = ds.invites.find((i) => i.token === token)
      if (invite) return structuredClone({ invite, businessName: ds.business.name })
    }
    return null
  }

  async acceptInvite(token: string, input: { fullName: string; password: string }): Promise<void> {
    await this.delay()
    const db = await this.db()
    const ds = Object.values(db.datasets).find((d) => d.invites.some((i) => i.token === token))
    const invite = ds?.invites.find((i) => i.token === token)
    if (!ds || !invite) throw new NotFoundError('This invitation link is not valid.')
    const parsed = acceptInviteSchema.safeParse({ ...input, confirm: input.password })
    if (!parsed.success) throw ValidationError.fromZod(parsed.error)
    if (invite.acceptedAt) throw new ValidationError('This invitation has already been accepted.')
    if (db.credentials.some((c) => c.email === invite.email)) throw new ValidationError('An account with this email already exists.')
    const user: User = {
      id: createId('usr'),
      businessId: ds.business.id,
      fullName: input.fullName.trim(),
      email: invite.email,
      phone: '',
      country: ds.business.country,
      role: invite.role,
      // The invite link proves ownership of the email address (§4.6 invite flow).
      emailVerified: true,
      language: 'en',
      createdAt: this.now().toISOString(),
      // The same permissions apply wherever this account signs in (web and mobile).
      permissions: invite.permissions ?? null,
    }
    ds.users.push(user)
    invite.acceptedAt = this.now().toISOString()
    db.credentials.push({ userId: user.id, email: invite.email, passwordHash: await hashPassword(invite.email, input.password) })
    db.sessionUserId = user.id
    this.persist()
  }

  async setLanguage(language: LanguageCode): Promise<void> {
    const { user } = await this.sessionUser()
    user.language = language
    this.persist()
  }

  /* ------------------------------------------------------------------ onboarding */

  async createBusiness(input: BusinessProfileInput): Promise<void> {
    await this.delay()
    const { db, user, ds } = await this.sessionUser()
    if (!user.emailVerified) throw new AuthError('Verify your email address first.')
    if (ds) throw new ValidationError('This account already has a business.')
    const business: Business = {
      id: createId('biz'),
      name: input.name.trim(),
      category: input.category,
      country: user.country,
      address: input.address,
      openingHours: input.openingHours,
      branding: { logo: input.logo, primaryColor: input.primaryColor, secondaryColor: '#0A112F', backgroundColor: '#F3F3F1', font: 'system' },
      signupFields: { ...DEFAULT_SIGNUP_FIELDS },
      permissions: { managersCanManageEmployees: false, showLeaderboardToEmployees: false },
      onboardingStep: 'plan',
      createdAt: this.now().toISOString(),
    }
    const owner: User = { ...user, businessId: business.id, role: 'owner', language: input.language }
    db.unattachedUsers = db.unattachedUsers.filter((u) => u.id !== user.id)
    db.datasets[business.id] = {
      business,
      subscription: defaultSubscription(),
      users: [owner],
      invites: [],
      programs: [],
      campaigns: [],
      customers: [],
      memberships: [],
      transactions: [],
      rewards: [],
      notifications: [],
      winback: defaultWinBack(),
      winbackEvents: [],
      gifts: [],
      audit: [],
    }
    this.persist()
  }

  async choosePlan(choice: 'free' | 'trial' | 'preview'): Promise<void> {
    await this.mutate((c) => {
      const sub = c.ds.subscription
      const catalog = this.opts.catalog
      if (c.plan.override) throw new ValidationError('Your plan is managed by Bonuca and cannot be changed here.')
      if (sub.source === 'app_store' || sub.source === 'google_play') throw new ValidationError('This subscription was purchased in the mobile app. Manage it through the App Store or Google Play.')
      if (sub.selection === 'paid') throw new ValidationError('Paid plan changes are processed through Stripe.')
      if (choice === 'free') {
        if (!catalog.free.enabled) throw new ValidationError('The Free Plan is not available.')
        Object.assign(sub, { selection: 'free', planId: catalog.free.plan.id, source: null })
      } else if (choice === 'trial') {
        if (!catalog.trial.enabled) throw new ValidationError('A free trial is not available.')
        if (sub.trialEndsAt) throw new ValidationError('The free trial has already been used.')
        Object.assign(sub, {
          selection: 'trial',
          planId: catalog.trial.grantsPlanId,
          trialEndsAt: addDays(this.now(), catalog.trial.days).toISOString(),
        })
      } else {
        // "Skip for now" → Preview Mode. No data is deleted.
        Object.assign(sub, { selection: 'none' })
      }
      if (c.ds.business.onboardingStep === 'plan') c.ds.business.onboardingStep = 'first_program'
    }, 'subscription.manage')
  }

  async finishOnboarding(): Promise<void> {
    await this.mutate((c) => {
      c.ds.business.onboardingStep = 'done'
    }, 'subscription.manage')
  }

  /* ------------------------------------------------------------------ programs */

  listPrograms() {
    return this.read('programs.view', (ds) => ds.programs)
  }

  async createProgram(draft: ProgramDraft): Promise<Program> {
    return this.mutate((c) => {
      if (!draft.name.trim()) throw new ValidationError('Program name is required.')
      assertWithinLimit(c.plan, 'programs', c.ds.programs.filter((p) => p.status !== 'archived').length)
      const now = this.now().toISOString()
      const program = {
        ...structuredClone(draft),
        id: createId('prg'),
        businessId: c.ds.business.id,
        status: 'draft',
        joinQrToken: null,
        createdAt: now,
        publishedAt: null,
        updatedAt: now,
      } as Program
      c.ds.programs.push(program)
      this.audit(c, 'Programs', 'Created program', program.name)
      return program
    }, 'programs.manage')
  }

  async updateProgram(id: string, draft: ProgramDraft): Promise<Program> {
    return this.mutate((c) => {
      const index = c.ds.programs.findIndex((p) => p.id === id)
      const existing = c.ds.programs[index]
      if (!existing) throw new NotFoundError('Program not found.')
      if (existing.type !== draft.type) throw new ValidationError('A program type cannot be changed.')
      if (existing.status === 'archived') throw new ValidationError('Archived programs cannot be edited.')
      if (existing.status !== 'draft') {
        const parsed = programSchema.safeParse(draft)
        if (!parsed.success) throw ValidationError.fromZod(parsed.error)
      } else if (!draft.name.trim()) throw new ValidationError('Program name is required.')
      const updated = { ...existing, ...structuredClone(draft), updatedAt: this.now().toISOString() } as Program
      c.ds.programs[index] = updated
      this.audit(c, 'Programs', 'Edited program', updated.name)
      return updated
    }, 'programs.manage')
  }

  async programLifecycle(id: string, action: LifecycleAction): Promise<Program> {
    return this.mutate((c) => {
      const program = c.ds.programs.find((p) => p.id === id)
      if (!program) throw new NotFoundError('Program not found.')
      const next = nextStatus(program.status, action)
      if (!next) throw new ValidationError(`Cannot ${action} a program that is ${program.status}.`)
      if (action === 'publish') {
        const parsed = programSchema.safeParse(program)
        if (!parsed.success) throw ValidationError.fromZod(parsed.error, 'Complete the required fields before publishing.')
        // The printable join QR is generated the first time the program is published (§4.2).
        program.joinQrToken ??= createToken()
        program.publishedAt = this.now().toISOString()
      }
      if (action === 'enable' || action === 'publish') {
        // Only one Active program of each type; drafts and inactive programs are unlimited (client rule).
        const sameType = c.ds.programs.find((p) => p.id !== id && p.type === program.type && p.status === 'active')
        if (sameType) throw new ValidationError(`Only one active ${TYPE_NAME[program.type]} at a time. Pause or archive “${sameType.name}” first.`)
        assertWithinLimit(c.plan, 'programs', c.ds.programs.filter((p) => p.status === 'active' && p.id !== id).length)
      }
      program.status = next
      program.updatedAt = this.now().toISOString()
      this.audit(c, 'Programs', `${action[0]!.toUpperCase()}${action.slice(1)} program`, program.name)
      return program
    }, 'programs.manage')
  }

  async setDesignMode(id: string, mode: Program['designMode']): Promise<Program> {
    return this.mutate((c) => {
      const program = c.ds.programs.find((p) => p.id === id)
      if (!program) throw new NotFoundError('Program not found.')
      if (program.status !== 'draft') {
        const parsed = programSchema.safeParse({ ...program, designMode: mode })
        if (!parsed.success) throw ValidationError.fromZod(parsed.error, 'This design cannot be applied yet.')
      }
      program.designMode = mode
      program.updatedAt = this.now().toISOString()
      return program
    }, 'wallet.manage')
  }

  async updateSurprise(id: string, surprise: Program['surprise']): Promise<Program> {
    return this.mutate((c) => {
      const program = c.ds.programs.find((p) => p.id === id)
      if (!program) throw new NotFoundError('Program not found.')
      if (surprise.enabled && surprise.pool.length === 0) throw new ValidationError('Add at least one reward to the pool.')
      program.surprise = structuredClone(surprise)
      return program
    }, 'rewards.manage')
  }

  programCardCounts() {
    return this.read('programs.view', (ds) => {
      const counts: Record<string, number> = {}
      for (const m of ds.memberships) counts[m.programId] = (counts[m.programId] ?? 0) + 1
      return counts
    })
  }

  getProgramCustomers(programId: string) {
    return this.read('programs.view', (ds, c) => {
      const program = ds.programs.find((p) => p.id === programId)
      if (!program) throw new NotFoundError('Program not found.')
      const lastByCustomer = new Map<string, string>()
      for (const t of ds.transactions) {
        if (t.programId !== programId) continue
        const prev = lastByCustomer.get(t.customerId)
        if (!prev || t.createdAt > prev) lastByCustomer.set(t.customerId, t.createdAt)
      }
      return ds.memberships
        .filter((m) => m.programId === programId)
        .flatMap((membership) => {
          const customer = ds.customers.find((x) => x.id === membership.customerId)
          if (!customer) return []
          const lastVisit = lastByCustomer.get(customer.id) ?? membership.lastActivityAt
          // OI-46 (provisional): Active = any activity on this card in the last 60 days.
          const status: 'active' | 'inactive' = lastVisit && daysBetween(lastVisit, this.now()) <= 60 ? 'active' : 'inactive'
          return [{ customer: this.limit(customer, c), membership, progress: progressLine(program, membership), lastVisit, status }]
        })
    })
  }

  listCampaigns() {
    return this.read('programs.view', (ds) => ds.campaigns)
  }

  async createCampaign(draft: CampaignDraft): Promise<Campaign> {
    return this.mutate((c) => {
      if (!draft.name.trim()) throw new ValidationError('Campaign name is required.')
      const now = this.now().toISOString()
      const campaign = { ...structuredClone(draft), id: createId('cmp'), businessId: c.ds.business.id, status: 'draft', qrToken: null, createdAt: now, publishedAt: null } as Campaign
      c.ds.campaigns.push(campaign)
      this.audit(c, 'Campaigns', 'Created campaign', campaign.name)
      return campaign
    }, 'programs.manage')
  }

  async updateCampaign(id: string, draft: CampaignDraft): Promise<Campaign> {
    return this.mutate((c) => {
      const index = c.ds.campaigns.findIndex((x) => x.id === id)
      const existing = c.ds.campaigns[index]
      if (!existing) throw new NotFoundError('Campaign not found.')
      if (existing.kind !== draft.kind) throw new ValidationError('A campaign type cannot be changed.')
      if (existing.status !== 'draft') {
        const parsed = campaignSchema.safeParse(draft)
        if (!parsed.success) throw ValidationError.fromZod(parsed.error)
      }
      const updated = { ...existing, ...structuredClone(draft) } as Campaign
      c.ds.campaigns[index] = updated
      this.audit(c, 'Campaigns', 'Edited campaign', updated.name)
      return updated
    }, 'programs.manage')
  }

  async campaignLifecycle(id: string, action: LifecycleAction): Promise<Campaign> {
    return this.mutate((c) => {
      const campaign = c.ds.campaigns.find((x) => x.id === id)
      if (!campaign) throw new NotFoundError('Campaign not found.')
      const next = nextStatus(campaign.status, action)
      if (!next) throw new ValidationError(`Cannot ${action} a campaign that is ${campaign.status}.`)
      if (action === 'publish' || action === 'enable') {
        const parsed = campaignSchema.safeParse(campaign)
        if (!parsed.success) throw ValidationError.fromZod(parsed.error, 'Complete the required fields before publishing.')
        if (campaign.kind === 'stamp_acquisition') {
          const linked = c.ds.programs.find((p) => p.id === campaign.linkedProgramId)
          if (!linked || linked.type !== 'stamp' || linked.status !== 'active') {
            throw new ValidationError('The linked stamp card must be published and active.')
          }
        }
      }
      if (action === 'publish') {
        // Campaign QR is system-generated on publish (§4.2).
        campaign.qrToken ??= createToken()
        campaign.publishedAt = this.now().toISOString()
      }
      campaign.status = next
      if (next === 'ended') campaign.publishedAt ??= this.now().toISOString()
      this.audit(c, 'Campaigns', `${action[0]!.toUpperCase()}${action.slice(1)} campaign`, campaign.name)
      return campaign
    }, 'programs.manage')
  }

  listCampaignRows() {
    return this.read('programs.view', (ds) => campaignRows(ds, this.now()))
  }

  getCampaignLinked(id: string) {
    return this.read('programs.view', (ds) => {
      if (id !== WINBACK_ID && !ds.campaigns.some((c) => c.id === id)) throw new NotFoundError('Campaign not found.')
      return campaignLinked(ds, id, this.now())
    })
  }

  async linkCampaignCustomer(campaignId: string, customerId: string): Promise<void> {
    await this.mutate((c) => {
      const campaign = c.ds.campaigns.find((x) => x.id === campaignId)
      const customer = c.ds.customers.find((x) => x.id === customerId)
      if (!campaign) throw new NotFoundError('Campaign not found.')
      if (!customer) throw new NotFoundError('Customer not found.')
      if (campaign.status !== 'active') throw new ValidationError('Customers can be added to an Active campaign only.')
      if (campaignLinked(c.ds, campaignId, this.now()).some((r) => r.customerId === customerId)) throw new ValidationError('This customer is already linked to the campaign.')
      const now = this.now()
      const nowIso = now.toISOString()
      const code = () => `BNC-${createToken().slice(0, 8).toUpperCase()}`
      const base = { businessId: c.ds.business.id, customerId, description: '', pointsRewardId: null, pointsCost: null, winbackStage: null, issuedAt: nowIso, redeemedAt: null, status: 'available' as const }
      if (campaign.kind === 'voucher') {
        c.ds.rewards.push({ ...base, id: createId('rwd'), programId: null, campaignId, source: 'voucher', name: campaign.voucherReward, passCode: code(), availableFrom: new Date(`${campaign.validFrom}T00:00:00`).toISOString(), expiresAt: new Date(`${campaign.validTo}T23:59:59`).toISOString() })
      } else if (campaign.kind === 'stamp_acquisition') {
        const program = c.ds.programs.find((p) => p.id === campaign.linkedProgramId)
        if (!program || program.status !== 'active') throw new ValidationError('The linked stamp card must be active.')
        if (c.ds.memberships.some((m) => m.customerId === customerId && m.programId === program.id)) throw new ValidationError('This customer already has the stamp card.')
        c.ds.memberships.push({ id: createId('mem'), customerId, programId: program.id, passCode: code(), joinedAt: nowIso, stamps: campaign.startingStamps, points: 0, visits: 0, totalSpend: 0, tierIndex: 0, lastActivityAt: null, viaCampaignId: campaignId })
        if (campaign.welcomeGift.enabled) {
          c.ds.rewards.push({ ...base, id: createId('rwd'), programId: program.id, campaignId, source: 'welcome_gift', name: campaign.welcomeGift.rewardName, description: campaign.welcomeGift.description, passCode: null, availableFrom: null, expiresAt: campaign.welcomeGift.validityDays ? addDays(now, campaign.welcomeGift.validityDays).toISOString() : null })
        }
      }
      this.audit(c, 'Campaigns', 'Linked customer', `${customer.name} → ${campaign.name}`)
    }, 'programs.manage')
  }

  async winbackLifecycle(action: 'enable' | 'disable' | 'end'): Promise<void> {
    await this.mutate((c) => {
      const w = c.ds.winback
      if (w.endedAt) throw new ValidationError('This campaign has ended.')
      if (action === 'enable') {
        const parsed = winBackSchema.safeParse({ ...w, enabled: true })
        if (!parsed.success) throw ValidationError.fromZod(parsed.error, 'Complete the win-back stages before resuming.')
        w.enabled = true
      } else if (action === 'disable') w.enabled = false
      else {
        w.enabled = false
        w.endedAt = this.now().toISOString()
      }
      this.audit(c, 'Campaigns', action === 'enable' ? 'Resumed campaign' : action === 'disable' ? 'Paused campaign' : 'Ended campaign', 'Win-back')
      if (action === 'enable') c.ds = evaluateWinBack(c.ds, this.now())
    }, 'notifications.manage')
  }

  /* ------------------------------------------------------------------ scanner */

  lookupPass(code: string) {
    return this.read('scanner.use', (ds, c) => {
      const ctx = buildScanContext(ds, code, this.now())
      if (ctx) ctx.target = { ...ctx.target, customer: this.limit(ctx.target.customer, c) } as typeof ctx.target
      return ctx
    })
  }

  async confirmScan(input: Parameters<BusinessBackend['confirmScan']>[0]) {
    return this.mutate((c) => {
      const a = input.action
      // Remove stamp (-1) and adding more than one stamp are Owner/Manager only.
      if (a.type === 'remove_stamp') authorize(c.access, 'scanner.adjust')
      // Several stamps in one scan: the program must allow it and the user needs the permission.
      if (a.type === 'add_stamp' && (a.count ?? 1) > 1) authorize(c.access, 'scanner.multiStamp')
      const address = c.ds.business.address
      const location = [address.street, address.city].filter(Boolean).join(', ') || c.ds.business.name
      const { dataset, result } = applyScan(c.ds, { ...input, employeeId: c.user.id, location }, this.now())
      c.ds = dataset
      const customer = c.ds.customers.find((x) => x.id === result.transaction.customerId)
      const program = c.ds.programs.find((p) => p.id === result.transaction.programId)
      this.audit(c, 'Award actions', result.summary.replace(/\.$/, ''), `${customer?.name ?? 'Customer'}${program ? ` · ${program.name}` : ''} · ${input.entry === 'search' ? 'found by search' : 'scanned'}`)
      return result
    }, 'scanner.transact')
  }

  getAwardCustomer(customerId: string) {
    return this.read('scanner.use', (ds, c) => {
      const customer = ds.customers.find((x) => x.id === customerId)
      if (!customer) return null
      const now = this.now()
      return {
        customer: this.limit(customer, c),
        cards: ds.memberships
          .filter((m) => m.customerId === customerId)
          .flatMap((membership) => {
            const program = ds.programs.find((p) => p.id === membership.programId)
            return program && program.status !== 'draft' ? [{ membership, program, unavailableReason: programUnavailable(program, now) }] : []
          }),
        gifts: ds.gifts.filter((g) => g.customerId === customerId && giftStatus(g, now) === 'available'),
        history: customerHistory(ds, customerId).slice(0, c.user.role === 'employee' ? 10 : 30),
      }
    })
  }

  listRecentScans(limit: number) {
    return this.read('scanner.use', (ds, c) => {
      const customerName = new Map(ds.customers.map((x) => [x.id, x.name]))
      const label = new Map<string, string>([...ds.programs.map((p) => [p.id, p.name] as const), ...ds.campaigns.map((x) => [x.id, x.name] as const)])
      return ds.transactions
        .filter((t) => c.user.role !== 'employee' || t.employeeId === c.user.id)
        .slice(-limit)
        .reverse()
        .map((transaction) => ({
          transaction,
          customerName: customerName.get(transaction.customerId) ?? 'Unknown customer',
          programName: label.get(transaction.programId ?? transaction.campaignId ?? '') ?? '—',
        }))
    })
  }

  /* ------------------------------------------------------------------ customers */

  /** Employees see limited customer info (OI-18). */
  private limit(customer: Customer, c: Ctx): Customer {
    if (c.user.role !== 'employee') return customer
    // Staff see limited customer info unless the owner ticked "View customers".
    if (c.user.permissions?.includes('customers.view')) return customer
    return { ...customer, email: '', phone: '', birthday: '', notes: '' }
  }

  listCustomers() {
    return this.read('customers.view', (ds, c) => ds.customers.map((x) => this.limit(x, c)))
  }

  getCustomer(id: string) {
    return this.read('customers.view', (ds, c) => {
      const customer = ds.customers.find((x) => x.id === id)
      if (!customer) return null
      const transactions = ds.transactions.filter((t) => t.customerId === id).reverse()
      return {
        customer: this.limit(customer, c),
        memberships: ds.memberships
          .filter((m) => m.customerId === id)
          .flatMap((membership) => {
            const program = ds.programs.find((p) => p.id === membership.programId)
            return program ? [{ membership, program }] : []
          }),
        transactions: c.user.role === 'employee' ? transactions.slice(0, 10) : transactions,
        rewards: ds.rewards.filter((r) => r.customerId === id),
        gifts: ds.gifts.filter((g) => g.customerId === id),
        campaigns: customerCampaigns(ds, id),
        history: c.user.role === 'employee' ? customerHistory(ds, id).slice(0, 10) : customerHistory(ds, id),
        lastVisit: transactions[0]?.createdAt ?? null,
        scanCount: transactions.length,
      }
    })
  }

  async addCustomer(input: CustomerInput): Promise<Customer> {
    return this.mutate((c) => {
      const parsed = customerSchema(c.ds.business.signupFields).safeParse(input)
      if (!parsed.success) throw ValidationError.fromZod(parsed.error)
      assertWithinLimit(c.plan, 'customers', c.ds.customers.length)
      const next = c.ds.customers.reduce((max, x) => Math.max(max, Number(x.customerNumber.replace(/\D/g, '')) || 0), 10000) + 1
      const customer: Customer = {
        id: createId('cus'),
        businessId: c.ds.business.id,
        customerNumber: `C-${next}`,
        ...parsed.data,
        notes: '',
        createdAt: this.now().toISOString(),
      }
      c.ds.customers.push(customer)
      this.audit(c, 'Customers', 'Added customer', `${customer.name} (${customer.customerNumber})`)
      return customer
    }, 'customers.add')
  }

  async updateCustomerNotes(id: string, notes: string): Promise<void> {
    await this.mutate((c) => {
      const customer = c.ds.customers.find((x) => x.id === id)
      if (!customer) throw new NotFoundError('Customer not found.')
      customer.notes = notes
      this.audit(c, 'Customers', 'Edited notes', `${customer.name} (${customer.customerNumber})`)
    }, 'customers.notes')
  }

  async giveGift(customerId: string, input: GiftInput): Promise<Gift> {
    return this.mutate((c) => {
      const customer = c.ds.customers.find((x) => x.id === customerId)
      if (!customer) throw new NotFoundError('Customer not found.')
      if (!input.name.trim()) throw new ValidationError('Gift name is required.')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expiresOn)) throw new ValidationError('Choose the expiry date.')
      const expiresAt = new Date(`${input.expiresOn}T23:59:59`)
      const availableFrom = input.availableFrom ? new Date(`${input.availableFrom}T00:00:00`) : null
      if (expiresAt < this.now()) throw new ValidationError('The expiry date must be in the future.')
      if (availableFrom && availableFrom > expiresAt) throw new ValidationError('The gift must start before it expires.')
      const gift: Gift = {
        id: createId('gft'),
        businessId: c.ds.business.id,
        customerId,
        name: input.name.trim(),
        description: input.description.trim(),
        terms: input.terms.trim(),
        availableFrom: availableFrom && availableFrom > this.now() ? availableFrom.toISOString() : null,
        expiresAt: expiresAt.toISOString(),
        status: 'open',
        createdBy: c.user.id,
        createdAt: this.now().toISOString(),
        redeemedAt: null,
        redeemedBy: null,
        redeemedLocation: null,
        cancelledAt: null,
        cancelledBy: null,
      }
      c.ds.gifts.push(gift)
      this.audit(c, 'Gifts', 'Gave gift', `${gift.name} → ${customer.name}`)
      return gift
    }, 'gifts.manage')
  }

  async cancelGift(giftId: string): Promise<Gift> {
    return this.mutate((c) => {
      const gift = c.ds.gifts.find((g) => g.id === giftId)
      if (!gift) throw new NotFoundError('Gift not found.')
      const status = giftStatus(gift, this.now())
      if (status === 'redeemed') throw new ValidationError('A redeemed gift cannot be cancelled.')
      if (status === 'cancelled') throw new ValidationError('This gift is already cancelled.')
      gift.status = 'cancelled'
      gift.cancelledAt = this.now().toISOString()
      gift.cancelledBy = c.user.id
      const customer = c.ds.customers.find((x) => x.id === gift.customerId)
      this.audit(c, 'Gifts', 'Cancelled gift', `${gift.name} → ${customer?.name ?? 'customer'}`)
      return gift
    }, 'gifts.manage')
  }

  listAudit() {
    return this.read('audit.view', (ds) => [...ds.audit].reverse())
  }

  /* ------------------------------------------------------------------ public sign-up (no login) */

  private findCampaign(db: DevDb, token: string) {
    for (const ds of Object.values(db.datasets)) {
      endExpiredCampaigns(ds, this.now())
      const campaign = ds.campaigns.find((c) => c.qrToken === token)
      if (campaign) return { ds, campaign }
    }
    return null
  }

  async getCampaignJoin(token: string) {
    await this.delay()
    const found = this.findCampaign(await this.db(), token)
    if (!found || found.campaign.status === 'draft' || found.campaign.status === 'archived') return null
    const { ds, campaign } = found
    const state: 'open' | 'paused' | 'ended' = campaign.status === 'ended' ? 'ended' : campaign.status === 'paused' ? 'paused' : 'open'
    const program = campaign.kind === 'stamp_acquisition' ? (ds.programs.find((p) => p.id === campaign.linkedProgramId) ?? null) : null
    return structuredClone({ businessName: ds.business.name, branding: ds.business.branding, campaign, program, state })
  }

  /**
   * Claiming a QR campaign: one claim per customer. Creates the stamp card (with starting stamps and
   * welcome gift) or the voucher, which adds the customer to the campaign's Linked customers.
   */
  async claimCampaign(token: string, input: JoinInput) {
    await this.delay()
    const db = await this.db()
    const found = this.findCampaign(db, token)
    if (!found || found.campaign.status === 'draft' || found.campaign.status === 'archived') throw new NotFoundError('This campaign is not available.')
    const { ds, campaign } = found
    if (campaign.status === 'ended') throw new ValidationError('This campaign has ended.')
    if (campaign.status === 'paused') throw new ValidationError('This campaign is paused. New claims are not possible right now.')
    if (!input.name.trim()) throw new ValidationError('Name is required.')
    const email = input.email.trim().toLowerCase()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError('Enter a valid email address.')
    if (!input.acceptTerms) throw new ValidationError('Please accept the rewards terms.')
    const now = this.now()
    const nowIso = now.toISOString()
    let customer = email ? ds.customers.find((x) => x.email.toLowerCase() === email) : undefined
    const program = campaign.kind === 'stamp_acquisition' ? ds.programs.find((p) => p.id === campaign.linkedProgramId) : undefined
    if (customer) {
      const claimed =
        campaign.kind === 'stamp_acquisition'
          ? ds.memberships.some((m) => m.customerId === customer!.id && m.viaCampaignId === campaign.id)
          : ds.rewards.some((r) => r.customerId === customer!.id && r.campaignId === campaign.id)
      if (claimed) throw new ValidationError('You have already claimed this campaign. A second scan gives nothing new.')
      if (program && ds.memberships.some((m) => m.customerId === customer!.id && m.programId === program.id)) throw new ValidationError('You already have this stamp card.')
    }
    if (campaign.kind === 'stamp_acquisition' && (!program || program.status !== 'active')) throw new ValidationError('This campaign is not available.')
    if (!customer) {
      assertWithinLimit(resolvePlanState(ds.subscription, this.opts.catalog, now), 'customers', ds.customers.length)
      const next = ds.customers.reduce((max, x) => Math.max(max, Number(x.customerNumber.replace(/\D/g, '')) || 0), 10000) + 1
      customer = { id: createId('cus'), businessId: ds.business.id, customerNumber: `C-${next}`, name: input.name.trim(), email, phone: '', birthday: input.birthday, notes: '', createdAt: nowIso }
      ds.customers.push(customer)
    }
    const passCode = () => `BNC-${createToken().slice(0, 8).toUpperCase()}`
    const base = { businessId: ds.business.id, customerId: customer.id, description: '', pointsRewardId: null, pointsCost: null, winbackStage: null, issuedAt: nowIso, redeemedAt: null, status: 'available' as const }
    let membership = null
    let reward = null
    if (campaign.kind === 'stamp_acquisition') {
      membership = { id: createId('mem'), customerId: customer.id, programId: program!.id, passCode: passCode(), joinedAt: nowIso, stamps: campaign.startingStamps, points: 0, visits: 0, totalSpend: 0, tierIndex: 0, lastActivityAt: null, viaCampaignId: campaign.id }
      ds.memberships.push(membership)
      if (campaign.welcomeGift.enabled) {
        reward = { ...base, id: createId('rwd'), programId: program!.id, campaignId: campaign.id, source: 'welcome_gift' as const, name: campaign.welcomeGift.rewardName, description: campaign.welcomeGift.description, passCode: null, availableFrom: null, expiresAt: campaign.welcomeGift.validityDays ? addDays(now, campaign.welcomeGift.validityDays).toISOString() : null }
        ds.rewards.push(reward)
      }
    } else {
      reward = { ...base, id: createId('rwd'), programId: null, campaignId: campaign.id, source: 'voucher' as const, name: campaign.voucherReward, passCode: passCode(), availableFrom: new Date(`${campaign.validFrom}T00:00:00`).toISOString(), expiresAt: new Date(`${campaign.validTo}T23:59:59`).toISOString() }
      ds.rewards.push(reward)
    }
    this.persist()
    return structuredClone({ customer, campaign, businessName: ds.business.name, program: program ?? null, membership, reward })
  }

  private findJoin(db: DevDb, token: string) {
    for (const ds of Object.values(db.datasets)) {
      const program = ds.programs.find((p) => p.joinQrToken === token)
      if (program) return { ds, program }
    }
    return null
  }

  async getJoinPage(token: string) {
    await this.delay()
    const found = this.findJoin(await this.db(), token)
    if (!found || found.program.status !== 'active') return null
    return structuredClone({ businessName: found.ds.business.name, branding: found.ds.business.branding, program: found.program })
  }

  async joinProgram(token: string, input: JoinInput) {
    await this.delay()
    const db = await this.db()
    const found = this.findJoin(db, token)
    if (!found || found.program.status !== 'active') throw new NotFoundError('This program is not accepting sign-ups.')
    const { ds, program } = found
    const fields = program.signupPage.fields
    if (!input.name.trim()) throw new ValidationError('Name is required.')
    if (fields.email === 'required' && !input.email.trim()) throw new ValidationError('Email is required.')
    if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) throw new ValidationError('Enter a valid email address.')
    if (fields.birthday === 'required' && !input.birthday) throw new ValidationError('Birthday is required.')
    if (!input.acceptTerms) throw new ValidationError('Please accept the rewards terms.')
    assertWithinLimit(resolvePlanState(ds.subscription, this.opts.catalog, this.now()), 'customers', ds.customers.length)
    const now = this.now().toISOString()
    const next = ds.customers.reduce((max, x) => Math.max(max, Number(x.customerNumber.replace(/\D/g, '')) || 0), 10000) + 1
    const customer: Customer = {
      id: createId('cus'),
      businessId: ds.business.id,
      customerNumber: `C-${next}`,
      name: input.name.trim(),
      email: fields.email === 'off' ? '' : input.email.trim(),
      phone: '',
      birthday: fields.birthday === 'off' ? '' : input.birthday,
      notes: '',
      createdAt: now,
    }
    const membership = {
      id: createId('mem'),
      customerId: customer.id,
      programId: program.id,
      passCode: `BNC-${createToken().slice(0, 8).toUpperCase()}`,
      joinedAt: now,
      stamps: 0,
      points: 0,
      visits: 0,
      totalSpend: 0,
      tierIndex: 0,
      lastActivityAt: null,
      viaCampaignId: null,
    }
    ds.customers.push(customer)
    ds.memberships.push(membership)
    this.persist()
    return structuredClone({ customer, membership, program, businessName: ds.business.name, branding: ds.business.branding })
  }

  async updateSignupFields(config: SignupFieldConfig): Promise<void> {
    await this.mutate((c) => {
      c.ds.business.signupFields = { ...config }
      this.audit(c, 'Customers', 'Edited sign-up fields', Object.entries(config).map(([k, v]) => `${k}: ${v}`).join(', '))
    }, 'customers.signupFields')
  }

  /* ------------------------------------------------------------------ employees */

  listEmployees() {
    // Invite tokens are credentials: only the Owner receives them (a Manager could otherwise accept a manager invite).
    return this.read('employees.view', (ds, c) => ({
      users: ds.users,
      invites: ds.invites.map((i) => (c.user.role === 'owner' ? i : { ...i, token: '' })),
    }))
  }

  async inviteEmployee(email: string, role: Invite['role'], permissions?: TeamPermission[]) {
    return this.mutate((c) => {
      if (role !== 'manager' && role !== 'employee' && role !== 'admin') throw new ValidationError('Invalid role.')
      authorize(c.access, role === 'employee' ? 'employees.invite' : 'employees.inviteManager')
      const normalized = email.trim().toLowerCase()
      if (c.ds.users.some((u) => u.email === normalized)) throw new ValidationError('This person is already on your team.')
      if (c.ds.invites.some((i) => i.email === normalized && !i.acceptedAt)) throw new ValidationError('An invitation is already pending for this email.')
      const staff = c.ds.users.filter((u) => u.role !== 'owner').length + c.ds.invites.filter((i) => !i.acceptedAt).length
      assertWithinLimit(c.plan, 'employees', staff)
      const invite: Invite = {
        token: createToken(),
        businessId: c.ds.business.id,
        email: normalized,
        role,
        invitedBy: c.user.id,
        createdAt: this.now().toISOString(),
        acceptedAt: null,
        // User Type preset, as adjusted by the inviter.
        permissions: (permissions ?? presetFor(role)).filter(isTeamPermission),
      }
      c.ds.invites.push(invite)
      this.audit(c, 'Employees', `Invited ${role}`, normalized)
      // Email delivery is not connected (OI-37): surface the link instead of claiming it was sent.
      const delivery: EmailDelivery = { delivered: false, devLink: `/accept-invite/${invite.token}` }
      return { invite, delivery }
    }, 'employees.invite')
  }

  async updateMemberAccess(userId: string, role: Invite['role'], permissions: TeamPermission[]): Promise<void> {
    await this.mutate((c) => {
      const member = c.ds.users.find((u) => u.id === userId)
      if (!member) throw new NotFoundError('Team member not found.')
      if (member.role === 'owner') throw new ValidationError('The owner always has full access.')
      if (role !== 'manager' && role !== 'employee' && role !== 'admin') throw new ValidationError('Invalid role.')
      member.role = role
      member.permissions = permissions.filter(isTeamPermission)
      this.audit(c, 'Employees', 'Changed access', `${member.fullName}: ${role}`)
    }, 'employees.permissions')
  }

  async updatePermissions(patch: Partial<Business['permissions']>): Promise<void> {
    await this.mutate((c) => {
      if (patch.managersCanManageEmployees !== undefined) authorize(c.access, 'employees.permissions')
      if (patch.showLeaderboardToEmployees !== undefined) authorize(c.access, 'leaderboard.visibility')
      Object.assign(c.ds.business.permissions, patch)
    })
  }

  getTeamActivity() {
    return this.read('leaderboard.view', (ds) => ({
      users: ds.users,
      programs: ds.programs,
      rows: ds.transactions.map((t) => ({ userId: t.employeeId, customerId: t.customerId, programId: t.programId, kind: t.kind, stampsAdded: t.stampsAdded, pointsAdded: t.pointsAdded, createdAt: t.createdAt })),
    }))
  }

  getLeaderboard() {
    return this.read('leaderboard.view', (ds) => buildLeaderboard(ds.users, ds.transactions, this.now()))
  }

  /* ------------------------------------------------------------------ notifications & rewards */

  listNotifications() {
    return this.read('notifications.view', (ds) => [...ds.notifications].reverse())
  }

  async saveNotification(id: string | null, draft: NotificationDraft) {
    return this.mutate((c) => {
      if (draft.origin !== 'manual') authorize(c.access, 'notifications.ai')
      const parsed = notificationSchema.safeParse(draft)
      if (!parsed.success) throw ValidationError.fromZod(parsed.error)
      const now = this.now().toISOString()
      if (id) {
        const existing = c.ds.notifications.find((n) => n.id === id)
        if (!existing) throw new NotFoundError('Campaign not found.')
        if (existing.status === 'sent') throw new ValidationError('Sent campaigns cannot be edited.')
        Object.assign(existing, structuredClone(draft), { updatedAt: now })
        this.audit(c, 'Notifications', 'Edited notification', existing.title)
        return existing
      }
      const created = { ...structuredClone(draft), id: createId('ntf'), businessId: c.ds.business.id, status: 'draft' as const, createdAt: now, updatedAt: now, sentAt: null }
      c.ds.notifications.push(created)
      this.audit(c, 'Notifications', 'Created notification', created.title)
      return created
    }, 'notifications.manage')
  }

  async sendNotification(id: string) {
    await this.delay()
    const c = await this.ctx()
    authorize(c.access, 'notifications.manage')
    const n = c.ds.notifications.find((x) => x.id === id)
    if (!n) throw new NotFoundError('Campaign not found.')
    if (n.status === 'sent') throw new ValidationError('This campaign has already been sent.')
    // Throws IntegrationNotConnectedError while no push service exists — the campaign stays a draft.
    const { deliveredAt } = await this.opts.integrations.notifications.send({ title: n.title, message: n.message, programIds: n.programIds })
    n.status = 'sent'
    n.sentAt = deliveredAt
    c.db.datasets[c.ds.business.id] = c.ds
    this.persist()
    return structuredClone(n)
  }

  getWinBack() {
    return this.read('notifications.view', (ds) => ({ config: ds.winback, events: ds.winbackEvents }))
  }

  async saveWinBack(config: WinBackConfig): Promise<void> {
    await this.mutate((c) => {
      const parsed = winBackSchema.safeParse(config)
      if (!parsed.success) throw ValidationError.fromZod(parsed.error)
      c.ds.winback = structuredClone(config)
      this.audit(c, 'Notifications', 'Edited win-back settings', config.enabled ? 'On' : 'Off')
      c.ds = evaluateWinBack(c.ds, this.now())
    }, 'notifications.manage')
  }

  listRewards() {
    return this.read('rewards.view', (ds) => ds.rewards)
  }

  /* ------------------------------------------------------------------ insights & settings */

  getDashboard(range?: DateRange) {
    return this.read('dashboard.view', (ds) => dashboardStats(ds, this.now(), range))
  }

  getAnalytics() {
    return this.read('analytics.view', (ds) => analyticsStats(ds, this.now()))
  }

  async updateBusiness(update: BusinessUpdate): Promise<void> {
    await this.mutate((c) => {
      const b = c.ds.business
      if (update.branding) {
        authorize(c.access, 'branding.manage')
        b.branding = { ...b.branding, ...update.branding }
      }
      const { branding: _branding, ...rest } = update
      if (Object.keys(rest).length) {
        authorize(c.access, 'settings.edit')
        if (rest.name !== undefined && !rest.name.trim()) throw new ValidationError('Business name is required.')
        Object.assign(b, rest)
      }
      this.audit(c, 'Settings', update.branding ? 'Edited branding' : 'Edited business settings', Object.keys(update).join(', '))
    })
  }
}

/** Fill fields added after data was first saved (gifts, audit, program sign-up page …). */
export function normalizeDataset(ds: BusinessDataset): BusinessDataset {
  ds.gifts ??= []
  ds.audit ??= []
  for (const p of ds.programs) {
    p.expiresOn ??= null
    p.location ??= null
    p.signupPage ??= defaultSignupPage(ds.business.branding)
  }
  return ds
}

function progressLine(program: Program, m: { stamps: number; points: number; visits: number; tierIndex: number; joinedAt: string }): string {
  switch (program.type) {
    case 'stamp':
      return `${m.stamps} / ${program.config.stampsRequired} stamps`
    case 'points':
      return `${m.points} pts (${currencyCode(program.config)})`
    case 'tier':
      return program.config.tiersEnabled ? `${program.config.tiers[m.tierIndex]?.name ?? '—'} · ${m.visits} visits` : `${m.visits} visits`
    case 'membership':
      return `Customer since ${formatDate(m.joinedAt)}`
  }
}
