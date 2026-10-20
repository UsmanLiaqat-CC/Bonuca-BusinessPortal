import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Datum = Record<string, string | number>
interface ChartProps {
  data: Datum[]
  x: string
  y: string
  name: string
  height?: number
}

/** Single-series charts in Bonuca Blue (accent token); recessive grid and axes; hover tooltips. */
const AXIS = { stroke: 'var(--bn-border)', tick: { fill: 'var(--bn-muted)', fontSize: 11 }, tickLine: false }
const TOOLTIP = {
  contentStyle: { background: 'var(--bn-surface)', border: '1px solid var(--bn-border)', borderRadius: 8, color: 'var(--bn-fg)', fontSize: 12 },
  labelStyle: { color: 'var(--bn-muted)' },
  cursor: { stroke: 'var(--bn-border)', fill: 'var(--bn-surface-2)' },
}

export function AreaTrend({ data, x, y, name, height = 220 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={`fill-${y}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bn-accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--bn-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--bn-border)" strokeDasharray="0" />
        <XAxis dataKey={x} {...AXIS} minTickGap={24} />
        <YAxis {...AXIS} axisLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP} />
        <Area type="monotone" dataKey={y} name={name} stroke="var(--bn-accent)" strokeWidth={2} fill={`url(#fill-${y})`} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bn-surface)' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Bars({ data, x, y, name, height = 220, horizontal = false }: ChartProps & { horizontal?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--bn-border)" />
          <XAxis type="number" {...AXIS} allowDecimals={false} />
          <YAxis type="category" dataKey={x} {...AXIS} axisLine={false} width={110} />
          <Tooltip {...TOOLTIP} />
          <Bar dataKey={y} name={name} fill="var(--bn-accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--bn-border)" />
          <XAxis dataKey={x} {...AXIS} minTickGap={12} />
          <YAxis {...AXIS} axisLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} />
          <Bar dataKey={y} name={name} fill="var(--bn-accent)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}
