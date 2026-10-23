import { useId, type CSSProperties } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

/** Redesign data-viz series (blue → lilac → sky → mint → amber), repeated for more categories. */
export const SERIES = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

/** Donut with centre total and a legend (redesign "Membership Distribution"). Table view stays in ChartCard. */
export function Donut({ data, label, value, centerLabel }: { data: Datum[]; label: string; value: string; centerLabel: string }) {
  const total = data.reduce((sum, d) => sum + Number(d[value] ?? 0), 0)
  return (
    <div className="donut-wrap">
      <div className="relative mx-auto size-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={value} nameKey={label} innerRadius={64} outerRadius={88} paddingAngle={data.length > 1 ? 3 : 0} cornerRadius={8} stroke="none" animationDuration={1200}>
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <b className="font-display text-[30px] leading-none font-bold tracking-tight">{total.toLocaleString()}</b>
          <span className="mt-1 text-xs text-faint">{centerLabel}</span>
        </div>
      </div>
      <div className="legend">
        {data.map((d, i) => (
          <div key={String(d[label])} className="legend-row">
            <i style={{ '--c': SERIES[i % SERIES.length] } as CSSProperties} />
            <span>{d[label]}</span>
            <b>{Number(d[value] ?? 0).toLocaleString()}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Small decorative trend line for the feature stat card (yellow on ink). */
export function Sparkline({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, '')
  if (values.length < 2) return null
  const W = 260
  const H = 70
  const max = Math.max(...values)
  const min = Math.min(...values)
  const pts = values.map((v, i) => [(W * i) / (values.length - 1), H - 6 - ((H - 12) * (v - min)) / (max - min || 1)] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]!
  return (
    <svg className="chart h-[70px]" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`spk-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FFD43B" stopOpacity=".35" />
          <stop offset="1" stopColor="#FFD43B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="area" d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#spk-${id})`} />
      <path className="line" d={d} fill="none" stroke="#FFD43B" strokeWidth={2.4} style={{ '--len': 800 } as CSSProperties} />
      <circle cx={last[0]} cy={last[1]} r={4} fill="#FFD43B" />
    </svg>
  )
}

type Datum = Record<string, string | number>
interface ChartProps {
  data: Datum[]
  x: string
  y: string
  name: string
  height?: number
}

/**
 * Single-series charts in Bonuca Blue (accent token) styled like the redesign: gradient bars with
 * rounded tops, a drawn line with a soft area fill, recessive grid and an ink tooltip.
 */
const AXIS = { stroke: 'transparent', tick: { fill: 'var(--color-text-tertiary)', fontSize: 11 }, tickLine: false, axisLine: false }
const TOOLTIP = {
  contentStyle: { background: 'var(--color-ink)', border: 0, borderRadius: 12, color: 'var(--color-text-inverse)', fontSize: 12, boxShadow: 'var(--shadow-pop)', padding: '8px 11px' },
  labelStyle: { color: 'var(--color-text-inverse)', opacity: 0.7 },
  itemStyle: { color: 'var(--color-text-inverse)', fontWeight: 600 },
  cursor: { stroke: 'var(--chart-grid)', fill: 'var(--color-accent-softer)' },
}

export function AreaTrend({ data, x, y, name, height = 240 }: ChartProps) {
  const id = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis dataKey={x} {...AXIS} minTickGap={24} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip {...TOOLTIP} />
        <Area
          type="monotone"
          dataKey={y}
          name={name}
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          fill={`url(#fill-${id})`}
          dot={{ r: 3, strokeWidth: 2, stroke: 'var(--color-accent)', fill: 'var(--color-surface)' }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface)', fill: 'var(--color-accent)' }}
          animationDuration={1400}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Bars({ data, x, y, name, height = 240, horizontal = false }: ChartProps & { horizontal?: boolean }) {
  const id = useId().replace(/:/g, '')
  return (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <defs>
            <linearGradient id={`hbar-${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="#6C8BFF" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" {...AXIS} allowDecimals={false} />
          <YAxis type="category" dataKey={x} {...AXIS} width={110} />
          <Tooltip {...TOOLTIP} />
          <Bar dataKey={y} name={name} fill={`url(#hbar-${id})`} radius={[0, 99, 99, 0]} maxBarSize={22} background={{ fill: 'var(--color-surface-sunken)', radius: 99 }} animationDuration={900} />
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={`bar-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D66FF" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey={x} {...AXIS} minTickGap={12} />
          <YAxis {...AXIS} allowDecimals={false} />
          <Tooltip {...TOOLTIP} />
          <Bar dataKey={y} name={name} fill={`url(#bar-${id})`} radius={[8, 8, 8, 8]} maxBarSize={34} animationDuration={900} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
