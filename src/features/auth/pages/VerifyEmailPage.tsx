import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useT } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY, useSessionQuery } from '@/state/session'
import { verifyCodeSchema } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { Field, Input } from '@/components/ui/Field'
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
  const { register, handleSubmit, formState, setError } = useForm<Values>({ resolver: zodResolver(verifyCodeSchema), defaultValues: { code: '' } })

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await backend.verifyEmail(code)
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
    <AuthLayout title={t('auth.verify.title')} subtitle={t('auth.verify.body', { email: session.data?.user.email ?? '' })}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {devCode && (
          <DevCallout title="Development — email not sent">
            No email service is connected, so no message was delivered. Your verification code is{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono font-semibold" data-testid="dev-code">
              {devCode}
            </code>
            .
          </DevCallout>
        )}
        <Field label={t('auth.verify.code')} required error={formState.errors.code?.message}>
          {(p) => <Input {...p} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="font-mono tracking-[0.4em]" {...register('code')} />}
        </Field>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          {t('auth.verify.submit')}
        </Button>
        <Button variant="ghost" onClick={resend} loading={resending}>
          {t('auth.verify.resend')}
        </Button>
      </form>
    </AuthLayout>
  )
}
