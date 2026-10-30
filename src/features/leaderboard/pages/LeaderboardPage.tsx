import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import type { Role } from '@/types/domain'
import { USER_TYPE_LABEL } from '@/lib/teamPermissions'
import { useBackend } from '@/state/services'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Initials } from '@/components/data-display/Table'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'

const ROLE_LABEL = (r: Role) => (r === 'owner' ? 'Owner' : USER_TYPE_LABEL[r])
const MEDAL = ['🥇', '🥈', '🥉']

/** Leaderboard tab: how many scans / stamps / points / redemptions each Owner, Manager and Staff member handled. */
export default function LeaderboardPage() {
  const backend = useBackend()
  const activity = useQuery({ queryKey: ['team-activity'], queryFn: () => backend.getTeamActivity() })
  const [f, setF] = useState({ role: '', user: '', program: '', from: '', to: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  return (
    <>
      <PageHeader
        title="Leaderboard"
        breadcrumb={
          <>
            <Trophy className="size-[13px]" aria-hidden /> Engagement
          </>
        }
        description="Who scanned how much: Owner, Managers and Staff, with filters."
      />
      <Card className="reveal-up overflow-hidden">
        <QueryState query={activity}>
          {(data) => {
            const byUser = new Map(data.users.map((u) => [u.id, { user: u, scans: 0, stamps: 0, points: 0, redeemed: 0, customers: new Set<string>(), last: '' }]))
            for (const t of data.rows) {
              if (f.program && t.programId !== f.program) continue
              if (f.from && t.createdAt.slice(0, 10) < f.from) continue
              if (f.to && t.createdAt.slice(0, 10) > f.to) continue
              const r = byUser.get(t.userId)
              if (!r) continue
              r.scans++
              if (t.stampsAdded > 0) r.stamps += t.stampsAdded
              if (t.pointsAdded > 0) r.points += t.pointsAdded
              if (t.kind.endsWith('_redeemed')) r.redeemed++
              r.customers.add(t.customerId)
              if (t.createdAt > r.last) r.last = t.createdAt
            }
            const rows = [...byUser.values()]
              .filter((r) => (!f.role || r.user.role === f.role) && (!f.user || r.user.id === f.user))
              .sort((a, b) => b.scans - a.scans)
            return (
              <>
                <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-3 xl:grid-cols-5" role="group" aria-label="Leaderboard filters">
                  <Select aria-label="Role" value={f.role} onChange={set('role')}>
                    <option value="">All roles</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Staff</option>
                  </Select>
                  <Select aria-label="Person" value={f.user} onChange={set('user')}>
                    <option value="">Everyone</option>
                    {data.users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                  </Select>
                  <Select aria-label="Program" value={f.program} onChange={set('program')}>
                    <option value="">All programs</option>
                    {data.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                  <Input type="date" aria-label="From date" value={f.from} onChange={set('from')} />
                  <Input type="date" aria-label="To date" value={f.to} onChange={set('to')} />
                </div>
                {rows.length === 0 ? (
                  <div className="p-5"><EmptyState icon={<Trophy className="size-6" />} title="No one matches these filters" /></div>
                ) : (
                  <div className="table-wrap">
                    <table className="t" aria-label="Leaderboard">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th className="num">Scans</th>
                          <th className="num">Stamps given</th>
                          <th className="num">Points given</th>
                          <th className="num">Redemptions</th>
                          <th className="num">Customers served</th>
                          <th className="hidden md:table-cell">Last scan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={r.user.id}>
                            <td className="text-lg">{r.scans > 0 ? (MEDAL[i] ?? i + 1) : '—'}</td>
                            <td><span className="person"><Initials name={r.user.fullName} /><span className="font-semibold">{r.user.fullName}</span></span></td>
                            <td><Badge tone={r.user.role === 'owner' ? 'accent' : r.user.role === 'employee' ? 'neutral' : 'warning'} dot={false}>{ROLE_LABEL(r.user.role)}</Badge></td>
                            <td className="num font-semibold">{r.scans}</td>
                            <td className="num">{r.stamps}</td>
                            <td className="num">{r.points}</td>
                            <td className="num">{r.redeemed}</td>
                            <td className="num">{r.customers.size}</td>
                            <td className="hidden whitespace-nowrap text-muted md:table-cell">{r.last ? new Date(r.last).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )
          }}
        </QueryState>
      </Card>
    </>
  )
}
