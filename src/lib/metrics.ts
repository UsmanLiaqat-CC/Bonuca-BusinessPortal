import type { BusinessDataset, Transaction } from '@/types/domain'
import { DAY_MS, addDays, dayKey, monthKey, startOfDay, startOfMonth, startOfWeek } from './dates'
import { rewardStatus } from './rewards'

/**
 * Dashboard (§4.1) and Analytics (§4.9) computations.
 * Definitions: a "scan" is one confirmed transaction; a "visit" is one customer on one calendar day.
 * Analytics use a fixed last-30-days window (OI-34).
 */

function visitKeys(txs: Transaction[]): Set<string> {
  return new Set(txs.map((t) => `${t.customerId}|${dayKey(new Date(t.createdAt))}`))
}

/** Inclusive calendar-day range, `YYYY-MM-DD` (the dashboard filter chips). */
export interface DateRange {
  from: string
  to: string
}

export interface PeriodStats {
  newMembers: number
  scans: number
  visits: number
  returningCustomers: number
  newWalletCards: number
}

function inRange(iso: string, r: DateRange): boolean {
  const k = dayKey(new Date(iso))
  return k >= r.from && k <= r.to
}

/** The equally long range that ends the day before `r` starts (trend baseline). */
export function previousRange(r: DateRange): DateRange {
  const from = new Date(`${r.from}T00:00:00`)
  const to = new Date(`${r.to}T00:00:00`)
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1
  return { from: dayKey(addDays(from, -days)), to: dayKey(addDays(from, -1)) }
}

function periodStats(ds: BusinessDataset, r: DateRange): PeriodStats {
  const txs = ds.transactions.filter((t) => inRange(t.createdAt, r))
  const perCustomer = new Map<string, number>()
  for (const key of visitKeys(txs)) {
    const id = key.split('|')[0]!
    perCustomer.set(id, (perCustomer.get(id) ?? 0) + 1)
  }
  return {
    newMembers: ds.customers.filter((c) => inRange(c.createdAt, r)).length,
    scans: txs.length,
    visits: visitKeys(txs).size,
    returningCustomers: [...perCustomer.values()].filter((n) => n >= 2).length,
    newWalletCards: ds.memberships.filter((m) => inRange(m.joinedAt, r)).length,
  }
}

export interface DashboardStats {
  /** Figures for the selected filter range and the equally long range before it (trend baseline). */
  range: DateRange
  period: PeriodStats
  previous: PeriodStats
  totalMembers: number
  newToday: number
  newThisWeek: number
  newThisMonth: number
  totalScans: number
  activePrograms: number
  walletCards: number
  visits: number
  returningCustomers: number
  membershipDistribution: { name: string; value: number }[]
  customerGrowth: { date: string; total: number }[]
  dailyScans: { date: string; scans: number }[]
  monthlyGrowth: { month: string; newMembers: number }[]
  topPrograms: { name: string; scans: number; members: number }[]
}

/** Default dashboard filter: this month (matches the "This Month" chip). */
export function defaultRange(now: Date): DateRange {
  const from = startOfMonth(now)
  const to = new Date(from.getFullYear(), from.getMonth() + 1, 0)
  return { from: dayKey(from), to: dayKey(to) }
}

export function dashboardStats(ds: BusinessDataset, now: Date = new Date(), range: DateRange = defaultRange(now)): DashboardStats {
  const today = startOfDay(now)
  const week = startOfWeek(now)
  const month = startOfMonth(now)
  const created = ds.customers.map((c) => new Date(c.createdAt))

  const visitsPerCustomer = new Map<string, number>()
  for (const key of visitKeys(ds.transactions)) {
    const id = key.split('|')[0]!
    visitsPerCustomer.set(id, (visitsPerCustomer.get(id) ?? 0) + 1)
  }

  const programName = new Map(ds.programs.map((p) => [p.id, p.name]))
  const membershipDistribution = ds.programs
    .filter((p) => p.status !== 'archived')
    .map((p) => ({ name: p.name, value: ds.memberships.filter((m) => m.programId === p.id && inRange(m.joinedAt, range)).length }))
    .filter((d) => d.value > 0)

  const growthStart = addDays(today, -29)
  const customerGrowth = Array.from({ length: 30 }, (_, i) => {
    const day = addDays(growthStart, i)
    const end = addDays(day, 1)
    return { date: dayKey(day), total: created.filter((d) => d < end).length }
  })

  const scansByDay = new Map<string, number>()
  for (const t of ds.transactions) {
    const k = dayKey(new Date(t.createdAt))
    scansByDay.set(k, (scansByDay.get(k) ?? 0) + 1)
  }
  const dailyScans = Array.from({ length: 30 }, (_, i) => {
    const k = dayKey(addDays(growthStart, i))
    return { date: k, scans: scansByDay.get(k) ?? 0 }
  })

  const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(month)
    d.setMonth(d.getMonth() - (11 - i))
    const k = monthKey(d)
    return { month: k, newMembers: created.filter((c) => monthKey(c) === k).length }
  })

  const topPrograms = ds.programs
    .map((p) => ({
      name: programName.get(p.id) ?? p.id,
      scans: ds.transactions.filter((t) => t.programId === p.id && inRange(t.createdAt, range)).length,
      members: ds.memberships.filter((m) => m.programId === p.id && inRange(m.joinedAt, range)).length,
    }))
    .filter((p) => p.scans > 0 || p.members > 0)
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5)

  return {
    range,
    period: periodStats(ds, range),
    previous: periodStats(ds, previousRange(range)),
    totalMembers: ds.customers.length,
    newToday: created.filter((d) => d >= today).length,
    newThisWeek: created.filter((d) => d >= week).length,
    newThisMonth: created.filter((d) => d >= month).length,
    totalScans: ds.transactions.length,
    activePrograms: ds.programs.filter((p) => p.status === 'active').length,
    walletCards: ds.memberships.length + ds.rewards.filter((r) => r.source === 'voucher').length,
    visits: visitKeys(ds.transactions).size,
    returningCustomers: [...visitsPerCustomer.values()].filter((n) => n >= 2).length,
    membershipDistribution,
    customerGrowth,
    dailyScans,
    monthlyGrowth,
    topPrograms,
  }
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export interface AnalyticsStats {
  visitors: number
  returningCustomers: number
  retentionPercent: number | null
  visitFrequency: number
  rewardRedemptions: number
  topMembers: { customerId: string; name: string; visits: number }[]
  mostActiveDays: { day: string; scans: number }[]
  growth: { week: string; newMembers: number }[]
  growthPercent: number | null
  /** heatmap[weekday 0=Mon][hour 0-23] = scans */
  heatmap: number[][]
  heatmapMax: number
}

export function analyticsStats(ds: BusinessDataset, now: Date = new Date()): AnalyticsStats {
  const windowStart = addDays(startOfDay(now), -29)
  const prevStart = addDays(windowStart, -30)
  const inWindow = ds.transactions.filter((t) => new Date(t.createdAt) >= windowStart)
  const prevWindow = ds.transactions.filter((t) => {
    const d = new Date(t.createdAt)
    return d >= prevStart && d < windowStart
  })

  const allVisitDays = new Map<string, Set<string>>()
  for (const t of ds.transactions) {
    if (new Date(t.createdAt) > now) continue
    const set = allVisitDays.get(t.customerId) ?? new Set<string>()
    set.add(dayKey(new Date(t.createdAt)))
    allVisitDays.set(t.customerId, set)
  }

  const visitorIds = new Set(inWindow.map((t) => t.customerId))
  const returning = [...visitorIds].filter((id) => (allVisitDays.get(id)?.size ?? 0) >= 2).length
  const prevIds = new Set(prevWindow.map((t) => t.customerId))
  const retained = [...prevIds].filter((id) => visitorIds.has(id)).length
  const windowVisits = visitKeys(inWindow).size

  const customerName = new Map(ds.customers.map((c) => [c.id, c.name]))
  const visitsByCustomer = new Map<string, number>()
  for (const key of visitKeys(inWindow)) {
    const id = key.split('|')[0]!
    visitsByCustomer.set(id, (visitsByCustomer.get(id) ?? 0) + 1)
  }
  const topMembers = [...visitsByCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([customerId, visits]) => ({ customerId, name: customerName.get(customerId) ?? customerId, visits }))

  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const t of inWindow) {
    const d = new Date(t.createdAt)
    heatmap[(d.getDay() + 6) % 7]![d.getHours()]!++
  }
  const mostActiveDays = WEEKDAY_LABELS.map((day, i) => ({ day, scans: heatmap[i]!.reduce((a, b) => a + b, 0) }))

  const weekStart = startOfWeek(now)
  const growth = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(weekStart, -7 * (11 - i))
    const end = addDays(start, 7)
    return {
      week: dayKey(start),
      newMembers: ds.customers.filter((c) => {
        const d = new Date(c.createdAt)
        return d >= start && d < end
      }).length,
    }
  })
  const newInWindow = ds.customers.filter((c) => new Date(c.createdAt) >= windowStart).length
  const newInPrev = ds.customers.filter((c) => {
    const d = new Date(c.createdAt)
    return d >= prevStart && d < windowStart
  }).length

  return {
    visitors: visitorIds.size,
    returningCustomers: returning,
    retentionPercent: prevIds.size ? Math.round((retained / prevIds.size) * 100) : null,
    visitFrequency: visitorIds.size ? Math.round((windowVisits / visitorIds.size) * 10) / 10 : 0,
    rewardRedemptions: ds.rewards.filter(
      (r) => rewardStatus(r, now) === 'redeemed' && r.redeemedAt && new Date(r.redeemedAt) >= windowStart,
    ).length,
    topMembers,
    mostActiveDays,
    growth,
    growthPercent: newInPrev ? Math.round(((newInWindow - newInPrev) / newInPrev) * 100) : null,
    heatmap,
    heatmapMax: Math.max(0, ...heatmap.flat()),
  }
}
