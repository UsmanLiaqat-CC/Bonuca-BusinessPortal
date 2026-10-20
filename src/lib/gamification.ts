import type { Role, Transaction, User } from '@/types/domain'
import { addDays } from './dates'

/**
 * Employee ranking / gamification (spec §4.6). Motivational add-on only: this module is read-only
 * and must never be imported by access control or the scan engine (spec condition).
 * Badge criteria are provisional (OI-31). Window: last 30 days.
 */
export type BadgeId = 'scan_king' | 'fastest_scanner' | 'customer_hero'

export const BADGE_LABELS: Record<BadgeId, string> = {
  scan_king: 'Scan King',
  fastest_scanner: 'Fastest Scanner',
  customer_hero: 'Customer Hero',
}

export interface LeaderboardEntry {
  userId: string
  name: string
  role: Role
  scans: number
  avgSeconds: number | null
  customersServed: number
  badges: BadgeId[]
}

const MIN_SCANS_FOR_SPEED = 5

export function buildLeaderboard(users: User[], transactions: Transaction[], now: Date = new Date()): LeaderboardEntry[] {
  const since = addDays(now, -30)
  const recent = transactions.filter((t) => new Date(t.createdAt) >= since)
  const entries: LeaderboardEntry[] = users.map((u) => {
    const mine = recent.filter((t) => t.employeeId === u.id)
    const timed = mine.filter((t) => t.durationMs !== null)
    const avg = timed.length >= MIN_SCANS_FOR_SPEED ? timed.reduce((s, t) => s + (t.durationMs ?? 0), 0) / timed.length / 1000 : null
    return {
      userId: u.id,
      name: u.fullName,
      role: u.role,
      scans: mine.length,
      avgSeconds: avg === null ? null : Math.round(avg * 10) / 10,
      customersServed: new Set(mine.map((t) => t.customerId)).size,
      badges: [],
    }
  })
  const active = entries.filter((e) => e.scans > 0)
  const award = (badge: BadgeId, pick: (list: LeaderboardEntry[]) => LeaderboardEntry | undefined) => {
    const winner = pick(active)
    if (winner) winner.badges.push(badge)
  }
  award('scan_king', (l) => [...l].sort((a, b) => b.scans - a.scans)[0])
  award('fastest_scanner', (l) => l.filter((e) => e.avgSeconds !== null).sort((a, b) => a.avgSeconds! - b.avgSeconds!)[0])
  award('customer_hero', (l) => [...l].sort((a, b) => b.customersServed - a.customersServed)[0])
  return entries.sort((a, b) => b.scans - a.scans)
}
