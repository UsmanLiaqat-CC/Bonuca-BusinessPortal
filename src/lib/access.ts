import type { Business, PlanLimits, Role } from '@/types/domain'
import { hasPlanFeature, type PlanState } from './plan'

/** Exact Preview Mode message required by spec §2. Do not reword. */
export const PREVIEW_LOCK_MESSAGE = 'Select a free trial, free plan, or paid plan to use this feature.'
export const ROLE_LOCK_MESSAGE = 'Your role does not have access to this feature.'

export type Permission =
  | 'dashboard.view'
  | 'programs.view'
  | 'programs.manage'
  | 'wallet.view'
  | 'wallet.manage'
  | 'qr.manage'
  | 'scanner.use'
  | 'scanner.transact'
  | 'scanner.adjust'
  | 'gifts.manage'
  | 'audit.view'
  | 'customers.view'
  | 'customers.viewFull'
  | 'customers.add'
  | 'customers.notes'
  | 'customers.signupFields'
  | 'employees.view'
  | 'employees.invite'
  | 'employees.inviteManager'
  | 'employees.permissions'
  | 'leaderboard.view'
  | 'leaderboard.visibility'
  | 'notifications.view'
  | 'notifications.manage'
  | 'notifications.ai'
  | 'rewards.view'
  | 'rewards.manage'
  | 'analytics.view'
  | 'analytics.aiCommentary'
  | 'branding.manage'
  | 'subscription.view'
  | 'subscription.manage'
  | 'settings.view'
  | 'settings.edit'
  | 'settings.billing'
  | 'account.view'

export interface AccessContext {
  role: Role
  plan: PlanState
  permissions: Business['permissions']
}

type RoleRule = (ctx: AccessContext) => boolean

interface PermissionRule {
  roles: RoleRule
  /** Mutating / live actions are locked in Preview Mode (§2). */
  locksInPreview: boolean
  feature?: 'aiCommentary'
}

const OWNER_MANAGER: RoleRule = (c) => c.role === 'owner' || c.role === 'manager'
const ALL: RoleRule = () => true
const OWNER: RoleRule = (c) => c.role === 'owner'
const EMPLOYEE_ADMIN: RoleRule = (c) =>
  c.role === 'owner' || (c.role === 'manager' && c.permissions.managersCanManageEmployees)

/**
 * Role matrix — spec §3, §4.6. Provisional interpretations are documented in docs/open-items.md
 * (OI-15 Manager limited settings, OI-16/17 employee management, OI-18 limited customer info,
 * OI-19 AI features Owner-only).
 */
const RULES: Record<Permission, PermissionRule> = {
  'dashboard.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'programs.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'programs.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  'wallet.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'wallet.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  'qr.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  'scanner.use': { roles: ALL, locksInPreview: false },
  'scanner.transact': { roles: ALL, locksInPreview: true },
  // Award actions: Remove stamp (-1) and the amount dropdown are Owner/Manager only; employees add and redeem.
  'scanner.adjust': { roles: OWNER_MANAGER, locksInPreview: true },
  // Surprise gift from the customer profile: Give gift / Cancel are Owner and Manager only.
  'gifts.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  // Settings → Audit: review what Managers and Employees did.
  'audit.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'customers.view': { roles: ALL, locksInPreview: false },
  'customers.viewFull': { roles: OWNER_MANAGER, locksInPreview: false },
  'customers.add': { roles: OWNER_MANAGER, locksInPreview: true },
  'customers.notes': { roles: OWNER_MANAGER, locksInPreview: true },
  'customers.signupFields': { roles: OWNER_MANAGER, locksInPreview: true },
  'employees.view': { roles: EMPLOYEE_ADMIN, locksInPreview: false },
  'employees.invite': { roles: EMPLOYEE_ADMIN, locksInPreview: true },
  'employees.inviteManager': { roles: OWNER, locksInPreview: true },
  'employees.permissions': { roles: OWNER, locksInPreview: true },
  'leaderboard.view': {
    roles: (c) => OWNER_MANAGER(c) || (c.role === 'employee' && c.permissions.showLeaderboardToEmployees),
    locksInPreview: false,
  },
  'leaderboard.visibility': { roles: OWNER_MANAGER, locksInPreview: true },
  'notifications.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'notifications.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  'notifications.ai': { roles: OWNER, locksInPreview: true },
  'rewards.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'rewards.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  'analytics.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'analytics.aiCommentary': { roles: OWNER_MANAGER, locksInPreview: true, feature: 'aiCommentary' },
  'branding.manage': { roles: OWNER_MANAGER, locksInPreview: true },
  // §3.1 lists Subscription & Billing for Owner & Manager; §4.6 gives billing actions to Owner only.
  'subscription.view': { roles: OWNER_MANAGER, locksInPreview: false },
  // Choosing a plan is how a business leaves Preview Mode, so it is never preview-locked.
  'subscription.manage': { roles: OWNER, locksInPreview: false },
  'settings.view': { roles: OWNER_MANAGER, locksInPreview: false },
  'settings.edit': { roles: OWNER_MANAGER, locksInPreview: true },
  'settings.billing': { roles: OWNER, locksInPreview: false },
  'account.view': { roles: ALL, locksInPreview: false },
}

export type Decision =
  | { allowed: true }
  | { allowed: false; reason: 'role' | 'preview' | 'plan' | 'limit'; message: string }

export function evaluate(ctx: AccessContext, permission: Permission): Decision {
  const rule = RULES[permission]
  if (!rule.roles(ctx)) return { allowed: false, reason: 'role', message: ROLE_LOCK_MESSAGE }
  if (rule.locksInPreview && ctx.plan.mode === 'preview') {
    return { allowed: false, reason: 'preview', message: PREVIEW_LOCK_MESSAGE }
  }
  if (rule.feature && !hasPlanFeature(ctx.plan, rule.feature)) {
    return { allowed: false, reason: 'plan', message: 'Available on the Pro plan.' }
  }
  return { allowed: true }
}

export function can(ctx: AccessContext, permission: Permission): boolean {
  return evaluate(ctx, permission).allowed
}

const LIMIT_LABEL: Record<keyof PlanLimits, string> = {
  customers: 'customers',
  programs: 'programs',
  locations: 'locations',
  employees: 'employees',
}

/** Free-plan (or other plan) quantity limits (§2). */
export function checkLimit(plan: PlanState, resource: keyof PlanLimits, currentCount: number): Decision {
  if (plan.mode === 'preview') return { allowed: false, reason: 'preview', message: PREVIEW_LOCK_MESSAGE }
  const limit = plan.limits?.[resource] ?? null
  if (limit !== null && currentCount >= limit) {
    return {
      allowed: false,
      reason: 'limit',
      message: `Your ${plan.plan?.name ?? 'current'} plan allows up to ${limit} ${LIMIT_LABEL[resource]}. Upgrade to add more.`,
    }
  }
  return { allowed: true }
}

export class AccessDeniedError extends Error {
  readonly decision: Exclude<Decision, { allowed: true }>
  constructor(decision: Exclude<Decision, { allowed: true }>) {
    super(decision.message)
    this.name = 'AccessDeniedError'
    this.decision = decision
  }
}

/** Throws when not allowed — used by the backend layer so access is enforced in logic, not only UI. */
export function authorize(ctx: AccessContext, permission: Permission): void {
  const d = evaluate(ctx, permission)
  if (!d.allowed) throw new AccessDeniedError(d)
}

export function assertWithinLimit(plan: PlanState, resource: keyof PlanLimits, count: number): void {
  const d = checkLimit(plan, resource, count)
  if (!d.allowed) throw new AccessDeniedError(d)
}
