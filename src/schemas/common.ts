import { z } from 'zod'
import { HEX_RE } from '@/lib/color'

export const hexColor = z.string().regex(HEX_RE, 'Enter a colour as #RRGGBB.')
export const requiredText = (message: string) => z.string().trim().min(1, message)
export const optionalImage = z.string().nullable()
export const positiveInt = (message: string) =>
  z.number({ error: message }).int(message).min(1, message)
export const nullablePositive = z.number().positive('Must be greater than 0.').nullable()

export const backgroundSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('default') }),
  z.object({ kind: z.literal('color'), color: hexColor }),
  z.object({ kind: z.literal('image'), image: z.string().min(1, 'Upload a background image.') }),
])
