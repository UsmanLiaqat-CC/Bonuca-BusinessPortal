import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ArrowRight, Mail, RotateCcw } from 'lucide-react'
import { useT } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY, useSessionQuery } from '@/state/session'
import { verifyCodeSchema } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/state/toast'
import { AuthLayout, DevCallout } from '../components/AuthLayout'

type Values = z.infer<typeof verifyCodeSchema>

export const DEV_CODE_KEY = ['dev-verification-code'] as const

/** Spec §1.3 — the account cannot proceed until the email is verified. */
export default function VerifyEmailPage() {
  const t = useT()
  const backend = useBackend()
  const qc = useQueryClient()
  const toast = useToast()
  const session = useSessionQuery()
  const [devCode, setDevCode] = useState<string | undefined>(() => qc.getQueryData<string | null>(DEV_CODE_KEY) ?? undefined)
  const [resending, setResending] = useState(false)
  const [focused, setFocused] = useState(false)
  const { register, handleSubmit, formState, setError, control } = useForm<Values>({ resolver: zodResolver(verifyCodeSchema), defaultValues: { code: '' } })
  const code = useWatch({ control, name: 'code' }) ?? ''
  const field = register('code')

  const onSubmit = handleSubmit(async (values) => {
    try {
      await backend.verifyEmail(values.code)
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
    } catch (err) {
      setError('code', { message: errorMessage(err) })
    }
  })

  const resend = async () => {
    setResending(true)
    try {
      const d = await backend.resendVerification()
      if (!d.delivered) setDevCode(d.devCode)
      toast.info(d.delivered ? 'A new code was sent.' : 'Email delivery is not connected — the new development code is shown below.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.verify.title')}
      subtitle={t('auth.verify.body', { email: session.data?.user.email ?? '' })}
      eyebrow={
        <>
          <Mail className="size-[13px]" aria-hidden /> {t('auth.verify.eyebrow')}
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        {devCode && (
          <DevCallout title="Development — email not sent">
            No email service is connected, so no message was delivered. Your verification code is{' '}
            <code className="code-pill" data-testid="dev-code">
              {devCode}
            </code>
            .
          </DevCallout>
        )}
        <Field label={t('auth.verify.code')} required error={formState.errors.code?.message}>
          {(p) => (
            /* One real input (paste, autofill, screen readers) drawn as the redesign's six OTP boxes. */
            <div className="relative">
              <div className="otp" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => {
                  const digit = code[i] ?? ''
                  const current = focused && i === Math.min(code.length, 5)
                  return (
                    <span
                      key={i}
                      className={cn(
                        'grid h-[48px] place-items-center rounded-[15px] border-[1.5px] font-display text-xl font-bold transition-all duration-150 sm:h-[58px] sm:text-2xl',
                        digit ? 'bg-surface-muted' : 'bg-surface',
                        formState.errors.code ? 'border-danger' : current ? 'border-accent' : digit ? 'border-ink' : 'border-line-strong',
                        current && '-translate-y-0.5 shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_16%,transparent)]',
                      )}
                    >
                      {digit}
                    </span>
                  )
                })}
              </div>
              <input
                {...p}
                {...field}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                onFocus={() => setFocused(true)}
                onBlur={(ev) => {
                  setFocused(false)
                  void field.onBlur(ev)
                }}
                className="absolute inset-0 size-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
              />
            </div>
          )}
        </Field>
        <Button type="submit" size="lg" loading={formState.isSubmitting} className="btn-block">
          {t('auth.verify.submit')}
          <ArrowRight className="size-[15px]" aria-hidden />
        </Button>
        <Button variant="ghost" onClick={resend} loading={resending} className="btn-block">
          {!resending && <RotateCcw className="size-[15px]" aria-hidden />}
          {t('auth.verify.resend')}
        </Button>
      </form>
    </AuthLayout>
  )
}
