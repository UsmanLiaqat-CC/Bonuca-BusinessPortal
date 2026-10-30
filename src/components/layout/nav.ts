import { BarChart3, Bell, Building2, CreditCard, Gift, LayoutDashboard, Palette, QrCode, Settings, Stamp, Ticket, Trophy, UserCircle, Users, UsersRound, type LucideIcon } from 'lucide-react'
import type { Permission } from '@/lib/access'
import type { MessageKey } from '@/i18n'
import type { Role } from '@/types/domain'

export type NavGroup = 'overview' | 'operations' | 'engagement' | 'business'

export interface NavItem {
  to: string
  labelKey: MessageKey
  /** Employees see "Customer Info" (limited) instead of "Customers" (spec §3.2). */
  employeeLabelKey?: MessageKey
  icon: LucideIcon
  permission: Permission
  roles?: Role[]
  /** Sidebar section heading (redesign grouping only; no effect on access). */
  group: NavGroup
}

/** Business portal tabs (spec §4 / §3). Visibility is permission-driven; routes are also guarded. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, permission: 'dashboard.view', group: 'overview' },
  { to: '/app/programs', labelKey: 'nav.programs', icon: Stamp, permission: 'programs.view', group: 'overview' },
  // Campaigns tab (client change): sits right under Loyalty Programs.
  { to: '/app/campaigns', labelKey: 'nav.campaigns', icon: Ticket, permission: 'programs.view', group: 'overview' },
  { to: '/app/scanner', labelKey: 'nav.scanner', icon: QrCode, permission: 'scanner.use', group: 'operations' },
  { to: '/app/customers', labelKey: 'nav.customers', employeeLabelKey: 'nav.customerInfo', icon: Users, permission: 'customers.view', group: 'operations' },
  { to: '/app/employees', labelKey: 'nav.employees', icon: UsersRound, permission: 'employees.view', group: 'operations' },
  { to: '/app/notifications', labelKey: 'nav.notifications', icon: Bell, permission: 'notifications.view', group: 'engagement' },
  { to: '/app/rewards', labelKey: 'nav.rewards', icon: Gift, permission: 'rewards.view', group: 'engagement' },
  { to: '/app/analytics', labelKey: 'nav.analytics', icon: BarChart3, permission: 'analytics.view', group: 'engagement' },
  // Leaderboard tab (client change): right below Analytics.
  { to: '/app/leaderboard', labelKey: 'nav.leaderboard', icon: Trophy, permission: 'leaderboard.view', group: 'engagement' },
  { to: '/app/branding', labelKey: 'nav.branding', icon: Palette, permission: 'settings.view', group: 'business' },
  { to: '/app/subscription', labelKey: 'nav.subscription', icon: CreditCard, permission: 'subscription.view', group: 'business' },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings, permission: 'settings.view', group: 'business' },
  { to: '/app/account', labelKey: 'nav.account', icon: UserCircle, permission: 'account.view', roles: ['employee'], group: 'business' },
]

export const BusinessIcon = Building2

export function homePathFor(role: Role, grants?: readonly string[] | null): string {
  if (role === 'employee') return '/app/scanner'
  // Team members without dashboard access land on Award actions.
  if (role !== 'owner' && grants && !grants.includes('dashboard')) return '/app/scanner'
  return '/app/dashboard'
}
