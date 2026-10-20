import { Controller, get, type UseFormReturn } from 'react-hook-form'
import type { Background } from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { ColorField } from '@/components/forms/ColorField'
import { Button } from '@/components/ui/Button'
import { backgroundBaseColor, contrastRatio, suggestTextColor } from '@/lib/color'
import { cn } from '@/lib/cn'

/**
 * Shared visual controls (spec §4.2: Logo, Icon, Background, Hero/Strip, Text Colour).
 * Which controls appear and which are required depends on the program type.
 */
export function BackgroundControl({ value, onChange, required, error, allowDefault = true }: { value: Background; onChange: (b: Background) => void; required?: boolean; error?: string; allowDefault?: boolean }) {
  const options: { kind: Background['kind']; label: string }[] = [
    ...(allowDefault ? [{ kind: 'default' as const, label: 'Bonuca template gradient' }] : []),
    { kind: 'color', label: 'Flat colour (RGB)' },
    { kind: 'image', label: 'Background image' },
  ]
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">
        Background{required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        <span className="ml-1 text-xs font-normal text-muted">— a colour or an image, not both</span>
      </legend>
      <div role="radiogroup" aria-label="Background type" className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.kind}
            type="button"
            role="radio"
            aria-checked={value.kind === o.kind}
            onClick={() => onChange(o.kind === 'default' ? { kind: 'default' } : o.kind === 'color' ? { kind: 'color', color: value.kind === 'color' ? value.color : '#0A112F' } : { kind: 'image', image: value.kind === 'image' ? value.image : '' })}
            className={cn('rounded-lg border px-3 py-1.5 text-sm', value.kind === o.kind ? 'border-accent bg-accent-soft text-accent' : 'border-line hover:bg-surface-2')}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value.kind === 'color' && <ColorField label="Background colour" value={value.color} onChange={(color) => onChange({ kind: 'color', color })} />}
      {value.kind === 'image' && <ImageUpload label="Background image" shape="wide" required value={value.image || null} onChange={(image) => onChange({ kind: 'image', image: image ?? '' })} />}
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </fieldset>
  )
}

export function VisualFields({
  form,
  show,
  logoRequired,
}: {
  form: UseFormReturn<ProgramDraft>
  show: { background: boolean; textColor: boolean }
  logoRequired: boolean
}) {
  const { control, watch, setValue, formState } = form
  const err = (path: string) => (get(formState.errors, path) as { message?: string } | undefined)?.message
  const background = watch('visuals.background')
  const textColor = watch('visuals.textColor')
  const bgBase = backgroundBaseColor(background)
  const suggestion = suggestTextColor(bgBase)
  const lowContrast = background.kind !== 'image' && /^#[0-9a-fA-F]{6}$/.test(textColor) && contrastRatio(bgBase, textColor) < 3

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Controller control={control} name="visuals.logo" render={({ field }) => <ImageUpload label="Program Logo" required={logoRequired} value={field.value} onChange={field.onChange} error={err('visuals.logo')} hint="Small square logo, top-left of the wallet pass." />} />
      <Controller control={control} name="visuals.icon" render={({ field }) => <ImageUpload label="Program Icon" value={field.value} onChange={field.onChange} hint="Defaults to the logo. Used in notification banners and the Wallet list." />} />
      <Controller control={control} name="visuals.heroImage" render={({ field }) => <ImageUpload label="Hero / Strip Image" shape="wide" value={field.value} onChange={field.onChange} hint="Optional wide banner across the top of the pass." />} />
      {show.background && (
        <Controller control={control} name="visuals.background" render={({ field }) => <BackgroundControl value={field.value} onChange={field.onChange} error={err('visuals.background')} />} />
      )}
      {show.textColor && (
        <div className="flex flex-col gap-2">
          <Controller
            control={control}
            name="visuals.textColor"
            render={({ field }) => <ColorField label="Text Colour" required value={field.value} onChange={field.onChange} error={err('visuals.textColor')} hint="Colour of all text on the pass." />}
          />
          {background.kind !== 'image' && textColor.toUpperCase() !== suggestion && (
            <div className={cn('flex flex-wrap items-center gap-2 text-xs', lowContrast ? 'text-warning' : 'text-muted')}>
              {lowContrast ? 'Low contrast against the background.' : 'Suggested for contrast:'}
              <Button size="sm" variant="secondary" onClick={() => setValue('visuals.textColor', suggestion, { shouldDirty: true })}>
                Use {suggestion}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
