import { useMemo, useState } from 'react'
import { Controller, get, useForm, useWatch } from 'react-hook-form'
import type { Campaign, LifecycleStatus, Program, VoucherCampaign } from '@/types/domain'
import type { CampaignDraft } from '@/services/backend'
import { campaignSchema } from '@/schemas/campaign'
import { zodResolver, toNullableNumber } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { buildVoucherPassContent } from '@/lib/walletContent'
import { useToast } from '@/state/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { ColorField } from '@/components/forms/ColorField'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { BackgroundControl } from './VisualFields'
import { useCampaignLifecycle, useSaveCampaign } from '../hooks'

const STARTING = [0, 1, 2, 3]

/** Spec §4.2 program campaigns: stamp card acquisition + one-time voucher. */
export function CampaignForm({ initial, campaignId, status, programs, onDone }: { initial: CampaignDraft; campaignId: string | null; status: LifecycleStatus | null; programs: Program[]; onDone: (c: Campaign) => void }) {
  const toast = useToast()
  const save = useSaveCampaign()
  const lifecycle = useCampaignLifecycle()
  const form = useForm<CampaignDraft>({ resolver: zodResolver<CampaignDraft>(campaignSchema), defaultValues: initial })
  const { register, control, formState } = form
  const values = useWatch({ control }) as CampaignDraft
  const e = (p: string) => (get(formState.errors, p) as { message?: string } | undefined)?.message
  const isDraft = status === null || status === 'draft'
  const stampPrograms = programs.filter((p) => p.type === 'stamp' && p.status !== 'archived')
  const [customStart, setCustomStart] = useState(initial.kind === 'stamp_acquisition' && !STARTING.includes(initial.startingStamps))

  const persist = async (draft: CampaignDraft, publish: boolean) => {
    try {
      let c = await save.mutateAsync({ id: campaignId, draft })
      if (publish) c = await lifecycle.mutateAsync({ id: c.id, action: 'publish' })
      toast.success(publish ? 'Campaign published. Its QR code is ready.' : 'Campaign saved.')
      onDone(c)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  const saveDraft = async () => {
    if (await form.trigger('name')) await persist(form.getValues(), false)
  }

  const preview = useMemo(
    () => (values.kind === 'voucher' ? buildVoucherPassContent({ ...(values as VoucherCampaign), id: 'p', businessId: '', status: 'draft', qrToken: null, createdAt: '', publishedAt: null }) : null),
    [values],
  )

  return (
    <div className={preview ? 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]' : ''}>
      <form className="flex min-w-0 flex-col gap-6" noValidate onSubmit={(ev) => ev.preventDefault()}>
        <Card>
          <CardHeader title={initial.kind === 'voucher' ? 'One-time voucher campaign' : 'Stamp card acquisition campaign'} description={initial.kind === 'voucher' ? 'Standalone — not linked to any stamp card. One shared QR; each claim is tracked per customer and redeemable once.' : 'A special join QR layered on top of an existing Stamp Card program.'} />
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label="Campaign Name" required error={e('name')} hint={initial.kind === 'voucher' ? 'e.g. "Free Coffee Campaign"' : 'Internal label, e.g. "Cup-lid Campaign"'}>
              {(p) => <Input {...p} {...register('name')} />}
            </Field>
            {initial.kind === 'stamp_acquisition' ? (
              <>
                <Field label="Linked Stamp Card Program" required error={e('linkedProgramId')} hint={stampPrograms.length ? 'Which stamp card this campaign issues.' : 'Create a Stamp Card program first.'}>
                  {(p) => (
                    <Select {...p} {...register('linkedProgramId')}>
                      <option value="">Select…</option>
                      {stampPrograms.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} ({sp.status})
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Controller
                  control={control}
                  name="startingStamps"
                  render={({ field }) => (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Field label="Starting Stamps" required hint="Stamps the new card already has when issued." className="sm:w-1/2">
                        {(p) => (
                          <Select
                            {...p}
                            value={customStart ? 'custom' : String(field.value)}
                            onChange={(ev) => {
                              const custom = ev.target.value === 'custom'
                              setCustomStart(custom)
                              field.onChange(custom ? 4 : Number(ev.target.value))
                            }}
                          >
                            {STARTING.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                            <option value="custom">Custom</option>
                          </Select>
                        )}
                      </Field>
                      {customStart && (
                        <Field label="Custom starting stamps" required error={e('startingStamps')} className="sm:w-1/2">
                          {(p) => <Input {...p} type="number" min={0} value={Number.isFinite(field.value) ? field.value : ''} onChange={(ev) => field.onChange(toNullableNumber(ev.target.value))} />}
                        </Field>
                      )}
                    </div>
                  )}
                />
                <div className="flex flex-col gap-4 rounded-lg border border-line p-4 sm:col-span-2">
                  <Controller control={control} name="welcomeGift.enabled" render={({ field }) => <Toggle label="Welcome Gift (optional)" description="If on, reveals Reward Name, Description, Validity Period and Redemption Conditions." checked={!!field.value} onChange={field.onChange} />} />
                  {values.kind === 'stamp_acquisition' && values.welcomeGift?.enabled && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Reward Name" required error={e('welcomeGift.rewardName')}>
                        {(p) => <Input {...p} {...register('welcomeGift.rewardName')} />}
                      </Field>
                      <Field label="Validity Period (days)" optional error={e('welcomeGift.validityDays')}>
                        {(p) => <Input {...p} type="number" min={1} {...register('welcomeGift.validityDays', { setValueAs: toNullableNumber })} />}
                      </Field>
                      <Field label="Description" optional className="sm:col-span-2">
                        {(p) => <Textarea {...p} rows={2} {...register('welcomeGift.description')} />}
                      </Field>
                      <Field label="Redemption Conditions" optional className="sm:col-span-2">
                        {(p) => <Textarea {...p} rows={2} {...register('welcomeGift.redemptionConditions')} />}
                      </Field>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Field label="Voucher Reward" required error={e('voucherReward')} hint='e.g. "1 Free Coffee"'>
                  {(p) => <Input {...p} {...register('voucherReward')} />}
                </Field>
                <Field label="Valid From" required error={e('validFrom')}>
                  {(p) => <Input {...p} type="date" {...register('validFrom')} />}
                </Field>
                <Field label="Valid To" required error={e('validTo')} hint="Window in which the voucher can be claimed and redeemed.">
                  {(p) => <Input {...p} type="date" {...register('validTo')} />}
                </Field>
                <Controller control={control} name="visuals.logo" render={({ field }) => <ImageUpload label="Logo" required value={field.value} onChange={field.onChange} error={e('visuals.logo')} />} />
                <Controller control={control} name="visuals.background" render={({ field }) => <BackgroundControl value={field.value} onChange={field.onChange} />} />
                <Controller control={control} name="visuals.textColor" render={({ field }) => <ColorField label="Text Colour" required value={field.value} onChange={field.onChange} error={e('visuals.textColor')} />} />
              </>
            )}
          </CardBody>
        </Card>
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <>
              <GuardedButton permission="programs.manage" onClick={form.handleSubmit((d) => persist(d, true))} loading={lifecycle.isPending}>
                Publish & generate QR
              </GuardedButton>
              <GuardedButton permission="programs.manage" variant="secondary" onClick={saveDraft} loading={save.isPending && !lifecycle.isPending}>
                Save as draft
              </GuardedButton>
            </>
          ) : (
            <GuardedButton permission="programs.manage" onClick={form.handleSubmit((d) => persist(d, false))} loading={save.isPending}>
              Save
            </GuardedButton>
          )}
        </div>
      </form>
      {preview && (
        <aside className="xl:sticky xl:top-20 xl:self-start">
          <WalletPassPreview content={preview} label="Voucher pass preview" />
        </aside>
      )}
    </div>
  )
}
