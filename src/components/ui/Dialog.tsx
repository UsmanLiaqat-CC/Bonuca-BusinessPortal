import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/** Redesign modal: blurred backdrop, spring scale-in; closes on Esc, × or backdrop click. */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    restoreFocus.current = document.activeElement as HTMLElement | null
    const first = panel.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')
    ;(first ?? panel.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab' && panel.current) {
        const items = panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]):not(.hidden), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
        if (!items.length) return
        const firstEl = items[0]!
        const lastEl = items[items.length - 1]!
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      restoreFocus.current?.focus()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div role="presentation" className="backdrop px-3 pt-16 sm:px-5 sm:pt-24" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('modal flex max-h-[calc(100vh-6rem)] flex-col text-fg', size === 'sm' ? 'max-w-[440px]' : size === 'lg' && 'wide')}
      >
        <div className="modal-head">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl tracking-[-0.025em]">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13.5px] text-muted">{description}</p>}
          </div>
          <button type="button" data-close onClick={onClose} className="icon-btn" aria-label="Close dialog">
            <X className="size-[18px]" />
          </button>
        </div>
        {children && <div className="modal-body overflow-y-auto">{children}</div>}
        {footer && <div className="modal-foot flex-wrap">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  tone = 'primary',
  loading,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  body: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  loading?: boolean
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-muted">{body}</div>
    </Dialog>
  )
}
