import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useI18n } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'
import { loginSchema, type LoginValues } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { env } from '@/lib/env'
import { Field } from '@/components/ui/Field'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DevCallout } from '../components/AuthLayout'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { IconInput } from '../components/IconInput'

export default function LoginPage() {
  const { t, setLanguage } = useI18n()
  const backend = useBackend()
  const qc = useQueryClient()
  const { register, handleSubmit, formState, setError, setValue } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      const session = await backend.login(email, password)
      setLanguage(session.user.language)
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
    } catch (err) {
      setError('root', { message: errorMessage(err) })
    }
  })

  return (
    <AuthSplitLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            {t('landing.startFree')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field label={t('auth.email')} required error={formState.errors.email?.message}>
          {(p) => <IconInput {...p} icon={Mail} type="email" autoComplete="email" placeholder="you@business.com" {...register('email')} />}
        </Field>
        <Field label={t('auth.password')} required error={formState.errors.password?.message}>
          {(p) => <IconInput {...p} icon={Lock} type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
        </Field>
        {formState.errors.root && <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">{formState.errors.root.message}</p>}
        <Button type="submit" size="lg" loading={formState.isSubmitting} className="group h-12 rounded-xl shadow-[0_8px_24px_-8px_rgba(23,71,248,0.6)]">
          {t('auth.login.submit')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Button>
        {env.devTools && backend.dev && (
          <DevCallout title="Development sample accounts">
            <ul className="flex flex-col gap-1">
              {backend.dev.seedAccounts.map((a) => (
                <li key={a.email} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="capitalize">{a.role}</span>: <code className="font-mono text-xs">{a.email}</code>
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-accent hover:underline"
                    onClick={() => {
                      setValue('email', a.email)
                      setValue('password', a.password)
                    }}
                  >
                    Use
                  </button>
                </li>
              ))}
            </ul>
          </DevCallout>
        )}
      </form>
    </AuthSplitLayout>
  )
}
