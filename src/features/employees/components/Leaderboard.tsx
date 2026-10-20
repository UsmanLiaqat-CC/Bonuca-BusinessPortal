import { Award, Gauge, Heart, Trophy } from 'lucide-react'
import { BADGE_LABELS, type BadgeId } from '@/lib/gamification'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useLeaderboard } from '../hooks'

const BADGE_ICON: Record<BadgeId, typeof Trophy> = { scan_king: Trophy, fastest_scanner: Gauge, customer_hero: Heart }

/** Spec §4.6 leaderboard — motivational only; never affects permissions or transactions. */
export function Leaderboard() {
  const board = useLeaderboard()
  return (
    <Card>
      <CardHeader title="Leaderboard" description="Scan counts and speed over the last 30 days." />
      <QueryState query={board}>
        {(rows) => {
          const active = rows.filter((r) => r.scans > 0)
          if (!active.length) return <div className="p-5"><EmptyState icon={<Award className="size-6" />} title="No scans in the last 30 days" /></div>
          return (
            <ol className="divide-y divide-line">
              {active.map((r, i) => (
                <li key={r.userId} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-6 text-center font-semibold text-muted">{i + 1}</span>
                  <span className="min-w-32 flex-1 font-medium">{r.name}</span>
                  <span className="tabular-nums">{r.scans} scans</span>
                  <span className="text-muted tabular-nums">{r.avgSeconds === null ? '— s avg' : `${r.avgSeconds}s avg`}</span>
                  <span className="flex flex-wrap gap-1">
                    {r.badges.map((b) => {
                      const Icon = BADGE_ICON[b]
                      return (
                        <Badge key={b} tone="accent">
                          <Icon className="size-3" aria-hidden /> {BADGE_LABELS[b]}
                        </Badge>
                      )
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )
        }}
      </QueryState>
    </Card>
  )
}
