import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react'
import { useI18n } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'
import { DEV_CODE_KEY } from './VerifyEmailPage'
import { registerSchema, type RegisterValues, PASSWORD_RULE_MESSAGE } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'
import { COUNTRIES } from '@/mocks/countries'
import { Field, Input, Select, Checkbox } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '../components/AuthLayout'
import { IconInput } from '../components/IconInput'

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
      eyebrow={
        <>
          <Sparkles className="size-[13px]" aria-hidden /> {t('auth.register.eyebrow')}
        </>
      }
      footer={
        <>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="link underline-hl text-fg">
            {t('landing.login')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        <Field label={t('auth.fullName')} required error={e.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label={t('auth.email')} required error={e.email?.message}>
          {(p) => <IconInput {...p} icon={Mail} type="email" autoComplete="email" placeholder="you@business.com" {...register('email')} />}
        </Field>
        <Field label={t('auth.password')} required error={e.password?.message} hint={PASSWORD_RULE_MESSAGE}>
          {(p) => <IconInput {...p} icon={Lock} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        <div className="form-grid">
          <Field label={t('auth.country')} required error={e.country?.message} hint="Used to suggest your language and program currency later.">
            {(p) => (
              <Select {...p} {...register('country')}>
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
            {(p) => <Input {...p} type="tel" autoComplete="tel" placeholder="+49" {...register('phone')} />}
          </Field>
        </div>
        <div className={cn('field', e.acceptTerms && 'has-error')}>
          <Checkbox label={t('auth.acceptTerms')} {...register('acceptTerms')} aria-invalid={e.acceptTerms ? true : undefined} />
          {e.acceptTerms && (
            <p className="error-msg" role="alert">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {e.acceptTerms.message}
            </p>
          )}
        </div>
        {e.root && (
          <p className="callout border-transparent bg-danger-soft text-danger" role="alert">
            {e.root.message}
          </p>
        )}
        <Button type="submit" size="lg" loading={formState.isSubmitting} className="btn-block">
          {t('auth.createAccount')}
          <ArrowRight className="size-[15px]" aria-hidden />
        </Button>
      </form>
    </AuthLayout>
  )
}
