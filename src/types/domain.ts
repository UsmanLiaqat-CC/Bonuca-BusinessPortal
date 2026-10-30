/**
 * Domain model for the Bonuca business portal.
 * Every entity and field here maps to the specification (§ references inline).
 * Dates are ISO-8601 strings; colours are #RRGGBB hex; images are data URLs (dev) or URLs (API).
 */

export type ISODate = string
export type HexColor = string
export type ImageRef = string | null

/* ------------------------------------------------------------------ Accounts & roles (§2, §4.6) */

import type { TeamPermission } from '@/lib/teamPermissions'

/** 'employee' is shown as Staff; 'admin' gets every team permission by default. */
export type Role = 'owner' | 'admin' | 'manager' | 'employee'
export type LanguageCode = 'en' | 'de' | 'tr' | 'fr' | 'it' | 'ru' | 'kk'

export interface User {
  id: string
  businessId: string | null
  fullName: string
  email: string
  phone: string
  country: string
  role: Role
  emailVerified: boolean
  language: LanguageCode
  createdAt: ISODate
  /** Team permissions chosen by the owner (preset by User Type). null/absent = role defaults (older accounts). */
  permissions?: TeamPermission[] | null
}

export interface Invite {
  token: string
  businessId: string
  email: string
  role: Exclude<Role, 'owner'>
  invitedBy: string
  createdAt: ISODate
  acceptedAt: ISODate | null
  /** Permission checkboxes chosen when inviting; copied to the user on activation. */
  permissions?: TeamPermission[] | null
}

/* ------------------------------------------------------------------ Business (§1.4, §4.10, §4.12) */

export const BUSINESS_CATEGORIES = ['cafe', 'restaurant', 'barber_shop', 'beauty_salon', 'bakery', 'other'] as const
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export interface DayHours {
  closed: boolean
  open: string // "HH:MM"
  close: string // "HH:MM"
}
export type OpeningHours = Record<Weekday, DayHours>

export interface Address {
  street: string
  postalCode: string
  city: string
  country: string
}

/** Font options for business-branded surfaces — option list is provisional (OI-32). */
export type FontChoice = 'system' | 'serif' | 'rounded'

export interface BusinessBranding {
  logo: ImageRef
  primaryColor: HexColor
  secondaryColor: HexColor
  backgroundColor: HexColor
  font: FontChoice
}

export type SignupFieldKey = 'name' | 'email' | 'phone' | 'birthday'
export type SignupFieldRequirement = 'required' | 'optional'
export type SignupFieldConfig = Record<SignupFieldKey, SignupFieldRequirement>

export type OnboardingStep = 'plan' | 'first_program' | 'done'

export interface Business {
  id: string
  name: string
  category: BusinessCategory
  country: string
  address: Address
  /** null = not set yet (can be completed later in Settings, §1.4). */
  openingHours: OpeningHours | null
  branding: BusinessBranding
  /** §4.5 — Name required by default; Email/Phone/Birthday optional by default. */
  signupFields: SignupFieldConfig
  permissions: {
    /** §4.6 "employees if permitted" — Owner-controlled (OI-16). */
    managersCanManageEmployees: boolean
    /** §4.6 leaderboard optionally visible to employees. */
    showLeaderboardToEmployees: boolean
  }
  onboardingStep: OnboardingStep
  createdAt: ISODate
}

/* ------------------------------------------------------------------ Plans & subscription (§2, §4.11) */

export type PlanSelection = 'none' | 'free' | 'trial' | 'paid'
export type PurchaseSource = 'web_stripe' | 'app_store' | 'google_play'
export type OverrideKind = 'free_access' | 'billing_paused' | 'custom_duration' | 'unlimited'

export interface SuperAdminOverride {
  kind: OverrideKind
  /** Plan whose features the override grants. */
  planId: string
  endsAt: ISODate | null
}

export interface Subscription {
  selection: PlanSelection
  planId: string | null
  trialEndsAt: ISODate | null
  source: PurchaseSource | null
  currentPeriodEnd: ISODate | null
  cancelAtPeriodEnd: boolean
  /** Set by Bonuca Super Admin only. Read-only for the business (§2, §4.11). */
  override: SuperAdminOverride | null
}

export interface PlanLimits {
  /** null = unlimited */
  customers: number | null
  programs: number | null
  locations: number | null
  employees: number | null
}

export interface PlanDefinition {
  id: string
  name: string
  kind: 'free' | 'paid'
  /** Display price; null when not configured (OI-05). Never invented by the frontend. */
  priceLabel: string | null
  limits: PlanLimits
  features: {
    /** §4.9 — AI commentary is Pro-exclusive (gating to be confirmed, OI-08). */
    aiCommentary: boolean
  }
}

/** Mirrors configuration owned by the Bonuca Super Admin portal. */
export interface PlanCatalog {
  free: { enabled: boolean; plan: PlanDefinition }
  trial: { enabled: boolean; days: number; grantsPlanId: string }
  paid: PlanDefinition[]
}

export type AccessMode = 'preview' | 'free' | 'trial' | 'paid'

/* ------------------------------------------------------------------ Programs (§4.2) */

export type ProgramType = 'stamp' | 'membership' | 'tier' | 'points'
export const PROGRAM_TYPES: readonly ProgramType[] = ['stamp', 'membership', 'tier', 'points']

/** §4.2 lifecycle: Draft → Active (Publish) ⇄ Paused (Suspend), plus Archive. */
/** 'ended' is used by campaigns only (end date reached or ended manually). */
export type LifecycleStatus = 'draft' | 'active' | 'paused' | 'ended' | 'archived'

/** Background is a flat RGB colour OR an image, never both (§4.2). 'default' = Bonuca template gradient. */
export type Background =
  | { kind: 'default' }
  | { kind: 'color'; color: HexColor }
  | { kind: 'image'; image: string }

export interface ProgramVisuals {
  logo: ImageRef
  /** Defaults to the logo when empty (§4.2). */
  icon: ImageRef
  background: Background
  heroImage: ImageRef
  textColor: HexColor
  /** Highlight colour on the wallet card (labels, stamp rings). Defaults to the business brand colour. */
  accentColor?: HexColor
}

/** Who can be asked for which field on the customer sign-up page (Name is always required). */
export type SignupPageFieldMode = 'required' | 'optional' | 'off'

/** Customer sign-up page shown after the first scan of a program's join QR (BONUCA CHANGES doc). */
export interface SignupPageConfig {
  backgroundColor: HexColor
  fontColor: HexColor
  heroImage: ImageRef
  logo: ImageRef
  fields: { email: SignupPageFieldMode; birthday: SignupPageFieldMode }
  /** Big title on the page. Empty = the business name. */
  headline?: string
  /** Small line under the title. Empty = the program name. */
  tagline?: string
}

/** Optional valid location; used for nearby notifications once a push service is connected. */
export interface ProgramLocation {
  address: string
  radiusMeters: number
  /** Set when picked from the place search. */
  lat?: number
  lng?: number
}

/** §4.3 — Base template (default) or Start from Scratch (scope pending, OI-06). */
export type DesignMode = 'template' | 'custom'

export interface SurpriseConfig {
  /** §4.8 — off by default for every program. */
  enabled: boolean
  /** Chance (0–100 %) that a confirmed scan triggers a surprise reward. */
  probabilityPercent: number
  pool: string[]
}

export type StampIconPreset = 'coffee' | 'star' | 'heart' | 'scissors' | 'croissant' | 'check'
export type StampIcon = { kind: 'preset'; preset: StampIconPreset } | { kind: 'custom'; image: string }
export type StampRewardType = 'free_item' | 'percent_discount' | 'fixed_discount' | 'custom'

export interface StampConfig {
  stampsRequired: number
  stampIcon: StampIcon
  rewardDescription: string
  rewardType: StampRewardType
  expiry: { enabled: boolean; days: number | null }
  /** "Allow Multiple Stamps": off = one stamp per scan. max null = unlimited. Missing = off (older programs). */
  multipleStamps?: { enabled: boolean; max: number | null }
}

export type BenefitType = 'percent_discount' | 'fixed_discount' | 'perk'
export type MembershipValidity =
  | { kind: 'permanent' }
  | { kind: 'expires_on'; date: string }
  | { kind: 'renews_annually' }

export interface MembershipConfig {
  benefitDescription: string
  benefitType: BenefitType
  discountValue: number | null
  validity: MembershipValidity
}

export type UpgradeBasis = 'visits' | 'points' | 'spend'

export interface TierDefinition {
  name: string
  requiredValue: number
  walletColor: HexColor
  badge: ImageRef
  rewards: string
}

export interface TierConfig {
  tiersEnabled: boolean
  upgradeBasis: UpgradeBasis
  tiers: TierDefinition[]
  downgrade: { enabled: boolean; inactivityDays: number | null }
}

export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN', 'other'] as const
export type CurrencyOption = (typeof CURRENCIES)[number]
export type RoundingRule = 'up' | 'down' | 'nearest'

export interface PointsReward {
  id: string
  name: string
  pointsRequired: number
  icon: ImageRef
}

export interface PointsConfig {
  currency: CurrencyOption
  /** Free-text currency code when currency = 'other'. */
  customCurrency: string
  /** Calculation basis: `spend` units of currency = `points` points (e.g. 1 € = 10 pts). */
  ratio: { spend: number; points: number }
  awardingMethod: 'fixed' | 'manual'
  /** Only for awardingMethod = 'fixed' (OI-27). */
  pointsPerScan: number | null
  rounding: RoundingRule
  minimumPurchase: number | null
  maxPointsPerTransaction: number | null
  rewards: PointsReward[]
  pointExpiry: { enabled: boolean; months: number | null }
  rewardExpiry: { enabled: boolean; days: number | null }
}

interface ProgramBase {
  id: string
  businessId: string
  name: string
  status: LifecycleStatus
  visuals: ProgramVisuals
  designMode: DesignMode
  termsAndConditions: string
  surprise: SurpriseConfig
  /** Program end date ("Program Rules with expiry date"). null = no end date. */
  expiresOn: string | null
  location: ProgramLocation | null
  signupPage: SignupPageConfig
  /** Generated on first Publish (§4.2). */
  joinQrToken: string | null
  createdAt: ISODate
  publishedAt: ISODate | null
  updatedAt: ISODate
}

export interface StampProgram extends ProgramBase { type: 'stamp'; config: StampConfig }
export interface MembershipProgram extends ProgramBase { type: 'membership'; config: MembershipConfig }
export interface TierProgram extends ProgramBase { type: 'tier'; config: TierConfig }
export interface PointsProgram extends ProgramBase { type: 'points'; config: PointsConfig }
export type Program = StampProgram | MembershipProgram | TierProgram | PointsProgram

/* ------------------------------------------------------------------ Campaigns (§4.2) */

export interface WelcomeGift {
  enabled: boolean
  rewardName: string
  description: string
  validityDays: number | null
  redemptionConditions: string
}

interface CampaignBase {
  id: string
  businessId: string
  name: string
  status: LifecycleStatus
  qrToken: string | null
  createdAt: ISODate
  publishedAt: ISODate | null
}

export interface AcquisitionCampaign extends CampaignBase {
  kind: 'stamp_acquisition'
  linkedProgramId: string
  startingStamps: number
  welcomeGift: WelcomeGift
}

export interface VoucherCampaign extends CampaignBase {
  kind: 'voucher'
  voucherReward: string
  validFrom: string
  validTo: string
  visuals: { logo: ImageRef; background: Background; textColor: HexColor }
}

export type Campaign = AcquisitionCampaign | VoucherCampaign

/* ------------------------------------------------------------------ Customers (§4.5) */

export interface Customer {
  id: string
  businessId: string
  /** Human-facing customer ID used in search (§4.5). */
  customerNumber: string
  name: string
  email: string
  phone: string
  birthday: string
  notes: string
  createdAt: ISODate
}

/** A customer's wallet card for one program. */
export interface Membership {
  id: string
  customerId: string
  programId: string
  passCode: string
  joinedAt: ISODate
  stamps: number
  points: number
  visits: number
  totalSpend: number
  tierIndex: number
  lastActivityAt: ISODate | null
  viaCampaignId: string | null
}

/* ------------------------------------------------------------------ Transactions & rewards (§4.4, §4.8) */

export type TransactionKind =
  | 'stamp'
  | 'stamp_removed'
  | 'points'
  | 'visit'
  | 'gift_redeemed'
  | 'reward_redeemed'
  | 'voucher_redeemed'
  | 'winback_redeemed'

export interface Transaction {
  id: string
  businessId: string
  customerId: string
  programId: string | null
  campaignId: string | null
  employeeId: string
  kind: TransactionKind
  stampsAdded: number
  pointsAdded: number
  purchaseAmount: number | null
  rewardId: string | null
  createdAt: ISODate
  /** Scan-to-confirm duration (§4.4 target < 5 s); used by the leaderboard. */
  durationMs: number | null
  /** How the employee reached the customer on Award actions. null for older records. */
  entry?: 'scan' | 'search' | null
  /** Stamps / points / visits on the card after this action. null when not applicable. */
  balanceAfter?: number | null
  giftId?: string | null
}

export type RewardSource = 'stamp_card' | 'points' | 'winback' | 'surprise' | 'welcome_gift' | 'voucher'
export type StoredRewardStatus = 'available' | 'redeemed'
/** §4.8 states. Pending/Expired are derived from dates (OI-24). */
export type RewardStatus = 'available' | 'redeemed' | 'pending' | 'expired'

export interface RewardInstance {
  id: string
  businessId: string
  customerId: string
  programId: string | null
  campaignId: string | null
  source: RewardSource
  name: string
  description: string
  pointsRewardId: string | null
  pointsCost: number | null
  winbackStage: number | null
  /** Voucher claims carry their own pass code (one claim per customer, §4.2). */
  passCode: string | null
  issuedAt: ISODate
  availableFrom: ISODate | null
  expiresAt: ISODate | null
  redeemedAt: ISODate | null
  status: StoredRewardStatus
}

/* ------------------------------------------------------------------ Surprise gifts (customer profile) */

/** Stored state; Scheduled and Expired are derived from the dates. */
export type StoredGiftStatus = 'open' | 'redeemed' | 'cancelled'
export type GiftStatus = 'scheduled' | 'available' | 'redeemed' | 'expired' | 'cancelled'

/** A gift given to one customer. Never linked to a program; never changes stamps or points. */
export interface Gift {
  id: string
  businessId: string
  customerId: string
  name: string
  description: string
  terms: string
  /** null = available immediately. */
  availableFrom: ISODate | null
  expiresAt: ISODate
  status: StoredGiftStatus
  createdBy: string
  createdAt: ISODate
  redeemedAt: ISODate | null
  redeemedBy: string | null
  redeemedLocation: string | null
  cancelledAt: ISODate | null
  cancelledBy: string | null
}

/* ------------------------------------------------------------------ Audit (Settings → Audit) */

export type AuditModule = 'Programs' | 'Campaigns' | 'Award actions' | 'Customers' | 'Gifts' | 'Employees' | 'Notifications' | 'Settings'

export interface AuditEntry {
  id: string
  userId: string
  userName: string
  role: Exclude<Role, 'owner'>
  action: string
  module: AuditModule
  details: string
  createdAt: ISODate
}

/* ------------------------------------------------------------------ Notifications (§4.7) */

export const MANUAL_CAMPAIGN_TYPES = [
  'happy_hour',
  'new_item',
  'double_stamps',
  'birthday_reward',
  'holiday_campaign',
  'limited_offer',
  'other',
] as const
export type ManualCampaignType = (typeof MANUAL_CAMPAIGN_TYPES)[number]

export type NotificationOrigin = 'manual' | 'ai_campaign' | 'ai_bonus'

export interface NotificationCampaign {
  id: string
  businessId: string
  type: ManualCampaignType
  origin: NotificationOrigin
  title: string
  message: string
  /** Suggested offer / offer terms (AI Campaign, AI Bonus Generator). */
  offer: string
  /** Duration (AI Bonus Generator). */
  duration: string
  /** Empty = all active programs. */
  programIds: string[]
  /** Who receives it: everyone, customers of programs, customers inactive for N days, or chosen customers. */
  audience?: { kind: 'all' | 'programs' | 'inactive' | 'customers'; inactiveDays?: number; customerIds?: string[] }
  status: 'draft' | 'sent'
  createdAt: ISODate
  updatedAt: ISODate
  sentAt: ISODate | null
}

export interface WinBackStage {
  days: number
  offer: string
  /** Campaigns tab: each stage can be switched off. Missing = on (older data). */
  enabled?: boolean
  /** Push message text for this stage. */
  message?: string
}

export interface WinBackConfig {
  enabled: boolean
  stages: WinBackStage[]
  /** Set when the win-back campaign is ended from the Campaigns tab. */
  endedAt?: string | null
}

export interface WinBackEvent {
  id: string
  customerId: string
  stage: number
  rewardId: string
  createdAt: ISODate
  /** Push delivery result. Always false while no push service is connected (OI-22). */
  delivered: boolean
}

/* ------------------------------------------------------------------ Aggregate */

export interface BusinessDataset {
  business: Business
  subscription: Subscription
  users: User[]
  invites: Invite[]
  programs: Program[]
  campaigns: Campaign[]
  customers: Customer[]
  memberships: Membership[]
  transactions: Transaction[]
  rewards: RewardInstance[]
  notifications: NotificationCampaign[]
  winback: WinBackConfig
  winbackEvents: WinBackEvent[]
  gifts: Gift[]
  audit: AuditEntry[]
}
