import type {
  Business,
  BusinessBranding,
  BusinessCategory,
  Campaign,
  Customer,
  DesignMode,
  Invite,
  LanguageCode,
  Membership,
  NotificationCampaign,
  PlanCatalog,
  Program,
  RewardInstance,
  SignupFieldConfig,
  Subscription,
  SuperAdminOverride,
  SurpriseConfig,
  Transaction,
  User,
  WinBackConfig,
  WinBackEvent,
} from '@/types/domain'
import type { LifecycleAction } from '@/lib/lifecycle'
import type { ScanContext, ScanInput, ScanResult } from '@/lib/scanEngine'
import type { DashboardStats, AnalyticsStats, DateRange } from '@/lib/metrics'
import type { LeaderboardEntry } from '@/lib/gamification'

/**
 * The single business-account data contract used by every screen (spec §0: one account, one
 * dataset shared by web and mobile). Today only the in-browser development adapter implements it
 * (`services/dev`). A production adapter must implement the same interface against the real API;
 * the frontend does not assume any endpoint paths.
 */

export interface SessionInfo {
  user: User
  business: Business | null
  subscription: Subscription | null
  catalog: PlanCatalog
}

/** Email is never really sent in development — the code/link is surfaced instead (OI-37). */
export type EmailDelivery = { delivered: true } | { delivered: false; devCode?: string; devLink?: string }

export interface RegisterInput {
  fullName: string
  email: string
  password: string
  country: string
  phone: string
  acceptTerms: boolean
  language: LanguageCode
}

export interface BusinessProfileInput {
  name: string
  category: BusinessCategory
  logo: string | null
  address: Business['address']
  openingHours: Business['openingHours']
  primaryColor: string
  language: LanguageCode
}

/** Omit that preserves discriminated unions. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type ProgramDraft = DistributiveOmit<Program, 'id' | 'businessId' | 'status' | 'joinQrToken' | 'createdAt' | 'publishedAt' | 'updatedAt'>
export type CampaignDraft = DistributiveOmit<Campaign, 'id' | 'businessId' | 'status' | 'qrToken' | 'createdAt' | 'publishedAt'>

export interface CustomerInput {
  name: string
  email: string
  phone: string
  birthday: string
}

export interface CustomerDetail {
  customer: Customer
  memberships: { membership: Membership; program: Program }[]
  transactions: Transaction[]
  rewards: RewardInstance[]
  lastVisit: string | null
  scanCount: number
}

export interface EmployeesView {
  users: User[]
  invites: Invite[]
}

export type NotificationDraft = Omit<NotificationCampaign, 'id' | 'businessId' | 'status' | 'createdAt' | 'updatedAt' | 'sentAt'>

export interface BusinessUpdate {
  name?: string
  category?: BusinessCategory
  address?: Business['address']
  openingHours?: Business['openingHours']
  branding?: Partial<BusinessBranding>
}

export interface BusinessBackend {
  /** True for the in-browser development adapter (drives the "Development" banner). */
  readonly isDevelopment: boolean

  // Auth & account (§1.2, §1.3, §4.6)
  getSession(): Promise<SessionInfo | null>
  register(input: RegisterInput): Promise<EmailDelivery>
  verifyEmail(code: string): Promise<void>
  resendVerification(): Promise<EmailDelivery>
  login(email: string, password: string): Promise<SessionInfo>
  logout(): Promise<void>
  getInvite(token: string): Promise<{ invite: Invite; businessName: string } | null>
  acceptInvite(token: string, input: { fullName: string; password: string }): Promise<void>
  setLanguage(language: LanguageCode): Promise<void>

  // Onboarding (§1.4–§1.7)
  createBusiness(input: BusinessProfileInput): Promise<void>
  choosePlan(choice: 'free' | 'trial' | 'preview'): Promise<void>
  finishOnboarding(): Promise<void>

  // Programs & campaigns (§4.2, §4.3, §4.8)
  listPrograms(): Promise<Program[]>
  createProgram(draft: ProgramDraft): Promise<Program>
  updateProgram(id: string, draft: ProgramDraft): Promise<Program>
  programLifecycle(id: string, action: LifecycleAction): Promise<Program>
  setDesignMode(id: string, mode: DesignMode): Promise<Program>
  updateSurprise(id: string, surprise: SurpriseConfig): Promise<Program>
  listCampaigns(): Promise<Campaign[]>
  createCampaign(draft: CampaignDraft): Promise<Campaign>
  updateCampaign(id: string, draft: CampaignDraft): Promise<Campaign>
  campaignLifecycle(id: string, action: LifecycleAction): Promise<Campaign>

  // Scanner (§4.4)
  lookupPass(code: string): Promise<ScanContext | null>
  confirmScan(input: Omit<ScanInput, 'employeeId'>): Promise<ScanResult>
  listRecentScans(limit: number): Promise<{ transaction: Transaction; customerName: string; programName: string }[]>

  // Customers (§4.5)
  listCustomers(): Promise<Customer[]>
  getCustomer(id: string): Promise<CustomerDetail | null>
  addCustomer(input: CustomerInput): Promise<Customer>
  updateCustomerNotes(id: string, notes: string): Promise<void>
  updateSignupFields(config: SignupFieldConfig): Promise<void>

  // Employees (§4.6)
  listEmployees(): Promise<EmployeesView>
  inviteEmployee(email: string, role: Invite['role']): Promise<{ invite: Invite; delivery: EmailDelivery }>
  updatePermissions(patch: Partial<Business['permissions']>): Promise<void>
  getLeaderboard(): Promise<LeaderboardEntry[]>

  // Notifications & rewards (§4.7, §4.8)
  listNotifications(): Promise<NotificationCampaign[]>
  saveNotification(id: string | null, draft: NotificationDraft): Promise<NotificationCampaign>
  sendNotification(id: string): Promise<NotificationCampaign>
  getWinBack(): Promise<{ config: WinBackConfig; events: WinBackEvent[] }>
  saveWinBack(config: WinBackConfig): Promise<void>
  listRewards(): Promise<RewardInstance[]>

  // Insights (§4.1, §4.9)
  getDashboard(range?: DateRange): Promise<DashboardStats>
  getAnalytics(): Promise<AnalyticsStats>

  // Business settings & branding (§4.10, §4.12)
  updateBusiness(update: BusinessUpdate): Promise<void>

  // Development-only tooling (not product features). Simulates Super Admin actions locally.
  dev?: {
    setOverride(override: SuperAdminOverride | null): Promise<void>
    expireTrial(): Promise<void>
    resetAll(): Promise<void>
    seedAccounts: { email: string; password: string; role: string }[]
  }
}
