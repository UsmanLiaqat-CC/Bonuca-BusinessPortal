import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useBackend, useServices } from '@/state/services'
import { errorMessage } from '@/lib/errors'
import { WEEKDAY_LABELS } from '@/lib/metrics'
import { PageHeader } from '@/components/data-display/PageHeader'
import { StatCard } from '@/components/data-display/StatCard'
import { ChartCard } from '@/components/data-display/ChartCard'
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
      <PageHeader title={t('nav.analytics')} description="Last 30 days." />
      <QueryState query={analytics}>
        {(a) => (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Visitors" value={a.visitors} />
              <StatCard label="Returning customers" value={a.returningCustomers} />
              <StatCard label="Retention" value={a.retentionPercent === null ? '—' : `${a.retentionPercent}%`} hint="Previous 30 days' customers who returned" />
              <StatCard label="Visit frequency" value={a.visitFrequency} hint="Visits per visitor" />
              <StatCard label="Reward redemptions" value={a.rewardRedemptions} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Most active days" table={{ columns: ['Day', 'Scans'], rows: a.mostActiveDays.map((d) => [d.day, d.scans]) }}>
                <Bars data={a.mostActiveDays} x="day" y="scans" name="Scans" />
              </ChartCard>
              <ChartCard title="Growth" description={a.growthPercent === null ? 'New members per week' : `New members per week · ${a.growthPercent >= 0 ? '+' : ''}${a.growthPercent}% vs previous 30 days`} table={{ columns: ['Week of', 'New members'], rows: a.growth.map((g) => [g.week, g.newMembers]) }}>
                <Bars data={a.growth.map((g) => ({ ...g, week: g.week.slice(5) }))} x="week" y="newMembers" name="New members" />
              </ChartCard>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <ChartCard title="Activity heatmap" description="Scans by weekday and hour" table={{ columns: ['Day', ...Array.from({ length: 24 }, (_, h) => `${h}h`)], rows: a.heatmap.map((r, i) => [WEEKDAY_LABELS[i]!, ...r]) }}>
                <div className="px-2">
                  <Heatmap data={a.heatmap} max={a.heatmapMax} />
                </div>
              </ChartCard>
              <Card>
                <CardHeader title="AI commentary" actions={<Badge tone="accent">Pro</Badge>} description="Plain-language explanation of the pattern with a suggested action." />
                <CardBody className="flex flex-col gap-3">
                  <p className="text-xs text-muted">Pro-plan exclusivity is pending client confirmation.</p>
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
                    <Sparkles className="size-4" aria-hidden /> Explain this pattern
                  </GuardedButton>
                  {!gate.allowed && <p className="text-xs text-muted">{gate.message}</p>}
                  {commentary?.text && <p className="rounded-lg bg-accent-soft p-3 text-sm">{commentary.text}</p>}
                  {commentary?.error && <IntegrationNotice title="AI service not connected">{commentary.error} No commentary was generated.</IntegrationNotice>}
                </CardBody>
              </Card>
            </div>
            <Card>
              <CardHeader title="Top members" description="Most visits in the last 30 days" />
              {a.topMembers.length === 0 ? (
                <CardBody><p className="text-sm text-muted">No visits in this period.</p></CardBody>
              ) : (
                <ol className="divide-y divide-line">
                  {a.topMembers.map((m, i) => (
                    <li key={m.customerId} className="flex justify-between gap-2 px-5 py-2.5 text-sm">
                      <span><span className="mr-3 text-muted">{i + 1}</span>{m.name}</span>
                      <span className="tabular-nums">{m.visits} visits</span>
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
