import { CalendarDays, CreditCard, Repeat, ScanLine, Stamp, Users, Footprints } from 'lucide-react'
import { useT } from '@/i18n'
import { PageHeader } from '@/components/data-display/PageHeader'
import { StatCard } from '@/components/data-display/StatCard'
import { ChartCard } from '@/components/data-display/ChartCard'
import { AreaTrend, Bars } from '@/components/data-display/charts'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useDashboard } from '../hooks'

const short = (d: string) => d.slice(5)

/** Spec §4.1 Dashboard — Owner and Manager only. */
export default function DashboardPage() {
  const t = useT()
  const dashboard = useDashboard()
  return (
    <>
      <PageHeader title={t('nav.dashboard')} />
      <QueryState query={dashboard}>
        {(s) => (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Total Members" value={s.totalMembers} icon={<Users className="size-4" />} />
              <StatCard label="New Members Today" value={s.newToday} icon={<CalendarDays className="size-4" />} />
              <StatCard label="New This Week" value={s.newThisWeek} icon={<CalendarDays className="size-4" />} />
              <StatCard label="New This Month" value={s.newThisMonth} icon={<CalendarDays className="size-4" />} />
              <StatCard label="Total Scans" value={s.totalScans} icon={<ScanLine className="size-4" />} />
              <StatCard label="Active Programs" value={s.activePrograms} icon={<Stamp className="size-4" />} />
              <StatCard label="Wallet Cards" value={s.walletCards} icon={<CreditCard className="size-4" />} />
              <StatCard label="Visits" value={s.visits} hint="One customer on one day" icon={<Footprints className="size-4" />} />
              <StatCard label="Returning Customers" value={s.returningCustomers} hint="Visited on 2+ days" icon={<Repeat className="size-4" />} />
            </div>
            {s.totalMembers === 0 && s.totalScans === 0 ? (
              <EmptyState title="No activity yet" body="Charts fill in as customers join and get scanned." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Customer Growth" description="Total members, last 30 days" table={{ columns: ['Date', 'Total members'], rows: s.customerGrowth.map((d) => [d.date, d.total]) }}>
                  <AreaTrend data={s.customerGrowth.map((d) => ({ ...d, date: short(d.date) }))} x="date" y="total" name="Total members" />
                </ChartCard>
                <ChartCard title="Daily Scans" description="Last 30 days" table={{ columns: ['Date', 'Scans'], rows: s.dailyScans.map((d) => [d.date, d.scans]) }}>
                  <Bars data={s.dailyScans.map((d) => ({ ...d, date: short(d.date) }))} x="date" y="scans" name="Scans" />
                </ChartCard>
                <ChartCard title="Monthly Growth" description="New members per month, last 12 months" table={{ columns: ['Month', 'New members'], rows: s.monthlyGrowth.map((d) => [d.month, d.newMembers]) }}>
                  <Bars data={s.monthlyGrowth} x="month" y="newMembers" name="New members" />
                </ChartCard>
                <ChartCard title="Top Programs" description="By scans" table={{ columns: ['Program', 'Scans', 'Members'], rows: s.topPrograms.map((p) => [p.name, p.scans, p.members]) }}>
                  <Bars data={s.topPrograms} x="name" y="scans" name="Scans" horizontal />
                </ChartCard>
                <ChartCard title="Membership Distribution" description="Wallet cards per program" className="lg:col-span-2" table={{ columns: ['Program', 'Members'], rows: s.membershipDistribution.map((d) => [d.name, d.value]) }}>
                  <Bars data={s.membershipDistribution} x="name" y="value" name="Members" horizontal height={Math.max(140, s.membershipDistribution.length * 44)} />
                </ChartCard>
              </div>
            )}
          </div>
        )}
      </QueryState>
    </>
  )
}
