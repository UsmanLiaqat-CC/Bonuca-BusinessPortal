import type { Campaign, Membership, Program, RewardInstance, StampIcon, VoucherCampaign } from '@/types/domain'
import { backgroundCss } from './color'
import { currencyCode, nextReward, sortedRewards } from './points'
import { nextTierProgress, tierMetric } from './tiers'
import { formatDate } from './dates'

/**
 * What a wallet pass shows (spec §4.3 master fields + per-type dynamic content).
 * Used by the live preview; the real pass is generated server-side (not connected).
 */
export interface PassField {
  label: string
  value: string
}

export interface PassContent {
  title: string
  logo: string | null
  heroImage: string | null
  background: string
  textColor: string
  /** Template structure present (false for Start-from-Scratch designs, §4.3 Option B). */
  structural: boolean
  primary: PassField | null
  secondary: PassField[]
  stampGrid: { total: number; filled: number; icon: StampIcon } | null
  progress: { value: number; max: number; label: string } | null
  tierBadge: string | null
  redeemed: boolean
  templateName: string
  /** Wallet card layout (client reference): brand line, card type, headline, reward block. */
  brand: string
  subtitle: string
  typeLabel: string
  headline: string
  accentColor: string
  /** Large figure for non-stamp cards (balance, tier). */
  big: string | null
  footer: { label: string; value: string; sub: string } | null
}

export const TEMPLATE_NAMES: Record<Program['type'], string> = {
  stamp: 'Digital Stamp Card',
  membership: 'Membership Card',
  tier: 'Tier Program Pass',
  // OI-30: no launch base template listed for Points programs.
  points: 'Generic layout (no launch template)',
}

const SAMPLE: Pick<Membership, 'stamps' | 'points' | 'visits' | 'totalSpend' | 'tierIndex' | 'joinedAt'> = {
  stamps: 3,
  points: 120,
  visits: 4,
  totalSpend: 42,
  tierIndex: 0,
  joinedAt: new Date('2026-01-15').toISOString(),
}

const TYPE_LABEL: Record<Program['type'], string> = {
  stamp: 'Digital stamp card',
  membership: 'Membership card',
  tier: 'Tier card',
  points: 'Points card',
}

export function buildPassContent(program: Program, membership?: Membership | null, businessName?: string): PassContent {
  const m = membership ?? SAMPLE
  const v = program.visuals
  const base: PassContent = {
    brand: businessName || program.name || 'Program name',
    subtitle: businessName ? program.name : '',
    typeLabel: TYPE_LABEL[program.type],
    headline: '',
    accentColor: v.accentColor ?? '#7FB77E',
    big: null,
    footer: null,
    title: program.name || 'Program name',
    logo: v.logo,
    heroImage: v.heroImage,
    background: backgroundCss(v.background),
    textColor: v.textColor,
    structural: program.designMode === 'template',
    primary: null,
    secondary: [],
    stampGrid: null,
    progress: null,
    tierBadge: null,
    redeemed: false,
    templateName: program.designMode === 'custom' ? 'Start from Scratch' : TEMPLATE_NAMES[program.type],
  }

  // Option B: clean identification-style pass, no structural elements (§4.3).
  if (program.designMode === 'custom') return base

  switch (program.type) {
    case 'stamp': {
      const c = program.config
      const filled = Math.min(m.stamps, c.stampsRequired)
      return {
        ...base,
        headline: c.rewardType === 'free_item' ? `Buy ${c.stampsRequired}, get 1 free` : `Collect ${c.stampsRequired} stamps`,
        stampGrid: { total: c.stampsRequired, filled, icon: c.stampIcon },
        primary: { label: 'Reward', value: c.rewardDescription || 'Reward description' },
        secondary: [{ label: 'Progress', value: `${Math.max(0, c.stampsRequired - filled)} stamps to go` }],
        footer: { label: 'Reward', value: c.rewardDescription || 'Reward description', sub: filled >= c.stampsRequired ? 'Ready to redeem' : 'On your next visit' },
      }
    }
    case 'membership': {
      const c = program.config
      return {
        ...base,
        headline: c.benefitDescription || 'Benefit description',
        big: formatDate(m.joinedAt),
        primary: { label: 'Benefit', value: c.benefitDescription || 'Benefit description' },
        secondary: [{ label: 'Customer since', value: formatDate(m.joinedAt) }],
        footer: { label: 'Benefit', value: c.benefitDescription || 'Benefit description', sub: 'Show at every visit' },
      }
    }
    case 'tier': {
      const c = program.config
      if (!c.tiersEnabled || c.tiers.length === 0) return base
      const tier = c.tiers[m.tierIndex] ?? c.tiers[0]!
      const value = tierMetric(m, c.upgradeBasis)
      const next = nextTierProgress(c, m.tierIndex, value)
      const unit = c.upgradeBasis === 'visits' ? 'visits' : c.upgradeBasis === 'points' ? 'points' : 'spend'
      return {
        ...base,
        headline: tier.name,
        big: tier.name,
        footer: { label: 'Tier benefits', value: tier.rewards || '—', sub: next ? `${next.remaining} ${unit} to ${next.next.name}` : 'Top tier reached' },
        // Pass background switches to the tier's wallet colour (§4.3).
        background: tier.walletColor,
        tierBadge: tier.badge,
        primary: { label: 'Current tier', value: tier.name },
        secondary: next ? [{ label: 'Next tier', value: `${next.remaining} ${unit} to ${next.next.name}` }] : [],
        progress: next ? { value, max: next.next.requiredValue, label: `${next.remaining} ${unit} to ${next.next.name}` } : null,
      }
    }
    case 'points': {
      const c = program.config
      const next = nextReward(c, m.points)
      const top = sortedRewards(c).at(-1)
      // OI-07 fallback layout: balance + next reward + points needed + QR.
      return {
        ...base,
        headline: `${c.ratio.points} pts per ${c.ratio.spend} ${currencyCode(c)}`,
        big: `${m.points} pts`,
        footer: next ? { label: 'Next reward', value: next.reward.name || 'Reward', sub: `${next.pointsNeeded} pts to go` } : { label: 'Rewards', value: top ? 'All rewards unlocked' : '—', sub: '' },
        primary: { label: 'Balance', value: `${m.points} pts` },
        secondary: next
          ? [
              { label: 'Next reward', value: next.reward.name },
              { label: 'Points needed', value: String(next.pointsNeeded) },
            ]
          : [{ label: 'Next reward', value: top ? 'All rewards unlocked' : '—' }],
        progress: next ? { value: m.points, max: next.reward.pointsRequired, label: `${next.pointsNeeded} pts to ${next.reward.name}` } : null,
      }
    }
  }
}

export function buildVoucherPassContent(campaign: VoucherCampaign, reward?: RewardInstance | null): PassContent {
  return {
    brand: campaign.name || 'Campaign name',
    subtitle: '',
    typeLabel: 'Voucher',
    headline: campaign.voucherReward || 'Voucher reward',
    accentColor: '#7FB77E',
    big: null,
    footer: { label: 'Voucher', value: campaign.voucherReward || 'Voucher reward', sub: `Valid to ${formatDate(campaign.validTo || null)}` },
    title: campaign.name || 'Campaign name',
    logo: campaign.visuals.logo,
    heroImage: null,
    background: backgroundCss(campaign.visuals.background),
    textColor: campaign.visuals.textColor,
    structural: true,
    primary: { label: 'Voucher', value: campaign.voucherReward || 'Voucher reward' },
    secondary: [
      { label: 'Valid from', value: formatDate(campaign.validFrom || null) },
      { label: 'Valid to', value: formatDate(campaign.validTo || null) },
    ],
    stampGrid: null,
    progress: null,
    tierBadge: null,
    redeemed: reward?.status === 'redeemed',
    templateName: 'Generic layout (no launch template)',
  }
}

export function pointsCurrencyLabel(program: Program): string | null {
  return program.type === 'points' ? currencyCode(program.config) : null
}

export function isVoucherCampaign(c: Campaign): c is VoucherCampaign {
  return c.kind === 'voucher'
}
