import { z } from 'zod'
import type { SignupFieldConfig } from '@/types/domain'

/** Customer fields follow the business's signup configuration (spec §4.5). */
export function customerSchema(fields: SignupFieldConfig) {
  const req = (key: keyof SignupFieldConfig) => fields[key] === 'required'
  return z.object({
    name: req('name') ? z.string().trim().min(1, 'Name is required.') : z.string().trim(),
    email: z
      .string()
      .trim()
      .refine((v) => (req('email') ? v.length > 0 : true), 'Email is required.')
      .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address.'),
    phone: z
      .string()
      .trim()
      .refine((v) => (req('phone') ? v.length > 0 : true), 'Phone number is required.')
      .refine((v) => v === '' || /^[+\d][\d\s()-]{5,}$/.test(v), 'Enter a valid phone number.'),
    birthday: z.string().refine((v) => (req('birthday') ? v.length > 0 : true), 'Birthday is required.'),
  })
}
export type CustomerValues = z.infer<ReturnType<typeof customerSchema>>
