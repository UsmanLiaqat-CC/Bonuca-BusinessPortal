import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Gift, History, ScanLine, Search, Stamp, StickyNote, Ticket, UserRound, X } from 'lucide-react'
import type { Gift as GiftT } from '@/types/domain'
import type { GiftInput } from '@/services/backend'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatDateTime } from '@/lib/dates'
import { rewardStatus } from '@/lib/rewards'
import { giftStatus, GIFT_STATUS_LABEL } from '@/lib/gifts'
import { buildPassContent } from '@/lib/walletContent'
import type { HistoryRow } from '@/lib/history'
import { PageHeader } from '@/components/data-display/PageHeader'
import { KpiCard } from '@/components/data-display/KpiCard'
import { LifecycleBadge, RewardBadge } from '@/components/data-display/StatusBadge'
import { CAMPAIGN_KIND_LABEL } from '@/lib/campaigns'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { EmptyState, ErrorState, QueryState } from '@/components/feedback/QueryState'
import { WalletCard } from '@/features/wallet-cards/components/WalletPassPreview'
import { useCancelGift, useCustomer, useGiveGift, useUpdateNotes } from '../hooks'

const GIFT_TONE: Record<ReturnType<typeof giftStatus>, BadgeTone> = { scheduled: 'accent', available: 'success', redeemed: 'neutral', expired: 'outline', cancelled: 'danger' }
const CHANGE_TONE: Record<HistoryRow['tone'], string> = { add: 'bg-success-soft text-success', remove: 'bg-danger-soft text-danger', redeem: 'bg-accent-soft text-accent', gift: 'bg-warning-soft text-warning' }

function Notes({ id, initial }: { id: string; initial: string }) {
  const toast = useToast()
  const update = useUpdateNotes(id)
  const [value, setValue] = useState(initial)
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="notes" className="sr-only">Notes</label>
      <Textarea id="notes" rows={3} value={value} onChange={(e) => setValue(e.target.value)} />
      <div>
        <GuardedButton permission="customers.notes" size="sm" loading={update.isPending} onClick={() => update.mutate(value, { onSuccess: () => toast.success('Notes saved.'), onError: (e) => toast.error(errorMessage(e)) })}>
          Save notes
        </GuardedButton>
      </div>
    </div>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

/** Surprise gift form: gift name, description, expiry date and optional terms (Owner and Manager). */
function GiveGiftDialog({ customerId, customerName, open, onClose }: { customerId: string; customerName: string; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const give = useGiveGift(customerId)
  const empty: GiftInput = { name: '', description: '', terms: '', availableFrom: '', expiresOn: '' }
  const [v, setV] = useState<GiftInput>(empty)
  const [touched, setTouched] = useState(false)
  const nameError = touched && !v.name.trim() ? 'Gift name is required.' : undefined
  const expiryError = touched && !v.expiresOn ? 'Choose the expiry date.' : undefined
  const submit = () => {
    setTouched(true)
    if (!v.name.trim() || !v.expiresOn) return
    give.mutate(v, {
      onSuccess: (g) => {
        toast.success(giftStatus(g) === 'scheduled' ? `Gift scheduled for ${customerName}.` : `Gift given to ${customerName}.`)
        setV(empty)
        setTouched(false)
        onClose()
      },
      onError: (e) => toast.error(errorMessage(e)),
    })
  }
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Give gift"
      description={`A surprise gift for ${customerName}. It is not linked to any program and never changes stamps or points.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <GuardedButton permission="gifts.manage" onClick={submit} loading={give.isPending}>Give gift</GuardedButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Gift name" required error={nameError}>
          {(p) => <Input {...p} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="e.g. Free slice of cake" />}
        </Field>
        <Field label="Description" optional>
          {(p) => <Textarea {...p} rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Available from" optional hint="Leave empty to make it available now. A future date schedules the gift.">
            {(p) => <Input {...p} type="date" min={today()} value={v.availableFrom} onChange={(e) => setV({ ...v, availableFrom: e.target.value })} />}
          </Field>
          <Field label="Expiry date" required error={expiryError}>
            {(p) => <Input {...p} type="date" min={today()} value={v.expiresOn} onChange={(e) => setV({ ...v, expiresOn: e.target.value })} />}
          </Field>
        </div>
        <Field label="Terms" optional>
          {(p) => <Textarea {...p} rows={2} value={v.terms} onChange={(e) => setV({ ...v, terms: e.target.value })} />}
        </Field>
        <IntegrationNotice title="Customer notification not connected">The customer would get a wallet or push notification where supported. That service is not connected in this environment, so no notification is sent. Staff see the gift when they scan the customer.</IntegrationNotice>
      </div>
    </Dialog>
  )
}

function GiftRow({ gift, customerId }: { gift: GiftT; customerId: string }) {
  const toast = useToast()
  const cancel = useCancelGift(customerId)
  const status = giftStatus(gift)
  const canCancel = status === 'available' || status === 'scheduled' || status === 'expired'
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold">
          <Gift className="size-4 text-warning" aria-hidden /> {gift.name}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {gift.description && `${gift.description} · `}
          {status === 'scheduled' ? `From ${formatDate(gift.availableFrom)} · ` : ''}Expires {formatDate(gift.expiresAt)}
          {gift.redeemedAt && ` · Redeemed ${formatDateTime(gift.redeemedAt)}${gift.redeemedLocation ? ` at ${gift.redeemedLocation}` : ''}`}
        </p>
      </div>
      <span className="flex items-center gap-2">
        <Badge tone={GIFT_TONE[status]}>{GIFT_STATUS_LABEL[status]}</Badge>
        {canCancel && status !== 'expired' && (
          <GuardedButton permission="gifts.manage" size="sm" variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate(gift.id, { onSuccess: () => toast.success('Gift cancelled.'), onError: (e) => toast.error(errorMessage(e)) })}>
            <X className="size-3.5" aria-hidden /> Cancel
          </GuardedButton>
        )}
      </span>
    </li>
  )
}

/** Customer profile: details, linked programs, history across programs, rewards and gifts. */
export default function CustomerDetailPage() {
  const t = useT()
  const { id = '' } = useParams()
  const access = useAccess()
  const { session } = useSession()
  const customer = useCustomer(id)
  const full = access.can('customers.viewFull')
  const [filter, setFilter] = useState('all')
  const [giftOpen, setGiftOpen] = useState(false)

  return (
    <QueryState query={customer}>
      {(d) => {
        if (!d) return <ErrorState message="Customer not found." />
        const c = d.customer
        const programIds = new Set(d.history.map((h) => h.programId).filter(Boolean))
        const history = d.history.filter((h) => filter === 'all' || (filter === 'gifts' ? h.tone === 'gift' : h.programId === filter))
        const availableRewards = d.rewards.filter((r) => rewardStatus(r) === 'available').length + d.gifts.filter((g) => giftStatus(g) === 'available').length
        return (
          <>
            <PageHeader
              title={c.name || c.customerNumber}
              description={`Customer number ${c.customerNumber}`}
              breadcrumb={
                <>
                  <Link to="/app/customers">{full ? t('nav.customers') : t('nav.customerInfo')}</Link>
                  <ChevronRight className="size-[13px]" aria-hidden />
                  <span className="mono">{c.customerNumber}</span>
                </>
              }
              actions={
                // Give gift is visible to Owner and Manager only.
                access.can('customers.viewFull') && (
                  <GuardedButton permission="gifts.manage" onClick={() => setGiftOpen(true)}>
                    <Gift className="size-[15px]" aria-hidden /> Give gift
                  </GuardedButton>
                )
              }
            />
            <div className="mb-[18px] grid gap-4 sm:grid-cols-3">
              <KpiCard label="Number of scans" value={d.scanCount} icon="scans" accent="primary" hint={`Last visit ${formatDate(d.lastVisit)}`} />
              <KpiCard label="Linked programs" value={d.memberships.length} icon="card" accent="success" />
              <KpiCard label="Available rewards & gifts" value={availableRewards} icon="gift" accent="warning" />
            </div>
            <div className="grid gap-[18px] lg:grid-cols-2">
              <Card>
                <CardHeader title="Details" icon={<UserRound className="size-4" />} />
                <CardBody className="flex flex-col gap-4">
                  <dl className="setup-grid grid-cols-1 sm:grid-cols-2">
                    {(
                      [
                        ['Name', c.name],
                        ...(full
                          ? [
                              ['Email', c.email],
                              ['Phone', c.phone],
                              ['Birthday', c.birthday ? formatDate(c.birthday) : ''],
                            ]
                          : []),
                        ['Customer number', c.customerNumber],
                        ['Joined', formatDate(c.createdAt)],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div key={k} className="setup-item">
                        <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
                        <dd className="font-semibold break-words">{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                  {full && (
                    <div>
                      <p className="label mb-2 flex items-center gap-1.5"><StickyNote className="size-3.5" aria-hidden /> Notes</p>
                      <Notes key={`${c.id}-${c.notes}`} id={c.id} initial={c.notes} />
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Linked programs" icon={<Stamp className="size-4" />} description="One card per program this customer belongs to." />
                <CardBody>
                  {d.memberships.length === 0 ? (
                    <p className="text-sm text-muted">Not enrolled in any program.</p>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2" aria-label="Linked programs">
                      {d.memberships.map(({ membership: m, program: p }) => {
                        const content = buildPassContent(p, m, session.business.name)
                        return (
                          <li key={m.id}>
                            <Link to={access.can('programs.view') ? `/app/programs/${p.id}` : '#'} className="block rounded-2xl transition-transform hover:-translate-y-0.5" aria-label={`Open program ${p.name}`}>
                              <WalletCard content={content} qrCode={m.passCode} compact />
                              <p className="mt-2 px-1 text-sm font-semibold">{p.name}</p>
                              <p className="px-1 text-xs text-muted">{content.stampGrid ? `${content.stampGrid.filled} / ${content.stampGrid.total} stamps` : (content.big ?? content.primary?.value)}</p>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader
                  title="History"
                  icon={<History className="size-4" />}
                  description="All activity across programs."
                  actions={
                    <label className="flex items-center gap-2 text-sm">
                      <span className="label">Program</span>
                      <Select className="w-52" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter history by program">
                        <option value="all">All programs</option>
                        {d.memberships.filter(({ program }) => programIds.has(program.id)).map(({ program }) => (
                          <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                        <option value="gifts">Gifts</option>
                      </Select>
                    </label>
                  }
                />
                {history.length === 0 ? (
                  <CardBody>
                    <EmptyState title="No activity yet" />
                  </CardBody>
                ) : (
                  <div className="table-wrap">
                    <table className="t" aria-label="Customer history">
                      <thead>
                        <tr>
                          <th>Change</th>
                          <th>What</th>
                          <th>Program</th>
                          <th>By</th>
                          <th>Date & time</th>
                          <th className="hidden md:table-cell">How</th>
                          <th className="hidden md:table-cell">Balance after</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.id}>
                            <td><span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${CHANGE_TONE[h.tone]}`}>{h.change}</span></td>
                            <td>{h.description}</td>
                            <td className="text-muted">{h.programName ?? '—'}</td>
                            <td>{h.by}</td>
                            <td className="whitespace-nowrap text-muted">{formatDateTime(h.at)}</td>
                            <td className="hidden md:table-cell">
                              {h.entry ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted">
                                  {h.entry === 'scan' ? <ScanLine className="size-3.5" aria-hidden /> : <Search className="size-3.5" aria-hidden />}
                                  {h.entry === 'scan' ? 'Scanned' : 'Search'}
                                </span>
                              ) : (
                                <span className="text-faint">—</span>
                              )}
                            </td>
                            <td className="hidden md:table-cell">{h.balanceAfter ?? <span className="text-faint">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader title="Campaigns" icon={<Ticket className="size-4" />} description="Campaigns this customer claimed or was triggered by." />
                <CardBody>
                  {d.campaigns.length === 0 ? (
                    <p className="text-sm text-muted">Not linked to any campaign.</p>
                  ) : (
                    <ul className="flex flex-col" aria-label="Customer campaigns">
                      {d.campaigns.map((cp) => (
                        <li key={cp.id} className="border-b border-line last:border-0">
                          <Link to={`/app/campaigns/${cp.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:underline">
                            <span className="font-semibold">{cp.name}</span>
                            <Badge tone="outline">{CAMPAIGN_KIND_LABEL[cp.kind]}</Badge>
                            <LifecycleBadge status={cp.status} />
                            <span className="ml-auto text-xs text-muted">{cp.kind === 'winback' ? 'Triggered' : 'Claimed'} {formatDate(cp.date)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader title="Rewards and gifts" icon={<Gift className="size-4" />} description="Available, redeemed and expired." />
                <CardBody className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="label mb-2">Rewards</p>
                    {d.rewards.length === 0 ? (
                      <p className="text-sm text-muted">No rewards yet.</p>
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
                  </div>
                  <div>
                    <p className="label mb-2">Gifts</p>
                    {d.gifts.length === 0 ? (
                      <p className="text-sm text-muted">No gifts yet.</p>
                    ) : (
                      <ul>
                        {[...d.gifts].reverse().map((g) => <GiftRow key={g.id} gift={g} customerId={c.id} />)}
                      </ul>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
            <GiveGiftDialog customerId={c.id} customerName={c.name || c.customerNumber} open={giftOpen} onClose={() => setGiftOpen(false)} />
          </>
        )
      }}
    </QueryState>
  )
}
