import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { errorMessage } from '@/lib/errors'

/** Uniform loading / error rendering for React Query results. */
export function QueryState<T>({
  query,
  children,
  loadingLabel,
}: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown }
  children: (data: T) => ReactNode
  loadingLabel?: string
}) {
  if (query.isPending) return <Spinner label={loadingLabel} />
  if (query.isError || query.data === undefined) {
    return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />
  }
  return <>{children(query.data)}</>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card empty border-danger/30">
      <span className="ill bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <p className="max-w-md text-sm text-fg">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty rounded-card border border-dashed border-line-strong bg-surface-muted py-10">
      {icon && (
        <span className="ill" aria-hidden>
          {icon}
        </span>
      )}
      <p className="font-display text-base font-semibold tracking-tight text-fg">{title}</p>
      {body && <div className="max-w-md text-sm">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
