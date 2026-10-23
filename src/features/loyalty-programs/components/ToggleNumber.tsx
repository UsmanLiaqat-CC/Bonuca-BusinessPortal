import { Controller, get, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { Toggle } from '@/components/ui/Field'
import { Input } from '@/components/ui/Field'
import { toNullableNumber } from '@/lib/forms'

/** "Toggle + number" pattern used by Expiry Rule, Downgrade Rule, Point/Reward Expiry (spec §4.2). */
export function ToggleNumber<T extends FieldValues>({
  form,
  toggleName,
  numberName,
  label,
  description,
  unit,
}: {
  form: UseFormReturn<T>
  toggleName: FieldPath<T>
  numberName: FieldPath<T>
  label: string
  description: string
  unit: string
}) {
  const enabled = form.watch(toggleName) as boolean
  const error = (get(form.formState.errors, numberName) as { message?: string } | undefined)?.message
  return (
    <div className="flex flex-col gap-2 reveal">
      <Controller control={form.control} name={toggleName} render={({ field }) => <Toggle plain label={label} description={description} checked={!!field.value} onChange={field.onChange} />} />
      {enabled && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="sr-only">{`${label} — ${unit}`}</span>
          <Input type="number" min={1} className="w-28" aria-label={`${label} (${unit})`} aria-invalid={error ? true : undefined} {...form.register(numberName, { setValueAs: toNullableNumber })} />
          <span className="text-muted">{unit}</span>
          {error && <span className="w-full error-msg" role="alert">{error}</span>}
        </label>
      )}
    </div>
  )
}
