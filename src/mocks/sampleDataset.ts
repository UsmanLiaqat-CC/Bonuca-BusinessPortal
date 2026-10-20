import type {
  BusinessDataset,
  Customer,
  Membership,
  PointsProgram,
  Program,
  RewardInstance,
  StampProgram,
  TierProgram,
  Transaction,
  User,
  VoucherCampaign,
} from '@/types/domain'
import {
  DEFAULT_SIGNUP_FIELDS,
  defaultOpeningHours,
  defaultSubscription,
  defaultSurprise,
  defaultVisuals,
} from '@/lib/factories'
import { addDays } from '@/lib/dates'
import { computeTierIndex } from '@/lib/tiers'
import { evaluateWinBack } from '@/lib/scanEngine'

/**
 * Deterministic SAMPLE data. Used for:
 *  - Preview Mode demo data (spec §2: "full read-only tour … using demo/sample data"), and
 *  - the local development seed business.
 * Never presented as real data: every screen shows a Demo/Development label.
 */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Placeholder sample logo (SVG data URL) so sample programs satisfy "Program Logo required". */
const SAMPLE_LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F4EDE4"/><path d="M18 26h24v10a12 12 0 0 1-24 0z" fill="#6B3F1F"/><path d="M42 29h4a5 5 0 0 1 0 10h-4" fill="none" stroke="#6B3F1F" stroke-width="3"/></svg>')

const FIRST = ['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Felix', 'Giulia', 'Hannah', 'Ivan', 'Julia', 'Kemal', 'Lena', 'Marco', 'Nina', 'Oscar', 'Paula', 'Quentin', 'Rosa', 'Sven', 'Tara', 'Umut', 'Vera', 'Wim', 'Yara', 'Zoe', 'Luca', 'Mia', 'Noah', 'Emma', 'Leon']
const LAST = ['Schmidt', 'Rossi', 'Yilmaz', 'Martin', 'Müller', 'Bianchi', 'Kaya', 'Dubois', 'Weber', 'Ricci', 'Demir', 'Laurent', 'Fischer', 'Conti', 'Öztürk', 'Bernard']

export interface SampleOptions {
  businessId: string
  businessName: string
  seed: number
  now: Date
  staff: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[]
}

/** Weekday/hour weighting so the heatmap shows a pattern (e.g. busy Friday evening). */
function pickTime(rng: () => number, day: Date): Date {
  const weekday = (day.getDay() + 6) % 7
  const evening = weekday >= 4 ? 0.55 : 0.3
  const r = rng()
  const hour = r < evening ? 17 + Math.floor(rng() * 4) : r < evening + 0.3 ? 11 + Math.floor(rng() * 3) : 8 + Math.floor(rng() * 9)
  const d = new Date(day)
  d.setHours(hour, Math.floor(rng() * 60), 0, 0)
  return d
}

export function buildSampleDataset(opts: SampleOptions): BusinessDataset {
  const rng = mulberry32(opts.seed)
  const { now, businessId } = opts
  const iso = (d: Date) => d.toISOString()
  const created = iso(addDays(now, -320))

  const users: User[] = opts.staff.map((s) => ({
    ...s,
    businessId,
    phone: '',
    country: 'DE',
    emailVerified: true,
    language: 'en',
    createdAt: created,
  }))

  const base = (id: string, name: string) => ({
    id,
    businessId,
    name,
    status: 'active' as const,
    visuals: { ...defaultVisuals(), logo: SAMPLE_LOGO },
    designMode: 'template' as const,
    termsAndConditions: 'Sample terms and conditions.',
    surprise: defaultSurprise(),
    joinQrToken: `join-${id}`,
    createdAt: created,
    publishedAt: created,
    updatedAt: created,
  })

  const stamp: StampProgram = {
    ...base('prg_coffee', 'Coffee Card'),
    type: 'stamp',
    config: { stampsRequired: 10, stampIcon: { kind: 'preset', preset: 'coffee' }, rewardDescription: '1 Free Coffee', rewardType: 'free_item', expiry: { enabled: false, days: null } },
  }
  const lunch: StampProgram = {
    ...base('prg_lunch', 'Lunch Card'),
    status: 'draft',
    joinQrToken: null,
    publishedAt: null,
    type: 'stamp',
    visuals: { ...defaultVisuals(), logo: SAMPLE_LOGO, background: { kind: 'color', color: '#7A2E1F' } },
    config: { stampsRequired: 8, stampIcon: { kind: 'preset', preset: 'star' }, rewardDescription: 'Free Lunch Menu', rewardType: 'free_item', expiry: { enabled: true, days: 90 } },
  }
  const membership: Program = {
    ...base('prg_vip', 'VIP Member'),
    type: 'membership',
    visuals: { ...defaultVisuals(), logo: SAMPLE_LOGO, background: { kind: 'color', color: '#1B1B1F' } },
    config: { benefitDescription: '10% off every visit', benefitType: 'percent_discount', discountValue: 10, validity: { kind: 'renews_annually' } },
  }
  const tier: TierProgram = {
    ...base('prg_club', 'Rewards Club'),
    type: 'tier',
    config: {
      tiersEnabled: true,
      upgradeBasis: 'visits',
      tiers: [
        { name: 'Member', requiredValue: 0, walletColor: '#3A3F55', badge: null, rewards: 'Welcome drink' },
        { name: 'Silver', requiredValue: 10, walletColor: '#8A8FA3', badge: null, rewards: 'Free birthday drink' },
        { name: 'Gold', requiredValue: 25, walletColor: '#B8902E', badge: null, rewards: 'Free birthday drink, priority seating' },
      ],
      downgrade: { enabled: false, inactivityDays: null },
    },
  }
  const points: PointsProgram = {
    ...base('prg_points', 'Coffee Rewards'),
    type: 'points',
    surprise: { enabled: true, probabilityPercent: 5, pool: ['Free cookie', 'Free espresso shot'] },
    config: {
      currency: 'EUR',
      customCurrency: '',
      ratio: { spend: 1, points: 10 },
      awardingMethod: 'manual',
      pointsPerScan: null,
      rounding: 'down',
      minimumPurchase: 2,
      maxPointsPerTransaction: 500,
      rewards: [
        { id: 'prw_coffee', name: 'Free Coffee', pointsRequired: 100, icon: null },
        { id: 'prw_dessert', name: 'Free Dessert', pointsRequired: 250, icon: null },
        { id: 'prw_burger', name: 'Free Burger', pointsRequired: 500, icon: null },
      ],
      pointExpiry: { enabled: true, months: 12 },
      rewardExpiry: { enabled: true, days: 30 },
    },
  }
  const programs: Program[] = [stamp, membership, tier, points, lunch]

  const voucher: VoucherCampaign = {
    id: 'cmp_freecoffee',
    businessId,
    kind: 'voucher',
    name: 'Free Coffee Campaign',
    status: 'active',
    qrToken: 'cmp-freecoffee',
    createdAt: iso(addDays(now, -40)),
    publishedAt: iso(addDays(now, -40)),
    voucherReward: '1 Free Coffee',
    validFrom: iso(addDays(now, -40)).slice(0, 10),
    validTo: iso(addDays(now, 50)).slice(0, 10),
    visuals: { logo: SAMPLE_LOGO, background: { kind: 'default' }, textColor: '#FFFFFF' },
  }
  const brunch: VoucherCampaign = {
    ...voucher,
    id: 'cmp_brunch',
    name: 'Weekend Brunch Voucher',
    qrToken: 'cmp-brunch',
    voucherReward: 'Free brunch drink',
    validFrom: iso(addDays(now, 5)).slice(0, 10),
    validTo: iso(addDays(now, 35)).slice(0, 10),
  }

  const customers: Customer[] = []
  const memberships: Membership[] = []
  const transactions: Transaction[] = []
  const rewards: RewardInstance[] = []
  const staffIds = users.map((u) => u.id)
  const activePrograms = [stamp, membership, tier, points]
  let pass = 1000

  const COUNT = 64
  for (let i = 0; i < COUNT; i++) {
    const first = FIRST[Math.floor(rng() * FIRST.length)]!
    const last = LAST[Math.floor(rng() * LAST.length)]!
    // Skew sign-ups toward recent months to show growth.
    const ageDays = Math.floor(Math.pow(rng(), 1.6) * 300)
    const createdAt = addDays(now, -ageDays)
    createdAt.setHours(9 + Math.floor(rng() * 10))
    const customer: Customer = {
      id: `cus_${i}`,
      businessId,
      customerNumber: `C-${String(10001 + i)}`,
      name: `${first} ${last}`,
      email: rng() > 0.3 ? `${first}.${last}${i}@example.com`.toLowerCase() : '',
      phone: rng() > 0.4 ? `+49 151 ${String(1000000 + Math.floor(rng() * 8999999))}` : '',
      birthday: rng() > 0.5 ? `19${70 + Math.floor(rng() * 30)}-0${1 + Math.floor(rng() * 9)}-1${Math.floor(rng() * 9)}` : '',
      notes: i % 9 === 0 ? 'Prefers oat milk.' : '',
      createdAt: iso(createdAt),
    }
    customers.push(customer)

    const joined = activePrograms.filter((_, idx) => idx === i % 4 || rng() > 0.75)
    // ~15% of customers go inactive (drives win-back demo).
    const inactive = rng() < 0.15
    const lastActiveAgo = inactive ? 20 + Math.floor(rng() * 50) : 0

    for (const program of joined) {
      const m: Membership = {
        id: `mem_${i}_${program.id}`,
        customerId: customer.id,
        programId: program.id,
        passCode: `BNC-DEMO${pass++}`,
        joinedAt: customer.createdAt,
        stamps: 0,
        points: 0,
        visits: 0,
        totalSpend: 0,
        tierIndex: 0,
        lastActivityAt: null,
        viaCampaignId: program.id === stamp.id && i % 5 === 0 ? 'cmp_cuplid' : null,
      }
      const visitCount = Math.floor(rng() * 14) + 1
      for (let v = 0; v < visitCount; v++) {
        const span = Math.max(1, Math.min(ageDays, 120) - lastActiveAgo)
        const day = addDays(now, -(lastActiveAgo + Math.floor(rng() * span)))
        const at = pickTime(rng, day)
        if (at > now) continue
        const amount = Math.round((3 + rng() * 25) * 100) / 100
        const kind = program.type === 'stamp' ? 'stamp' : program.type === 'points' ? 'points' : 'visit'
        const pts = program.type === 'points' ? Math.floor(amount * 10) : 0
        transactions.push({
          id: `txn_${transactions.length}`,
          businessId,
          customerId: customer.id,
          programId: program.id,
          campaignId: null,
          employeeId: staffIds[Math.floor(rng() * staffIds.length)]!,
          kind,
          stampsAdded: kind === 'stamp' ? 1 : 0,
          pointsAdded: pts,
          purchaseAmount: program.type === 'points' ? amount : null,
          rewardId: null,
          createdAt: iso(at),
          durationMs: 1500 + Math.floor(rng() * 4500),
        })
        m.visits++
        m.stamps++
        m.points += pts
        m.totalSpend += program.type === 'points' ? amount : 0
        if (!m.lastActivityAt || iso(at) > m.lastActivityAt) m.lastActivityAt = iso(at)
      }
      if (program.type === 'stamp') {
        const completed = Math.floor(m.stamps / program.config.stampsRequired)
        for (let r = 0; r < completed; r++) {
          const redeemed = r < completed - 1 || rng() > 0.5
          rewards.push(sampleReward(`rwd_s_${i}_${r}`, customer.id, program.id, 'stamp_card', program.config.rewardDescription, now, redeemed))
        }
        m.stamps = m.stamps % program.config.stampsRequired
      } else {
        m.stamps = 0
      }
      if (program.type === 'tier') m.tierIndex = computeTierIndex(program.config, m.visits)
      if (program.type === 'points' && m.points >= 100) {
        rewards.push(sampleReward(`rwd_p_${i}`, customer.id, program.id, 'points', 'Free Coffee', now, rng() > 0.4, { pointsRewardId: 'prw_coffee', pointsCost: 100 }))
        if (rewards.at(-1)!.status === 'redeemed') m.points -= 100
      }
      if (program.type !== 'points') m.points = program.type === 'tier' ? 0 : m.points
      memberships.push(m)
    }

    if (i % 6 === 0) {
      const claimRedeemed = rng() > 0.5
      rewards.push({
        ...sampleReward(`rwd_v_${i}`, customer.id, null, 'voucher', voucher.voucherReward, now, claimRedeemed),
        campaignId: voucher.id,
        passCode: `BNC-VOUCH${pass++}`,
        expiresAt: new Date(voucher.validTo + 'T23:59:59').toISOString(),
      })
    }
    if (i % 10 === 3) {
      rewards.push({
        ...sampleReward(`rwd_b_${i}`, customer.id, null, 'voucher', brunch.voucherReward, now, false),
        campaignId: brunch.id,
        passCode: `BNC-BRNCH${pass++}`,
        availableFrom: new Date(brunch.validFrom + 'T00:00:00').toISOString(),
        expiresAt: new Date(brunch.validTo + 'T23:59:59').toISOString(),
      })
    }
  }

  const dataset: BusinessDataset = {
    business: {
      id: businessId,
      name: opts.businessName,
      category: 'cafe',
      country: 'DE',
      address: { street: 'Sample Street 1', postalCode: '10115', city: 'Berlin', country: 'DE' },
      openingHours: defaultOpeningHours(),
      branding: { logo: null, primaryColor: '#1747F8', secondaryColor: '#0A112F', backgroundColor: '#FBFBFB', font: 'system' },
      signupFields: { ...DEFAULT_SIGNUP_FIELDS },
      permissions: { managersCanManageEmployees: false, showLeaderboardToEmployees: true },
      onboardingStep: 'done',
      createdAt: created,
    },
    subscription: { ...defaultSubscription(), selection: 'trial', planId: 'pro', trialEndsAt: iso(addDays(now, 10)) },
    users,
    invites: [],
    programs,
    campaigns: [
      {
        id: 'cmp_cuplid',
        businessId,
        kind: 'stamp_acquisition',
        name: 'Cup-lid Campaign',
        status: 'active',
        qrToken: 'cmp-cuplid',
        createdAt: iso(addDays(now, -60)),
        publishedAt: iso(addDays(now, -60)),
        linkedProgramId: stamp.id,
        startingStamps: 2,
        welcomeGift: { enabled: true, rewardName: 'Free cookie', description: 'Welcome gift with your first coffee', validityDays: 30, redemptionConditions: 'One per customer' },
      },
      voucher,
      brunch,
    ],
    customers,
    memberships,
    transactions: transactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    rewards: rewards.map((r) => ({ ...r, businessId })),
    notifications: [
      {
        id: 'ntf_happyhour',
        businessId,
        type: 'happy_hour',
        origin: 'manual',
        title: 'Happy Hour 3–5 PM',
        message: 'Double the treats this afternoon — show your card at the counter.',
        offer: '',
        duration: '',
        programIds: [],
        status: 'draft',
        createdAt: iso(addDays(now, -2)),
        updatedAt: iso(addDays(now, -2)),
        sentAt: null,
      },
    ],
    winback: {
      enabled: true,
      stages: [
        { days: 14, offer: 'Free espresso shot' },
        { days: 30, offer: '10% off your next visit' },
        { days: 40, offer: 'Free coffee' },
        { days: 60, offer: 'Free coffee and cake' },
      ],
    },
    winbackEvents: [],
  }
  return evaluateWinBack(dataset, now)
}

function sampleReward(
  id: string,
  customerId: string,
  programId: string | null,
  source: RewardInstance['source'],
  name: string,
  now: Date,
  redeemed: boolean,
  extra: Partial<RewardInstance> = {},
): RewardInstance {
  const issued = addDays(now, -Math.floor(Math.abs(Math.sin(id.length * 7.1)) * 25) - 3)
  return {
    id,
    businessId: '',
    customerId,
    programId,
    campaignId: null,
    source,
    name,
    description: '',
    pointsRewardId: null,
    pointsCost: null,
    winbackStage: null,
    passCode: null,
    issuedAt: issued.toISOString(),
    availableFrom: null,
    expiresAt: null,
    redeemedAt: redeemed ? addDays(issued, 2).toISOString() : null,
    status: redeemed ? 'redeemed' : 'available',
    ...extra,
  }
}

export const DEMO_BUSINESS_ID = 'biz_demo'

/** Preview Mode demo dataset — generated fresh relative to `now`, never persisted, never mutated. */
export function buildPreviewDataset(now: Date = new Date()): BusinessDataset {
  return buildSampleDataset({
    businessId: DEMO_BUSINESS_ID,
    businessName: 'Demo Café',
    seed: 42,
    now,
    staff: [
      { id: 'usr_demo_owner', fullName: 'Demo Owner', email: 'owner@demo.invalid', role: 'owner' },
      { id: 'usr_demo_mgr', fullName: 'Demo Manager', email: 'manager@demo.invalid', role: 'manager' },
      { id: 'usr_demo_emp1', fullName: 'Demo Barista A', email: 'a@demo.invalid', role: 'employee' },
      { id: 'usr_demo_emp2', fullName: 'Demo Barista B', email: 'b@demo.invalid', role: 'employee' },
    ],
  })
}
