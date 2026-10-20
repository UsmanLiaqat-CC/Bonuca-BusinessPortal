import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { inviteSchema } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { useAccess } from '@/state/session'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { DevCallout } from '@/features/auth/components/AuthLayout'
import { useInvite } from '../hooks'

type Values = z.infer<typeof inviteSchema>

/** Spec §4.6 invite flow: Owner or Manager invites by email. */
export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const access = useAccess()
  const invite = useInvite()
  const [link, setLink] = useState<string | null>(null)
  const canInviteManager = access.can('employees.inviteManager')
  const { register, handleSubmit, formState, setError, reset } = useForm<Values>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '', role: 'employee' } })

  const close = () => {
    setLink(null)
    reset()
    onClose()
  }
  const submit = handleSubmit(async (v) => {
    try {
      const { delivery } = await invite.mutateAsync(v)
      setLink(delivery.delivered ? null : `${window.location.origin}${delivery.devLink ?? ''}`)
      if (delivery.delivered) close()
    } catch (e) {
      setError('root', { message: errorMessage(e) })
    }
  })

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Invite team member"
      description="They receive an email, set their own password, and get role-based access."
      footer={
        link ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={submit} loading={formState.isSubmitting}>Invite Employee</Button>
          </>
        )
      }
    >
      {link ? (
        <DevCallout title="Invitation created — email not sent">
          No email service is connected in this environment. Share this invitation link manually for testing:
          <a href={link} className="mt-1 block font-mono text-xs break-all text-accent" data-testid="invite-link">
            {link}
          </a>
        </DevCallout>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field label="Email" required error={formState.errors.email?.message}>
            {(p) => <Input {...p} type="email" {...register('email')} />}
          </Field>
          <Field label="Role" required hint={canInviteManager ? undefined : 'Managers can invite Employees only.'}>
            {(p) => (
              <Select {...p} {...register('role')}>
                <option value="employee">Employee</option>
                {canInviteManager && <option value="manager">Manager</option>}
              </Select>
            )}
          </Field>
          {formState.errors.root && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">{formState.errors.root.message}</p>}
        </form>
      )}
    </Dialog>
  )
}
