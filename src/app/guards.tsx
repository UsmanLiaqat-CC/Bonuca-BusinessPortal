import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { SessionInfo } from '@/services/backend'
import type { Permission } from '@/lib/access'
import { BusinessSessionProvider, useAccess, useSessionQuery } from '@/state/session'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/feedback/QueryState'
import { errorMessage } from '@/lib/errors'
import { ShieldOff } from 'lucide-react'

export type Stage = 'anon' | 'verify' | 'business' | 'plan' | 'first_program' | 'app'

export const STAGE_PATH: Record<Stage, string> = {
  anon: '/login',
  verify: '/verify-email',
  business: '/onboarding/business',
  plan: '/onboarding/plan',
  first_program: '/onboarding/first-program',
  app: '/app',
}

/** Where a user is in the registration → onboarding → app flow (spec §1). */
export function stageOf(session: SessionInfo | null | undefined): Stage {
  if (!session) return 'anon'
  if (!session.user.emailVerified) return 'verify'
  if (!session.business) return 'business'
  if (session.business.onboardingStep === 'plan') return 'plan'
  if (session.business.onboardingStep === 'first_program') return 'first_program'
  return 'app'
}

/** Renders children only at the expected stage; otherwise redirects to the correct step. */
export function StageRoute({ stage, children }: { stage: Stage | Stage[]; children: ReactNode }) {
  const q = useSessionQuery()
  if (q.isPending) return <Spinner />
  if (q.isError) return <div className="p-6"><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></div>
  const current = stageOf(q.data)
  const allowed = Array.isArray(stage) ? stage : [stage]
  if (!allowed.includes(current)) return <Navigate to={STAGE_PATH[current]} replace />
  return <>{children}</>
}

/** App area: requires a completed onboarding and provides the business session. */
export function AppRoute({ children }: { children: ReactNode }) {
  const q = useSessionQuery()
  if (q.isPending) return <Spinner />
  if (q.isError) return <div className="p-6"><ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} /></div>
  const current = stageOf(q.data)
  if (current !== 'app' || !q.data?.business || !q.data.subscription) return <Navigate to={STAGE_PATH[current]} replace />
  return <BusinessSessionProvider session={{ ...q.data, business: q.data.business, subscription: q.data.subscription }}>{children}</BusinessSessionProvider>
}

/** Route-level permission enforcement (not only hidden navigation — spec §2/§3). */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const decision = useAccess().evaluate(permission)
  if (!decision.allowed && decision.reason === 'role') {
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 text-center" role="alert">
        <ShieldOff className="size-8 text-muted" aria-hidden />
        <h1 className="text-lg font-semibold">No access</h1>
        <p className="text-sm text-muted">{decision.message}</p>
      </div>
    )
  }
  return <>{children}</>
}
