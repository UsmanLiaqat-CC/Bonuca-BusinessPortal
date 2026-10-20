import { useId, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
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
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium" id={`${id}-label`}>
        {label}
        {required ? <span className="ml-0.5 text-danger" aria-hidden>*</span> : <span className="ml-1 text-xs font-normal text-muted">(optional)</span>}
      </span>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-surface-2',
            shape === 'square' ? 'size-16' : 'h-16 w-32',
          )}
        >
          {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5 text-muted" aria-hidden />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-50"
            aria-describedby={message ? `${id}-err` : hint ? `${id}-hint` : undefined}
          >
            {value ? 'Replace' : 'Upload'} <span className="sr-only">{label}</span>
          </button>
          {value && (
            <button type="button" disabled={disabled} onClick={() => onChange(null)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-50">
              <Trash2 className="size-3.5" aria-hidden /> Remove <span className="sr-only">{label}</span>
            </button>
          )}
        </div>
        <input ref={input} type="file" accept="image/*" className="hidden" aria-labelledby={`${id}-label`} onChange={(e) => onFile(e.target.files?.[0])} data-testid={`upload-${label}`} />
      </div>
      {message ? (
        <p id={`${id}-err`} className="text-xs text-danger" role="alert">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
