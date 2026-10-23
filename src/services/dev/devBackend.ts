import type {
  Business,
  BusinessDataset,
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
  NotificationDraft,
  ProgramDraft,
  RegisterInput,
  SessionInfo,
} from '../backend'
import type { Integrations } from '../integrations'
import { assertWithinLimit, authorize, type AccessContext, type Permission } from '@/lib/access'
import { resolvePlanState, type PlanState } from '@/lib/plan'
import { nextStatus, type LifecycleAction } from '@/lib/lifecycle'
import { applyScan, buildScanContext, evaluateWinBack } from '@/lib/scanEngine'
import { analyticsStats, dashboardStats, type DateRange } from '@/lib/metrics'
import { buildLeaderboard } from '@/lib/gamification'
import { AuthError, NotFoundError, ValidationError } from '@/lib/errors'
import { createId, createToken, createVerificationCode } from '@/lib/ids'
import { addDays } from '@/lib/dates'
import { DEFAULT_SIGNUP_FIELDS, defaultSubscription, defaultWinBack } from '@/lib/factories'
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
          this.dbCache = loaded
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
    const ds = buildSampleDataset({ businessId, businessName: 'Sample Business (development)', seed: 7, now: this.now(), staff })
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
    // Work on a copy: a failed mutation must not leave partial changes behind.
    const current = structuredClone(db.datasets[ds.business.id]!)
    const self = current.users.find((u) => u.id === user.id) ?? user
    const plan = resolvePlanState(current.subscription, this.opts.catalog, this.now())
    return { db, user: self, ds: current, plan, access: { role: self.role, plan, permissions: current.business.permissions } }
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
        assertWithinLimit(c.plan, 'programs', c.ds.programs.filter((p) => p.status === 'active' && p.id !== id).length)
      }
      program.status = next
      program.updatedAt = this.now().toISOString()
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

  listCampaigns() {
    return this.read('programs.view', (ds) => ds.campaigns)
  }

  async createCampaign(draft: CampaignDraft): Promise<Campaign> {
    return this.mutate((c) => {
      if (!draft.name.trim()) throw new ValidationError('Campaign name is required.')
      const now = this.now().toISOString()
      const campaign = { ...structuredClone(draft), id: createId('cmp'), businessId: c.ds.business.id, status: 'draft', qrToken: null, createdAt: now, publishedAt: null } as Campaign
      c.ds.campaigns.push(campaign)
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
      return campaign
    }, 'programs.manage')
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
      const { dataset, result } = applyScan(c.ds, { ...input, employeeId: c.user.id }, this.now())
      c.ds = dataset
      return result
    }, 'scanner.transact')
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
      return customer
    }, 'customers.add')
  }

  async updateCustomerNotes(id: string, notes: string): Promise<void> {
    await this.mutate((c) => {
      const customer = c.ds.customers.find((x) => x.id === id)
      if (!customer) throw new NotFoundError('Customer not found.')
      customer.notes = notes
    }, 'customers.notes')
  }

  async updateSignupFields(config: SignupFieldConfig): Promise<void> {
    await this.mutate((c) => {
      c.ds.business.signupFields = { ...config }
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

  async inviteEmployee(email: string, role: Invite['role']) {
    return this.mutate((c) => {
      if (role !== 'manager' && role !== 'employee') throw new ValidationError('Invalid role.')
      authorize(c.access, role === 'manager' ? 'employees.inviteManager' : 'employees.invite')
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
      }
      c.ds.invites.push(invite)
      // Email delivery is not connected (OI-37): surface the link instead of claiming it was sent.
      const delivery: EmailDelivery = { delivered: false, devLink: `/accept-invite/${invite.token}` }
      return { invite, delivery }
    }, 'employees.invite')
  }

  async updatePermissions(patch: Partial<Business['permissions']>): Promise<void> {
    await this.mutate((c) => {
      if (patch.managersCanManageEmployees !== undefined) authorize(c.access, 'employees.permissions')
      if (patch.showLeaderboardToEmployees !== undefined) authorize(c.access, 'leaderboard.visibility')
      Object.assign(c.ds.business.permissions, patch)
    })
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
        return existing
      }
      const created = { ...structuredClone(draft), id: createId('ntf'), businessId: c.ds.business.id, status: 'draft' as const, createdAt: now, updatedAt: now, sentAt: null }
      c.ds.notifications.push(created)
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
    })
  }
}
