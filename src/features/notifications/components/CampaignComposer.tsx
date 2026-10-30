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
import { useCustomers } from '@/features/customers/hooks'
import { searchCustomers } from '@/lib/customerSearch'
import { useState } from 'react'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { CAMPAIGN_TYPE_LABELS } from '../labels'
import { useSaveNotification } from '../hooks'

const EMPTY: NotificationValues = { type: 'happy_hour', origin: 'manual', title: '', message: '', offer: '', duration: '', programIds: [], audience: { kind: 'all' } }

/** Create/edit a manual or AI-drafted campaign. Saving never sends (spec §4.7). */
export function CampaignComposer({ open, onClose, editing, initial, programs }: { open: boolean; onClose: () => void; editing: NotificationCampaign | null; initial?: Partial<NotificationValues>; programs: Program[] }) {
  const toast = useToast()
  const save = useSaveNotification()
  const { register, control, handleSubmit, formState, reset } = useForm<NotificationValues>({ resolver: zodResolver(notificationSchema), defaultValues: EMPTY })
  useEffect(() => {
    if (open) reset(editing ? { type: editing.type, origin: editing.origin, title: editing.title, message: editing.message, offer: editing.offer, duration: editing.duration, programIds: editing.programIds, audience: editing.audience ?? { kind: editing.programIds.length ? 'programs' : 'all' } } : { ...EMPTY, ...initial })
  }, [open, editing, initial, reset])
  const active = programs.filter((p) => p.status === 'active')
  const customers = useCustomers()
  const [q, setQ] = useState('')
  const submit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: editing?.id ?? null, draft: v })
      toast.success('Notification saved as a draft. Review it and send when ready.')
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
      title={editing ? 'Edit notification' : origin === 'manual' ? 'New notification' : 'Review AI draft'}
      description={origin === 'manual' ? 'A push message to your customers’ wallet passes. Saving keeps it as a draft; nothing is sent until you press Send.' : undefined}
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
        <Field label="Notification type" required>
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
          name="audience"
          render={({ field }) => {
            const aud = field.value ?? { kind: 'all' as const }
            const all = customers.data ?? []
            const chosen = new Set(aud.customerIds ?? [])
            const kinds = [
              { kind: 'all', title: 'All customers', body: `Everyone with a wallet card${all.length ? ` (${all.length})` : ''}` },
              { kind: 'programs', title: 'By program', body: 'Customers of the programs you pick' },
              { kind: 'inactive', title: 'Inactive customers', body: 'Not scanned for a number of days' },
              { kind: 'customers', title: 'Specific customers', body: 'Pick individual customers' },
            ] as const
            return (
              <fieldset className="flex flex-col gap-3 sm:col-span-2">
                <legend className="label mb-2">Who should receive it?</legend>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Audience">
                  {kinds.map((k) => (
                    <button key={k.kind} type="button" role="radio" aria-checked={aud.kind === k.kind} onClick={() => field.onChange({ ...aud, kind: k.kind })} className={'type-card text-left' + (aud.kind === k.kind ? ' on' : '')}>
                      <b>{k.title}</b>
                      <small>{k.body}</small>
                    </button>
                  ))}
                </div>
                {aud.kind === 'programs' && (
                  <Controller
                    control={control}
                    name="programIds"
                    render={({ field: pf }) => (
                      <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
                        {active.length === 0 && <p className="text-sm text-muted">No active programs.</p>}
                        {active.map((p) => (
                          <Checkbox key={p.id} label={p.name} checked={pf.value.includes(p.id)} onChange={(e) => pf.onChange(e.target.checked ? [...pf.value, p.id] : pf.value.filter((x) => x !== p.id))} />
                        ))}
                      </div>
                    )}
                  />
                )}
                {aud.kind === 'inactive' && (
                  <div className="field max-w-xs">
                    <label htmlFor="aud-days" className="label">Inactive for at least (days)</label>
                    <Input id="aud-days" type="number" min={1} value={aud.inactiveDays ?? 30} onChange={(e) => field.onChange({ ...aud, inactiveDays: Number(e.target.value) || 30 })} />
                  </div>
                )}
                {aud.kind === 'customers' && (
                  <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
                    <label htmlFor="aud-search" className="sr-only">Search customers</label>
                    <Input id="aud-search" placeholder="Search by name, email, phone or number" value={q} onChange={(e) => setQ(e.target.value)} />
                    <ul className="flex max-h-44 flex-col overflow-y-auto">
                      {searchCustomers(all, q).slice(0, 12).map((c) => (
                        <li key={c.id}>
                          <Checkbox label={`${c.name || c.customerNumber} · ${c.customerNumber}`} checked={chosen.has(c.id)} onChange={(e) => field.onChange({ ...aud, customerIds: e.target.checked ? [...chosen, c.id] : [...chosen].filter((x) => x !== c.id) })} />
                        </li>
                      ))}
                    </ul>
                    <p className="hint">{chosen.size} selected</p>
                  </div>
                )}
              </fieldset>
            )
          }}
        />
      </form>
    </Dialog>
  )
}
