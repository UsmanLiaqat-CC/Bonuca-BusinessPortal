import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { PlanCatalog, PlanDefinition, PlanLimits } from '@/types/domain'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

function limitLine(limits: PlanLimits): string[] {
  const fmt = (n: number | null, label: string) => (n === null ? `Unlimited ${label}` : `Up to ${n} ${label}`)
  return [fmt(limits.customers, 'customers'), fmt(limits.programs, 'programs'), fmt(limits.locations, 'locations'), fmt(limits.employees, 'employees')]
}

export function PlanCard({ title, price, lines, badge, current, action }: { title: string; price: ReactNode; lines: string[]; badge?: ReactNode; current?: boolean; action: ReactNode }) {
  return (
    <Card className={cn('flex flex-col p-5', current && 'border-accent ring-1 ring-accent')}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {current ? <Badge tone="accent">Current</Badge> : badge}
      </div>
      <div className="mt-2 text-sm text-muted">{price}</div>
      <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-sm">
        {lines.map((l) => (
          <li key={l} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            {l}
          </li>
        ))}
      </ul>
      <div className="mt-5">{action}</div>
    </Card>
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
    <div className="grid gap-4 md:grid-cols-3">
      {catalog.free.enabled && (
        <PlanCard title="Free Plan" price="No payment details required" lines={limitLine(catalog.free.plan.limits)} current={currentPlanId === catalog.free.plan.id} action={renderFree()} />
      )}
      {catalog.trial.enabled && (
        <PlanCard
          title="Free Trial"
          price={`${catalog.trial.days} days, then reverts to Free (or Preview) — no data is deleted`}
          lines={[`All ${proPlan?.name ?? 'paid'} features, temporarily`, ...(proPlan ? limitLine(proPlan.limits) : [])]}
          action={renderTrial()}
        />
      )}
      {catalog.paid.map((plan) => (
        <PlanCard
          key={plan.id}
          title={`${plan.name} Plan`}
          price={plan.priceLabel ?? <span>Pricing not configured yet <span className="text-xs">(set by Bonuca)</span></span>}
          lines={[...limitLine(plan.limits), plan.features.aiCommentary ? 'AI heatmap commentary' : 'Activity heatmap']}
          current={currentPlanId === plan.id}
          action={renderPaid(plan)}
        />
      ))}
    </div>
  )
}
