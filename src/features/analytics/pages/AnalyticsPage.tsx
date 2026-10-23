import { useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CalendarDays, Footprints, Gift, Grid3x3, Lock, Percent, Repeat, Sparkles, TrendingUp, Trophy, Users } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useBackend, useServices } from '@/state/services'
import { errorMessage } from '@/lib/errors'
import { WEEKDAY_LABELS } from '@/lib/metrics'
import { PageHeader } from '@/components/data-display/PageHeader'
import { StatCard } from '@/components/data-display/StatCard'
import { ChartCard } from '@/components/data-display/ChartCard'
import { Initials } from '@/components/data-display/Table'
import { Bars } from '@/components/data-display/charts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { QueryState } from '@/components/feedback/QueryState'
import { Heatmap } from '../components/Heatmap'

/** Spec §4.9 Analytics (fixed last-30-days window, OI-34). */
export default function AnalyticsPage() {
  const t = useT()
  const backend = useBackend()
  const { integrations } = useServices()
  const access = useAccess()
  const analytics = useQuery({ queryKey: ['analytics'], queryFn: () => backend.getAnalytics() })
  const [commentary, setCommentary] = useState<{ text?: string; error?: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const gate = access.evaluate('analytics.aiCommentary')

  return (
    <>
      <PageHeader
        title={t('nav.analytics')}
        breadcrumb={
          <>
            <BarChart3 className="size-[13px]" aria-hidden /> {t('nav.group.engagement')}
          </>
        }
        description="Last 30 days."
      />
      <QueryState query={analytics}>
        {(a) => (
          <div className="flex flex-col gap-[18px]">
            <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-5">
              <StatCard label="Visitors" value={a.visitors} icon={<Users className="size-[15px]" />} feature className="col-span-2 lg:col-span-1" />
              <StatCard label="Returning customers" value={a.returningCustomers} icon={<Repeat className="size-[15px]" />} />
              <StatCard label="Retention" value={a.retentionPercent === null ? '—' : `${a.retentionPercent}%`} hint="Previous 30 days' customers who returned" icon={<Percent className="size-[15px]" />} progress={a.retentionPercent ?? undefined} />
              <StatCard label="Visit frequency" value={a.visitFrequency} hint="Visits per visitor" icon={<Footprints className="size-[15px]" />} />
              <StatCard label="Reward redemptions" value={a.rewardRedemptions} icon={<Gift className="size-[15px]" />} />
            </div>
            <div className="grid gap-[18px] lg:grid-cols-2">
              <ChartCard title="Most active days" icon={<CalendarDays className="size-4" />} table={{ columns: ['Day', 'Scans'], rows: a.mostActiveDays.map((d) => [d.day, d.scans]) }}>
                <Bars data={a.mostActiveDays} x="day" y="scans" name="Scans" />
              </ChartCard>
              <ChartCard title="Growth" icon={<TrendingUp className="size-4" />} description={a.growthPercent === null ? 'New members per week' : `New members per week · ${a.growthPercent >= 0 ? '+' : ''}${a.growthPercent}% vs previous 30 days`} table={{ columns: ['Week of', 'New members'], rows: a.growth.map((g) => [g.week, g.newMembers]) }}>
                <Bars data={a.growth.map((g) => ({ ...g, week: g.week.slice(5) }))} x="week" y="newMembers" name="New members" />
              </ChartCard>
            </div>
            <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]">
              <ChartCard title="Activity heatmap" icon={<Grid3x3 className="size-4" />} description="Scans by weekday and hour" table={{ columns: ['Day', ...Array.from({ length: 24 }, (_, h) => `${h}h`)], rows: a.heatmap.map((r, i) => [WEEKDAY_LABELS[i]!, ...r]) }}>
                <div>
                  <Heatmap data={a.heatmap} max={a.heatmapMax} />
                </div>
              </ChartCard>
              <Card className="ai-card reveal-up">
                <CardHeader title="AI commentary" icon={<Sparkles className="spark size-4" />} actions={<Badge tone="ink">Pro</Badge>} description="Plain-language explanation of the pattern with a suggested action." />
                <CardBody className="flex flex-col gap-3">
                  <p className="hint">Pro-plan exclusivity is pending client confirmation.</p>
                  <GuardedButton
                    permission="analytics.aiCommentary"
                    loading={busy}
                    onClick={async () => {
                      setBusy(true)
                      try {
                        setCommentary({ text: await integrations.ai.heatmapCommentary(a.heatmap) })
                      } catch (e) {
                        setCommentary({ error: errorMessage(e) })
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    <Sparkles className="size-[15px]" aria-hidden /> Explain this pattern
                  </GuardedButton>
                  {!gate.allowed && <p className="lock-overlay text-xs"><Lock className="size-3.5 shrink-0" aria-hidden /> {gate.message}</p>}
                  {commentary?.text && <p className="callout info text-fg">{commentary.text}</p>}
                  {commentary?.error && <IntegrationNotice title="AI service not connected">{commentary.error} No commentary was generated.</IntegrationNotice>}
                </CardBody>
              </Card>
            </div>
            <Card className="reveal-up overflow-hidden">
              <CardHeader title="Top members" icon={<Trophy className="size-4" />} description="Most visits in the last 30 days" />
              {a.topMembers.length === 0 ? (
                <CardBody><p className="empty py-4">No visits in this period.</p></CardBody>
              ) : (
                <ol>
                  {a.topMembers.map((m, i) => (
                    <li key={m.customerId} className="list-row text-sm">
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="w-5 text-center font-display font-bold text-faint">{i + 1}</span>
                        <span className="person min-w-0">
                          <Initials name={m.name} />
                          <span className="truncate">{m.name}</span>
                        </span>
                      </span>
                      <span className="hidden w-40 sm:block" aria-hidden>
                        <span className="mini-prog mt-0 block">
                          <i style={{ '--w': `${Math.round((m.visits / (a.topMembers[0]?.visits || 1)) * 100)}%` } as CSSProperties} />
                        </span>
                      </span>
                      <span className="w-20 text-right font-semibold tabular-nums">{m.visits} visits</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        )}
      </QueryState>
    </>
  )
}
