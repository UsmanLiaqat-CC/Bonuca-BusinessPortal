import { useState, type ReactNode } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Tabs'
import { cn } from '@/lib/cn'

/**
 * Chart container with a Chart/Table toggle. The table view is the accessibility relief for
 * Bonuca Blue on the dark surface (contrast 2.96:1, below 3:1) and for screen-reader users.
 */
export function ChartCard({
  title,
  description,
  children,
  table,
  icon,
  filter,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  table: { columns: string[]; rows: (string | number)[][] }
  icon?: ReactNode
  /** Optional date filter (TimePresetChips) shown beside the Chart/Table toggle. */
  filter?: ReactNode
  className?: string
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card className={cn('reveal-up flex flex-col', className)}>
      <CardHeader
        title={title}
        description={description}
        icon={icon}
        split={false}
        actions={
          <>
          {filter}
          <Segmented
            label={`${title} view`}
            value={view}
            onChange={setView}
            items={[
              { value: 'chart', label: 'Chart' },
              { value: 'table', label: 'Table' },
            ]}
          />
          </>
        }
      />
      <div className="card-body flex-1">
        {view === 'chart' ? (
          children
        ) : (
          <div className="table-wrap max-h-[300px] overflow-auto rounded-[14px] border border-line">
            <table className="t">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  {table.columns.map((c, j) => (
                    <th key={c} scope="col" className={j ? 'num' : undefined}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className={j ? 'num' : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  )
}
