import { useState } from 'react'
import { Gift, RotateCcw, TriangleAlert } from 'lucide-react'
import type { ScanAction, ScanContext } from '@/lib/scanEngine'
import { buildPointsPreview, calculatePoints, currencyCode } from '@/lib/points'
import { nextTierProgress, tierMetric } from '@/lib/tiers'
import { formatDate } from '@/lib/dates'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Field'
import { Initials } from '@/components/data-display/Table'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { useT } from '@/i18n'

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="kv">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? 'big text-right font-display text-lg font-semibold tracking-tight' : 'text-right font-semibold'}>{value}</dd>
    </div>
  )
}

/** Identification → confirm step (spec §4.4 employee scan flow). */
export function ScanPanel({ context, onConfirm, pending, onReset }: { context: ScanContext; onConfirm: (a: ScanAction) => void; pending: boolean; onReset: () => void }) {
  const t = useT()
  const [amount, setAmount] = useState('')
  const [points, setPoints] = useState('')
  const { target } = context
  const amountNum = amount === '' ? null : Number(amount)
  const pointsNum = points === '' ? null : Number(points)

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="person">
        <Initials name={target.customer.name || target.customer.customerNumber} className="size-11 text-sm" />
        <div>
        <p className="font-display text-xl font-bold tracking-tight">{target.customer.name}</p>
        <p className="text-sm font-normal text-muted">
          {target.customer.customerNumber} · {target.kind === 'membership' ? `${target.program.name} (${t(`type.${target.program.type}`)})` : `${target.campaign.name} (voucher)`}
        </p>
        </div>
      </div>
      <button type="button" onClick={onReset} className="btn btn-text btn-sm">
        <RotateCcw className="size-3.5" aria-hidden /> New scan
      </button>
    </div>
  )

  let action: React.ReactNode = null
  if (context.unavailableReason) {
    action = (
      <p className="callout warn items-center" role="alert">
        <TriangleAlert className="size-[18px] shrink-0" aria-hidden /> {context.unavailableReason}
      </p>
    )
  } else if (target.kind === 'voucher') {
    action = (
      <>
        <dl>
          <Row label="Voucher" value={target.reward.name} strong />
          <Row label="Valid from" value={formatDate(target.campaign.validFrom)} />
          <Row label="Valid to" value={formatDate(target.campaign.validTo)} />
        </dl>
        <GuardedButton permission="scanner.transact" size="lg" onClick={() => onConfirm({ type: 'redeem_voucher' })} loading={pending}>
          Redeem voucher
        </GuardedButton>
      </>
    )
  } else {
    const p = target.program
    const m = target.membership
    if (p.type === 'stamp') {
      action = (
        <>
          <dl>
            <Row label="Stamps" value={`${m.stamps} / ${p.config.stampsRequired}`} strong />
            <Row label="Reward" value={p.config.rewardDescription} />
          </dl>
          <GuardedButton permission="scanner.transact" size="lg" onClick={() => onConfirm({ type: 'add_stamp' })} loading={pending}>
            Add stamp
          </GuardedButton>
        </>
      )
    } else if (p.type === 'points') {
      const cur = currencyCode(p.config)
      if (p.config.awardingMethod === 'fixed') {
        const pts = calculatePoints(p.config, null).points
        action = (
          <>
            <dl>
              <Row label="Current balance" value={`${m.points} pts`} />
              <Row label="Points to be added" value={`+${pts}`} strong />
            </dl>
            <GuardedButton permission="scanner.transact" size="lg" onClick={() => onConfirm({ type: 'credit_points', purchaseAmount: null })} loading={pending}>
              Credit {pts} points
            </GuardedButton>
          </>
        )
      } else {
        const preview = buildPointsPreview(p.config, m.points, amountNum)
        action = (
          <>
            <div className="field">
              <label htmlFor="scan-amount" className="label">Purchase amount ({cur})</label>
              <Input id="scan-amount" type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            {/* Full preview before confirming (spec §4.2 condition). Currency is fixed by the program. */}
            <dl aria-label="Points preview">
              <Row label="Customer" value={target.customer.name} />
              <Row label="Current balance" value={`${preview.currentBalance} pts`} />
              <Row label="Amount entered" value={amountNum === null ? '—' : `${amountNum.toFixed(2)} ${cur}`} />
              <Row label="Points to be added" value={`+${preview.points}`} strong />
              <Row label="New balance" value={`${preview.newBalance} pts`} strong />
              <Row label="Next reward" value={preview.nextReward?.name ?? 'All rewards reached'} />
              <Row label="Points still needed" value={preview.pointsStillNeeded === null ? '—' : String(preview.pointsStillNeeded)} />
            </dl>
            {preview.belowMinimum && <p className="callout warn text-xs">Below the minimum purchase amount — no points are earned.</p>}
            {preview.capped && <p className="callout warn text-xs">Capped at the maximum points per transaction.</p>}
            <GuardedButton permission="scanner.transact" size="lg" onClick={() => amountNum !== null && amountNum >= 0 && onConfirm({ type: 'credit_points', purchaseAmount: amountNum })} loading={pending}>
              Credit {preview.points} points
            </GuardedButton>
          </>
        )
      }
    } else if (p.type === 'membership') {
      const c = p.config
      action = (
        <>
          <dl>
            <Row label="Benefit" value={c.benefitDescription} strong />
            {c.benefitType !== 'perk' && <Row label="Discount to apply" value={c.benefitType === 'percent_discount' ? `${c.discountValue}%` : String(c.discountValue)} strong />}
            <Row label="Member since" value={formatDate(m.joinedAt)} />
          </dl>
          <GuardedButton permission="scanner.transact" size="lg" onClick={() => onConfirm({ type: 'record_visit', purchaseAmount: null, points: null })} loading={pending}>
            Record visit
          </GuardedButton>
        </>
      )
    } else {
      const c = p.config
      const tier = c.tiers[m.tierIndex]
      const value = tierMetric(m, c.upgradeBasis)
      const next = c.tiersEnabled ? nextTierProgress(c, m.tierIndex, value) : null
      action = (
        <>
          <dl>
            <Row label="Current tier" value={c.tiersEnabled ? (tier?.name ?? '—') : 'Tiering off'} strong />
            {tier && <Row label="Benefits" value={tier.rewards} />}
            {next && <Row label="Next tier" value={`${next.remaining} ${c.upgradeBasis === 'spend' ? 'spend' : c.upgradeBasis} to ${next.next.name}`} />}
          </dl>
          {c.tiersEnabled && c.upgradeBasis === 'spend' && (
            <div className="field">
              <label htmlFor="scan-tier-amount" className="label">Purchase amount</label>
              <Input id="scan-tier-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
          {c.tiersEnabled && c.upgradeBasis === 'points' && (
            <div className="field">
              <label htmlFor="scan-tier-points" className="label">Points to add</label>
              <Input id="scan-tier-points" type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
            </div>
          )}
          <GuardedButton permission="scanner.transact" size="lg" onClick={() => onConfirm({ type: 'record_visit', purchaseAmount: amountNum, points: pointsNum })} loading={pending}>
            Record visit
          </GuardedButton>
        </>
      )
    }
  }

  return (
    <Card className="reveal-up">
      <CardBody className="flex flex-col gap-[18px]">
        {header}
        {context.activeWinback && (
          // Win-back reactivation scan (spec §4.4): name, days inactive, active reward, redemption status.
          <div className="offer-card flex flex-col gap-3" data-testid="winback-panel">
            <span className="confetti" aria-hidden>🎁</span>
            <div className="relative flex items-center gap-2 font-display text-lg font-bold">
              <Gift className="size-[18px]" aria-hidden /> Welcome back offer
            </div>
            <dl>
              <Row label="Customer" value={target.customer.name} />
              <Row label="Days inactive" value={context.daysInactive === null ? '—' : String(context.daysInactive)} />
              <Row label="Win-back reward" value={context.activeWinback.name} strong />
              <Row label="Redemption status" value="Not redeemed" />
            </dl>
            <GuardedButton permission="scanner.transact" onClick={() => onConfirm({ type: 'redeem_winback', rewardId: context.activeWinback!.id })} loading={pending}>
              Redeem Reward
            </GuardedButton>
          </div>
        )}
        {action}
        {context.redeemableRewards.length > 0 && !context.unavailableReason && (
          <div className="flex flex-col gap-2.5 border-t border-line pt-[18px]">
            <p className="label">Available rewards</p>
            <ul className="flex flex-col gap-2">
              {context.redeemableRewards.map((r) => (
                <li key={r.id} className="option-row py-2.5">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    <Gift className="size-4 text-faint" aria-hidden /> {r.name} {r.pointsCost !== null && <Badge>{r.pointsCost} pts</Badge>} {r.source === 'surprise' && <Badge tone="accent">Surprise</Badge>}
                  </span>
                  <GuardedButton permission="scanner.transact" size="sm" variant="ink" onClick={() => onConfirm({ type: 'redeem_reward', rewardId: r.id })} loading={pending}>
                    Redeem Reward
                  </GuardedButton>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
