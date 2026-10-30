import { z } from 'zod'
import { MANUAL_CAMPAIGN_TYPES } from '@/types/domain'
import { requiredText } from './common'

export const notificationSchema = z.object({
  type: z.enum(MANUAL_CAMPAIGN_TYPES),
  origin: z.enum(['manual', 'ai_campaign', 'ai_bonus']),
  title: requiredText('Title is required.'),
  message: requiredText('Message is required.'),
  offer: z.string(),
  duration: z.string(),
  programIds: z.array(z.string()),
  audience: z.object({ kind: z.enum(['all', 'programs', 'inactive', 'customers']), inactiveDays: z.number().int().min(1).optional(), customerIds: z.array(z.string()).optional() }).optional(),
})
export type NotificationValues = z.infer<typeof notificationSchema>

/** §4.7 win-back: configurable thresholds with escalating offers. */
export const winBackSchema = z
  .object({
    enabled: z.boolean(),
    stages: z
      .array(
        z.object({
          days: z.number({ error: 'Enter the days.' }).int().min(1, 'At least 1 day.'),
          offer: z.string(),
          enabled: z.boolean().optional(),
          message: z.string().optional(),
        }),
      )
      .min(1, 'Add at least one stage.'),
  })
  .superRefine((c, ctx) => {
    c.stages.forEach((s, i) => {
      if (c.enabled && s.enabled !== false && !s.offer.trim()) ctx.addIssue({ code: 'custom', message: 'Enter the offer for this stage.', path: ['stages', i, 'offer'] })
      const prev = c.stages[i - 1]
      if (prev && s.days <= prev.days) ctx.addIssue({ code: 'custom', message: 'Each stage must be later than the previous one.', path: ['stages', i, 'days'] })
    })
  })
export type WinBackValues = z.infer<typeof winBackSchema>
