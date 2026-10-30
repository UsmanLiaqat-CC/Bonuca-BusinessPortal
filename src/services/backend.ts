import type {
  AuditEntry,
  Business,
  BusinessBranding,
  BusinessCategory,
  Campaign,
  Customer,
  DesignMode,
  Gift,
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
import type { HistoryRow } from '@/lib/history'
import type { TeamPermission } from '@/lib/teamPermissions'
import type { CampaignKind, CampaignLinkedRow, CampaignRow } from '@/lib/campaigns'

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
  gifts: Gift[]
  /** All activity across programs (stamps, points, redemptions, gifts). */
  history: HistoryRow[]
  /** Campaigns this customer is linked to (claimed or triggered). */
  campaigns: { id: string; kind: CampaignKind; name: string; status: Campaign['status']; date: string }[]
  lastVisit: string | null
  scanCount: number
}

/** Award actions: one customer found by scan or search, with every program card they hold. */
export interface AwardCustomer {
  customer: Customer
  cards: { membership: Membership; program: Program; unavailableReason: string | null }[]
  gifts: Gift[]
  history: HistoryRow[]
}

export interface GiftInput {
  name: string
  description: string
  terms: string
  /** YYYY-MM-DD; empty = available now. */
  availableFrom: string
  /** YYYY-MM-DD (required). */
  expiresOn: string
}

export interface ProgramCustomerRow {
  customer: Customer
  membership: Membership
  progress: string
  lastVisit: string | null
  /** Active = activity in the last 60 days (provisional, OI-46). */
  status: 'active' | 'inactive'
}

/** Public customer sign-up page reached by scanning a program's join QR. */
export interface JoinPage {
  businessName: string
  branding: BusinessBranding
  program: Program
}

/** Public page reached by scanning a campaign QR. */
export interface CampaignJoinPage {
  businessName: string
  branding: BusinessBranding
  campaign: Campaign
  /** Linked stamp card (acquisition campaigns). */
  program: Program | null
  /** 'ended' → "This campaign has ended."; 'paused' → no new claims. */
  state: 'open' | 'paused' | 'ended'
}

export interface CampaignClaimResult {
  customer: Customer
  campaign: Campaign
  businessName: string
  program: Program | null
  membership: Membership | null
  reward: RewardInstance | null
}

export interface JoinInput {
  name: string
  email: string
  birthday: string
  acceptTerms: boolean
}

export interface JoinResult {
  customer: Customer
  membership: Membership
  program: Program
  businessName: string
  branding: BusinessBranding
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
  /** Wallet cards (memberships) issued per program id. */
  programCardCounts(): Promise<Record<string, number>>
  getProgramCustomers(programId: string): Promise<ProgramCustomerRow[]>
  listCampaigns(): Promise<Campaign[]>
  createCampaign(draft: CampaignDraft): Promise<Campaign>
  updateCampaign(id: string, draft: CampaignDraft): Promise<Campaign>
  campaignLifecycle(id: string, action: LifecycleAction): Promise<Campaign>
  /** Campaigns tab: every campaign plus the win-back campaign, with offer, period and counts. */
  listCampaignRows(): Promise<CampaignRow[]>
  getCampaignLinked(id: string): Promise<CampaignLinkedRow[]>
  /** Win-back campaign Pause / Resume / End. */
  winbackLifecycle(action: 'enable' | 'disable' | 'end'): Promise<void>

  // Scanner (§4.4)
  lookupPass(code: string): Promise<ScanContext | null>
  confirmScan(input: Omit<ScanInput, 'employeeId'>): Promise<ScanResult>
  listRecentScans(limit: number): Promise<{ transaction: Transaction; customerName: string; programName: string }[]>
  getAwardCustomer(customerId: string): Promise<AwardCustomer | null>

  // Customers (§4.5)
  listCustomers(): Promise<Customer[]>
  getCustomer(id: string): Promise<CustomerDetail | null>
  addCustomer(input: CustomerInput): Promise<Customer>
  updateCustomerNotes(id: string, notes: string): Promise<void>
  updateSignupFields(config: SignupFieldConfig): Promise<void>
  giveGift(customerId: string, input: GiftInput): Promise<Gift>
  cancelGift(giftId: string): Promise<Gift>

  // Settings → Audit
  listAudit(): Promise<AuditEntry[]>

  // Public customer sign-up (no login): first scan of a program's join QR
  getJoinPage(token: string): Promise<JoinPage | null>
  joinProgram(token: string, input: JoinInput): Promise<JoinResult>
  getCampaignJoin(token: string): Promise<CampaignJoinPage | null>
  claimCampaign(token: string, input: JoinInput): Promise<CampaignClaimResult>

  // Employees (§4.6)
  listEmployees(): Promise<EmployeesView>
  /** Invite by email with a User Type (Staff/Manager/Admin) and its permission checkboxes. */
  inviteEmployee(email: string, role: Invite['role'], permissions?: TeamPermission[]): Promise<{ invite: Invite; delivery: EmailDelivery }>
  /** Owner changes a team member's User Type and permission checkboxes. */
  updateMemberAccess(userId: string, role: Invite['role'], permissions: TeamPermission[]): Promise<void>
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
