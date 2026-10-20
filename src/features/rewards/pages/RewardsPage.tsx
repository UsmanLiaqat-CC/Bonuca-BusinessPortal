import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Gift } from 'lucide-react'
import type { RewardStatus } from '@/types/domain'
import { useT } from '@/i18n'
import { useBackend } from '@/state/services'
import { REWARD_STATUSES, countByStatus, rewardStatus } from '@/lib/rewards'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable } from '@/components/data-display/Table'
import { RewardBadge } from '@/components/data-display/StatusBadge'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { usePrograms, useCampaigns } from '@/features/loyalty-programs/hooks'
import { useCustomers } from '@/features/customers/hooks'
import { SurpriseEditor } from '../components/SurpriseEditor'

const LABEL: Record<RewardStatus, string> = { available: 'Available', redeemed: 'Redeemed', pending: 'Pending', expired: 'Expired' }
const SOURCE: Record<string, string> = { stamp_card: 'Stamp card', points: 'Points', winback: 'Win-back', surprise: 'Surprise', welcome_gift: 'Welcome gift', voucher: 'Voucher' }

/** Spec §4.8 Rewards. */
export default function RewardsPage() {
  const t = useT()
  const backend = useBackend()
  const navigate = useNavigate()
  const rewards = useQuery({ queryKey: ['rewards'], queryFn: () => backend.listRewards() })
  const programs = usePrograms()
  const campaigns = useCampaigns()
  const customers = useCustomers()
  const [tab, setTab] = useState<'rewards' | 'surprise'>('rewards')
  const [status, setStatus] = useState<RewardStatus | 'all'>('all')
  const names = useMemo(() => new Map((customers.data ?? []).map((c) => [c.id, c.name])), [customers.data])
  const sources = useMemo(() => new Map([...(programs.data ?? []).map((p) => [p.id, p.name] as const), ...(campaigns.data ?? []).map((c) => [c.id, c.name] as const)]), [programs.data, campaigns.data])

  return (
    <>
      <PageHeader title={t('nav.rewards')} />
      <div className="mb-6">
        <Tabs label="Rewards sections" value={tab} onChange={setTab} items={[{ value: 'rewards', label: 'Rewards' }, { value: 'surprise', label: 'Surprise rewards' }]} />
      </div>
      {tab === 'rewards' ? (
        <QueryState query={rewards}>
          {(list) => {
            const counts = countByStatus(list)
            const shown = list.filter((r) => status === 'all' || rewardStatus(r) === status).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
            return (
              <Card>
                <div className="px-4 pt-3">
                  <Tabs label="Filter by state" value={status} onChange={setStatus} items={[{ value: 'all', label: 'All', count: list.length }, ...REWARD_STATUSES.map((s) => ({ value: s, label: LABEL[s], count: counts[s] }))]} />
                </div>
                {shown.length === 0 ? (
                  <div className="p-5"><EmptyState icon={<Gift className="size-6" />} title="No rewards in this state" /></div>
                ) : (
                  <DataTable
                    caption="Rewards"
                    rows={shown}
                    rowKey={(r) => r.id}
                    onRowClick={(r) => navigate(`/app/customers/${r.customerId}`)}
                    columns={[
                      { key: 'reward', header: 'Reward', cell: (r) => <span className="font-medium">{r.name}</span> },
                      { key: 'customer', header: 'Customer', cell: (r) => names.get(r.customerId) ?? r.customerId },
                      { key: 'source', header: 'Source', hideOnMobile: true, cell: (r) => `${SOURCE[r.source]}${r.programId || r.campaignId ? ` · ${sources.get(r.programId ?? r.campaignId ?? '') ?? ''}` : ''}` },
                      { key: 'status', header: 'State', cell: (r) => <RewardBadge status={rewardStatus(r)} /> },
                      { key: 'issued', header: 'Issued', hideOnMobile: true, cell: (r) => formatDate(r.issuedAt) },
                      { key: 'expires', header: 'Expires', hideOnMobile: true, cell: (r) => formatDate(r.expiresAt) },
                    ]}
                  />
                )}
              </Card>
            )
          }}
        </QueryState>
      ) : (
        <QueryState query={programs}>
          {(list) => {
            const editable = list.filter((p) => p.status !== 'archived')
            return editable.length === 0 ? (
              <EmptyState title="No programs" body="Surprise rewards are configured per program and are off by default." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {editable.map((p) => (
                  <SurpriseEditor key={`${p.id}-${p.updatedAt}-${JSON.stringify(p.surprise)}`} program={p} />
                ))}
              </div>
            )
          }}
        </QueryState>
      )}
    </>
  )
}
