import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { ArrowRight, ChevronRight, Gift, Pencil, Power, QrCode, Search, Settings2, Users, WalletCards } from 'lucide-react'
import type { Program } from '@/types/domain'
import type { ProgramDraft } from '@/services/backend'
import { useT } from '@/i18n'
import { useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { joinUrl } from '@/lib/env'
import { buildPassContent } from '@/lib/walletContent'
import { currencyCode, sortedRewards } from '@/lib/points'
import { toDraft, visualsFromBranding } from '@/lib/factories'
import { matchesCustomer } from '@/lib/customerSearch'
import { programSchema } from '@/schemas/program'
import { zodResolver } from '@/lib/forms'
import { PageHeader } from '@/components/data-display/PageHeader'
import { KpiCard } from '@/components/data-display/KpiCard'
import { DataTable } from '@/components/data-display/Table'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { ColorField } from '@/components/forms/ColorField'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, ErrorState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { QrDownload } from '@/features/qr-scanner/components/QrDownload'
import { LifecycleControls } from '../components/LifecycleControls'
import { VisualFields } from '../components/VisualFields'
import { useProgramCardCounts, useProgramCustomers, useProgramLifecycle, usePrograms, useSaveProgram } from '../hooks'

type Tab = 'overview' | 'rules' | 'rewards' | 'wallet' | 'customers'
const TABS: Tab[] = ['overview', 'rules', 'rewards', 'wallet', 'customers']

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="setup-grid grid-cols-1 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="setup-item">
          <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
          <dd className="text-[14.5px] font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function rulesOf(program: Program): [string, string][] {
  const rows: [string, string][] = []
  switch (program.type) {
    case 'stamp':
      rows.push(['Stamps required', String(program.config.stampsRequired)], ['Stamp expiry', program.config.expiry.enabled ? `${program.config.expiry.days} days without a scan` : 'Off'])
      break
    case 'membership':
      rows.push(['Benefit type', program.config.benefitType.replace('_', ' ')], ['Validity', program.config.validity.kind === 'expires_on' ? `Expires ${formatDate(program.config.validity.date)}` : program.config.validity.kind.replace('_', ' ')])
      break
    case 'tier':
      rows.push(['Tiers', program.config.tiersEnabled ? program.config.tiers.map((t) => `${t.name} (${t.requiredValue})`).join(' → ') : 'Tiering off'], ['Upgrade basis', program.config.upgradeBasis], ['Downgrade rule', program.config.downgrade.enabled ? `${program.config.downgrade.inactivityDays} days inactive` : 'Off'])
      break
    case 'points':
      rows.push(
        ['Currency', currencyCode(program.config)],
        ['Ratio', `${program.config.ratio.spend} ${currencyCode(program.config)} = ${program.config.ratio.points} pts`],
        ['Awarding', program.config.awardingMethod === 'manual' ? 'Manual entry' : `Fixed — ${program.config.pointsPerScan} pts per scan`],
        ['Point expiry', program.config.pointExpiry.enabled ? `${program.config.pointExpiry.months} months` : 'Off'],
      )
  }
  rows.push(['Program expiry date', program.expiresOn ? formatDate(program.expiresOn) : 'No end date'], ['Valid location', program.location ? `${program.location.address} (${program.location.radiusMeters} m)` : 'Not set'])
  return rows
}

function rewardsOf(program: Program): [string, string][] {
  const rows: [string, string][] = []
  switch (program.type) {
    case 'stamp':
      rows.push(['Reward', program.config.rewardDescription || '—'], ['Reward type', program.config.rewardType.replace('_', ' ')])
      break
    case 'membership':
      rows.push(['Benefit', program.config.benefitDescription || '—'], ['Discount', program.config.discountValue === null ? '—' : String(program.config.discountValue)])
      break
    case 'tier':
      program.config.tiers.forEach((t) => rows.push([t.name, t.rewards || '—']))
      break
    case 'points':
      sortedRewards(program.config).forEach((r) => rows.push([`${r.pointsRequired} pts`, r.name || '—']))
  }
  rows.push(['Surprise rewards', program.surprise.enabled ? `On (${program.surprise.probabilityPercent}%) — ${program.surprise.pool.join(', ')}` : 'Off'])
  return rows
}

/** Wallet card section: card design for this program only, live preview and active cards count. */
function WalletCardSection({ program, activeCards }: { program: Program; activeCards: number }) {
  const toast = useToast()
  const { session } = useSession()
  const save = useSaveProgram()
  const initial = useMemo(() => toDraft(program), [program])
  const form = useForm<ProgramDraft>({ resolver: zodResolver<ProgramDraft>(programSchema), defaultValues: initial })
  const values = useWatch({ control: form.control }) as ProgramDraft
  const preview = buildPassContent({ ...program, ...values } as Program, null, session.business.name)
  const live = program.status !== 'draft'
  const submit = form.handleSubmit(
    (draft) => save.mutate({ id: program.id, draft }, { onSuccess: () => toast.success(live ? 'Wallet card saved. Applies to every issued card.' : 'Wallet card saved.'), onError: (e) => toast.error(errorMessage(e)) }),
    () => toast.error('Some fields need attention.'),
  )
  return (
    <div className="layout-preview">
      <div className="flex min-w-0 flex-col gap-[18px]">
        <KpiCard label="Active wallet cards" value={activeCards} icon="wallet" accent="primary" hint="Cards issued to customers of this program" />
        <Card>
          <CardHeader
            title="Card design"
            icon={<WalletCards className="size-4" />}
            description="Branding colours and logo are the defaults. Changes here apply to this program only."
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const b = visualsFromBranding(session.business.branding)
                  form.setValue('visuals.logo', b.logo, { shouldDirty: true })
                  form.setValue('visuals.background', b.background, { shouldDirty: true })
                  form.setValue('visuals.accentColor', b.accentColor, { shouldDirty: true })
                }}
              >
                Use Branding defaults
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-5">
            <VisualFields form={form} show={{ background: program.type !== 'tier', textColor: program.type !== 'tier' }} logoRequired={program.designMode === 'template'} />
            <Controller control={form.control} name="visuals.accentColor" render={({ field }) => <ColorField label="Highlight colour" value={field.value ?? '#7FB77E'} onChange={field.onChange} hint="Labels, stamp rings and the reward icon on the card." />} />
            {live && <IntegrationNotice title="Wallet integration not connected">This program is live: a saved design applies to every issued card. Card updates are pushed by the Apple/Google Wallet backend, which is not available in this environment.</IntegrationNotice>}
            {program.status === 'archived' ? (
              <p className="lock-overlay">Archived programs cannot be edited.</p>
            ) : (
              <div>
                <GuardedButton permission="programs.manage" onClick={submit} loading={save.isPending}>
                  Save wallet card
                </GuardedButton>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <WalletPassPreview content={preview} label="Wallet card preview (sample customer)" />
      </aside>
    </div>
  )
}

/** Program → its customers: name, email or phone, customer number, progress, last visit, status. */
function ProgramCustomers({ programId }: { programId: string }) {
  const navigate = useNavigate()
  const rows = useProgramCustomers(programId)
  const [q, setQ] = useState('')
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Customers"
        icon={<Users className="size-4" />}
        actions={
          <div className="relative w-64 max-w-full">
            <label htmlFor="program-customer-search" className="sr-only">Search customers</label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input id="program-customer-search" className="pl-9" placeholder="Name, email, phone or number" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />
      <QueryState query={rows}>
        {(list) => {
          const shown = list.filter((r) => matchesCustomer(r.customer, q))
          return shown.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<Users className="size-6" />} title={list.length ? 'No customers match your search' : 'No customers in this program yet'} />
            </div>
          ) : (
            <DataTable
              caption="Program customers"
              rows={shown}
              rowKey={(r) => r.membership.id}
              onRowClick={(r) => navigate(`/app/customers/${r.customer.id}`)}
              columns={[
                { key: 'name', header: 'Name', cell: (r) => <span className="font-semibold">{r.customer.name || '—'}</span> },
                { key: 'contact', header: 'Email or phone', hideOnMobile: true, cell: (r) => <span className="text-muted">{r.customer.email || r.customer.phone || '—'}</span> },
                { key: 'number', header: 'Customer number', cell: (r) => <span className="mono">{r.customer.customerNumber}</span> },
                { key: 'progress', header: 'Progress', cell: (r) => r.progress },
                { key: 'last', header: 'Last visit', hideOnMobile: true, cell: (r) => <span className="text-muted">{formatDate(r.lastVisit)}</span> },
                { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'active' ? 'success' : 'outline'}>{r.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
              ]}
            />
          )
        }}
      </QueryState>
    </Card>
  )
}

const PAST = { publish: 'published', enable: 'enabled', disable: 'paused', archive: 'archived', end: 'ended' } as const

export default function ProgramDetailPage() {
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const programs = usePrograms()
  const counts = useProgramCardCounts()
  const lifecycle = useProgramLifecycle()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') as Tab | null
  const tab: Tab = requested && TABS.includes(requested) ? requested : 'overview'

  return (
    <QueryState query={programs}>
      {(list) => {
        const program = list.find((p) => p.id === id)
        if (!program) return <ErrorState message="Program not found." />
        const cards = counts.data?.[program.id] ?? 0
        return (
          <>
            <PageHeader
              title={program.name}
              description={t(`type.${program.type}`)}
              breadcrumb={
                <>
                  <Link to="/app/programs">{t('nav.programs')}</Link>
                  <ChevronRight className="size-[13px]" aria-hidden />
                  <span>{t(`type.${program.type}`)}</span>
                </>
              }
              actions={
                program.status !== 'archived' && (
                  <GuardedButton permission="programs.manage" onClick={() => navigate(`/app/programs/${program.id}/edit`)}>
                    <Pencil className="size-[15px]" aria-hidden /> {t('common.edit')}
                  </GuardedButton>
                )
              }
            />
            <Tabs
              label="Program sections"
              value={tab}
              onChange={(v) => setParams(v === 'overview' ? {} : { tab: v }, { replace: true })}
              items={[
                { value: 'overview', label: 'Overview' },
                { value: 'rules', label: 'Rules' },
                { value: 'rewards', label: 'Rewards' },
                { value: 'wallet', label: 'Wallet card' },
                { value: 'customers', label: 'Customers', count: cards },
              ]}
            />
            {tab === 'overview' && (
              <div className="layout-preview">
                <div className="flex min-w-0 flex-col gap-[18px]">
                  <Card>
                    <CardHeader title="Lifecycle" icon={<Power className="size-4" />} />
                    <CardBody>
                      <LifecycleControls
                        status={program.status}
                        pending={lifecycle.isPending}
                        onAction={(action) =>
                          lifecycle.mutate(
                            { id: program.id, action },
                            {
                              onSuccess: () => {
                                toast.success(`Program ${PAST[action]}.`)
                                if (action === 'publish') navigate(`/app/programs/${program.id}/live`)
                              },
                              onError: (e) => toast.error(errorMessage(e)),
                            },
                          )
                        }
                      />
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader title="Join QR code" icon={<QrCode className="size-4" />} description="Generated the first time the program is published." />
                    <CardBody>
                      {program.joinQrToken ? (
                        <>
                          {program.status === 'paused' && <p className="callout warn mb-3">Program paused — this QR does not enrol new customers until it is enabled again.</p>}
                          <QrDownload
                            text={joinUrl('program', program.joinQrToken)}
                            filename={`join-${program.name.toLowerCase().replace(/\W+/g, '-')}`}
                            title={program.name}
                            subtitle={program.type === 'membership' || program.type === 'tier' ? 'Scan to join our membership' : 'Scan to add our card to your wallet'}
                            placements={['table', 'counter', 'sticker', 'flyer', 'window']}
                          />
                          <Link to="/app/scanner/qr-codes" className="link mt-3.5 text-sm">
                            All printable QR codes <ArrowRight className="size-[15px]" aria-hidden />
                          </Link>
                        </>
                      ) : (
                        <p className="lock-overlay">No QR exists yet — Draft programs are invisible to customers.</p>
                      )}
                    </CardBody>
                  </Card>
                </div>
                <aside className="flex flex-col gap-[18px] xl:sticky xl:top-24 xl:self-start">
                  <KpiCard label="Active wallet cards" value={cards} icon="wallet" accent="primary" hint="Customers holding this program’s card" />
                  <Link to={`/app/programs/${program.id}?tab=customers`} className="link text-sm">
                    View customers <ArrowRight className="size-[15px]" aria-hidden />
                  </Link>
                </aside>
              </div>
            )}
            {tab === 'rules' && (
              <Card>
                <CardHeader title="Rules" icon={<Settings2 className="size-4" />} />
                <CardBody>
                  <Rows rows={rulesOf(program)} />
                </CardBody>
              </Card>
            )}
            {tab === 'rewards' && (
              <Card>
                <CardHeader title="Rewards" icon={<Gift className="size-4" />} actions={<Link to="/app/rewards" className="link text-sm">All rewards <ArrowRight className="size-[15px]" aria-hidden /></Link>} />
                <CardBody>
                  <Rows rows={rewardsOf(program)} />
                </CardBody>
              </Card>
            )}
            {tab === 'wallet' && <WalletCardSection key={program.updatedAt} program={program} activeCards={cards} />}
            {tab === 'customers' && <ProgramCustomers programId={program.id} />}
          </>
        )
      }}
    </QueryState>
  )
}
