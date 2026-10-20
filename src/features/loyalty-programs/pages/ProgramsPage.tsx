import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coins, Crown, Layers, Plus, Stamp, Ticket, TicketPercent } from 'lucide-react'
import { PROGRAM_TYPES, type LifecycleStatus, type ProgramType } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { DataTable } from '@/components/data-display/Table'
import { Card, CardHeader } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useCampaigns, usePrograms } from '../hooks'

export const TYPE_ICONS: Record<ProgramType, typeof Stamp> = { stamp: Stamp, membership: Crown, tier: Layers, points: Coins }
type Filter = 'all' | LifecycleStatus

/** Spec §4.2 — several programs at once, including more than one of the same type. */
export default function ProgramsPage() {
  const t = useT()
  const navigate = useNavigate()
  const access = useAccess()
  const programs = usePrograms()
  const campaigns = useCampaigns()
  const [filter, setFilter] = useState<Filter>('all')
  const [chooser, setChooser] = useState<'program' | 'campaign' | null>(null)
  const nonArchived = (programs.data ?? []).filter((p) => p.status !== 'archived').length

  return (
    <>
      <PageHeader
        title={t('nav.programs')}
        description="Programs are what customers join. Campaigns are special QR codes layered on top (acquisition) or standalone vouchers."
        actions={
          <>
            <GuardedButton permission="programs.manage" variant="secondary" onClick={() => setChooser('campaign')}>
              <Ticket className="size-4" aria-hidden /> Create campaign
            </GuardedButton>
            <GuardedButton permission="programs.manage" extra={access.limit('programs', nonArchived)} onClick={() => setChooser('program')}>
              <Plus className="size-4" aria-hidden /> Create Program
            </GuardedButton>
          </>
        }
      />
      <QueryState query={programs}>
        {(list) => {
          const counts = { all: list.length, draft: 0, active: 0, paused: 0, archived: 0 }
          list.forEach((p) => counts[p.status]++)
          const shown = filter === 'all' ? list : list.filter((p) => p.status === filter)
          return (
            <div className="flex flex-col gap-4">
              <Tabs
                label="Filter by status"
                value={filter}
                onChange={setFilter}
                items={(['all', 'active', 'draft', 'paused', 'archived'] as Filter[]).map((f) => ({ value: f, label: f === 'all' ? 'All' : t(`status.${f}`), count: counts[f] }))}
              />
              {shown.length === 0 ? (
                <EmptyState icon={<Stamp className="size-6" />} title={list.length ? 'No programs with this status' : 'No loyalty programs yet'} body="Create a Stamp Card, Membership Card, Tier Program or Points Program." />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {shown.map((p) => {
                    const Icon = TYPE_ICONS[p.type]
                    return (
                      <li key={p.id}>
                        <Link to={`/app/programs/${p.id}`} className="block rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-accent">
                          <div className="flex items-start justify-between gap-3">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                              <Icon className="size-5" aria-hidden />
                            </span>
                            <LifecycleBadge status={p.status} />
                          </div>
                          <p className="mt-3 font-semibold">{p.name}</p>
                          <p className="text-sm text-muted">{t(`type.${p.type}`)}</p>
                          <p className="mt-2 text-xs text-muted">{p.publishedAt ? `Published ${formatDate(p.publishedAt)}` : `Created ${formatDate(p.createdAt)}`}</p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        }}
      </QueryState>

      <Card className="mt-8">
        <CardHeader title="Campaigns" description="Stamp card acquisition campaigns and one-time voucher campaigns." />
        <QueryState query={campaigns}>
          {(list) =>
            list.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No campaigns yet" />
              </div>
            ) : (
              <DataTable
                caption="Campaigns"
                rows={list}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/app/campaigns/${c.id}`)}
                columns={[
                  { key: 'name', header: 'Campaign', cell: (c) => <span className="font-medium">{c.name}</span> },
                  { key: 'kind', header: 'Type', cell: (c) => <Badge>{c.kind === 'voucher' ? 'One-time voucher' : 'Stamp card acquisition'}</Badge> },
                  { key: 'status', header: 'Status', cell: (c) => <LifecycleBadge status={c.status} /> },
                  { key: 'date', header: 'Created', hideOnMobile: true, cell: (c) => formatDate(c.createdAt) },
                ]}
              />
            )
          }
        </QueryState>
      </Card>

      <Dialog open={chooser === 'program'} onClose={() => setChooser(null)} title="Choose a program type">
        <ul className="grid gap-3 sm:grid-cols-2">
          {PROGRAM_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
              <li key={type}>
                <button type="button" onClick={() => navigate(`/app/programs/new/${type}`)} className="flex w-full items-center gap-3 rounded-lg border border-line p-4 text-left hover:border-accent hover:bg-accent-soft">
                  <Icon className="size-5 text-accent" aria-hidden />
                  <span className="font-medium">{t(`type.${type}`)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Dialog>
      <Dialog open={chooser === 'campaign'} onClose={() => setChooser(null)} title="Choose a campaign type">
        <ul className="grid gap-3">
          <li>
            <button type="button" onClick={() => navigate('/app/campaigns/new/stamp_acquisition')} className="flex w-full items-start gap-3 rounded-lg border border-line p-4 text-left hover:border-accent hover:bg-accent-soft">
              <Stamp className="mt-0.5 size-5 text-accent" aria-hidden />
              <span>
                <span className="block font-medium">Stamp card acquisition campaign</span>
                <span className="text-sm text-muted">A special join QR layered on an existing Stamp Card program.</span>
              </span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => navigate('/app/campaigns/new/voucher')} className="flex w-full items-start gap-3 rounded-lg border border-line p-4 text-left hover:border-accent hover:bg-accent-soft">
              <TicketPercent className="mt-0.5 size-5 text-accent" aria-hidden />
              <span>
                <span className="block font-medium">One-time voucher campaign</span>
                <span className="text-sm text-muted">Standalone voucher; each claim can be redeemed once.</span>
              </span>
            </button>
          </li>
        </ul>
      </Dialog>
    </>
  )
}
