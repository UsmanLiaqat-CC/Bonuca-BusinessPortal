import { useState } from 'react'
import type { BusinessBranding, FontChoice } from '@/types/domain'
import { useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { isHexColor } from '@/lib/color'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { ColorField } from '@/components/forms/ColorField'
import { Field, Select } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { useUpdateBusiness } from '../hooks'

const FONTS: { value: FontChoice; label: string; stack: string }[] = [
  { value: 'system', label: 'System', stack: 'inherit' },
  { value: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
  { value: 'rounded', label: 'Rounded', stack: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif' },
]

export type BrandingSection = 'logo' | 'colors' | 'font'

/** The business's own branding (spec §4.10) — separate from Bonuca's platform tokens. */
export function BrandingForm({ sections = ['logo', 'colors', 'font'] }: { sections?: BrandingSection[] }) {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateBusiness()
  const [b, setB] = useState<BusinessBranding>(session.business.branding)
  const valid = [b.primaryColor, b.secondaryColor, b.backgroundColor].every(isHexColor)
  const font = FONTS.find((f) => f.value === b.font)!

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-5">
        {sections.includes('logo') && <ImageUpload label="Logo" value={b.logo} onChange={(logo) => setB({ ...b, logo })} />}
        {sections.includes('colors') && (
          <div className="grid gap-4 sm:grid-cols-3">
            <ColorField label="Primary Color" value={b.primaryColor} onChange={(primaryColor) => setB({ ...b, primaryColor })} />
            <ColorField label="Secondary Color" value={b.secondaryColor} onChange={(secondaryColor) => setB({ ...b, secondaryColor })} />
            <ColorField label="Background" value={b.backgroundColor} onChange={(backgroundColor) => setB({ ...b, backgroundColor })} />
          </div>
        )}
        {sections.includes('font') && (
          <Field label="Font" hint="Font options are provisional; Apple/Google Wallet passes do not support custom fonts.">
            {(p) => (
              <Select {...p} value={b.font} onChange={(e) => setB({ ...b, font: e.target.value as FontChoice })}>
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <div>
          <GuardedButton permission="branding.manage" loading={update.isPending} onClick={() => (valid ? update.mutate({ branding: b }, { onSuccess: () => toast.success('Branding saved.'), onError: (e) => toast.error(errorMessage(e)) }) : toast.error('Enter colours as #RRGGBB.'))}>
            Save
          </GuardedButton>
        </div>
      </div>
      <div className="rounded-card border border-line p-4" style={{ background: b.backgroundColor, fontFamily: font.stack }} aria-label="Branding preview">
        <div className="flex items-center gap-2">
          {b.logo ? <img src={b.logo} alt="" className="size-10 rounded-lg object-cover" /> : <span className="flex size-10 items-center justify-center rounded-lg text-white" style={{ background: b.primaryColor }}>{session.business.name.slice(0, 1)}</span>}
          <span className="font-semibold" style={{ color: b.secondaryColor }}>{session.business.name}</span>
        </div>
        <button type="button" tabIndex={-1} className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: b.primaryColor }}>
          Sample button
        </button>
        <p className="mt-3 text-xs" style={{ color: b.secondaryColor }}>Preview of your business colours on customer-facing surfaces.</p>
      </div>
    </div>
  )
}
