import { useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, Coins, Crown, Layers, Plus, Stamp, Users } from 'lucide-react'
import { PROGRAM_TYPES, type LifecycleStatus, type ProgramType } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { formatDate } from '@/lib/dates'
import { buildPassContent } from '@/lib/walletContent'
import { WalletCard } from '@/features/wallet-cards/components/WalletPassPreview'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { Dialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { useProgramCardCounts, usePrograms } from '../hooks'

export const TYPE_ICONS: Record<ProgramType, typeof Stamp> = { stamp: Stamp, membership: Crown, tier: Layers, points: Coins }
/** Redesign accent per program type (icon tiles, type cards). Decorative only. */
export const TYPE_COLORS: Record<ProgramType, string> = { stamp: '#1747F8', membership: '#7C3AED', tier: '#0F9D6E', points: '#C2410C' }
export const TYPE_BLURB: Record<ProgramType, string> = {
  stamp: 'Collect stamps, earn a reward',
  membership: 'A standing perk for customers',
  tier: 'Levels unlocked by visits',
  points: 'Earn points per purchase',
}
type Filter = 'all' | LifecycleStatus

/**
 * Spec §4.2 — several programs at once, including more than one of the same type. Campaigns moved to
 * their own Campaigns tab (client change), so only "Create Program" stays here.
 */
export default function ProgramsPage() {
  const t = useT()
  const navigate = useNavigate()
  const access = useAccess()
  const programs = usePrograms()
  const cardCounts = useProgramCardCounts()
  const { session } = useSession()
  const [filter, setFilter] = useState<Filter>('all')
  const [chooser, setChooser] = useState(false)
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
        description="Programs are what customers join."
        actions={
          <GuardedButton permission="programs.manage" extra={access.limit('programs', nonArchived)} onClick={() => setChooser(true)}>
            <Plus className="size-[15px]" aria-hidden /> Create Program
          </GuardedButton>
        }
      />
      <QueryState query={programs}>
        {(list) => {
          const counts: Record<Filter, number> = { all: list.length, draft: 0, active: 0, paused: 0, ended: 0, archived: 0 }
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
                    const cards = cardCounts.data?.[p.id] ?? 0
                    return (
                      <li key={p.id} className="flex" data-testid="program-card">
                        <div className="card hover reveal-up relative flex w-full flex-col gap-3.5 p-3.5" style={{ '--c': TYPE_COLORS[p.type] } as CSSProperties}>
                          {/* Program wallet pass: each pass lives on its own program (Wallet Cards tab removed). */}
                          <Link to={`/app/programs/${p.id}`} aria-label={`Open ${p.name}`} className="block">
                            <WalletCard content={buildPassContent(p, null, session.business.name)} compact />
                          </Link>
                          <div className="flex items-start justify-between gap-3 px-1">
                            <div className="min-w-0">
                              <h3 className="truncate font-display text-[17px] font-bold tracking-tight">
                                <Link to={`/app/programs/${p.id}`} className="hover:underline">{p.name}</Link>
                              </h3>
                              <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-muted">
                                <Icon className="size-[14px]" aria-hidden /> {t(`type.${p.type}`)}
                              </p>
                            </div>
                            <LifecycleBadge status={p.status} />
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-line px-1 pt-3 text-[13px]">
                            <Link to={`/app/programs/${p.id}?tab=customers`} className="link font-semibold" aria-label={`${cards} active cards — view customers of ${p.name}`}>
                              <Users className="size-[15px]" aria-hidden /> {cards} active {cards === 1 ? 'card' : 'cards'}
                            </Link>
                            <span className="text-faint">{p.publishedAt ? `Published ${formatDate(p.publishedAt)}` : `Created ${formatDate(p.createdAt)}`}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        }}
      </QueryState>

      <Dialog open={chooser} onClose={() => setChooser(false)} title="Choose a program type" description="The type can’t be changed after creation." size="lg">
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
    </>
  )
}
