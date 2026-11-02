import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Gift } from 'lucide-react'
import type { RewardInstance, RewardStatus } from '@/types/domain'
import type { ScanAction } from '@/lib/scanEngine'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { GuardedButton } from '@/components/feedback/GuardedButton'
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
  const [status, setStatus] = useState<RewardStatus | 'all'>('all')
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const toast = useToast()
  const qc = useQueryClient()

  /** Redeems from the owner/manager side (BONUCA CHANGES item 8) through the same scan engine as the QR scanner. */
  const redeem = async (r: RewardInstance) => {
    setRedeeming(r.id)
    try {
      const detail = await backend.getCustomer(r.customerId)
      const membership = detail?.memberships.find((m) => m.program.id === r.programId) ?? (r.source === 'winback' ? detail?.memberships[0] : undefined)
      const passCode = r.source === 'voucher' ? r.passCode : membership?.membership.passCode
      if (!passCode) throw new Error('This reward is attached to a pass that cannot be found. Open the customer to redeem it.')
      const action: ScanAction = r.source === 'voucher' ? { type: 'redeem_voucher' } : r.source === 'winback' ? { type: 'redeem_winback', rewardId: r.id } : { type: 'redeem_reward', rewardId: r.id }
      const result = await backend.confirmScan({ passCode, action, durationMs: null, entry: 'search' })
      toast.success(result.summary)
      await qc.invalidateQueries()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setRedeeming(null)
    }
  }
  const names = useMemo(() => new Map((customers.data ?? []).map((c) => [c.id, c.name])), [customers.data])
  const sources = useMemo(() => new Map([...(programs.data ?? []).map((p) => [p.id, p.name] as const), ...(campaigns.data ?? []).map((c) => [c.id, c.name] as const)]), [programs.data, campaigns.data])

  return (
    <>
      <PageHeader
        title={t('nav.rewards')}
        breadcrumb={
          <>
            <Gift className="size-[13px]" aria-hidden /> {t('nav.group.engagement')}
          </>
        }
      />
      <QueryState query={rewards}>
          {(list) => {
            const counts = countByStatus(list)
            const shown = list.filter((r) => status === 'all' || rewardStatus(r) === status).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
            return (
              <Card className="reveal-up overflow-hidden">
                <div className="px-[22px] pt-4 [&_.tabs]:mb-4">
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
                      { key: 'reward', header: 'Reward', cell: (r) => <span className="person"><span className="feed-ic bg-highlight-soft text-[#9A7300] dark:text-highlight" aria-hidden><Gift className="size-4" /></span>{r.name}</span> },
                      { key: 'customer', header: 'Customer', cell: (r) => names.get(r.customerId) ?? r.customerId },
                      { key: 'source', header: 'Source', hideOnMobile: true, cell: (r) => `${SOURCE[r.source]}${r.programId || r.campaignId ? ` · ${sources.get(r.programId ?? r.campaignId ?? '') ?? ''}` : ''}` },
                      { key: 'status', header: 'State', cell: (r) => <RewardBadge status={rewardStatus(r)} /> },
                      { key: 'issued', header: 'Issued', hideOnMobile: true, cell: (r) => <span className="text-muted">{formatDate(r.issuedAt)}</span> },
                      { key: 'expires', header: 'Expires', hideOnMobile: true, cell: (r) => <span className="text-muted">{formatDate(r.expiresAt)}</span> },
                      { key: 'redeemed', header: 'Redeemed', hideOnMobile: true, cell: (r) => <span className="text-muted">{formatDate(r.redeemedAt)}</span> },
                      {
                        key: 'action',
                        header: 'Action',
                        cell: (r) => (
                          // Clickable only while the reward is valid (available); stays visible but disabled otherwise.
                          <span role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                            <GuardedButton permission="scanner.transact" size="sm" variant="ink" disabled={rewardStatus(r) !== 'available'} loading={redeeming === r.id} onClick={() => void redeem(r)}>
                              Redeem
                            </GuardedButton>
                          </span>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            )
          }}
        </QueryState>
    </>
  )
}
