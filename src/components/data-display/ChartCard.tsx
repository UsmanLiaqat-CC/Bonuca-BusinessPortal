import { useState, type ReactNode } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/**
 * Chart container with a Chart/Table toggle. The table view is the accessibility relief for
 * Bonuca Blue on the dark surface (contrast 2.96:1, below 3:1) and for screen-reader users.
 */
export function ChartCard({ title, description, children, table, className }: { title: string; description?: string; children: ReactNode; table: { columns: string[]; rows: (string | number)[][] }; className?: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader
        title={title}
        description={description}
        actions={
          <div role="tablist" aria-label={`${title} view`} className="inline-flex rounded-lg border border-line p-0.5 text-xs">
            {(['chart', 'table'] as const).map((v) => (
              <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)} className={view === v ? 'rounded-md bg-surface-2 px-2.5 py-1 font-medium' : 'rounded-md px-2.5 py-1 text-muted hover:text-fg'}>
                {v === 'chart' ? 'Chart' : 'Table'}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 px-3 py-4">
        {view === 'chart' ? (
          children
        ) : (
          <div className="max-h-72 overflow-auto px-2">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  {table.columns.map((c) => (
                    <th key={c} scope="col" className="py-1.5 pr-3 font-medium">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {r.map((cell, j) => (
                      <td key={j} className="py-1.5 pr-3 tabular-nums">{cell}</td>
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
