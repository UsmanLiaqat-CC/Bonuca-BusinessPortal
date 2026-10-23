import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, hover, ...rest }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return <div className={cn('card', hover && 'hover', className)} {...rest} />
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  step,
  split = true,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Optional icon shown in the redesign's rounded icon tile next to the title. */
  icon?: ReactNode
  /** Numbered form section (redesign ink number badge). */
  step?: number
  /** Draw the divider under the header (default). */
  split?: boolean
  className?: string
}) {
  return (
    <div className={cn('card-head flex-wrap', split && 'split', className)}>
      <div className={cn(step !== undefined && 'flex items-start gap-3')}>
        {step !== undefined && (
          <span className="badge ink lg w-7 shrink-0 justify-center p-0" aria-hidden>
            {step}
          </span>
        )}
        <div className="min-w-0">
        <h2 className="card-title">
          {icon && (
            <span className="ic" aria-hidden>
              {icon}
            </span>
          )}
          {title}
        </h2>
        {description && <p className="card-sub">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-body', className)} {...rest} />
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-foot flex-wrap', className)} {...rest} />
}
