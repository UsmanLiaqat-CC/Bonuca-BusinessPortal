import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, PieChart, ScanLine, Stamp, TrendingUp, Trophy } from 'lucide-react'
import { useT } from '@/i18n'
import { useSession } from '@/state/session'
import { PageHeader } from '@/components/data-display/PageHeader'
import { KpiCard, trendPercent } from '@/components/data-display/KpiCard'
import { TimePresetChips, useRangeFilter } from '@/components/data-display/TimePresetChips'
import { ChartCard } from '@/components/data-display/ChartCard'
import { AreaTrend, Bars, Donut } from '@/components/data-display/charts'
import { buttonClass } from '@/components/ui/Button'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useDashboard } from '../hooks'

const short = (d: string) => d.slice(5)

/** Spec §4.1 Dashboard — Owner and Manager only. Layout and filters follow the Bonuca Admin dashboard. */
export default function DashboardPage() {
  const t = useT()
  const { session } = useSession()
  const kpiFilter = useRangeFilter()
  const programsFilter = useRangeFilter()
  const membershipFilter = useRangeFilter()
  const dashboard = useDashboard(kpiFilter.range)
  const programsStats = useDashboard(programsFilter.range)
  const membershipStats = useDashboard(membershipFilter.range)
  const firstName = session.user.fullName.split(/\s+/)[0] ?? ''
  return (
    <>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('ui.dash.welcome', { name: firstName ? `, ${firstName}` : '' })}
        actions={
          <>
            <Link to="/app/programs" className={buttonClass('secondary')}>
              <Stamp className="size-[15px]" aria-hidden />
              {t('nav.programs')}
            </Link>
            {/* Opens Award actions (Scan / Search) — the same flow as the QR Scanner menu item. */}
            <Link to="/app/scanner" className={buttonClass('primary')}>
              <ScanLine className="size-[15px]" aria-hidden />
              {t('ui.scanQr')}
            </Link>
          </>
        }
      />
      <QueryState query={dashboard}>
        {(s) => {
          const { period: p, previous: prev } = s
          return (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <TimePresetChips filter={kpiFilter} label="Dashboard period" />
                  <div className="text-[11px] font-medium text-muted">
                    Active: <span className="font-semibold text-accent">{s.range.from}</span> to <span className="font-semibold text-accent">{s.range.to}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard label={t('ui.kpi.totalCustomers')} value={s.totalMembers} icon="customers" accent="primary" hint={t('ui.hint.allTime')} />
                  <KpiCard label={t('ui.kpi.newCustomers')} value={p.newMembers} icon="growth" accent="success" trend={trendPercent(p.newMembers, prev.newMembers)} />
                  <KpiCard label={t('ui.kpi.totalScans')} value={p.scans} icon="scans" accent="primary" trend={trendPercent(p.scans, prev.scans)} />
                  <KpiCard label={t('ui.kpi.visits')} value={p.visits} icon="clock" accent="warning" trend={trendPercent(p.visits, prev.visits)} hint={t('ui.hint.visit')} />
                  <KpiCard label={t('ui.kpi.returning')} value={p.returningCustomers} icon="retention" accent="success" trend={trendPercent(p.returningCustomers, prev.returningCustomers)} hint={t('ui.hint.returning')} />
                  <KpiCard label={t('ui.kpi.newWallet')} value={p.newWalletCards} icon="wallet" accent="primary" trend={trendPercent(p.newWalletCards, prev.newWalletCards)} />
                  <KpiCard label={t('ui.kpi.wallet')} value={s.walletCards} icon="card" accent="primary" hint={t('ui.hint.allTime')} />
                  <KpiCard label={t('ui.kpi.activePrograms')} value={s.activePrograms} icon="bolt" accent="warning" hint={t('ui.hint.now')} />
                </div>
              </div>
              {s.totalMembers === 0 && s.totalScans === 0 ? (
                <EmptyState icon={<BarChart3 className="size-6" />} title="No activity yet" body="Charts fill in as customers join and get scanned." />
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title={t('ui.chart.growth')} description={t('ui.chart.growthDesc')} icon={<TrendingUp className="size-4" />} table={{ columns: ['Date', 'Total customers'], rows: s.customerGrowth.map((d) => [d.date, d.total]) }}>
                    <AreaTrend data={s.customerGrowth.map((d) => ({ ...d, date: short(d.date) }))} x="date" y="total" name="Total customers" />
                  </ChartCard>
                  <ChartCard title={t('ui.chart.daily')} description={t('ui.chart.last30')} icon={<ScanLine className="size-4" />} table={{ columns: ['Date', 'Scans'], rows: s.dailyScans.map((d) => [d.date, d.scans]) }}>
                    <Bars data={s.dailyScans.map((d) => ({ ...d, date: short(d.date) }))} x="date" y="scans" name="Scans" />
                  </ChartCard>
                  <ChartCard title={t('ui.chart.monthly')} description={t('ui.chart.monthlyDesc')} icon={<CalendarDays className="size-4" />} table={{ columns: ['Month', 'New customers'], rows: s.monthlyGrowth.map((d) => [d.month, d.newMembers]) }}>
                    <Bars data={s.monthlyGrowth} x="month" y="newMembers" name="New customers" />
                  </ChartCard>
                  <QueryState query={programsStats}>
                    {(ps) => (
                      <ChartCard
                        title={t('ui.chart.top')}
                        description="By scans"
                        icon={<Trophy className="size-4" />}
                        filter={<TimePresetChips filter={programsFilter} label="Top Programs period" />}
                        table={{ columns: ['Program', 'Scans', 'Customers'], rows: ps.topPrograms.map((r) => [r.name, r.scans, r.members]) }}
                      >
                        {ps.topPrograms.length ? (
                          <Bars data={ps.topPrograms} x="name" y="scans" name="Scans" horizontal height={Math.max(160, ps.topPrograms.length * 48)} />
                        ) : (
                          <p className="py-8 text-center text-sm text-muted">No program activity during this period.</p>
                        )}
                      </ChartCard>
                    )}
                  </QueryState>
                  <QueryState query={membershipStats}>
                    {(ms) => (
                      <ChartCard
                        title={t('ui.chart.perProgram')}
                        description="Wallet cards per program"
                        icon={<PieChart className="size-4" />}
                        className="lg:col-span-2"
                        filter={<TimePresetChips filter={membershipFilter} label="Customers per Program period" />}
                        table={{ columns: ['Program', 'Customers'], rows: ms.membershipDistribution.map((d) => [d.name, d.value]) }}
                      >
                        {ms.membershipDistribution.length ? (
                          <Donut data={ms.membershipDistribution} label="name" value="value" centerLabel="wallet cards" />
                        ) : (
                          <p className="py-8 text-center text-sm text-muted">No wallet cards issued during this period.</p>
                        )}
                      </ChartCard>
                    )}
                  </QueryState>
                </div>
              )}
            </div>
          )
        }}
      </QueryState>
    </>
  )
}
