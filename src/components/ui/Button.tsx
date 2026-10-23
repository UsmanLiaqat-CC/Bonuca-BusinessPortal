import { forwardRef, type ButtonHTMLAttributes, type PointerEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Redesign button styles (`.btn-*` in redesign/styles/app.css). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ink' | 'soft'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-ghost',
  ghost: 'btn-text',
  danger: 'btn-danger',
  ink: 'btn-ink',
  soft: 'btn-soft',
}
const SIZES: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra?: string) => cn('btn', VARIANTS[variant], SIZES[size], extra)

/** Click ripple from the redesign. Purely cosmetic; skipped when the user prefers reduced motion. */
export function ripple(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const r = el.getBoundingClientRect()
  const d = Math.max(r.width, r.height)
  const s = document.createElement('span')
  s.className = 'ripple'
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`
  el.appendChild(s)
  window.setTimeout(() => s.remove(), 600)
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', onPointerDown, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      onPointerDown={(e) => {
        ripple(e)
        onPointerDown?.(e)
      }}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
