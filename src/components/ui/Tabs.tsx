import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<T extends string> {
  value: T
  label: string
  count?: number
}

/** Positions the redesign's sliding "thumb" under the selected item of a `.tabs` / `.seg` group. */
function useThumb(selectedKey: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  useLayoutEffect(() => {
    const place = () => {
      const on = ref.current?.querySelector<HTMLElement>('[data-on="true"]')
      setThumb(on ? { left: on.offsetLeft, width: on.offsetWidth } : null)
    }
    place()
    void document.fonts?.ready.then(place)
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [selectedKey])
  return { ref, style: thumb ? { left: thumb.left, width: thumb.width } : { width: 0 } }
}

export function Tabs<T extends string>({ items, value, onChange, label, className }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const { ref, style } = useThumb(`${value}|${items.map((i) => `${i.label}${i.count ?? ''}`).join()}`)
  return (
    <div ref={ref} role="tablist" aria-label={label} className={cn('tabs flex-nowrap overflow-x-auto', className)}>
      <span className="thumb" style={style} aria-hidden />
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button key={item.value} role="tab" type="button" aria-selected={selected} data-on={selected} onClick={() => onChange(item.value)} className={cn('whitespace-nowrap', selected && 'on')}>
            {item.label}
            {item.count !== undefined && <span className="count">{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export interface SegmentItem<T extends string> {
  value: T
  label: ReactNode
  /** Accessible name when the label is an icon. */
  ariaLabel?: string
  title?: string
}

/** Redesign segmented control (`.seg`): Chart/Table, device, theme switches. */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  role = 'tablist',
  icons,
  className,
}: {
  items: SegmentItem<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  /** `tablist` for view switches, `radiogroup` for preferences. */
  role?: 'tablist' | 'radiogroup'
  icons?: boolean
  className?: string
}) {
  const { ref, style } = useThumb(value)
  const itemRole = role === 'tablist' ? 'tab' : 'radio'
  return (
    <div ref={ref} role={role} aria-label={label} className={cn('seg', icons && 'icons', className)}>
      <span className="thumb" style={style} aria-hidden />
      {items.map((item) => {
        const on = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role={itemRole}
            {...(itemRole === 'tab' ? { 'aria-selected': on } : { 'aria-checked': on })}
            aria-label={item.ariaLabel}
            title={item.title}
            data-on={on}
            className={cn(on && 'on')}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
