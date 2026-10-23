import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  optional?: boolean
  className?: string
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}

/** Label + control + hint/error wiring with accessible ids (redesign `.field`). */
export function Field({ label, hint, error, required, optional, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('field', error && 'has-error', className)}>
      <label htmlFor={id} className="label">
        <span>
          {label}
          {required && (
            <span className="req ml-0.5" aria-hidden>
              *
            </span>
          )}
        </span>
        {optional && <span className="opt">(optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="error-msg" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn('input', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cn('select', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn('textarea', className)} {...rest} />
})

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className={cn('check items-start', className)}>
      <input ref={ref} type="checkbox" {...rest} />
      <span className="pt-px">{label}</span>
    </label>
  )
})

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
  id?: string
  /** Render without the redesign's option-row box (e.g. inside a card header). */
  plain?: boolean
}

/** Switch — toggle-ON state uses Bonuca Blue (spec §4.10 token mapping). */
export function Toggle({ checked, onChange, label, description, disabled, id, plain }: ToggleProps) {
  const auto = useId()
  const toggleId = id ?? auto
  return (
    <div className={cn(plain ? 'flex items-center justify-between gap-4' : 'option-row', disabled && 'locked')}>
      <div className="min-w-0">
        <label id={`${toggleId}-label`} htmlFor={toggleId} className="block text-sm font-semibold">
          {label}
        </label>
        {description && <small className="block text-[12.5px] text-muted">{description}</small>}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${toggleId}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] left-[3px] size-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.25)] transition-transform duration-[240ms] ease-[cubic-bezier(.34,1.56,.64,1)]',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}
