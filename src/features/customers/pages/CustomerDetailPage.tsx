import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, ChevronRight, Gift, History, ScanLine, Stamp, StickyNote, UserRound } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatDateTime } from '@/lib/dates'
import { rewardStatus } from '@/lib/rewards'
import { sortedRewards, currencyCode } from '@/lib/points'
import { PageHeader } from '@/components/data-display/PageHeader'
import { StatCard } from '@/components/data-display/StatCard'
import { RewardBadge } from '@/components/data-display/StatusBadge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, ErrorState, QueryState } from '@/components/feedback/QueryState'
import type { Membership, Program } from '@/types/domain'
import { useCustomer, useUpdateNotes } from '../hooks'

const TX_LABEL = { stamp: 'Stamp added', points: 'Points credited', visit: 'Visit recorded', reward_redeemed: 'Reward redeemed', voucher_redeemed: 'Voucher redeemed', winback_redeemed: 'Win-back reward redeemed' } as const

function membershipLine(m: Membership, p: Program): string {
  switch (p.type) {
    case 'stamp':
      return `${m.stamps} / ${p.config.stampsRequired} stamps`
    case 'membership':
      return `Member since ${formatDate(m.joinedAt)} · ${p.config.benefitDescription}`
    case 'tier':
      return p.config.tiersEnabled ? `Current tier: ${p.config.tiers[m.tierIndex]?.name ?? '—'} · ${m.visits} visits` : `${m.visits} visits`
    case 'points':
      return `${m.points} pts (${currencyCode(p.config)} program)`
  }
}

function Notes({ id, initial }: { id: string; initial: string }) {
  const toast = useToast()
  const update = useUpdateNotes(id)
  const [value, setValue] = useState(initial)
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="notes" className="sr-only">Notes</label>
      <Textarea id="notes" rows={4} value={value} onChange={(e) => setValue(e.target.value)} />
      <div>
        <GuardedButton permission="customers.notes" size="sm" loading={update.isPending} onClick={() => update.mutate(value, { onSuccess: () => toast.success('Notes saved.'), onError: (e) => toast.error(errorMessage(e)) })}>
          Save notes
        </GuardedButton>
      </div>
    </div>
  )
}

/** Spec §4.5 profile: visit history, rewards, membership/current tier, number of scans, notes, last visit. */
export default function CustomerDetailPage() {
  const t = useT()
  const { id = '' } = useParams()
  const access = useAccess()
  const customer = useCustomer(id)
  const full = access.can('customers.viewFull')

  return (
    <QueryState query={customer}>
      {(d) => {
        if (!d) return <ErrorState message="Customer not found." />
        const c = d.customer
        return (
          <>
            <PageHeader title={c.name || c.customerNumber} description={`Customer ID ${c.customerNumber}`} breadcrumb={
                <>
                  <Link to="/app/customers">{full ? t('nav.customers') : t('nav.customerInfo')}</Link>
                  <ChevronRight className="size-[13px]" aria-hidden />
                  <span className="mono">{c.customerNumber}</span>
                </>
              } />
            <div className="mb-[18px] grid gap-[18px] sm:grid-cols-3">
              <StatCard label="Number of scans" value={d.scanCount} icon={<ScanLine className="size-[15px]" />} feature />
              <StatCard label="Last visit" value={<span className="text-2xl">{formatDate(d.lastVisit)}</span>} icon={<CalendarDays className="size-[15px]" />} />
              <StatCard label="Available rewards" value={d.rewards.filter((r) => rewardStatus(r) === 'available').length} icon={<Gift className="size-[15px]" />} />
            </div>
            <div className="grid gap-[18px] lg:grid-cols-2">
              {full && (
                <Card>
                  <CardHeader title="Profile" icon={<UserRound className="size-4" />} />
                  <CardBody>
                    <dl className="setup-grid grid-cols-1 sm:grid-cols-2">
                      {[
                        ['Email', c.email],
                        ['Phone', c.phone],
                        ['Birthday', c.birthday ? formatDate(c.birthday) : ''],
                        ['Joined', formatDate(c.createdAt)],
                      ].map(([k, v]) => (
                        <div key={k} className="setup-item">
                          <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
                          <dd className="font-semibold break-words">{v || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardBody>
                </Card>
              )}
              <Card>
                <CardHeader title="Memberships" icon={<Stamp className="size-4" />} description="Programs, current tier and balances." />
                <CardBody>
                  {d.memberships.length === 0 ? (
                    <p className="text-sm text-muted">Not enrolled in any program.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {d.memberships.map(({ membership: m, program: p }) => (
                        <li key={m.id} className="reveal text-sm">
                          <p className="font-display text-[15px] font-semibold">{p.name}</p>
                          <p className="text-muted">{membershipLine(m, p)}</p>
                          {p.type === 'points' && (
                            // Full multi-level breakdown lives here (OI-07 fallback).
                            <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                              {sortedRewards(p.config).map((r) => (
                                <li key={r.id} className={m.points >= r.pointsRequired ? 'badge green' : 'badge'}>
                                  {r.pointsRequired} pts · {r.name}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mono mt-2 text-xs text-faint">Pass {m.passCode}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Rewards" icon={<Gift className="size-4" />} />
                <CardBody>
                  {d.rewards.length === 0 ? (
                    <p className="empty py-4">No rewards yet.</p>
                  ) : (
                    <ul>
                      {d.rewards.map((r) => (
                        <li key={r.id} className="kv">
                          <span className="text-fg">
                            {r.name} <span className="text-xs text-muted">· {r.source.replace('_', ' ')}</span>
                          </span>
                          <RewardBadge status={rewardStatus(r)} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
              {full && (
                <Card>
                  <CardHeader title="Notes" icon={<StickyNote className="size-4" />} />
                  <CardBody>
                    <Notes key={`${c.id}-${c.notes}`} id={c.id} initial={c.notes} />
                  </CardBody>
                </Card>
              )}
              <Card className="lg:col-span-2">
                <CardHeader title="Visit history" icon={<History className="size-4" />} />
                <CardBody>
                  {d.transactions.length === 0 ? (
                    <EmptyState title="No visits yet" />
                  ) : (
                    <ul className="timeline">
                      {d.transactions.map((tx) => (
                        <li key={tx.id} className="tl-item flex-wrap">
                          <span>
                            {TX_LABEL[tx.kind]}
                            {tx.pointsAdded ? ` · +${tx.pointsAdded} pts` : ''}
                            {tx.purchaseAmount !== null ? ` · ${tx.purchaseAmount.toFixed(2)}` : ''}
                          </span>
                          <span className="text-muted">{formatDateTime(tx.createdAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </>
        )
      }}
    </QueryState>
  )
}
