import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Count-up on first render (redesign). Skipped for reduced motion, tests and browser automation. */
function useCountUp(target: number) {
  const animate =
    import.meta.env.MODE !== 'test' && typeof navigator !== 'undefined' && !navigator.webdriver && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (!animate) return
    const t0 = performance.now()
    let frame = 0
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1100)
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, animate])
  return animate ? shown : target
}

export function CountUp({ value }: { value: number }) {
  return <>{useCountUp(value).toLocaleString()}</>
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  feature,
  progress,
  className,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  /** Black "feature" card from the redesign (blue gradient in dark mode). */
  feature?: boolean
  /** Optional 0–100 progress bar under the value. */
  progress?: number
  className?: string
}) {
  return (
    <div className={cn('card stat hover reveal-up', feature && 'feature', className)}>
      <div className="lbl">
        <span>{label}</span>
        {icon && (
          <span className="ico" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <p className="val">{typeof value === 'number' && Number.isInteger(value) ? <CountUp value={value} /> : value}</p>
      {hint && <p className="note">{hint}</p>}
      {progress !== undefined && (
        <div className="bar" aria-hidden>
          <i style={{ '--w': `${Math.max(0, Math.min(100, progress))}%` } as React.CSSProperties} />
        </div>
      )}
    </div>
  )
}
