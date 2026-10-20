import { WEEKDAY_LABELS } from '@/lib/metrics'

/** Day/time activity heatmap (spec §4.9). Sequential single hue (Bonuca Blue) light → dark. */
export function Heatmap({ data, max }: { data: number[][]; max: number }) {
  const step = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)))
  const OPACITY = [0, 0.18, 0.4, 0.65, 1]
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-[2px] text-[10px]" aria-label="Scans by weekday and hour">
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Day</span></th>
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} scope="col" className="w-5 font-normal text-muted">{h % 3 === 0 ? h : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, d) => (
            <tr key={d}>
              <th scope="row" className="pr-2 text-left font-normal text-muted">{WEEKDAY_LABELS[d]}</th>
              {row.map((v, h) => (
                <td key={h} className="size-5 rounded-[3px] bg-surface-2 p-0" title={`${WEEKDAY_LABELS[d]} ${h}:00 — ${v} scans`} aria-label={`${WEEKDAY_LABELS[d]} ${h}:00, ${v} scans`}>
                  <div className="size-5 rounded-[3px]" style={{ background: 'var(--bn-accent)', opacity: OPACITY[step(v)] }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted" aria-hidden>
        Fewer
        {OPACITY.map((o, i) => (
          <span key={i} className="size-3 rounded-[2px] bg-surface-2">
            <span className="block size-3 rounded-[2px]" style={{ background: 'var(--bn-accent)', opacity: o }} />
          </span>
        ))}
        More
      </div>
    </div>
  )
}
