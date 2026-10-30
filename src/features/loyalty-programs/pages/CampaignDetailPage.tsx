import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Pause, Pencil, Play, QrCode, RotateCcw, Search, Send, Square, Ticket, Users } from 'lucide-react'
import type { WinBackConfig } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatDateTime } from '@/lib/dates'
import { joinUrl } from '@/lib/env'
import { buildVoucherPassContent } from '@/lib/walletContent'
import { CAMPAIGN_KIND_LABEL, WINBACK_ID, type CampaignKind, type LinkedRewardStatus } from '@/lib/campaigns'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { DataTable } from '@/components/data-display/Table'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Input, Select, Toggle } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, ErrorState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { QrDownload } from '@/features/qr-scanner/components/QrDownload'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { useSaveWinBack, useWinBack } from '@/features/notifications/hooks'
import { useCampaignLinked, useCampaignRows, useLinkCampaignCustomer, useWinbackLifecycle } from '@/features/campaigns/hooks'
import { useCustomers } from '@/features/customers/hooks'
import { searchCustomers } from '@/lib/customerSearch'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useCampaignLifecycle, useCampaigns, usePrograms } from '../hooks'

const REWARD_LABEL: Record<LinkedRewardStatus, string> = { not_redeemed: 'Not redeemed', redeemed: 'Redeemed', expired: 'Expired', none: 'No reward' }
const REWARD_TONE: Record<LinkedRewardStatus, BadgeTone> = { not_redeemed: 'accent', redeemed: 'success', expired: 'outline', none: 'neutral' }

/** Linked customers: who claimed (QR types) or was triggered (win-back), and whether they redeemed. */
function AddCustomerDialog({ campaignId, open, onClose }: { campaignId: string; open: boolean; onClose: () => void }) {
  const toast = useToast()
  const customers = useCustomers()
  const link = useLinkCampaignCustomer()
  const linked = useCampaignLinked(campaignId)
  const [q, setQ] = useState('')
  const taken = new Set((linked.data ?? []).map((r) => r.customerId))
  const list = searchCustomers(customers.data ?? [], q).filter((c) => !taken.has(c.id)).slice(0, 10)
  return (
    <Dialog open={open} onClose={onClose} title="Add linked customer" description="Pick an existing customer. They get this campaign's voucher or stamp card, and appear in Linked customers." footer={<Button onClick={onClose}>Done</Button>}>
      <div className="flex flex-col gap-3">
        <label htmlFor="link-search" className="sr-only">Search customers</label>
        <Input id="link-search" placeholder="Search by name, email, phone or number" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="flex max-h-72 flex-col overflow-y-auto" aria-label="Customers to add">
          {list.length === 0 && <li className="py-4 text-center text-sm text-muted">No customers to add.</li>}
          {list.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
              <span className="min-w-0"><b className="block truncate">{c.name || c.customerNumber}</b><span className="text-xs text-muted">{c.customerNumber}{c.email ? ` · ${c.email}` : ''}</span></span>
              <Button size="sm" loading={link.isPending} onClick={() => link.mutate({ campaignId, customerId: c.id }, { onSuccess: () => toast.success(`${c.name || c.customerNumber} added.`), onError: (e) => toast.error(errorMessage(e)) })}>Add</Button>
            </li>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}

function LinkedCustomers({ id, kind }: { id: string; kind: CampaignKind }) {
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const linked = useCampaignLinked(id)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | LinkedRewardStatus>('all')
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Linked customers"
        icon={<Users className="size-4" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {kind !== 'winback' && <GuardedButton permission="programs.manage" size="sm" onClick={() => setAdding(true)}>Add customer</GuardedButton>}
            <div className="relative w-56 max-w-full">
              <label htmlFor="linked-search" className="sr-only">Search linked customers</label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <Input id="linked-search" className="pl-9" placeholder="Customer name" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select className="w-44" aria-label="Reward status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">All reward statuses</option>
              <option value="not_redeemed">Not redeemed</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </Select>
          </div>
        }
      />
      <AddCustomerDialog campaignId={id} open={adding} onClose={() => setAdding(false)} />
      <QueryState query={linked}>
        {(rows) => {
          const shown = rows.filter((r) => r.customerName.toLowerCase().includes(q.trim().toLowerCase()) && (status === 'all' || r.rewardStatus === status))
          return shown.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<Users className="size-6" />} title={rows.length ? 'No customers match these filters' : 'No customers linked yet'} />
            </div>
          ) : (
            <DataTable
              caption="Linked customers"
              rows={shown}
              rowKey={(r) => `${r.customerId}-${r.date}`}
              onRowClick={(r) => navigate(`/app/customers/${r.customerId}`)}
              columns={[
                { key: 'customer', header: 'Customer', cell: (r) => <span className="font-semibold">{r.customerName}</span> },
                { key: 'date', header: kind === 'winback' ? 'Triggered' : 'Claimed', cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.date)}</span> },
                { key: 'status', header: 'Reward status', cell: (r) => <Badge tone={REWARD_TONE[r.rewardStatus]}>{REWARD_LABEL[r.rewardStatus]}</Badge> },
                { key: 'on', header: 'Redeemed on', hideOnMobile: true, cell: (r) => <span className="whitespace-nowrap text-muted">{r.redeemedAt ? formatDateTime(r.redeemedAt) : '—'}</span> },
                { key: 'by', header: 'Redeemed by', hideOnMobile: true, cell: (r) => r.redeemedBy ?? <span className="text-faint">—</span> },
                ...(kind === 'stamp_acquisition' ? [{ key: 'stamps', header: 'Stamps given', className: 'num', cell: (r: (typeof rows)[number]) => r.stampsGiven ?? '—' }] : []),
              ]}
            />
          )
        }}
      </QueryState>
    </Card>
  )
}

/** Win-back stages: each with an on/off toggle, its message and its offer. */
function WinBackStages({ config }: { config: WinBackConfig }) {
  const toast = useToast()
  const access = useAccess()
  const save = useSaveWinBack()
  const can = access.can('notifications.manage') && !config.endedAt
  const toggle = (i: number, on: boolean) =>
    save.mutate({ ...config, stages: config.stages.map((s, j) => (j === i ? { ...s, enabled: on } : s)) }, { onSuccess: () => toast.success(on ? 'Stage turned on.' : 'Stage turned off.'), onError: (e) => toast.error(errorMessage(e)) })
  return (
    <Card>
      <CardHeader title="Stages" icon={<RotateCcw className="size-4" />} description="Each stage fires once per inactivity period. Its offer becomes an active reward for the customer’s next scan." />
      <CardBody>
        <ol className="flex flex-col gap-3">
          {config.stages.map((s, i) => (
            <li key={i} className="option-row flex-wrap gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.days} days away</p>
                <p className="text-sm text-muted">{s.message?.trim() || 'No message set'}</p>
                <p className="text-sm">Offer: <b>{s.offer || '—'}</b></p>
              </div>
              <Toggle label={s.enabled === false ? 'Off' : 'On'} checked={s.enabled !== false} disabled={!can || save.isPending} onChange={(on) => toggle(i, on)} />
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  )
}

/** Campaign view (BONUCA CHANGES doc): summary, QR, win-back stages, actions and linked customers. */
export default function CampaignDetailPage() {
  const t = useT()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const rows = useCampaignRows()
  const campaigns = useCampaigns()
  const programs = usePrograms()
  const winback = useWinBack()
  const lifecycle = useCampaignLifecycle()
  const wbLifecycle = useWinbackLifecycle()
  const [ending, setEnding] = useState(false)
  const isWinback = id === WINBACK_ID

  return (
    <QueryState query={rows}>
      {(list) => {
        const row = list.find((r) => r.id === id)
        const c = campaigns.data?.find((x) => x.id === id)
        if (!row || (!isWinback && !c)) return <ErrorState message="Campaign not found." />
        const manage = isWinback ? 'notifications.manage' : 'programs.manage'
        const done = (msg: string) => ({ onSuccess: () => toast.success(msg), onError: (e: unknown) => toast.error(errorMessage(e)) })
        const act = (action: 'enable' | 'disable' | 'end' | 'publish') => {
          if (isWinback) wbLifecycle.mutate(action === 'publish' ? 'enable' : action, done(action === 'end' ? 'Campaign ended.' : action === 'disable' ? 'Campaign paused.' : 'Campaign resumed.'))
          else lifecycle.mutate({ id, action }, done(action === 'publish' ? 'Campaign published. The QR code is ready.' : action === 'end' ? 'Campaign ended.' : action === 'disable' ? 'Campaign paused.' : 'Campaign resumed.'))
        }
        const pending = lifecycle.isPending || wbLifecycle.isPending
        const linkedProgram = c?.kind === 'stamp_acquisition' ? programs.data?.find((p) => p.id === c.linkedProgramId) : null
        const summary: [string, string][] = [
          ['Type', CAMPAIGN_KIND_LABEL[row.kind]],
          ['Offer', row.offer],
          ['Dates', row.period],
          ...(c?.kind === 'stamp_acquisition' ? ([['Stamp card', linkedProgram?.name ?? '—']] as [string, string][]) : []),
          ['Customers', `${row.customers} linked · ${row.redeemed} redeemed`],
        ]
        return (
          <>
            <PageHeader
              title={row.name}
              description={CAMPAIGN_KIND_LABEL[row.kind]}
              breadcrumb={
                <>
                  <Link to="/app/campaigns">{t('nav.campaigns')}</Link>
                  <ChevronRight className="size-[13px]" aria-hidden />
                  <span>{CAMPAIGN_KIND_LABEL[row.kind]}</span>
                </>
              }
              actions={
                <>
                  {row.status !== 'ended' && row.status !== 'archived' && (
                    <GuardedButton permission={manage} variant="secondary" onClick={() => navigate(isWinback ? `/app/campaigns/${WINBACK_ID}/edit` : `/app/campaigns/${id}/edit`)}>
                      <Pencil className="size-[15px]" aria-hidden /> Edit
                    </GuardedButton>
                  )}
                  {row.status === 'draft' && !isWinback && (
                    <GuardedButton permission={manage} onClick={() => act('publish')} loading={pending}>
                      <Send className="size-[15px]" aria-hidden /> Publish
                    </GuardedButton>
                  )}
                  {row.status === 'active' && (
                    <GuardedButton permission={manage} variant="secondary" onClick={() => act('disable')} loading={pending}>
                      <Pause className="size-[15px]" aria-hidden /> Pause
                    </GuardedButton>
                  )}
                  {row.status === 'paused' && (
                    <GuardedButton permission={manage} onClick={() => act('enable')} loading={pending}>
                      <Play className="size-[15px]" aria-hidden /> Resume
                    </GuardedButton>
                  )}
                  {(row.status === 'active' || row.status === 'paused') && (
                    <GuardedButton permission={manage} variant="danger" onClick={() => setEnding(true)} loading={pending}>
                      <Square className="size-[15px]" aria-hidden /> End
                    </GuardedButton>
                  )}
                </>
              }
            />
            <div className={c?.kind === 'voucher' ? 'layout-preview' : 'flex flex-col gap-[18px]'}>
              <div className="flex min-w-0 flex-col gap-[18px]">
                <Card>
                  <CardHeader title="Summary" icon={<Ticket className="size-4" />} actions={<LifecycleBadge status={row.status} />} />
                  <CardBody>
                    <dl className="setup-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                      {summary.map(([k, v]) => (
                        <div key={k} className="setup-item">
                          <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
                          <dd className="text-[14.5px] font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    {row.status === 'paused' && <p className="callout warn mt-4 text-sm">Paused: no new claims. Customers who already have the reward can still redeem it.</p>}
                    {row.status === 'ended' && <p className="callout mt-4 text-sm">This campaign has ended. Its QR shows “This campaign has ended.”</p>}
                  </CardBody>
                </Card>
                {c && (
                  <Card>
                    <CardHeader icon={<QrCode className="size-4" />} title="Campaign QR code" description="Customers scan it to claim. One claim per customer." />
                    <CardBody>
                      {c.qrToken ? (
                        <QrDownload text={joinUrl('campaign', c.qrToken)} filename={`campaign-${c.name.toLowerCase().replace(/\W+/g, '-')}`} title={c.name} subtitle={c.kind === 'voucher' ? c.voucherReward : 'Scan to get your stamp card'} placements={['cup', 'flyer', 'sticker', 'poster']} />
                      ) : (
                        <p className="lock-overlay">The QR code is generated when the campaign is published.</p>
                      )}
                    </CardBody>
                  </Card>
                )}
                {isWinback && winback.data && <WinBackStages config={winback.data.config} />}
                {isWinback && <IntegrationNotice title="Push delivery not connected">Win-back rewards are created, but the push message is not delivered in this environment.</IntegrationNotice>}
              </div>
              {c?.kind === 'voucher' && (
                <aside className="xl:sticky xl:top-24 xl:self-start">
                  <WalletPassPreview content={buildVoucherPassContent(c)} label="Voucher pass preview" />
                </aside>
              )}
            </div>
            <div className="mt-[18px]">
              <LinkedCustomers id={id} kind={row.kind} />
            </div>
            <ConfirmDialog
              open={ending}
              onClose={() => setEnding(false)}
              title={`End ${row.name}?`}
              confirmLabel="End campaign"
              loading={pending}
              body="New claims stop and the campaign QR shows “This campaign has ended.” This cannot be undone."
              onConfirm={() => {
                setEnding(false)
                act('end')
              }}
            />
          </>
        )
      }}
    </QueryState>
  )
}
