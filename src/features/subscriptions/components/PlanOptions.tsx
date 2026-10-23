import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { PlanCatalog, PlanDefinition, PlanLimits } from '@/types/domain'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

function limitLine(limits: PlanLimits): string[] {
  const fmt = (n: number | null, label: string) => (n === null ? `Unlimited ${label}` : `Up to ${n} ${label}`)
  return [fmt(limits.customers, 'customers'), fmt(limits.programs, 'programs'), fmt(limits.locations, 'locations'), fmt(limits.employees, 'employees')]
}

/**
 * Redesign plan card (`.card.plan`). `featured` draws the gradient border, `ink` the black card;
 * the business's current plan always gets the featured border plus a "Current" badge.
 */
export function PlanCard({
  title,
  price,
  lines,
  badge,
  current,
  featured,
  ink,
  action,
}: {
  title: string
  price: ReactNode
  lines: string[]
  badge?: ReactNode
  current?: boolean
  featured?: boolean
  ink?: boolean
  action: ReactNode
}) {
  return (
    <article className={cn('card plan reveal-up', (current || featured) && 'current', ink && !current && 'ink')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[19px]">{title}</h3>
          <div className="muted mt-1.5 min-h-10 text-[13.5px]">{price}</div>
        </div>
        {current ? <Badge tone="accent">Current</Badge> : badge}
      </div>
      <ul>
        {lines.map((l) => (
          <li key={l}>
            <CheckCircle2 className="size-[15px] shrink-0" aria-hidden />
            {l}
          </li>
        ))}
      </ul>
      <div className="cta">{action}</div>
    </article>
  )
}

/** Free / Free Trial / Paid plans (spec §1.5, §2). Numbers come from Super Admin config (OI-03/04/05). */
export function PlanOptions({
  catalog,
  currentPlanId,
  renderFree,
  renderTrial,
  renderPaid,
}: {
  catalog: PlanCatalog
  currentPlanId?: string | null
  renderFree: () => ReactNode
  renderTrial: () => ReactNode
  renderPaid: (plan: PlanDefinition) => ReactNode
}) {
  const proPlan = catalog.paid.find((p) => p.id === catalog.trial.grantsPlanId)
  return (
    <div className="grid gap-[18px] md:grid-cols-3">
      {catalog.free.enabled && (
        <PlanCard title="Free Plan" price="No payment details required" lines={limitLine(catalog.free.plan.limits)} current={currentPlanId === catalog.free.plan.id} action={renderFree()} />
      )}
      {catalog.trial.enabled && (
        <PlanCard
          title="Free Trial"
          price={`${catalog.trial.days} days, then reverts to Free (or Preview) — no data is deleted`}
          lines={[`All ${proPlan?.name ?? 'paid'} features, temporarily`, ...(proPlan ? limitLine(proPlan.limits) : [])]}
          featured={!currentPlanId}
          action={renderTrial()}
        />
      )}
      {catalog.paid.map((plan) => (
        <PlanCard
          key={plan.id}
          title={`${plan.name} Plan`}
          price={plan.priceLabel ?? <span>Pricing not configured yet <span className="text-xs opacity-75">(set by Bonuca)</span></span>}
          lines={[...limitLine(plan.limits), plan.features.aiCommentary ? 'AI heatmap commentary' : 'Activity heatmap']}
          current={currentPlanId === plan.id}
          ink
          action={renderPaid(plan)}
        />
      ))}
    </div>
  )
}
