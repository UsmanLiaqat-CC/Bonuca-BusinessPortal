import { useState } from 'react'
import { Lock, ShieldCheck, UserPlus, Users, UsersRound } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable, Initials } from '@/components/data-display/Table'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { QueryState } from '@/components/feedback/QueryState'
import { InviteDialog } from '../components/InviteDialog'
import { Leaderboard } from '../components/Leaderboard'
import { useEmployees, useUpdateMemberAccess, useUpdatePermissions } from '../hooks'
import { AccessFields } from '../components/AccessFields'
import { presetFor, USER_TYPE_LABEL, type TeamPermission, type UserType } from '@/lib/teamPermissions'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'

const ROLE_ACCESS = {
  owner: 'Full access — billing/subscription, employees, customers, loyalty programs, analytics, scanner, business settings.',
  admin: 'All available permissions (preset). The owner can change the ticks per person.',
  manager: 'Customers, loyalty programs, rewards, analytics, scanner, limited settings, and employees if permitted.',
  employee: 'Scanner, limited customer info, add stamps/points/visits, redeem rewards. No billing or subscription access.',
} as const
const ROLE_TONE: Record<keyof typeof ROLE_ACCESS, BadgeTone> = { owner: 'accent', admin: 'accent', manager: 'warning', employee: 'neutral' }

/** Spec §4.6 Employees. */
export default function EmployeesPage() {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const { session } = useSession()
  const employees = useEmployees()
  const permissions = useUpdatePermissions()
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<{ userId: string; name: string; role: UserType; permissions: TeamPermission[] } | null>(null)
  const memberAccess = useUpdateMemberAccess()
  const perms = session.business.permissions
  const staffCount = (employees.data?.users.filter((u) => u.role !== 'owner').length ?? 0) + (employees.data?.invites.filter((i) => !i.acceptedAt).length ?? 0)

  const setPerm = (patch: Partial<typeof perms>) => permissions.mutate(patch, { onSuccess: () => toast.success('Saved.'), onError: (e) => toast.error(errorMessage(e)) })
  const ownerPerm = access.evaluate('employees.permissions')
  const visibilityPerm = access.evaluate('leaderboard.visibility')

  return (
    <>
      <PageHeader
        title={t('nav.employees')}
        breadcrumb={
          <>
            <UsersRound className="size-[13px]" aria-hidden /> {t('nav.group.operations')}
          </>
        }
        actions={
          <GuardedButton permission="employees.invite" extra={access.limit('employees', staffCount)} onClick={() => setInviting(true)}>
            <UserPlus className="size-[15px]" aria-hidden /> Invite Employee
          </GuardedButton>
        }
      />
      <div className="flex flex-col gap-[18px]">
        <Card className="reveal-up overflow-hidden">
          <CardHeader title="Team" icon={<Users className="size-4" />} />
          <QueryState query={employees}>
            {(data) => (
              <DataTable
                caption="Team members and invitations"
                rows={[
                  ...data.users.map((u) => ({ key: u.id, name: u.fullName, email: u.email, role: u.role, status: 'Active' as const, date: u.createdAt, permissions: u.permissions ?? null })),
                  ...data.invites.filter((i) => !i.acceptedAt).map((i) => ({ key: i.token, name: '—', email: i.email, role: i.role, status: 'Invited' as const, date: i.createdAt, permissions: i.permissions ?? null })),
                ]}
                rowKey={(r) => r.key}
                columns={[
                  {
                    key: 'name',
                    header: 'Name',
                    cell: (r) => (
                      <span className="person">
                        <Initials name={r.name === '—' ? r.email : r.name} />
                        <span>
                          {r.name}
                          <small className="md:hidden">{r.email}</small>
                        </span>
                      </span>
                    ),
                  },
                  { key: 'email', header: 'Email', hideOnMobile: true, cell: (r) => <span className="text-muted">{r.email}</span> },
                  {
                    key: 'role',
                    header: 'Role',
                    cell: (r) => (
                      <span title={ROLE_ACCESS[r.role]}>
                        <Badge tone={ROLE_TONE[r.role]} dot={false} className="capitalize">
                          {r.role === 'owner' ? 'Owner' : USER_TYPE_LABEL[r.role]}
                        </Badge>
                      </span>
                    ),
                  },
                  { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'Active' ? 'success' : 'warning'} live={r.status === 'Active'}>{r.status === 'Invited' ? 'Invited — awaiting setup' : 'Active'}</Badge> },
                  { key: 'date', header: 'Since', hideOnMobile: true, cell: (r) => <span className="text-muted">{formatDate(r.date)}</span> },
                  {
                    key: 'access',
                    header: 'Access',
                    className: 'num',
                    cell: (r) =>
                      r.status === 'Active' && r.role !== 'owner' ? (
                        <GuardedButton permission="employees.permissions" size="sm" variant="secondary" onClick={() => setEditing({ userId: r.key, name: r.name, role: r.role as UserType, permissions: r.permissions ?? presetFor(r.role as UserType) })}>
                          Permissions
                        </GuardedButton>
                      ) : null,
                  },
                ]}
              />
            )}
          </QueryState>
        </Card>
        <div className="grid gap-[18px] lg:grid-cols-2">
          <Card className="reveal-up">
            <CardHeader title="Roles" icon={<ShieldCheck className="size-4" />} />
            <CardBody>
              <dl className="flex flex-col gap-2.5">
                {(Object.keys(ROLE_ACCESS) as (keyof typeof ROLE_ACCESS)[]).map((r) => (
                  <div key={r} className="setup-item">
                    <dt className="mb-1.5">
                      <Badge tone={ROLE_TONE[r]} dot={false} className="capitalize">
                        {r}
                      </Badge>
                    </dt>
                    <dd className="text-[13.5px] text-muted">{ROLE_ACCESS[r]}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
          <Card className="reveal-up">
            <CardHeader title="Permissions & visibility" icon={<Lock className="size-4" />} />
            <CardBody className="flex flex-col gap-3">
              <div>
                <Toggle label="Managers may manage employees" description="Owner-only setting. Lets Managers view the team and invite Employees." checked={perms.managersCanManageEmployees} disabled={!ownerPerm.allowed || permissions.isPending} onChange={(v) => setPerm({ managersCanManageEmployees: v })} />
                {!ownerPerm.allowed && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-warning">
                    <Lock className="size-3" aria-hidden /> {ownerPerm.message}
                  </p>
                )}
              </div>
              <div>
                <Toggle label="Show leaderboard to employees" description="Gamification is motivational only and never affects permissions or transactions." checked={perms.showLeaderboardToEmployees} disabled={!visibilityPerm.allowed || permissions.isPending} onChange={(v) => setPerm({ showLeaderboardToEmployees: v })} />
                {!visibilityPerm.allowed && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-warning">
                    <Lock className="size-3" aria-hidden /> {visibilityPerm.message}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        {access.can('leaderboard.view') && <Leaderboard />}
      </div>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} />
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Permissions — ${editing?.name ?? ''}`}
        description="Whatever access you give here applies on both the web and mobile apps."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <GuardedButton
              permission="employees.permissions"
              loading={memberAccess.isPending}
              onClick={() =>
                editing &&
                memberAccess.mutate(
                  { userId: editing.userId, role: editing.role, permissions: editing.permissions },
                  { onSuccess: () => { toast.success('Permissions saved.'); setEditing(null) }, onError: (e) => toast.error(errorMessage(e)) },
                )
              }
            >
              Save permissions
            </GuardedButton>
          </>
        }
      >
        {editing && <AccessFields type={editing.role} permissions={editing.permissions} types={['employee', 'manager', 'admin']} onChange={(role, permissions) => setEditing({ ...editing, role, permissions })} idPrefix="edit" />}
      </Dialog>
    </>
  )
}
