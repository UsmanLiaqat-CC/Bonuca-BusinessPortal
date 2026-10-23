import { Award, Gauge, Heart, Trophy } from 'lucide-react'
import { BADGE_LABELS, type BadgeId } from '@/lib/gamification'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Initials } from '@/components/data-display/Table'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { cn } from '@/lib/cn'
import { useLeaderboard } from '../hooks'

const BADGE_ICON: Record<BadgeId, typeof Trophy> = { scan_king: Trophy, fastest_scanner: Gauge, customer_hero: Heart }
const MEDAL = ['', 's', 'b'] as const

/** Spec §4.6 leaderboard — motivational only; never affects permissions or transactions. Redesign podium + list. */
export function Leaderboard() {
  const board = useLeaderboard()
  return (
    <Card className="reveal-up overflow-hidden">
      <CardHeader title="Leaderboard" icon={<Trophy className="size-4" />} description="Scan counts and speed over the last 30 days." />
      <QueryState query={board}>
        {(rows) => {
          const active = rows.filter((r) => r.scans > 0)
          if (!active.length)
            return (
              <div className="p-5">
                <EmptyState icon={<Award className="size-6" />} title="No scans in the last 30 days" />
              </div>
            )
          const top = active.slice(0, 3)
          // Podium order: 2nd, 1st, 3rd.
          const podium = [top[1], top[0], top[2]]
          return (
            <>
              <div className="podium pt-6" aria-hidden>
                {podium.map((r, slot) => {
                  const rank = slot === 1 ? 1 : slot === 0 ? 2 : 3
                  return (
                    <div key={slot} className={cn('pod', `p${rank}`)}>
                      {r && (
                        <>
                          <Initials name={r.name} className="av" />
                          <b className="text-[13px] font-semibold">{r.name}</b>
                          <div className="blk">
                            <span className={cn('medal', MEDAL[rank - 1])}>{rank}</span>
                            <b>{r.scans}</b>
                            <span className="text-xs opacity-70">scans</span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <ol className="border-t border-line">
                {active.map((r, i) => (
                  <li key={r.userId} className="list-row flex-wrap text-sm">
                    <span className="flex min-w-40 flex-1 items-center gap-3">
                      <span className="w-6 text-center font-display font-bold text-faint">{i + 1}</span>
                      <span className="person">
                        <Initials name={r.name} />
                        {r.name}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{r.scans} scans</span>
                    <span className="text-muted tabular-nums">{r.avgSeconds === null ? '— s avg' : `${r.avgSeconds}s avg`}</span>
                    <span className="flex flex-wrap gap-1">
                      {r.badges.map((b) => {
                        const Icon = BADGE_ICON[b]
                        return (
                          <Badge key={b} tone="accent" dot={false}>
                            <Icon className="size-3" aria-hidden /> {BADGE_LABELS[b]}
                          </Badge>
                        )
                      })}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )
        }}
      </QueryState>
    </Card>
  )
}
