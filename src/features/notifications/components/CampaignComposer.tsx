import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { MANUAL_CAMPAIGN_TYPES, type NotificationCampaign, type Program } from '@/types/domain'
import { notificationSchema, type NotificationValues } from '@/schemas/notification'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { useToast } from '@/state/toast'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { CAMPAIGN_TYPE_LABELS } from '../labels'
import { useSaveNotification } from '../hooks'

const EMPTY: NotificationValues = { type: 'happy_hour', origin: 'manual', title: '', message: '', offer: '', duration: '', programIds: [] }

/** Create/edit a manual or AI-drafted campaign. Saving never sends (spec §4.7). */
export function CampaignComposer({ open, onClose, editing, initial, programs }: { open: boolean; onClose: () => void; editing: NotificationCampaign | null; initial?: Partial<NotificationValues>; programs: Program[] }) {
  const toast = useToast()
  const save = useSaveNotification()
  const { register, control, handleSubmit, formState, reset } = useForm<NotificationValues>({ resolver: zodResolver(notificationSchema), defaultValues: EMPTY })
  useEffect(() => {
    if (open) reset(editing ? { type: editing.type, origin: editing.origin, title: editing.title, message: editing.message, offer: editing.offer, duration: editing.duration, programIds: editing.programIds } : { ...EMPTY, ...initial })
  }, [open, editing, initial, reset])
  const active = programs.filter((p) => p.status === 'active')
  const submit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: editing?.id ?? null, draft: v })
      toast.success('Campaign saved as a draft. Review it and send when ready.')
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })
  const origin = editing?.origin ?? initial?.origin ?? 'manual'
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? 'Edit campaign' : origin === 'manual' ? 'New campaign' : 'Review AI draft'}
      description={origin !== 'manual' ? 'AI-generated content is a draft only. Review and edit before saving; nothing is sent automatically.' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <GuardedButton permission={origin === 'manual' ? 'notifications.manage' : 'notifications.ai'} onClick={submit} loading={formState.isSubmitting}>
            {origin === 'manual' ? 'Save draft' : 'Confirm & save draft'}
          </GuardedButton>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Campaign type" required>
          {(p) => (
            <Select {...p} {...register('type')}>
              {MANUAL_CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Title" required error={formState.errors.title?.message}>
          {(p) => <Input {...p} {...register('title')} />}
        </Field>
        <Field label="Message" required error={formState.errors.message?.message} className="sm:col-span-2" hint="Wallet push notification text. Customer-facing language handling is an open item.">
          {(p) => <Textarea {...p} rows={3} {...register('message')} />}
        </Field>
        <Field label={origin === 'ai_bonus' ? 'Offer terms' : 'Offer'} optional>
          {(p) => <Input {...p} {...register('offer')} />}
        </Field>
        <Field label="Duration" optional>
          {(p) => <Input {...p} placeholder="e.g. Today 3–5 PM" {...register('duration')} />}
        </Field>
        <Controller
          control={control}
          name="programIds"
          render={({ field }) => (
            <fieldset className="flex flex-col gap-2 sm:col-span-2">
              <legend className="mb-1 text-sm font-medium">Audience <span className="text-xs font-normal text-muted">— no selection = members of all active programs</span></legend>
              {active.length === 0 && <p className="text-sm text-muted">No active programs.</p>}
              {active.map((p) => (
                <Checkbox key={p.id} label={p.name} checked={field.value.includes(p.id)} onChange={(e) => field.onChange(e.target.checked ? [...field.value, p.id] : field.value.filter((x) => x !== p.id))} />
              ))}
            </fieldset>
          )}
        />
      </form>
    </Dialog>
  )
}
