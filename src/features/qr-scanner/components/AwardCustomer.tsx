import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Gift, History, Minus, Plus, RotateCcw, ScanLine, Search, TriangleAlert, UserRound } from 'lucide-react'
import type { PointsProgram, StampProgram } from '@/types/domain'
import type { ScanAction, ScanContext } from '@/lib/scanEngine'
import type { HistoryRow } from '@/lib/history'
import { buildPointsPreview, calculatePoints, currencyCode } from '@/lib/points'
import { buildPassContent } from '@/lib/walletContent'
import { formatDateTime } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'
import { useBackend } from '@/state/services'
import { useAccess, useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { Initials } from '@/components/data-display/Table'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { QueryState } from '@/components/feedback/QueryState'
import { WalletCard } from '@/features/wallet-cards/components/WalletPassPreview'
import { useAwardCustomer, useConfirmScan } from '../hooks'
import { ScanPanel } from './ScanPanel'

type Entry = 'scan' | 'search'

/**
 * Stamp program: stamp count, +1 stamp, Redeem bonus (full card only). Remove stamp needs the remove permission;
 * the amount dropdown shows only when the program allows multiple stamps and the user may award them.
 */
function StampActions({ context, program, onAction, pending }: { context: ScanContext; program: StampProgram; onAction: (a: ScanAction) => void; pending: boolean }) {
  const access = useAccess()
  const canRemove = access.can('scanner.adjust')
  const multi = program.config.multipleStamps
  const canMulti = !!multi?.enabled && access.can('scanner.multiStamp')
  const amounts = Array.from({ length: Math.max(2, multi?.max ?? 10) }, (_, i) => i + 1)
  const [amount, setAmount] = useState(1)
  const m = context.target.kind === 'membership' ? context.target.membership : null
  if (!m) return null
  const required = program.config.stampsRequired
  const full = m.stamps >= required
  const n = canMulti ? amount : 1
  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-[34px] leading-none font-bold tracking-tight" aria-label={`${m.stamps} of ${required} stamps`}>
        {m.stamps} <span className="text-lg text-muted">/ {required} stamps</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canMulti && (
          <label className="flex items-center gap-2 text-sm">
            <span className="label">Amount</span>
            <Select className="w-20" value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-label="Stamp amount">
              {amounts.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </label>
        )}
        <GuardedButton permission="scanner.transact" size="lg" onClick={() => onAction({ type: 'add_stamp', count: n })} loading={pending} disabled={full}>
          <Plus className="size-4" aria-hidden /> {n} stamp{n > 1 ? 's' : ''}
        </GuardedButton>
        {canRemove && (
          <GuardedButton permission="scanner.adjust" size="lg" variant="secondary" onClick={() => onAction({ type: 'remove_stamp', count: n })} loading={pending} disabled={m.stamps === 0}>
            <Minus className="size-4" aria-hidden /> Remove stamp (-{n})
          </GuardedButton>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <GuardedButton permission="scanner.transact" variant="ink" onClick={() => onAction({ type: 'redeem_bonus' })} loading={pending} disabled={!full}>
          <Gift className="size-4" aria-hidden /> Redeem bonus
        </GuardedButton>
        <span className="text-sm text-muted">{full ? `Card full — ${program.config.rewardDescription}` : `Available when the card is full (${m.stamps}/${required})`}</span>
      </div>
      {full && <p className="callout warn text-xs">The card is full. Redeem the bonus before adding more stamps.</p>}
    </div>
  )
}

/** Points program: purchase amount, the points it will give, "Credit X points". Saved only on press. */
function PointsActions({ context, program, onAction, pending }: { context: ScanContext; program: PointsProgram; onAction: (a: ScanAction) => void; pending: boolean }) {
  const [amount, setAmount] = useState('')
  const m = context.target.kind === 'membership' ? context.target.membership : null
  if (!m) return null
  const cur = currencyCode(program.config)
  if (program.config.awardingMethod === 'fixed') {
    const pts = calculatePoints(program.config, null).points
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">Balance <b className="text-fg">{m.points} pts</b></p>
        <GuardedButton permission="scanner.transact" size="lg" onClick={() => onAction({ type: 'credit_points', purchaseAmount: null })} loading={pending}>
          Credit {pts} points
        </GuardedButton>
      </div>
    )
  }
  const value = amount === '' ? null : Number(amount)
  const preview = buildPointsPreview(program.config, m.points, value)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="award-amount" className="label">Purchase amount ({cur})</label>
          <Input id="award-amount" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="rounded-xl bg-accent-soft p-3">
          <p className="text-xs font-semibold text-accent">Points it will give</p>
          <p className="font-display text-2xl font-bold text-accent">+{preview.points}</p>
          <p className="text-xs text-muted">Balance {preview.currentBalance} → {preview.newBalance} pts</p>
        </div>
      </div>
      {preview.belowMinimum && <p className="callout warn text-xs">Below the minimum purchase amount — no points are earned.</p>}
      {preview.capped && <p className="callout warn text-xs">Capped at the maximum points per transaction.</p>}
      <div>
        <GuardedButton permission="scanner.transact" size="lg" disabled={value === null || !(value >= 0)} onClick={() => value !== null && onAction({ type: 'credit_points', purchaseAmount: value })} loading={pending}>
          Credit {preview.points} points
        </GuardedButton>
      </div>
    </div>
  )
}

function HistoryList({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">No activity yet.</p>
  return (
    <ul className="flex flex-col" aria-label="Award history">
      {rows.map((h) => (
        <li key={h.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-2.5 text-sm last:border-0">
          <span className={cn('min-w-[64px] rounded-md px-2 py-0.5 text-center text-xs font-bold', h.tone === 'remove' ? 'bg-danger-soft text-danger' : h.tone === 'add' ? 'bg-success-soft text-success' : h.tone === 'gift' ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent')}>{h.change}</span>
          <span className="min-w-0 flex-1">
            <span className="font-semibold">{h.description}</span>
            <span className="text-muted"> · {h.programName ?? 'No program'} · {h.by}</span>
          </span>
          {h.balanceAfter && <span className="text-xs text-muted">Balance {h.balanceAfter}</span>}
          {h.entry && (
            <span className="inline-flex items-center gap-1 text-xs text-faint">
              {h.entry === 'scan' ? <ScanLine className="size-3.5" aria-hidden /> : <Search className="size-3.5" aria-hidden />}
              {h.entry === 'scan' ? 'Scanned' : 'Search'}
            </span>
          )}
          <span className="text-xs whitespace-nowrap text-faint">{formatDateTime(h.at)}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Award actions customer screen. A scan and a search result both open this screen. A customer with
 * several programs sees them as cards and the employee picks one; with one program it opens directly.
 */
export function AwardCustomer({ customerId, entry, scannedPass, onReset }: { customerId: string; entry: Entry; scannedPass: string | null; onReset: () => void }) {
  const backend = useBackend()
  const toast = useToast()
  const access = useAccess()
  const { session } = useSession()
  const award = useAwardCustomer(customerId)
  const confirm = useConfirmScan()
  const [picked, setPicked] = useState<string | null>(null)
  const cards = award.data?.cards ?? []
  const selected = picked ?? (cards.length === 1 ? cards[0]!.membership.passCode : null)
  const context = useQuery({ queryKey: ['award-context', selected], queryFn: () => backend.lookupPass(selected!), enabled: !!selected })
  const anyPass = selected ?? cards[0]?.membership.passCode ?? null

  const run = async (passCode: string | null, action: ScanAction) => {
    if (!passCode) return
    try {
      const r = await confirm.mutateAsync({ passCode, action, durationMs: null, entry })
      toast.success(r.surprise ? `${r.summary} Surprise reward: ${r.surprise.name}.` : r.summary)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <QueryState query={award}>
      {(a) => {
        if (!a) return <p className="callout warn">Customer not found.</p>
        const c = a.customer
        const ctx = context.data ?? null
        const program = ctx?.target.kind === 'membership' ? ctx.target.program : null
        const rewards = ctx && !ctx.unavailableReason ? ctx.redeemableRewards : []
        return (
          <div className="flex flex-col gap-[18px]" data-testid="award-customer">
            <Card className="reveal-up">
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="person">
                  <Initials name={c.name || c.customerNumber} className="size-12 text-sm" />
                  <div>
                    <p className="font-display text-xl font-bold tracking-tight">{c.name}</p>
                    <p className="text-sm text-muted">
                      {c.customerNumber}
                      {c.phone && ` · ${c.phone}`}
                      {c.email && ` · ${c.email}`}
                    </p>
                  </div>
                  <Badge tone="outline">{entry === 'scan' ? 'Scanned' : 'Found by search'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {access.can('customers.view') && (
                    <Link to={`/app/customers/${c.id}`} className="btn btn-ghost btn-sm">
                      <UserRound className="size-3.5" aria-hidden /> Profile
                    </Link>
                  )}
                  <button type="button" onClick={onReset} className="btn btn-text btn-sm">
                    <RotateCcw className="size-3.5" aria-hidden /> New scan
                  </button>
                </div>
              </CardBody>
            </Card>

            {(a.gifts.length > 0 || rewards.length > 0 || ctx?.activeWinback) && (
              <Card className="reveal-up border-warning/40">
                <CardHeader title="Active rewards & gifts" icon={<Gift className="size-4" />} description="Nothing is redeemed just because the customer was scanned. Press Redeem." />
                <CardBody>
                  <ul className="flex flex-col gap-2">
                    {a.gifts.map((g) => (
                      <li key={g.id} className="option-row py-2.5">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <Gift className="size-4 text-warning" aria-hidden /> {g.name} <Badge tone="warning">Gift</Badge>
                          {g.description && <span className="font-normal text-muted">{g.description}</span>}
                        </span>
                        <GuardedButton permission="scanner.transact" size="sm" variant="ink" disabled={!anyPass} onClick={() => void run(anyPass, { type: 'redeem_gift', giftId: g.id })} loading={confirm.isPending}>
                          Redeem
                        </GuardedButton>
                      </li>
                    ))}
                    {ctx?.activeWinback && (
                      <li className="option-row py-2.5">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Gift className="size-4 text-faint" aria-hidden /> {ctx.activeWinback.name} <Badge tone="accent">Welcome back</Badge>
                        </span>
                        <GuardedButton permission="scanner.transact" size="sm" variant="ink" onClick={() => void run(selected, { type: 'redeem_winback', rewardId: ctx.activeWinback!.id })} loading={confirm.isPending}>
                          Redeem
                        </GuardedButton>
                      </li>
                    )}
                    {rewards.map((r) => (
                      <li key={r.id} className="option-row py-2.5">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <Gift className="size-4 text-faint" aria-hidden /> {r.name} {r.pointsCost !== null && <Badge>{r.pointsCost} pts</Badge>} {r.source === 'surprise' && <Badge tone="accent">Surprise</Badge>}
                        </span>
                        <GuardedButton permission="scanner.transact" size="sm" variant="ink" onClick={() => void run(selected, { type: 'redeem_reward', rewardId: r.id })} loading={confirm.isPending}>
                          Redeem
                        </GuardedButton>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {cards.length === 0 ? (
              <p className="callout">This customer has no program card yet.</p>
            ) : cards.length > 1 ? (
              <Card className="reveal-up">
                <CardHeader title="Choose a program" description="This customer belongs to more than one program. Pick the one to award." />
                <CardBody>
                  <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Customer programs">
                    {cards.map(({ membership, program: p, unavailableReason }) => (
                      <li key={membership.id}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected === membership.passCode}
                          onClick={() => setPicked(membership.passCode)}
                          className={cn('block w-full rounded-[20px] p-1 text-left ring-2 ring-transparent transition', selected === membership.passCode && 'ring-accent')}
                        >
                          <WalletCard content={buildPassContent(p, membership, session.business.name)} qrCode={membership.passCode} compact />
                          <span className="mt-2 flex items-center justify-between gap-2 px-1 text-sm font-semibold">
                            {p.name}
                            {scannedPass === membership.passCode && <Badge tone="accent">Scanned card</Badge>}
                            {unavailableReason && <Badge tone="warning">Unavailable</Badge>}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}

            {selected && (
              <Card className="reveal-up">
                <CardBody className="flex flex-col gap-4">
                  {context.isPending ? (
                    <p className="text-sm text-muted">Loading card…</p>
                  ) : !ctx ? (
                    <p className="callout warn">This card could not be loaded.</p>
                  ) : ctx.unavailableReason ? (
                    <p className="callout warn items-center" role="alert">
                      <TriangleAlert className="size-[18px] shrink-0" aria-hidden /> {ctx.unavailableReason}
                    </p>
                  ) : (
                    <>
                      {program && ctx.target.kind === 'membership' && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-display text-lg font-bold">{program.name}</p>
                          <Badge tone="outline">{program.type === 'stamp' ? 'Stamp card' : program.type === 'points' ? 'Points' : program.type === 'tier' ? 'Tier' : 'Membership'}</Badge>
                        </div>
                      )}
                      {program?.type === 'stamp' ? (
                        <StampActions key={selected} context={ctx} program={program} onAction={(act) => void run(selected, act)} pending={confirm.isPending} />
                      ) : program?.type === 'points' ? (
                        <PointsActions key={selected} context={ctx} program={program} onAction={(act) => void run(selected, act)} pending={confirm.isPending} />
                      ) : (
                        <ScanPanel context={{ ...ctx, redeemableRewards: [], activeWinback: null }} onConfirm={(act) => void run(selected, act)} pending={confirm.isPending} onReset={onReset} hideHeader />
                      )}
                    </>
                  )}
                </CardBody>
              </Card>
            )}

            <Card className="reveal-up">
              <CardHeader title="History" icon={<History className="size-4" />} description="What changed, who did it, when, the balance after, and whether the customer was scanned or found by search." />
              <CardBody>
                <HistoryList rows={a.history} />
              </CardBody>
            </Card>
          </div>
        )
      }}
    </QueryState>
  )
}
