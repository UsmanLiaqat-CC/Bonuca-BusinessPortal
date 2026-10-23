import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
  /** Hide on narrow screens. */
  hideOnMobile?: boolean
}

/** Redesign table (`table.t`): uppercase muted header row, soft row hover. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; onRowClick?: (row: T) => void; caption?: string }) {
  return (
    <div className="table-wrap">
      <table className="t">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn(c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(onRowClick && 'clickable')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(row)) : undefined}
              aria-label={onRowClick ? 'Open details' : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn(c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PALETTE: [string, string][] = [
  ['#1747F8', '#E8EDFF'],
  ['#7C3AED', '#F1EAFF'],
  ['#0F9D6E', '#E3F6EE'],
  ['#C2410C', '#FFEFE4'],
  ['#BE185D', '#FDE7F1'],
  ['#0369A1', '#E3F2FB'],
  ['#7A5B00', '#FFF4CC'],
]

/**
 * Coloured initials avatar used in the redesign's people tables. Colour is a stable hash of the name.
 * The letters are drawn with CSS (`::before`) so they never leak into the row's text content.
 */
export function Initials({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const [fg, bg] = PALETTE[hash % PALETTE.length]!
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span className={cn('ini before:content-[attr(data-ini)]', className)} data-ini={letters || '?'} style={{ '--fg': fg, '--bg': bg } as React.CSSProperties} aria-hidden />
  )
}
