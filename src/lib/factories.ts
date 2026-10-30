import type {
  Business,
  BusinessBranding,
  SignupPageConfig,
  MembershipConfig,
  OpeningHours,
  PointsConfig,
  Program,
  ProgramType,
  ProgramVisuals,
  StampConfig,
  Subscription,
  SurpriseConfig,
  TierConfig,
  WinBackConfig,
} from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { DEFAULT_TIER_NAMES } from './tiers'
import { createId } from './ids'

/** Default brand colour applied when the business skips the picker (§1.4). Bonuca Blue. */
export const DEFAULT_BRAND_COLOR = '#1747F8'

export function defaultOpeningHours(): OpeningHours {
  const day = { closed: false, open: '09:00', close: '18:00' }
  return {
    mon: { ...day },
    tue: { ...day },
    wed: { ...day },
    thu: { ...day },
    fri: { ...day },
    sat: { ...day },
    sun: { closed: true, open: '09:00', close: '18:00' },
  }
}

export function defaultSubscription(): Subscription {
  return {
    selection: 'none',
    planId: null,
    trialEndsAt: null,
    source: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    override: null,
  }
}

/** §4.5 — Name required by default; Email, Phone Number, Birthday optional. */
export const DEFAULT_SIGNUP_FIELDS: Business['signupFields'] = {
  name: 'required',
  email: 'optional',
  phone: 'optional',
  birthday: 'optional',
}

/** §4.8 — Surprise Rewards default to off for every program. */
export function defaultSurprise(): SurpriseConfig {
  return { enabled: false, probabilityPercent: 5, pool: [] }
}

/** Win-back thresholds use the spec's example values; offers must be entered by the business. */
export function defaultWinBack(): WinBackConfig {
  return { enabled: false, stages: [14, 30, 40, 60].map((days) => ({ days, offer: '' })) }
}

export function defaultVisuals(): ProgramVisuals {
  return { logo: null, icon: null, background: { kind: 'default' }, heroImage: null, textColor: '#FFFFFF' }
}

export function defaultStampConfig(): StampConfig {
  return {
    stampsRequired: 10,
    stampIcon: { kind: 'preset', preset: 'coffee' },
    rewardDescription: '',
    rewardType: 'free_item',
    expiry: { enabled: false, days: null },
  }
}

export function defaultMembershipConfig(): MembershipConfig {
  return { benefitDescription: '', benefitType: 'percent_discount', discountValue: null, validity: { kind: 'permanent' } }
}

const TIER_COLORS = ['#3A3F55', '#8A8FA3', '#B8902E', '#5E6B7D', '#3D6FB6']

export function defaultTier(index: number) {
  return { name: DEFAULT_TIER_NAMES[index] ?? `Tier ${index + 1}`, requiredValue: index === 0 ? 0 : index * 10, walletColor: TIER_COLORS[index] ?? '#0A112F', badge: null, rewards: '' }
}

export function defaultTierConfig(): TierConfig {
  return {
    tiersEnabled: true,
    upgradeBasis: 'visits',
    tiers: [0, 1, 2].map(defaultTier),
    downgrade: { enabled: false, inactivityDays: null },
  }
}

export function defaultPointsConfig(currency: PointsConfig['currency'] = 'EUR'): PointsConfig {
  return {
    currency,
    customCurrency: '',
    ratio: { spend: 1, points: 10 },
    awardingMethod: 'manual',
    pointsPerScan: null,
    rounding: 'down',
    minimumPurchase: null,
    maxPointsPerTransaction: null,
    rewards: [{ id: createId('prw'), name: '', pointsRequired: 100, icon: null }],
    pointExpiry: { enabled: false, months: null },
    rewardExpiry: { enabled: false, days: null },
  }
}

/** Sign-up page defaults: cream page / dark text as in the client reference; logo from Branding. */
export function defaultSignupPage(branding?: Pick<BusinessBranding, 'logo'> | null): SignupPageConfig {
  return { backgroundColor: '#F6F1E9', fontColor: '#2B1A0E', heroImage: null, logo: branding?.logo ?? null, fields: { email: 'optional', birthday: 'optional' } }
}

/** Wallet design starts from the business Branding (logo + colours); each program can change it. */
export function visualsFromBranding(branding?: Pick<BusinessBranding, 'logo' | 'primaryColor' | 'secondaryColor'> | null): ProgramVisuals {
  if (!branding) return defaultVisuals()
  return { ...defaultVisuals(), logo: branding.logo, background: { kind: 'color', color: branding.secondaryColor }, accentColor: branding.primaryColor }
}

export function defaultProgramDraft(type: ProgramType, currency?: PointsConfig['currency'], branding?: BusinessBranding | null): ProgramDraft {
  const common = {
    name: '',
    visuals: visualsFromBranding(branding),
    designMode: 'template' as const,
    termsAndConditions: '',
    surprise: defaultSurprise(),
    expiresOn: null,
    location: null,
    signupPage: defaultSignupPage(branding),
  }
  switch (type) {
    case 'stamp':
      return { ...common, type, config: defaultStampConfig() }
    case 'membership':
      return { ...common, type, config: defaultMembershipConfig() }
    case 'tier':
      return { ...common, type, config: defaultTierConfig() }
    case 'points':
      return { ...common, type, config: defaultPointsConfig(currency) }
  }
}

export function toDraft(program: Program): ProgramDraft {
  const { id: _id, businessId: _b, status: _s, joinQrToken: _q, createdAt: _c, publishedAt: _p, updatedAt: _u, ...draft } = program
  return draft
}

/** Country → suggested currency for new Points programs (§1.2: a suggestion, not a global setting). */
const COUNTRY_CURRENCY: Record<string, PointsConfig['currency']> = {
  DE: 'EUR', AT: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR',
  US: 'USD', GB: 'GBP', CZ: 'CZK', TR: 'TRY', CH: 'CHF', PL: 'PLN',
}
export function suggestedCurrency(country: string): PointsConfig['currency'] {
  return COUNTRY_CURRENCY[country] ?? 'other'
}
