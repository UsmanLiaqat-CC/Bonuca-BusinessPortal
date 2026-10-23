import { useId, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { isHexColor } from '@/lib/color'
import { cn } from '@/lib/cn'

/** RGB colour picker with exact hex entry (spec: "Color picker (RGB)"), redesign swatch + mono hex input. */
export function ColorField({ label, value, onChange, hint, error, required, disabled }: { label: string; value: string; onChange: (v: string) => void; hint?: string; error?: string; required?: boolean; disabled?: boolean }) {
  const id = useId()
  // Local draft only while the typed value is incomplete; otherwise mirror `value`.
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? value
  return (
    <div className={cn('field', error && 'has-error')}>
      <label htmlFor={id} className="label">
        <span>
          {label}
          {required && (
            <span className="req ml-0.5" aria-hidden>
              *
            </span>
          )}
        </span>
      </label>
      <div className="color-input">
        <span className={cn('swatch relative', !disabled && 'cursor-pointer')}>
          <i style={{ '--c': isHexColor(value) ? value : '#000000' } as React.CSSProperties} />
          <input
            type="color"
            aria-label={`${label} picker`}
            value={isHexColor(value) ? value : '#000000'}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
        </span>
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
          className="input uppercase"
        />
      </div>
      {error ? (
        <p className="error-msg" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  )
}
