import { useId, useRef, useState } from 'react'
import { AlertCircle, ImagePlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const MAX_BYTES = 512 * 1024

/** Image upload stored as a data URL (development storage). Production would upload to asset storage. */
export function ImageUpload({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  disabled,
  shape = 'square',
}: {
  label: string
  value: string | null
  onChange: (v: string | null) => void
  required?: boolean
  hint?: string
  error?: string
  disabled?: boolean
  shape?: 'square' | 'wide'
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const message = localError ?? error

  const onFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setLocalError('Choose an image file.')
    if (file.size > MAX_BYTES) return setLocalError('Image must be 512 KB or smaller.')
    setLocalError(null)
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.onerror = () => setLocalError('Could not read this image.')
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('field', message && 'has-error')}>
      <span className="label" id={`${id}-label`}>
        <span>
          {label}
          {required && (
            <span className="req ml-0.5" aria-hidden>
              *
            </span>
          )}
        </span>
        {!required && <span className="opt">(optional)</span>}
      </span>
      <div className="upload flex-wrap">
        <div className={cn('tile overflow-hidden', shape === 'wide' && 'wide', value && 'border-solid bg-surface')}>
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-[22px]" aria-hidden />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="btn btn-ghost btn-sm"
            aria-describedby={message ? `${id}-err` : hint ? `${id}-hint` : undefined}
          >
            {value ? 'Replace' : 'Upload'} <span className="sr-only">{label}</span>
          </button>
          {value && (
            <button type="button" disabled={disabled} onClick={() => onChange(null)} className="btn btn-danger-text btn-sm">
              <Trash2 className="size-3.5" aria-hidden /> Remove <span className="sr-only">{label}</span>
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" aria-labelledby={`${id}-label`} onChange={(e) => onFile(e.target.files?.[0])} data-testid={`upload-${label}`} />
      </div>
      {message ? (
        <p id={`${id}-err`} className="error-msg" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
