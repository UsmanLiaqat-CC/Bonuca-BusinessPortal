import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useBackend } from '@/state/services'
import { SESSION_KEY } from '@/state/session'
import { acceptInviteSchema, PASSWORD_RULE_MESSAGE } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { Field, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/feedback/QueryState'
import { AuthLayout } from '../components/AuthLayout'

type Values = z.infer<typeof acceptInviteSchema>

/** Spec §4.6 invite flow: invitee sets their own password → gains role-based access. */
export default function AcceptInvitePage() {
  const { token = '' } = useParams()
  const backend = useBackend()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const invite = useQuery({ queryKey: ['invite', token], queryFn: () => backend.getInvite(token) })
  const { register, handleSubmit, formState, setError } = useForm<Values>({ resolver: zodResolver(acceptInviteSchema), defaultValues: { fullName: '', password: '', confirm: '' } })

  const onSubmit = handleSubmit(async (v) => {
    try {
      await backend.acceptInvite(token, { fullName: v.fullName, password: v.password })
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
      navigate('/app', { replace: true })
    } catch (err) {
      setError('root', { message: errorMessage(err) })
    }
  })

  if (invite.isPending) return <Spinner />
  if (invite.isError) return <ErrorState message={errorMessage(invite.error)} />
  if (!invite.data) {
    return (
      <AuthLayout title="Invitation not found">
        <p className="text-sm text-muted">This invitation link is not valid. Ask your business owner or manager to send a new invitation.</p>
      </AuthLayout>
    )
  }
  const { invite: inv, businessName } = invite.data
  if (inv.acceptedAt) {
    return (
      <AuthLayout title="Invitation already accepted">
        <p className="text-sm text-muted">This invitation has already been used. Log in with your email and password.</p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={`Join ${businessName}`} subtitle={<>You were invited as <strong className="capitalize">{inv.role}</strong> ({inv.email}). Set your password to get started.</>}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Full Name" required error={formState.errors.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label="Password" required error={formState.errors.password?.message} hint={PASSWORD_RULE_MESSAGE}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('password')} />}
        </Field>
        <Field label="Confirm password" required error={formState.errors.confirm?.message}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" {...register('confirm')} />}
        </Field>
        {formState.errors.root && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{formState.errors.root.message}</p>}
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Set password and continue
        </Button>
      </form>
    </AuthLayout>
  )
}
