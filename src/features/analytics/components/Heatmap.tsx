import { WEEKDAY_LABELS } from '@/lib/metrics'

/** Day/time activity heatmap (spec §4.9). Sequential single hue (Bonuca Blue) light → dark. */
export function Heatmap({ data, max }: { data: number[][]; max: number }) {
  const step = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)))
  const OPACITY = [0, 0.18, 0.4, 0.65, 1]
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-[11px]" aria-label="Scans by weekday and hour">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Day</span></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} scope="col" className="w-[22px] font-normal text-faint">{h % 3 === 0 ? h : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, d) => (
            <tr key={d}>
              <th scope="row" className="pr-2 text-left font-normal text-faint">{WEEKDAY_LABELS[d]}</th>
              {row.map((v, h) => (
                <td key={h} className="relative size-[22px] rounded-[6px] bg-surface-2 p-0 transition-transform hover:z-10 hover:scale-125 hover:shadow-[0_0_0_2px_var(--color-surface),0_0_0_3px_var(--color-accent)]" title={`${WEEKDAY_LABELS[d]} ${h}:00 — ${v} scans`} aria-label={`${WEEKDAY_LABELS[d]} ${h}:00, ${v} scans`}>
                  <div className="size-[22px] rounded-[6px] [animation:rd-pop-scale_.4s_var(--ease-out)_backwards]" style={{ background: 'var(--bn-accent)', opacity: OPACITY[step(v)], animationDelay: `${(d * 24 + h) * 4}ms` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="heat-legend" aria-hidden>
        Fewer
        {OPACITY.map((o, i) => (
          <span key={i} className="size-3.5 rounded-[4px] bg-surface-2">
            <span className="block size-3.5 rounded-[4px]" style={{ background: 'var(--bn-accent)', opacity: o }} />
          </span>
        ))}
        More
      </div>
    </div>
  )
}
