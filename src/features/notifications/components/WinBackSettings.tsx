import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { History, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { winBackSchema, type WinBackValues } from '@/schemas/notification'
import { zodResolver, toNullableNumber } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/dates'
import { useToast } from '@/state/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Toggle } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { useSaveWinBack, useWinBack } from '../hooks'

/** Spec §4.7 win-back automation: inactivity thresholds with escalating offers. */
export function WinBackSettings({ onSaved }: { onSaved?: () => void } = {}) {
  const winback = useWinBack()
  const save = useSaveWinBack()
  const toast = useToast()
  const form = useForm<WinBackValues>({ resolver: zodResolver(winBackSchema), defaultValues: { enabled: false, stages: [] } })
  const stages = useFieldArray({ control: form.control, name: 'stages' })
  const data = winback.data
  useEffect(() => {
    if (data) form.reset(data.config)
  }, [data, form])
  const errs = form.formState.errors.stages

  return (
    <div className="flex flex-col gap-[18px]">
      <Card>
        <CardHeader icon={<RotateCcw className="size-4" />} title="Win-back automation" description="Automatic drip sequence triggered by customer inactivity. Each notification also creates a matching active reward, redeemable on the customer's next scan." />
        <CardBody>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate(v, {
                onSuccess: () => {
                  toast.success('Win-back campaign saved.')
                  onSaved?.()
                },
                onError: (e) => toast.error(errorMessage(e)),
              }),
            )}
          >
            <Controller control={form.control} name="enabled" render={({ field }) => <Toggle label="Win-back campaign active" checked={field.value} onChange={field.onChange} />} />
            <ol className="flex flex-col gap-3">
              {stages.fields.map((f, i) => (
                <li key={f.id} className="grid items-start gap-3 rounded-xl border border-line p-3 reveal sm:grid-cols-[9rem_1fr_1fr_auto]">
                  <label className="field">
                    <span className="label">Stage {i + 1} — days away</span>
                    <Input type="number" min={1} {...form.register(`stages.${i}.days`, { setValueAs: toNullableNumber })} aria-invalid={errs?.[i]?.days ? true : undefined} />
                    {errs?.[i]?.days && <span className="error-msg">{errs[i]?.days?.message}</span>}
                  </label>
                  <div className="field">
                    <label htmlFor={`wb-msg-${i}`} className="label">Message</label>
                    <Input id={`wb-msg-${i}`} placeholder="e.g. We miss you! Your coffee is on us." {...form.register(`stages.${i}.message`)} />
                  </div>
                  <label className="field">
                    <span className="label">Offer (becomes the active reward)</span>
                    <Input placeholder="e.g. Free coffee" {...form.register(`stages.${i}.offer`)} aria-invalid={errs?.[i]?.offer ? true : undefined} />
                    {errs?.[i]?.offer && <span className="error-msg">{errs[i]?.offer?.message}</span>}
                  </label>
                  <div className="flex items-center gap-1 sm:mt-6">
                    <Controller control={form.control} name={`stages.${i}.enabled`} render={({ field }) => <Toggle label={`Stage ${i + 1} on`} checked={field.value !== false} onChange={field.onChange} plain />} />
                    <Button variant="ghost" onClick={() => stages.remove(i)} disabled={stages.fields.length <= 1} aria-label={`Remove stage ${i + 1}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => stages.append({ days: (stages.fields.at(-1)?.days ?? 0) + 30, offer: '', message: '', enabled: true })}>
                <Plus className="size-4" aria-hidden /> Add stage
              </Button>
              <GuardedButton permission="notifications.manage" type="submit" loading={save.isPending}>
                Save campaign
              </GuardedButton>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<History className="size-4" />} title="Automation log" description="Win-back rewards created by the automation." />
        <CardBody className="flex flex-col gap-3">
          <IntegrationNotice title="Push delivery not connected">Rewards are created, but notifications are not delivered to customers in this environment.</IntegrationNotice>
          <QueryState query={winback}>
            {(d) =>
              d.events.length === 0 ? (
                <p className="empty py-4">No win-back events yet.</p>
              ) : (
                <ul className="timeline text-sm">
                  {[...d.events].reverse().slice(0, 25).map((ev) => (
                    <li key={ev.id} className="tl-item flex-wrap">
                      <span>
                        Stage {ev.stage + 1} · customer {ev.customerId}
                      </span>
                      <span className="text-muted">
                        {formatDateTime(ev.createdAt)} · {ev.delivered ? 'Delivered' : 'Not delivered'}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryState>
        </CardBody>
      </Card>
    </div>
  )
}
