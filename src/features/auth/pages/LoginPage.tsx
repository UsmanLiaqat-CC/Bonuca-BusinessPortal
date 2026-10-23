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
import { ArrowRight, Lock, Mail, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
          <Link to="/register" className="link underline-hl text-fg">
            {t('landing.startFree')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        <Field label={t('auth.email')} required error={formState.errors.email?.message}>
          {(p) => <IconInput {...p} icon={Mail} type="email" autoComplete="email" placeholder="you@business.com" {...register('email')} />}
        </Field>
        <Field label={t('auth.password')} required error={formState.errors.password?.message}>
          {(p) => <IconInput {...p} icon={Lock} type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />}
        </Field>
        {formState.errors.root && (
          <p className="callout border-transparent bg-danger-soft text-danger" role="alert">
            {formState.errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" loading={formState.isSubmitting} className="btn-block">
          {t('auth.login.submit')}
          <ArrowRight className="size-[15px]" aria-hidden />
        </Button>
        {env.devTools && backend.dev && (
          <div className="callout dev dev-accounts block" role="note" data-testid="dev-callout">
            <b className="mb-1.5 flex items-center gap-2">
              <Zap className="size-[15px]" aria-hidden />
              Development sample accounts
            </b>
            {backend.dev.seedAccounts.map((a) => (
              <div key={a.email} className="acc gap-2">
                <span className="min-w-0">
                  <span className="capitalize">{a.role}</span>: <span className="mono break-all">{a.email}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-text btn-sm text-accent"
                  onClick={() => {
                    setValue('email', a.email)
                    setValue('password', a.password)
                  }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </AuthSplitLayout>
  )
}
