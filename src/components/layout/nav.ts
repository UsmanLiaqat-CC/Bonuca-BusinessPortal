import { BarChart3, Bell, Building2, CreditCard, Gift, LayoutDashboard, Palette, QrCode, Settings, Stamp, UserCircle, Users, UsersRound, WalletCards, type LucideIcon } from 'lucide-react'
import type { Permission } from '@/lib/access'
import type { MessageKey } from '@/i18n'
import type { Role } from '@/types/domain'

export interface NavItem {
  to: string
  labelKey: MessageKey
  /** Employees see "Customer Info" (limited) instead of "Customers" (spec §3.2). */
  employeeLabelKey?: MessageKey
  icon: LucideIcon
  permission: Permission
  roles?: Role[]
}

/** Business portal tabs (spec §4 / §3). Visibility is permission-driven; routes are also guarded. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/app/programs', labelKey: 'nav.programs', icon: Stamp, permission: 'programs.view' },
  { to: '/app/wallet-cards', labelKey: 'nav.wallet', icon: WalletCards, permission: 'wallet.view' },
  { to: '/app/scanner', labelKey: 'nav.scanner', icon: QrCode, permission: 'scanner.use' },
  { to: '/app/customers', labelKey: 'nav.customers', employeeLabelKey: 'nav.customerInfo', icon: Users, permission: 'customers.view' },
  { to: '/app/employees', labelKey: 'nav.employees', icon: UsersRound, permission: 'employees.view' },
  { to: '/app/notifications', labelKey: 'nav.notifications', icon: Bell, permission: 'notifications.view' },
  { to: '/app/rewards', labelKey: 'nav.rewards', icon: Gift, permission: 'rewards.view' },
  { to: '/app/analytics', labelKey: 'nav.analytics', icon: BarChart3, permission: 'analytics.view' },
  { to: '/app/branding', labelKey: 'nav.branding', icon: Palette, permission: 'settings.view' },
  { to: '/app/subscription', labelKey: 'nav.subscription', icon: CreditCard, permission: 'subscription.view' },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings, permission: 'settings.view' },
  { to: '/app/account', labelKey: 'nav.account', icon: UserCircle, permission: 'account.view', roles: ['employee'] },
]

export const BusinessIcon = Building2

export function homePathFor(role: Role): string {
  return role === 'employee' ? '/app/scanner' : '/app/dashboard'
}
