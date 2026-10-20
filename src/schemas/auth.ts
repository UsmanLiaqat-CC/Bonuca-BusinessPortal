import { z } from 'zod'
import { BUSINESS_CATEGORIES } from '@/types/domain'
import { hexColor, requiredText } from './common'

export const LANGUAGE_CODES = ['en', 'de', 'tr', 'fr', 'it'] as const

/** OI-01: provisional minimum password rule — confirm with the client/dev team. */
export const PASSWORD_RULE_MESSAGE = 'Use at least 8 characters, including a letter and a number.'
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_RULE_MESSAGE)
  .regex(/[A-Za-z]/, PASSWORD_RULE_MESSAGE)
  .regex(/\d/, PASSWORD_RULE_MESSAGE)

/** §1.2 Registration form. */
export const registerSchema = z.object({
  fullName: requiredText('Full name is required.'),
  email: z.email('Enter a valid email address.'),
  password: passwordSchema,
  country: requiredText('Choose your country.'),
  phone: z.string().trim().refine((v) => v === '' || /^[+\d][\d\s()-]{5,}$/.test(v), 'Enter a valid phone number.'),
  acceptTerms: z.literal(true, { error: 'You must accept the Terms & Privacy Policy to continue.' }),
})
export type RegisterValues = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const verifyCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.') })

const dayHours = z
  .object({ closed: z.boolean(), open: z.string(), close: z.string() })
  .refine((d) => d.closed || (d.open !== '' && d.close !== '' && d.close > d.open), {
    message: 'Closing time must be after opening time.',
    path: ['close'],
  })

export const openingHoursSchema = z.object({
  mon: dayHours, tue: dayHours, wed: dayHours, thu: dayHours, fri: dayHours, sat: dayHours, sun: dayHours,
})

export const addressSchema = z.object({ street: z.string(), postalCode: z.string(), city: z.string(), country: z.string() })

/** §1.4 Business profile. No currency field (currency is per program). */
export const businessProfileSchema = z.object({
  name: requiredText('Business name is required.'),
  category: z.enum(BUSINESS_CATEGORIES, { error: 'Choose a business category.' }),
  logo: z.string().nullable(),
  address: addressSchema,
  openingHours: openingHoursSchema.nullable(),
  primaryColor: hexColor,
  language: z.enum(LANGUAGE_CODES),
})
export type BusinessProfileValues = z.infer<typeof businessProfileSchema>

export const acceptInviteSchema = z
  .object({ fullName: requiredText('Full name is required.'), password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: 'Passwords do not match.', path: ['confirm'] })

export const inviteSchema = z.object({
  email: z.email('Enter a valid email address.'),
  role: z.enum(['manager', 'employee']),
})
