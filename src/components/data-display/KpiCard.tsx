import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CountUp } from './StatCard'
import { KpiIcon, type KpiIconName } from './KpiIcons'

export type KpiAccent = 'primary' | 'success' | 'warning' | 'danger'

const GLOW: Record<KpiAccent, string> = {
  primary: 'bg-accent-soft',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
}

/** Percentage change vs the previous period; `null` when the baseline is 0 (no meaningful %). */
export function trendPercent(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100
}

/** Admin-style KPI card: illustrated icon, soft glow, count-up value, trend pill and caption. */
export function KpiCard({
  label,
  value,
  icon,
  accent = 'primary',
  trend,
  hint,
  className,
}: {
  label: string
  value: number
  icon: KpiIconName
  accent?: KpiAccent
  /** % vs the previous period; omit for figures that do not depend on the filter. */
  trend?: number | null
  /** Caption under the label (e.g. "All time"). */
  hint?: string
  className?: string
}) {
  const up = (trend ?? 0) >= 0
  const TrendIcon = up ? TrendingUp : TrendingDown
  return (
    <div className={cn('group reveal-up relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]', className)}>
      <div className={cn('pointer-events-none absolute -top-12 -right-10 size-32 rounded-full opacity-70 blur-2xl transition-opacity group-hover:opacity-100', GLOW[accent])} />
      <div className="relative flex items-start justify-between gap-2">
        <div className="size-14 transition-transform duration-300 group-hover:scale-110">
          <KpiIcon name={icon} className="size-14" />
        </div>
        {trend !== undefined && trend !== null && (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold', up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            <TrendIcon className="size-3" aria-hidden />
            {up ? '+' : ''}
            {trend.toFixed(0)}%
          </span>
        )}
      </div>
      <p className="relative mt-4 text-[27px] leading-none font-bold tracking-tight whitespace-nowrap text-fg tabular-nums">
        <CountUp value={value} />
      </p>
      <p className="relative mt-2 text-xs font-medium text-muted">{label}</p>
      {(trend !== undefined || hint) && <p className="relative mt-0.5 text-[11px] text-faint">{hint ?? 'vs. previous period'}</p>}
    </div>
  )
}
