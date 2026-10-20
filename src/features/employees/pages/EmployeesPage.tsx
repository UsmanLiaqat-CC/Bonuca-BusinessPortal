import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable } from '@/components/data-display/Table'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { QueryState } from '@/components/feedback/QueryState'
import { InviteDialog } from '../components/InviteDialog'
import { Leaderboard } from '../components/Leaderboard'
import { useEmployees, useUpdatePermissions } from '../hooks'

const ROLE_ACCESS = {
  owner: 'Full access — billing/subscription, employees, customers, loyalty programs, analytics, scanner, business settings.',
  manager: 'Customers, loyalty programs, rewards, analytics, scanner, limited settings, and employees if permitted.',
  employee: 'Scanner, limited customer info, add stamps/points/visits, redeem rewards. No billing or subscription access.',
} as const

/** Spec §4.6 Employees. */
export default function EmployeesPage() {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const { session } = useSession()
  const employees = useEmployees()
  const permissions = useUpdatePermissions()
  const [inviting, setInviting] = useState(false)
  const perms = session.business.permissions
  const staffCount = (employees.data?.users.filter((u) => u.role !== 'owner').length ?? 0) + (employees.data?.invites.filter((i) => !i.acceptedAt).length ?? 0)

  const setPerm = (patch: Partial<typeof perms>) => permissions.mutate(patch, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) })
  const ownerPerm = access.evaluate('employees.permissions')
  const visibilityPerm = access.evaluate('leaderboard.visibility')

  return (
    <>
      <PageHeader
        title={t('nav.employees')}
        actions={
          <GuardedButton permission="employees.invite" extra={access.limit('employees', staffCount)} onClick={() => setInviting(true)}>
            <UserPlus className="size-4" aria-hidden /> Invite Employee
          </GuardedButton>
        }
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Team" />
          <QueryState query={employees}>
            {(data) => (
              <DataTable
                caption="Team members and invitations"
                rows={[
                  ...data.users.map((u) => ({ key: u.id, name: u.fullName, email: u.email, role: u.role, status: 'Active' as const, date: u.createdAt })),
                  ...data.invites.filter((i) => !i.acceptedAt).map((i) => ({ key: i.token, name: '—', email: i.email, role: i.role, status: 'Invited' as const, date: i.createdAt })),
                ]}
                rowKey={(r) => r.key}
                columns={[
                  { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
                  { key: 'email', header: 'Email', hideOnMobile: true, cell: (r) => r.email },
                  { key: 'role', header: 'Role', cell: (r) => <span className="capitalize" title={ROLE_ACCESS[r.role]}>{r.role}</span> },
                  { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'Active' ? 'success' : 'warning'}>{r.status === 'Invited' ? 'Invited — awaiting setup' : 'Active'}</Badge> },
                  { key: 'date', header: 'Since', hideOnMobile: true, cell: (r) => formatDate(r.date) },
                ]}
              />
            )}
          </QueryState>
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Roles" />
            <CardBody>
              <dl className="flex flex-col gap-3 text-sm">
                {(Object.keys(ROLE_ACCESS) as (keyof typeof ROLE_ACCESS)[]).map((r) => (
                  <div key={r}>
                    <dt className="font-medium capitalize">{r}</dt>
                    <dd className="text-muted">{ROLE_ACCESS[r]}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Permissions & visibility" />
            <CardBody className="flex flex-col gap-4">
              <div>
                <Toggle label="Managers may manage employees" description="Owner-only setting. Lets Managers view the team and invite Employees." checked={perms.managersCanManageEmployees} disabled={!ownerPerm.allowed || permissions.isPending} onChange={(v) => setPerm({ managersCanManageEmployees: v })} />
                {!ownerPerm.allowed && <p className="mt-1 text-xs text-muted">{ownerPerm.message}</p>}
              </div>
              <div>
                <Toggle label="Show leaderboard to employees" description="Gamification is motivational only and never affects permissions or transactions." checked={perms.showLeaderboardToEmployees} disabled={!visibilityPerm.allowed || permissions.isPending} onChange={(v) => setPerm({ showLeaderboardToEmployees: v })} />
                {!visibilityPerm.allowed && <p className="mt-1 text-xs text-muted">{visibilityPerm.message}</p>}
              </div>
            </CardBody>
          </Card>
        </div>
        {access.can('leaderboard.view') && <Leaderboard />}
      </div>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} />
    </>
  )
}
