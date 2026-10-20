import { Controller, get, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { CURRENCIES } from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { ColorField } from '@/components/forms/ColorField'
import { toNullableNumber } from '@/lib/forms'
import { defaultTier } from '@/lib/factories'
import { createId } from '@/lib/ids'
import { STAMP_PRESETS } from '@/features/wallet-cards/components/StampGlyph'
import { ToggleNumber } from './ToggleNumber'
import { cn } from '@/lib/cn'

type Form = UseFormReturn<ProgramDraft>
const errorOf = (form: Form, path: string) => (get(form.formState.errors, path) as { message?: string } | undefined)?.message
const num = { setValueAs: toNullableNumber }

/* ------------------------------------------------------------------ Stamp Card */
export function StampFields({ form }: { form: Form }) {
  const { register, control } = form
  const e = (p: string) => errorOf(form, p)
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Number of Stamps Required" required error={e('config.stampsRequired')} hint="How many stamps fill the card, e.g. 10.">
        {(p) => <Input {...p} type="number" min={1} {...register('config.stampsRequired', num)} />}
      </Field>
      <Controller
        control={control}
        name="config.stampIcon"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">
              Stamp Icon <span className="text-xs font-normal text-muted">(optional — default coffee cup)</span>
            </legend>
            <div role="radiogroup" aria-label="Stamp icon" className="flex flex-wrap gap-1.5">
              {STAMP_PRESETS.map(({ value, label, icon: Icon }) => {
                const selected = field.value.kind === 'preset' && field.value.preset === value
                return (
                  <button key={value} type="button" role="radio" aria-checked={selected} aria-label={label} title={label} onClick={() => field.onChange({ kind: 'preset', preset: value })} className={cn('rounded-lg border p-2', selected ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:bg-surface-2')}>
                    <Icon className="size-4" aria-hidden />
                  </button>
                )
              })}
            </div>
            <ImageUpload label="Custom stamp icon" value={field.value.kind === 'custom' ? field.value.image : null} onChange={(img) => field.onChange(img ? { kind: 'custom', image: img } : { kind: 'preset', preset: 'coffee' })} />
          </fieldset>
        )}
      />
      <Field label="Reward Description" required error={e('config.rewardDescription')} hint='What the customer gets, e.g. "1 Free Coffee".'>
        {(p) => <Input {...p} {...register('config.rewardDescription')} />}
      </Field>
      <Field label="Reward Type" required hint="Used for reporting and the redeem-reward wording.">
        {(p) => (
          <Select {...p} {...register('config.rewardType')}>
            <option value="free_item">Free item</option>
            <option value="percent_discount">% discount</option>
            <option value="fixed_discount">Fixed discount</option>
            <option value="custom">Custom</option>
          </Select>
        )}
      </Field>
      <div className="sm:col-span-2">
        <ToggleNumber form={form} toggleName="config.expiry.enabled" numberName="config.expiry.days" label="Expiry Rule" description="If enabled, an inactive card resets/expires after X days without a scan." unit="days without a scan" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Membership Card */
export function MembershipFields({ form }: { form: Form }) {
  const { register, control, watch } = form
  const e = (p: string) => errorOf(form, p)
  const benefitType = watch('config.benefitType')
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted sm:col-span-2">Membership Cards never track stamps or points — they identify the customer and state their benefit at checkout.</p>
      <Field label="Benefit Description" required error={e('config.benefitDescription')} hint='Main line on the pass, e.g. "10% off every visit".' className="sm:col-span-2">
        {(p) => <Input {...p} {...register('config.benefitDescription')} />}
      </Field>
      <Field label="Benefit Type" required hint="Drives what the employee sees when scanning this member.">
        {(p) => (
          <Select {...p} {...register('config.benefitType')}>
            <option value="percent_discount">% discount</option>
            <option value="fixed_discount">Fixed discount</option>
            <option value="perk">Perk description only</option>
          </Select>
        )}
      </Field>
      {benefitType !== 'perk' && (
        <Field label={benefitType === 'percent_discount' ? 'Discount Value (%)' : 'Discount Value (amount)'} required error={e('config.discountValue')}>
          {(p) => <Input {...p} type="number" min={0} step="0.01" {...register('config.discountValue', num)} />}
        </Field>
      )}
      <Controller
        control={control}
        name="config.validity"
        render={({ field }) => (
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <Field label="Validity" required className="sm:w-1/2">
              {(p) => (
                <Select {...p} value={field.value.kind} onChange={(ev) => field.onChange(ev.target.value === 'expires_on' ? { kind: 'expires_on', date: '' } : { kind: ev.target.value })}>
                  <option value="permanent">Permanent</option>
                  <option value="expires_on">Expires on date</option>
                  <option value="renews_annually">Renews annually</option>
                </Select>
              )}
            </Field>
            {field.value.kind === 'expires_on' && (
              <Field label="Expiry date" required error={e('config.validity.date')} className="sm:w-1/2">
                {(p) => <Input {...p} type="date" value={field.value.kind === 'expires_on' ? field.value.date : ''} onChange={(ev) => field.onChange({ kind: 'expires_on', date: ev.target.value })} />}
              </Field>
            )}
          </div>
        )}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Tier Program */
export function TierFields({ form }: { form: Form }) {
  const { register, control, watch } = form
  const e = (p: string) => errorOf(form, p)
  const tiers = useFieldArray({ control, name: 'config.tiers' })
  const enabled = watch('config.tiersEnabled')
  const basis = watch('config.upgradeBasis')
  const count = tiers.fields.length
  const setCount = (n: number) => {
    const target = Math.max(2, Math.min(5, n))
    if (target > count) for (let i = count; i < target; i++) tiers.append(defaultTier(i))
    if (target < count) tiers.remove(Array.from({ length: count - target }, (_, k) => count - 1 - k))
  }
  const unit = basis === 'visits' ? 'visits' : basis === 'points' ? 'points' : 'total spend'

  return (
    <div className="flex flex-col gap-5">
      <Controller control={control} name="config.tiersEnabled" render={({ field }) => <Toggle label="Enable Tiers" description="Turn tiering off entirely to use a flat membership card instead." checked={!!field.value} onChange={field.onChange} />} />
      {enabled && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Number of Tiers" required hint="Between 2 and 5." error={e('config.tiers')}>
              {(p) => (
                <Select {...p} value={count} onChange={(ev) => setCount(Number(ev.target.value))}>
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Upgrade Basis" required hint="One basis applies to all tiers.">
              {(p) => (
                <Select {...p} {...register('config.upgradeBasis')}>
                  <option value="visits">Visits</option>
                  <option value="points">Points</option>
                  <option value="spend">Total Spend</option>
                </Select>
              )}
            </Field>
          </div>
          <ol className="flex flex-col gap-3">
            {tiers.fields.map((f, i) => (
              <li key={f.id} className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold sm:col-span-2">Tier {i + 1}</p>
                <Field label="Tier Name" required error={e(`config.tiers.${i}.name`)}>
                  {(p) => <Input {...p} {...register(`config.tiers.${i}.name` as 'config.tiers.0.name')} />}
                </Field>
                <Field label={`Required Value (${unit})`} required error={e(`config.tiers.${i}.requiredValue`)}>
                  {(p) => <Input {...p} type="number" min={0} {...register(`config.tiers.${i}.requiredValue` as 'config.tiers.0.requiredValue', num)} />}
                </Field>
                <Controller
                  control={control}
                  name={`config.tiers.${i}.walletColor` as 'config.tiers.0.walletColor'}
                  render={({ field }) => <ColorField label="Wallet Colour" required value={field.value} onChange={field.onChange} error={e(`config.tiers.${i}.walletColor`)} hint="The pass background once a customer reaches this tier." />}
                />
                <Controller control={control} name={`config.tiers.${i}.badge` as 'config.tiers.0.badge'} render={({ field }) => <ImageUpload label="Tier Badge / Icon" value={field.value} onChange={field.onChange} />} />
                <Field label="Rewards & Benefits" required error={e(`config.tiers.${i}.rewards`)} className="sm:col-span-2">
                  {(p) => <Input {...p} placeholder="e.g. Free birthday drink, priority seating" {...register(`config.tiers.${i}.rewards` as 'config.tiers.0.rewards')} />}
                </Field>
              </li>
            ))}
          </ol>
          <ToggleNumber form={form} toggleName="config.downgrade.enabled" numberName="config.downgrade.inactivityDays" label="Downgrade Rule" description="If enabled, a customer drops one tier after X days of no visits." unit="days without a visit" />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Points Program */
export function PointsFields({ form }: { form: Form }) {
  const { register, control, watch } = form
  const e = (p: string) => errorOf(form, p)
  const rewards = useFieldArray({ control, name: 'config.rewards' })
  const currency = watch('config.currency')
  const method = watch('config.awardingMethod')
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Currency" required hint="Set per program, not account-wide. Employees never pick a currency mid-scan.">
          {(p) => (
            <Select {...p} {...register('config.currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'other' ? 'Other' : c}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {currency === 'other' && (
          <Field label="Currency code" required error={e('config.customCurrency')}>
            {(p) => <Input {...p} maxLength={8} {...register('config.customCurrency')} />}
          </Field>
        )}
        <fieldset className="flex flex-col gap-1.5 sm:col-span-2">
          <legend className="text-sm font-medium">
            Calculation Basis / Ratio<span className="ml-0.5 text-danger" aria-hidden>*</span>
          </legend>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Input type="number" min={0} step="0.01" className="w-28" aria-label="Spend amount" {...register('config.ratio.spend', num)} />
            <span>{currency === 'other' ? watch('config.customCurrency') || 'units' : currency} =</span>
            <Input type="number" min={0} step="0.01" className="w-28" aria-label="Points earned" {...register('config.ratio.points', num)} />
            <span>points</span>
          </div>
          {(e('config.ratio.spend') || e('config.ratio.points')) && <p className="text-xs text-danger" role="alert">{e('config.ratio.spend') ?? e('config.ratio.points')}</p>}
        </fieldset>
        <Field label="Awarding Method" required hint="Fixed = same points every scan. Manual = employee enters the purchase amount.">
          {(p) => (
            <Select {...p} {...register('config.awardingMethod')}>
              <option value="manual">Manual entry</option>
              <option value="fixed">Fixed per scan</option>
            </Select>
          )}
        </Field>
        {method === 'fixed' && (
          <Field label="Points per scan" required error={e('config.pointsPerScan')}>
            {(p) => <Input {...p} type="number" min={1} {...register('config.pointsPerScan', num)} />}
          </Field>
        )}
        <Field label="Rounding Rule" required hint="Applied to the calculated point value.">
          {(p) => (
            <Select {...p} {...register('config.rounding')}>
              <option value="down">Round down</option>
              <option value="up">Round up</option>
              <option value="nearest">Round to nearest</option>
            </Select>
          )}
        </Field>
        <Field label="Minimum Purchase Amount" optional error={e('config.minimumPurchase')} hint="Purchases below this earn no points.">
          {(p) => <Input {...p} type="number" min={0} step="0.01" {...register('config.minimumPurchase', num)} />}
        </Field>
        <Field label="Maximum Points per Transaction" optional error={e('config.maxPointsPerTransaction')} hint="Caps how many points one scan can award.">
          {(p) => <Input {...p} type="number" min={1} {...register('config.maxPointsPerTransaction', num)} />}
        </Field>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">
          Rewards List<span className="ml-0.5 text-danger" aria-hidden>*</span> <span className="text-xs font-normal text-muted">— at least one reward</span>
        </legend>
        {rewards.fields.map((f, i) => (
          <div key={f.id} className="grid items-end gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_9rem_auto]">
            <Field label={`Reward ${i + 1} name`} required error={e(`config.rewards.${i}.name`)}>
              {(p) => <Input {...p} placeholder="e.g. Free Coffee" {...register(`config.rewards.${i}.name` as 'config.rewards.0.name')} />}
            </Field>
            <Field label="Points Required" required error={e(`config.rewards.${i}.pointsRequired`)}>
              {(p) => <Input {...p} type="number" min={1} {...register(`config.rewards.${i}.pointsRequired` as 'config.rewards.0.pointsRequired', num)} />}
            </Field>
            <Button variant="ghost" onClick={() => rewards.remove(i)} disabled={rewards.fields.length <= 1} aria-label={`Remove reward ${i + 1}`}>
              <Trash2 className="size-4" />
            </Button>
            <div className="sm:col-span-3">
              <Controller control={control} name={`config.rewards.${i}.icon` as 'config.rewards.0.icon'} render={({ field }) => <ImageUpload label={`Reward ${i + 1} icon`} value={field.value} onChange={field.onChange} />} />
            </div>
          </div>
        ))}
        {e('config.rewards') && <p className="text-xs text-danger" role="alert">{e('config.rewards')}</p>}
        <div>
          <Button variant="secondary" size="sm" onClick={() => rewards.append({ id: createId('prw'), name: '', pointsRequired: 0, icon: null })}>
            <Plus className="size-4" aria-hidden /> Add reward
          </Button>
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleNumber form={form} toggleName="config.pointExpiry.enabled" numberName="config.pointExpiry.months" label="Point Expiry" description="Unused points expire after X months." unit="months" />
        <ToggleNumber form={form} toggleName="config.rewardExpiry.enabled" numberName="config.rewardExpiry.days" label="Reward Expiry" description="An earned-but-unredeemed reward expires after X days." unit="days" />
      </div>
    </div>
  )
}

export function TermsField({ form }: { form: Form }) {
  return (
    <Field label="Terms & Conditions" optional hint="Shown on the back of the wallet pass.">
      {(p) => <Textarea {...p} rows={4} {...form.register('termsAndConditions')} />}
    </Field>
  )
}
