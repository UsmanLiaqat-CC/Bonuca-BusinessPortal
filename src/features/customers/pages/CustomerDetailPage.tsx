import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
            <PageHeader title={c.name || c.customerNumber} description={`Customer ID ${c.customerNumber}`} breadcrumb={<Link to="/app/customers" className="hover:underline">{full ? t('nav.customers') : t('nav.customerInfo')}</Link>} />
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Number of scans" value={d.scanCount} />
              <StatCard label="Last visit" value={<span className="text-lg">{formatDate(d.lastVisit)}</span>} />
              <StatCard label="Available rewards" value={d.rewards.filter((r) => rewardStatus(r) === 'available').length} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {full && (
                <Card>
                  <CardHeader title="Profile" />
                  <CardBody>
                    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                      {[
                        ['Email', c.email],
                        ['Phone', c.phone],
                        ['Birthday', c.birthday ? formatDate(c.birthday) : ''],
                        ['Joined', formatDate(c.createdAt)],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs text-muted">{k}</dt>
                          <dd>{v || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardBody>
                </Card>
              )}
              <Card>
                <CardHeader title="Memberships" description="Programs, current tier and balances." />
                <CardBody>
                  {d.memberships.length === 0 ? (
                    <p className="text-sm text-muted">Not enrolled in any program.</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {d.memberships.map(({ membership: m, program: p }) => (
                        <li key={m.id} className="rounded-lg border border-line p-3 text-sm">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-muted">{membershipLine(m, p)}</p>
                          {p.type === 'points' && (
                            // Full multi-level breakdown lives here (OI-07 fallback).
                            <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                              {sortedRewards(p.config).map((r) => (
                                <li key={r.id} className={m.points >= r.pointsRequired ? 'rounded bg-success-soft px-2 py-0.5 text-success' : 'rounded bg-surface-2 px-2 py-0.5 text-muted'}>
                                  {r.pointsRequired} pts · {r.name}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-1 font-mono text-xs text-muted">Pass {m.passCode}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Rewards" />
                <CardBody>
                  {d.rewards.length === 0 ? (
                    <p className="text-sm text-muted">No rewards yet.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {d.rewards.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span>
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
                  <CardHeader title="Notes" />
                  <CardBody>
                    <Notes key={`${c.id}-${c.notes}`} id={c.id} initial={c.notes} />
                  </CardBody>
                </Card>
              )}
              <Card className="lg:col-span-2">
                <CardHeader title="Visit history" />
                <CardBody>
                  {d.transactions.length === 0 ? (
                    <EmptyState title="No visits yet" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {d.transactions.map((tx) => (
                        <li key={tx.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
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
