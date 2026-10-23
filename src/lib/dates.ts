export const DAY_MS = 86_400_000

export function daysBetween(fromIso: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(fromIso).getTime()) / DAY_MS)
}

/** Calendar-day arithmetic (DST-safe). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Monday-based start of week. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const offset = (d.getDay() + 6) % 7
  return addDays(d, -offset)
}

export function startOfMonth(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatDate(iso: string | null, locale = 'en'): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(iso: string | null, locale = 'en'): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export type RangePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom'

/** Inclusive `YYYY-MM-DD` range for a dashboard filter chip (week starts Monday). */
export function presetRange(preset: Exclude<RangePreset, 'custom'>, now: Date = new Date()): { from: string; to: string } {
  const today = startOfDay(now)
  if (preset === 'today') return { from: dayKey(today), to: dayKey(today) }
  if (preset === 'week') {
    const from = startOfWeek(now)
    return { from: dayKey(from), to: dayKey(addDays(from, 6)) }
  }
  if (preset === 'month') return { from: dayKey(startOfMonth(now)), to: dayKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)) }
  const q = Math.floor(now.getMonth() / 3)
  return { from: dayKey(new Date(now.getFullYear(), q * 3, 1)), to: dayKey(new Date(now.getFullYear(), q * 3 + 3, 0)) }
}
