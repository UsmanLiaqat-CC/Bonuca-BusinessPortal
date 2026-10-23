import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="empty" role="status">
      <span className="ill">
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </span>
      <span className="text-sm">{label}</span>
    </div>
  )
}
