import { Link } from 'react-router-dom'
import { Eye, FlaskConical, Info, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { useSession } from '@/state/session'
import { formatDate } from '@/lib/dates'
import { daysUntil } from '@/lib/plan'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'

function Bar({ tone, icon, children, testId }: { tone: 'accent' | 'warning' | 'neutral'; icon: ReactNode; children: ReactNode; testId: string }) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm',
        tone === 'accent' && 'bg-accent-soft text-fg',
        tone === 'warning' && 'bg-warning-soft text-fg',
        tone === 'neutral' && 'bg-surface-2 text-muted',
      )}
    >
      <span className="shrink-0" aria-hidden>
        {icon}
      </span>
      {children}
    </div>
  )
}

/** Shown in development builds: no backend is connected (truthful integration status). */
export function DevBanner() {
  const t = useT()
  return (
    <Bar tone="neutral" icon={<FlaskConical className="size-4" />} testId="dev-banner">
      <span className="text-xs">{t('dev.banner')}</span>
    </Bar>
  )
}

export function PreviewBanner() {
  const t = useT()
  const { session } = useSession()
  return (
    <Bar tone="warning" icon={<Eye className="size-4 text-warning" />} testId="preview-banner">
      <span className="font-medium">{t('preview.banner')}</span>
      {session.user.role === 'owner' && (
        <Link to="/app/subscription" className="font-semibold text-accent underline-offset-2 hover:underline">
          {t('preview.choosePlan')}
        </Link>
      )}
    </Bar>
  )
}

/** Read-only Super Admin override banner (spec §2, §4.1, §4.11). Contains no controls. */
export function OverrideBanner() {
  const t = useT()
  const { plan } = useSession()
  if (!plan.override) return null
  return (
    <Bar tone="accent" icon={<ShieldCheck className="size-4 text-accent" />} testId="override-banner">
      <span className="font-medium">{t('override.banner')}</span>
      {plan.override.endsAt && <span>{t('override.until', { date: formatDate(plan.override.endsAt) })}</span>}
      <span className="text-xs text-muted">{t('override.readonly')}</span>
    </Bar>
  )
}

export function TrialBanner() {
  const t = useT()
  const { plan } = useSession()
  if (plan.trialExpired) {
    return (
      <Bar tone="neutral" icon={<Info className="size-4" />} testId="trial-expired-banner">
        <span>{t('trial.expired')}</span>
      </Bar>
    )
  }
  if (plan.mode !== 'trial' || !plan.trialEndsAt || plan.override) return null
  return (
    <Bar tone="neutral" icon={<Info className="size-4" />} testId="trial-banner">
      <span>{t('trial.banner', { days: daysUntil(plan.trialEndsAt) })}</span>
    </Bar>
  )
}

/** Labels any screen content that is demo data (spec §2, §4.1). */
export function DemoBadge() {
  const t = useT()
  const { plan } = useSession()
  if (plan.mode !== 'preview') return null
  return <Badge tone="warning">{t('common.demoData')}</Badge>
}

/** Truthful status for an external dependency that is not available. */
export function IntegrationNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm" role="note">
      <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <div className="text-muted">{children}</div>
      </div>
    </div>
  )
}
