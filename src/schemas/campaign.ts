import { z } from 'zod'
import { backgroundSchema, hexColor, optionalImage, requiredText } from './common'

/** Program campaigns (spec §4.2). */
export const acquisitionCampaignSchema = z.object({
  kind: z.literal('stamp_acquisition'),
  linkedProgramId: requiredText('Choose the stamp card this campaign issues.'),
  name: requiredText('Campaign name is required.'),
  startingStamps: z.number({ error: 'Enter the starting stamps.' }).int().min(0, 'Cannot be negative.'),
  welcomeGift: z
    .object({
      enabled: z.boolean(),
      rewardName: z.string(),
      description: z.string(),
      validityDays: z.number().nullable(),
      redemptionConditions: z.string(),
    })
    .superRefine((g, ctx) => {
      if (!g.enabled) return
      if (!g.rewardName.trim()) ctx.addIssue({ code: 'custom', message: 'Reward name is required.', path: ['rewardName'] })
      if (g.validityDays !== null && g.validityDays < 1) {
        ctx.addIssue({ code: 'custom', message: 'Validity must be at least 1 day.', path: ['validityDays'] })
      }
    }),
})

export const voucherCampaignSchema = z
  .object({
    kind: z.literal('voucher'),
    name: requiredText('Campaign name is required.'),
    voucherReward: requiredText('Voucher reward is required.'),
    validFrom: requiredText('Choose the start date.'),
    validTo: requiredText('Choose the end date.'),
    visuals: z.object({ logo: optionalImage, background: backgroundSchema, textColor: hexColor }),
  })
  .superRefine((v, ctx) => {
    if (v.validFrom && v.validTo && v.validTo < v.validFrom) {
      ctx.addIssue({ code: 'custom', message: 'Valid To must be on or after Valid From.', path: ['validTo'] })
    }
    if (!v.visuals.logo) ctx.addIssue({ code: 'custom', message: 'Logo is required.', path: ['visuals', 'logo'] })
  })

export const campaignSchema = z.discriminatedUnion('kind', [acquisitionCampaignSchema, voucherCampaignSchema])
export type CampaignFormValues = z.infer<typeof campaignSchema>
