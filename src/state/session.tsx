import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PlanLimits } from '@/types/domain'
import type { SessionInfo } from '@/services/backend'
import { checkLimit, evaluate, type AccessContext, type Decision, type Permission } from '@/lib/access'
import { resolvePlanState, type PlanState } from '@/lib/plan'
import { useBackend } from './services'

export const SESSION_KEY = ['session'] as const

export function useSessionQuery() {
  const backend = useBackend()
  return useQuery({ queryKey: SESSION_KEY, queryFn: () => backend.getSession(), staleTime: 30_000 })
}

export interface BusinessSession {
  session: SessionInfo & { business: NonNullable<SessionInfo['business']>; subscription: NonNullable<SessionInfo['subscription']> }
  plan: PlanState
  access: AccessContext
}

const SessionContext = createContext<BusinessSession | null>(null)

export function BusinessSessionProvider({ session, children }: { session: BusinessSession['session']; children: ReactNode }) {
  const value = useMemo<BusinessSession>(() => {
    const plan = resolvePlanState(session.subscription, session.catalog)
    return { session, plan, access: { role: session.user.role, plan, permissions: session.business.permissions, grants: session.user.permissions ?? null } }
  }, [session])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): BusinessSession {
  const v = useContext(SessionContext)
  if (!v) throw new Error('useSession must be used inside <BusinessSessionProvider>')
  return v
}

export interface AccessApi {
  can: (p: Permission) => boolean
  evaluate: (p: Permission) => Decision
  limit: (resource: keyof PlanLimits, count: number) => Decision
  plan: PlanState
  role: AccessContext['role']
  isPreview: boolean
}

export function useAccess(): AccessApi {
  const { access, plan } = useSession()
  return useMemo(
    () => ({
      can: (p) => evaluate(access, p).allowed,
      evaluate: (p) => evaluate(access, p),
      limit: (r, n) => checkLimit(plan, r, n),
      plan,
      role: access.role,
      isPreview: plan.mode === 'preview',
    }),
    [access, plan],
  )
}
