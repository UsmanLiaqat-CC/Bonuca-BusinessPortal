/**
 * Team permissions (BONUCA CHANGES doc, "Roles"): the merchant invites by email and picks a User Type —
 * Staff, Manager or Admin. Each type is a preset that ticks permission checkboxes (per tab, read-only or
 * edit); the owner can change the ticks. The same list is stored on the user, so web and mobile apply it alike.
 */
export type TeamPermission =
  | 'scan'
  | 'redeem'
  | 'multiStamp'
  | 'adjustStamps'
  | 'customers.view'
  | 'customers.add'
  | 'customers.edit'
  | 'programs.view'
  | 'programs.manage'
  | 'dashboard'
  | 'rewards'
  | 'notifications'
  | 'team'
  | 'settings'
  | 'audit'

export type UserType = 'employee' | 'manager' | 'admin'

export const USER_TYPE_LABEL: Record<UserType, string> = { employee: 'Staff', manager: 'Manager', admin: 'Admin' }

export const TEAM_PERMISSIONS: { key: TeamPermission; tab: string; label: string; level: 'read' | 'edit' }[] = [
  { key: 'scan', tab: 'QR Scanner', label: 'Scan customer QR codes', level: 'edit' },
  { key: 'redeem', tab: 'QR Scanner', label: 'Redeem rewards', level: 'edit' },
  { key: 'multiStamp', tab: 'QR Scanner', label: 'Award multiple stamps per scan', level: 'edit' },
  { key: 'adjustStamps', tab: 'QR Scanner', label: 'Remove stamps', level: 'edit' },
  { key: 'customers.view', tab: 'Customers', label: 'View customers', level: 'read' },
  { key: 'customers.add', tab: 'Customers', label: 'Add customers manually', level: 'edit' },
  { key: 'customers.edit', tab: 'Customers', label: 'Edit customer details and give gifts', level: 'edit' },
  { key: 'programs.view', tab: 'Loyalty Programs & Campaigns', label: 'View programs and campaigns', level: 'read' },
  { key: 'programs.manage', tab: 'Loyalty Programs & Campaigns', label: 'Manage programs and campaigns', level: 'edit' },
  { key: 'dashboard', tab: 'Dashboard & Analytics', label: 'View dashboard and analytics', level: 'read' },
  { key: 'rewards', tab: 'Rewards', label: 'Manage rewards', level: 'edit' },
  { key: 'notifications', tab: 'Notifications', label: 'Manage notifications', level: 'edit' },
  { key: 'team', tab: 'Employees', label: 'Manage team members', level: 'edit' },
  { key: 'settings', tab: 'Settings & Branding', label: 'Edit settings and branding', level: 'edit' },
  { key: 'audit', tab: 'Settings & Branding', label: 'View audit', level: 'read' },
]

const STAFF: TeamPermission[] = ['scan', 'redeem']
const MANAGER: TeamPermission[] = [...STAFF, 'multiStamp', 'customers.view', 'customers.add', 'customers.edit', 'programs.view', 'programs.manage', 'dashboard']

/** Staff = scan + redeem; Manager = Staff + customers, programs, dashboard; Admin = everything. */
export function presetFor(type: UserType): TeamPermission[] {
  if (type === 'employee') return [...STAFF]
  if (type === 'manager') return [...MANAGER]
  return TEAM_PERMISSIONS.map((p) => p.key)
}

export function isTeamPermission(value: string): value is TeamPermission {
  return TEAM_PERMISSIONS.some((p) => p.key === value)
}
