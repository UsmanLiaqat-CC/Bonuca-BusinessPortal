import { useId, useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import type { Permission, Decision } from '@/lib/access'
import { useAccess } from '@/state/session'
import { buttonClass, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

export interface GuardedButtonProps {
  permission: Permission
  /** Additional decision (e.g. a plan limit) evaluated after the permission. */
  extra?: Decision
  onClick?: () => void
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit'
  loading?: boolean
  className?: string
  form?: string
}

/**
 * Button that stays visible but disabled when the action is not allowed (spec §2: "Buttons stay
 * visible but disabled"), and explains why — in Preview Mode with the exact required message.
 */
export function GuardedButton({ permission, extra, onClick, children, variant = 'primary', size = 'md', type = 'button', loading, className, form }: GuardedButtonProps) {
  const access = useAccess()
  const base = access.evaluate(permission)
  const decision = !base.allowed ? base : extra && !extra.allowed ? extra : base
  const [showReason, setShowReason] = useState(false)
  const reasonId = useId()

  if (decision.allowed) {
    return (
      <button type={type} form={form} onClick={loading ? undefined : onClick} aria-busy={loading || undefined} className={buttonClass(variant, size, className)}>
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    )
  }

  return (
    <span className="relative inline-flex" onMouseEnter={() => setShowReason(true)} onMouseLeave={(e) => !e.currentTarget.contains(document.activeElement) && setShowReason(false)}>
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={reasonId}
        onClick={(e) => {
          e.preventDefault()
          setShowReason(true)
        }}
        onFocus={() => setShowReason(true)}
        onKeyDown={(e) => e.key === 'Escape' && setShowReason(false)}
        onBlur={() => setShowReason(false)}
        className={buttonClass(variant, size, className)}
        data-locked={decision.reason}
      >
        <Lock className="size-3.5" aria-hidden />
        {children}
      </button>
      <span
        id={reasonId}
        role="tooltip"
        className={
          showReason
            ? 'absolute top-full right-0 z-40 mt-2 w-64 rounded-lg border border-line bg-surface p-3 text-xs text-fg shadow-card'
            : 'sr-only'
        }
      >
        {decision.message}
      </span>
    </span>
  )
}
