import { useT, type MessageKey } from '@/i18n'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { presetRange, type RangePreset } from '@/lib/dates'
import type { DateRange } from '@/lib/metrics'

const PRESETS: { value: RangePreset; label: MessageKey }[] = [
  { value: 'today', label: 'ui.range.today' },
  { value: 'week', label: 'ui.range.week' },
  { value: 'month', label: 'ui.range.month' },
  { value: 'quarter', label: 'ui.range.quarter' },
  { value: 'custom', label: 'ui.range.custom' },
]

/** Dashboard filter (same chips as the Bonuca Admin dashboard). Owns its preset; reports the range. */
export function useRangeFilter(initial: Exclude<RangePreset, 'custom'> = 'month') {
  const [preset, setPreset] = useState<RangePreset>(initial)
  const [range, setRange] = useState<DateRange>(() => presetRange(initial))
  return {
    preset,
    range,
    choose(next: RangePreset) {
      setPreset(next)
      if (next !== 'custom') setRange(presetRange(next))
    },
    setCustom(from: string, to: string) {
      if (from && to && from <= to) setRange({ from, to })
    },
  }
}

export function TimePresetChips({ filter, label, className }: { filter: ReturnType<typeof useRangeFilter>; label: string; className?: string }) {
  const { preset, range } = filter
  const t = useT()
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div role="group" aria-label={label} className="flex w-fit flex-wrap items-center gap-1.5 rounded-full border border-line bg-surface-2/60 p-1">
        {PRESETS.map((p) => {
          const on = preset === p.value
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={on}
              onClick={() => filter.choose(p.value)}
              className={cn(
                'cursor-pointer rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all duration-200',
                on ? 'bg-accent text-on-accent shadow-sm' : 'text-muted hover:bg-surface hover:text-fg',
              )}
            >
              {t(p.label)}
            </button>
          )
        })}
      </div>
      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          {(['from', 'to'] as const).map((k) => (
            <label key={k} className="flex flex-col gap-0.5 text-[9px] font-bold tracking-wider text-muted uppercase">
              {k === 'from' ? 'From' : 'To'}
              <input
                type="date"
                value={range[k]}
                min={k === 'to' ? range.from : undefined}
                max={k === 'from' ? range.to : undefined}
                onChange={(e) => (k === 'from' ? filter.setCustom(e.target.value, range.to) : filter.setCustom(range.from, e.target.value))}
                className="cursor-pointer rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-fg normal-case transition-all duration-200 hover:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
