import { useId, useState } from 'react'
import { isHexColor } from '@/lib/color'

/** RGB colour picker with exact hex entry (spec: "Color picker (RGB)"). */
export function ColorField({ label, value, onChange, hint, error, required, disabled }: { label: string; value: string; onChange: (v: string) => void; hint?: string; error?: string; required?: boolean; disabled?: boolean }) {
  const id = useId()
  // Local draft only while the typed value is incomplete; otherwise mirror `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? value
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={isHexColor(value) ? value : '#000000'}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
        />
        <input
          id={id}
          value={text}
          disabled={disabled}
          maxLength={7}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
            if (isHexColor(v)) {
              setDraft(null)
              onChange(v.toUpperCase())
            } else setDraft(v)
          }}
          className="h-10 w-28 rounded-lg border border-line bg-surface px-3 font-mono text-sm uppercase focus:border-accent focus:outline-none"
        />
      </div>
      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
