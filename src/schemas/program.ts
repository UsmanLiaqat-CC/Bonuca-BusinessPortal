import { z } from 'zod'
import { CURRENCIES } from '@/types/domain'
import { backgroundSchema, hexColor, nullablePositive, optionalImage, positiveInt, requiredText } from './common'

/**
 * Program setup validation (spec §4.2). The full schema is enforced on Publish and when saving an
 * Active/Paused program. Drafts only need a name ("business is still filling in fields").
 */

const visualsSchema = z.object({
  logo: optionalImage,
  icon: optionalImage,
  background: backgroundSchema,
  heroImage: optionalImage,
  textColor: hexColor,
  accentColor: hexColor.optional(),
})

const signupPageSchema = z.object({
  backgroundColor: hexColor,
  fontColor: hexColor,
  heroImage: optionalImage,
  logo: optionalImage,
  fields: z.object({ email: z.enum(['required', 'optional', 'off']), birthday: z.enum(['required', 'optional', 'off']) }),
})

const locationSchema = z
  .object({
    address: requiredText('Enter the address of the location.'),
    radiusMeters: z.number({ error: 'Enter a radius.' }).int('Whole metres only.').min(50, 'Minimum 50 m.').max(5000, 'Maximum 5,000 m.'),
  })
  .nullable()

const surpriseSchema = z
  .object({
    enabled: z.boolean(),
    probabilityPercent: z.number({ error: 'Enter a probability.' }).min(0.1, 'Minimum 0.1 %.').max(100, 'Maximum 100 %.'),
    pool: z.array(z.string().trim().min(1, 'Reward name cannot be empty.')),
  })
  .refine((s) => !s.enabled || s.pool.length > 0, { message: 'Add at least one reward to the pool.', path: ['pool'] })

const common = {
  name: requiredText('Program name is required.'),
  visuals: visualsSchema,
  designMode: z.enum(['template', 'custom']),
  termsAndConditions: z.string(),
  surprise: surpriseSchema,
  expiresOn: z.string().nullable(),
  location: locationSchema,
  signupPage: signupPageSchema,
}

const toggleDays = (label: string) =>
  z
    .object({ enabled: z.boolean(), days: z.number().nullable() })
    .refine((e) => !e.enabled || (e.days !== null && Number.isInteger(e.days) && e.days >= 1), {
      message: `Enter the number of days for ${label}.`,
      path: ['days'],
    })

export const stampConfigSchema = z.object({
  stampsRequired: positiveInt('Enter how many stamps fill the card.').max(50, 'Maximum 50 stamps.'),
  stampIcon: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('preset'), preset: z.enum(['coffee', 'star', 'heart', 'scissors', 'croissant', 'check']) }),
    z.object({ kind: z.literal('custom'), image: z.string().min(1, 'Upload a stamp icon.') }),
  ]),
  rewardDescription: requiredText('Reward description is required.'),
  rewardType: z.enum(['free_item', 'percent_discount', 'fixed_discount', 'custom']),
  expiry: toggleDays('the expiry rule'),
  multipleStamps: z
    .object({ enabled: z.boolean(), max: z.number().int().min(2, 'At least 2.').nullable() })
    .optional(),
})

export const membershipConfigSchema = z
  .object({
    benefitDescription: requiredText('Benefit description is required.'),
    benefitType: z.enum(['percent_discount', 'fixed_discount', 'perk']),
    discountValue: z.number().nullable(),
    validity: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('permanent') }),
      z.object({ kind: z.literal('expires_on'), date: requiredText('Choose the expiry date.') }),
      z.object({ kind: z.literal('renews_annually') }),
    ]),
  })
  .superRefine((c, ctx) => {
    // Discount Value: only if Benefit Type is a discount.
    if (c.benefitType === 'perk') return
    if (c.discountValue === null || !(c.discountValue > 0)) {
      ctx.addIssue({ code: 'custom', message: 'Enter the discount value.', path: ['discountValue'] })
    } else if (c.benefitType === 'percent_discount' && c.discountValue > 100) {
      ctx.addIssue({ code: 'custom', message: 'A percentage cannot exceed 100.', path: ['discountValue'] })
    }
  })

const tierSchema = z.object({
  name: requiredText('Tier name is required.'),
  requiredValue: z.number({ error: 'Enter the required value.' }).min(0, 'Cannot be negative.'),
  walletColor: hexColor,
  badge: optionalImage,
  rewards: requiredText('Rewards & benefits are required.'),
})

export const tierConfigSchema = z
  .object({
    tiersEnabled: z.boolean(),
    upgradeBasis: z.enum(['visits', 'points', 'spend']),
    tiers: z.array(tierSchema),
    downgrade: z
      .object({ enabled: z.boolean(), inactivityDays: z.number().nullable() })
      .refine((d) => !d.enabled || (d.inactivityDays !== null && d.inactivityDays >= 1), {
        message: 'Enter the inactivity period in days.',
        path: ['inactivityDays'],
      }),
  })
  .superRefine((c, ctx) => {
    if (!c.tiersEnabled) return
    if (c.tiers.length < 2 || c.tiers.length > 5) {
      ctx.addIssue({ code: 'custom', message: 'Number of tiers must be between 2 and 5.', path: ['tiers'] })
    }
    c.tiers.forEach((t, i) => {
      const prev = c.tiers[i - 1]
      if (prev && t.requiredValue <= prev.requiredValue) {
        ctx.addIssue({ code: 'custom', message: 'Must be higher than the previous tier.', path: ['tiers', i, 'requiredValue'] })
      }
    })
  })

export const pointsConfigSchema = z
  .object({
    currency: z.enum(CURRENCIES),
    customCurrency: z.string(),
    ratio: z.object({
      spend: z.number({ error: 'Enter the spend amount.' }).positive('Must be greater than 0.'),
      points: z.number({ error: 'Enter the points.' }).positive('Must be greater than 0.'),
    }),
    awardingMethod: z.enum(['fixed', 'manual']),
    pointsPerScan: z.number().nullable(),
    rounding: z.enum(['up', 'down', 'nearest']),
    minimumPurchase: z.number().min(0, 'Cannot be negative.').nullable(),
    maxPointsPerTransaction: nullablePositive,
    rewards: z
      .array(
        z.object({
          id: z.string(),
          name: requiredText('Reward name is required.'),
          pointsRequired: positiveInt('Enter the points required.'),
          icon: optionalImage,
        }),
      )
      .min(1, 'Add at least one reward.'),
    pointExpiry: z
      .object({ enabled: z.boolean(), months: z.number().nullable() })
      .refine((e) => !e.enabled || (e.months !== null && e.months >= 1), { message: 'Enter the expiry period in months.', path: ['months'] }),
    rewardExpiry: toggleDays('reward expiry'),
  })
  .superRefine((c, ctx) => {
    if (c.currency === 'other' && !c.customCurrency.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Enter the currency code.', path: ['customCurrency'] })
    }
    if (c.awardingMethod === 'fixed' && !(c.pointsPerScan !== null && c.pointsPerScan >= 1)) {
      ctx.addIssue({ code: 'custom', message: 'Enter the points awarded per scan.', path: ['pointsPerScan'] })
    }
  })

export const programSchema = z
  .discriminatedUnion('type', [
    z.object({ ...common, type: z.literal('stamp'), config: stampConfigSchema }),
    z.object({ ...common, type: z.literal('membership'), config: membershipConfigSchema }),
    z.object({ ...common, type: z.literal('tier'), config: tierConfigSchema }),
    z.object({ ...common, type: z.literal('points'), config: pointsConfigSchema }),
  ])
  .superRefine((p, ctx) => {
    if (p.designMode === 'custom') {
      // §4.3 Option B minimum: Program Name, Background colour (RGB), Text colour (RGB); Logo optional.
      if (p.visuals.background.kind !== 'color') {
        ctx.addIssue({ code: 'custom', message: 'A custom design needs an RGB background colour.', path: ['visuals', 'background'] })
      }
      return
    }
    // Logo is required for every program type on the template path (§4.2).
    if (!p.visuals.logo) ctx.addIssue({ code: 'custom', message: 'Program logo is required.', path: ['visuals', 'logo'] })
  })

export type ProgramFormValues = z.infer<typeof programSchema>
