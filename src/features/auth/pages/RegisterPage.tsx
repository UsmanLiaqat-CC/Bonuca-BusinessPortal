import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'
import { DEV_CODE_KEY } from './VerifyEmailPage'
import { registerSchema, type RegisterValues, PASSWORD_RULE_MESSAGE } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { COUNTRIES } from '@/mocks/countries'
import { Field, Input, Select, Checkbox } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '../components/AuthLayout'

/** Spec §1.2 registration form. "Create Account" → verification email (§1.3). */
export default function RegisterPage() {
  const { t, language } = useI18n()
  const backend = useBackend()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', country: '', phone: '', acceptTerms: false as unknown as true },
  })
  const { register, handleSubmit, formState, setError } = form
  const e = formState.errors

  const onSubmit = handleSubmit(async (values) => {
    try {
      const delivery = await backend.register({ ...values, language })
      // Development only: hand the undelivered code to the verify screen (email is not connected).
      qc.setQueryData(DEV_CODE_KEY, delivery.delivered ? null : (delivery.devCode ?? null))
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
      navigate('/verify-email', { replace: true })
    } catch (err) {
      setError('root', { message: errorMessage(err) })
    }
  })

  return (
    <AuthLayout
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            {t('landing.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label={t('auth.fullName')} required error={e.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label={t('auth.email')} required error={e.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label={t('auth.password')} required error={e.password?.message} hint={PASSWORD_RULE_MESSAGE}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        <Field label={t('auth.country')} required error={e.country?.message} hint="Used to suggest your language and program currency later.">
          {(p) => (
            <Select
              {...p}
              {...register('country')}
            >
              <option value="">Select…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t('auth.phone')} optional error={e.phone?.message}>
          {(p) => <Input {...p} type="tel" autoComplete="tel" {...register('phone')} />}
        </Field>
        <div>
          <Checkbox label={t('auth.acceptTerms')} {...register('acceptTerms')} aria-invalid={e.acceptTerms ? true : undefined} />
          {e.acceptTerms && <p className="mt-1 text-xs text-danger" role="alert">{e.acceptTerms.message}</p>}
        </div>
        {e.root && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{e.root.message}</p>}
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          {t('auth.createAccount')}
        </Button>
      </form>
    </AuthLayout>
  )
}
