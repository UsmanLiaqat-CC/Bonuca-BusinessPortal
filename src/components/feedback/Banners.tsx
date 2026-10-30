import { Link } from 'react-router-dom'
import { ArrowRight, Eye, Info, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { formatDate } from '@/lib/dates'
import { daysUntil } from '@/lib/plan'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'

/** Redesign callout (`.callout`) used for every account-level notice. */
function Bar({ tone, icon, children, testId }: { tone: 'accent' | 'warning' | 'neutral' | 'dev'; icon: ReactNode; children: ReactNode; testId: string }) {
  return (
    <div data-testid={testId} className={cn('callout items-center', tone === 'accent' && 'info', tone === 'warning' && 'warn', tone === 'dev' && 'dev')}>
      {icon}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-fg">{children}</div>
    </div>
  )
}

/** Shown in development builds: no backend is connected (truthful integration status). */
export function DevBanner() {
  // Removed from the UI (client request): the "Development build" tag is no longer shown on any page.
  return null
}

export function PreviewBanner() {
  const t = useT()
  const { session } = useSession()
  return (
    <Bar tone="warning" icon={<Eye className="size-[18px] shrink-0" aria-hidden />} testId="preview-banner">
      <span className="font-medium">{t('preview.banner')}</span>
      {session.user.role === 'owner' && (
        <Link to="/app/subscription" className="underline-hl font-semibold">
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
    <Bar tone="accent" icon={<ShieldCheck className="size-[18px] shrink-0" aria-hidden />} testId="override-banner">
      <span className="font-medium">{t('override.banner')}</span>
      {plan.override.endsAt && <span>{t('override.until', { date: formatDate(plan.override.endsAt) })}</span>}
      <span className="text-xs text-muted">{t('override.readonly')}</span>
    </Bar>
  )
}

/** Trial has ended (the active-trial state is shown by `TrialPill` / `TrialCard`). */
export function TrialBanner() {
  const t = useT()
  const { plan } = useSession()
  if (!plan.trialExpired) return null
  return (
    <Bar tone="neutral" icon={<Info className="size-[18px] shrink-0" aria-hidden />} testId="trial-expired-banner">
      <span>{t('trial.expired')}</span>
    </Bar>
  )
}

function useActiveTrial() {
  const { plan, session } = useSession()
  if (plan.mode !== 'trial' || !plan.trialEndsAt || plan.override || plan.trialExpired) return null
  const left = daysUntil(plan.trialEndsAt)
  const total = Math.max(session.catalog.trial.days, left, 1)
  return { left, total }
}

/** Top-bar trial status pill (redesign). */
export function TrialPill() {
  const t = useT()
  const trial = useActiveTrial()
  if (!trial) return null
  return (
    <span className="trial-pill" data-testid="trial-banner">
      <Info className="size-[15px]" aria-hidden />
      <span>{t('trial.banner', { days: trial.left })}</span>
    </span>
  )
}

/** Progress ring from the redesign (trial days remaining). */
export function Ring({ pct, size = 40, stroke = 4, label }: { pct: number; size?: number; stroke?: number; label?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg className="ring-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(127,127,140,.3)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-highlight)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, pct)))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {label !== undefined && (
        <text x="50%" y="50%" dy="0.35em" textAnchor="middle" fill="currentColor" fontSize={12} fontWeight={700}>
          {label}
        </text>
      )}
    </svg>
  )
}

/** Sidebar trial card (redesign): days left ring and a link to plans for roles that can see them. */
export function TrialCard() {
  const t = useT()
  const trial = useActiveTrial()
  const access = useAccess()
  if (!trial) return null
  return (
    <div className="trial-card">
      <span className="absolute top-3 right-3 opacity-100">
        <Ring pct={trial.left / trial.total} label={trial.left} />
      </span>
      <b>{t('onb.plan.trial')}</b>
      <span>{t('trial.banner', { days: trial.left }).replace(/^[^—]*—\s*/, '')}</span>
      {access.can('subscription.view') && (
        <>
          <br />
          <Link to="/app/subscription">
            {t('nav.subscription')} <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </>
      )}
    </div>
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
    <div className="callout" role="note">
      <Info className="size-[18px] shrink-0" aria-hidden />
      <div>
        <b>{title}</b>
        <div>{children}</div>
      </div>
    </div>
  )
}
