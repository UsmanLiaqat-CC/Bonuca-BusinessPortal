import { useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, ArrowRight, CalendarDays, ChevronRight, Coins, Crown, Layers, Plus, Stamp, Ticket, TicketPercent } from 'lucide-react'
import { PROGRAM_TYPES, type LifecycleStatus, type ProgramType } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { formatDate } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { DataTable } from '@/components/data-display/Table'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Dialog } from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useCampaigns, usePrograms } from '../hooks'

export const TYPE_ICONS: Record<ProgramType, typeof Stamp> = { stamp: Stamp, membership: Crown, tier: Layers, points: Coins }
/** Redesign accent per program type (icon tiles, type cards). Decorative only. */
export const TYPE_COLORS: Record<ProgramType, string> = { stamp: '#1747F8', membership: '#7C3AED', tier: '#0F9D6E', points: '#C2410C' }
export const TYPE_BLURB: Record<ProgramType, string> = {
  stamp: 'Collect stamps, earn a reward',
  membership: 'A standing perk for members',
  tier: 'Levels unlocked by visits',
  points: 'Earn points per purchase',
}
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
        breadcrumb={
          <>
            <Stamp className="size-[13px]" aria-hidden /> Programs
          </>
        }
        description="Programs are what customers join. Campaigns are special QR codes layered on top (acquisition) or standalone vouchers."
        actions={
          <>
            <GuardedButton permission="programs.manage" variant="secondary" onClick={() => setChooser('campaign')}>
              <Ticket className="size-[15px]" aria-hidden /> Create campaign
            </GuardedButton>
            <GuardedButton permission="programs.manage" extra={access.limit('programs', nonArchived)} onClick={() => setChooser('program')}>
              <Plus className="size-[15px]" aria-hidden /> Create Program
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
            <div className="flex flex-col">
              <Tabs
                label="Filter by status"
                value={filter}
                onChange={setFilter}
                items={(['all', 'active', 'draft', 'paused', 'archived'] as Filter[]).map((f) => ({ value: f, label: f === 'all' ? 'All' : t(`status.${f}`), count: counts[f] }))}
              />
              {shown.length === 0 ? (
                <EmptyState icon={list.length ? <Archive className="size-6" /> : <Stamp className="size-6" />} title={list.length ? 'No programs with this status' : 'No loyalty programs yet'} body="Create a Stamp Card, Membership Card, Tier Program or Points Program." />
              ) : (
                <ul className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                  {shown.map((p) => {
                    const Icon = TYPE_ICONS[p.type]
                    return (
                      <li key={p.id} className="flex">
                        <Link to={`/app/programs/${p.id}`} className="card hover prog-card reveal-up w-full" style={{ '--c': TYPE_COLORS[p.type] } as CSSProperties}>
                          <div className="top">
                            <span className="ti">
                              <Icon className="size-[22px]" aria-hidden />
                            </span>
                            <LifecycleBadge status={p.status} />
                          </div>
                          <div>
                            <h3>{p.name}</h3>
                            <p className="mt-0.5 text-muted">{t(`type.${p.type}`)}</p>
                          </div>
                          <div className="foot">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="size-[15px]" aria-hidden />
                              {p.publishedAt ? `Published ${formatDate(p.publishedAt)}` : `Created ${formatDate(p.createdAt)}`}
                            </span>
                            <span className="arrow" aria-hidden>
                              <ArrowRight className="size-[15px]" />
                            </span>
                          </div>
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

      <h2 className="section-title">Campaigns</h2>
      <Card className="reveal-up overflow-hidden">
        <QueryState query={campaigns}>
          {(list) =>
            list.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Ticket className="size-6" />} title="No campaigns yet" />
              </div>
            ) : (
              <DataTable
                caption="Campaigns"
                rows={list}
                rowKey={(c) => c.id}
                onRowClick={(c) => navigate(`/app/campaigns/${c.id}`)}
                columns={[
                  {
                    key: 'name',
                    header: 'Campaign',
                    cell: (c) => (
                      <span className="person">
                        <span className={c.kind === 'voucher' ? 'feed-ic bg-highlight-soft text-[#9A7300] dark:text-highlight' : 'feed-ic bg-accent-soft text-accent'} aria-hidden>
                          {c.kind === 'voucher' ? <TicketPercent className="size-[15px]" /> : <Stamp className="size-[15px]" />}
                        </span>
                        {c.name}
                      </span>
                    ),
                  },
                  { key: 'kind', header: 'Type', cell: (c) => <Badge tone="outline">{c.kind === 'voucher' ? 'One-time voucher' : 'Stamp card acquisition'}</Badge> },
                  { key: 'status', header: 'Status', cell: (c) => <LifecycleBadge status={c.status} /> },
                  { key: 'date', header: 'Created', hideOnMobile: true, cell: (c) => <span className="text-muted">{formatDate(c.createdAt)}</span> },
                  { key: 'go', header: '', className: 'num', cell: () => <ChevronRight className="ml-auto size-[15px] text-faint" aria-hidden /> },
                ]}
              />
            )
          }
        </QueryState>
      </Card>
      <p className="hint mt-2.5">Stamp card acquisition campaigns and one-time voucher campaigns.</p>

      <Dialog open={chooser === 'program'} onClose={() => setChooser(null)} title="Choose a program type" description="The type can’t be changed after creation." size="lg">
        <ul className="type-grid">
          {PROGRAM_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type]
            return (
              <li key={type} className="flex">
                <button type="button" onClick={() => navigate(`/app/programs/new/${type}`)} className="type-card w-full" style={{ '--c': TYPE_COLORS[type] } as CSSProperties}>
                  <span className="ti">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <b>{t(`type.${type}`)}</b>
                  <small>{TYPE_BLURB[type]}</small>
                </button>
              </li>
            )
          })}
        </ul>
      </Dialog>
      <Dialog open={chooser === 'campaign'} onClose={() => setChooser(null)} title="Choose a campaign type" description="Campaigns are special QR codes layered on top of programs, or standalone vouchers." size="lg">
        <ul className="type-grid">
          <li className="flex">
            <button type="button" onClick={() => navigate('/app/campaigns/new/stamp_acquisition')} className="type-card w-full" style={{ '--c': '#1747F8' } as CSSProperties}>
              <span className="ti">
                <Stamp className="size-[18px]" aria-hidden />
              </span>
              <b>Stamp card acquisition campaign</b>
              <small>A special join QR layered on an existing Stamp Card program.</small>
            </button>
          </li>
          <li className="flex">
            <button type="button" onClick={() => navigate('/app/campaigns/new/voucher')} className="type-card w-full" style={{ '--c': '#C2410C' } as CSSProperties}>
              <span className="ti">
                <TicketPercent className="size-[18px]" aria-hidden />
              </span>
              <b>One-time voucher campaign</b>
              <small>Standalone voucher; each claim can be redeemed once.</small>
            </button>
          </li>
        </ul>
      </Dialog>
    </>
  )
}
