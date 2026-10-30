import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, MoreHorizontal, Plus, RotateCcw, Search, Sparkles, Stamp, Ticket, TicketPercent } from 'lucide-react'
import type { LifecycleStatus } from '@/types/domain'
import { CAMPAIGN_KIND_LABEL, WINBACK_ID, type CampaignKind, type CampaignRow } from '@/lib/campaigns'
import { formatDate } from '@/lib/dates'
import { errorMessage } from '@/lib/errors'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useServices } from '@/state/services'
import { useToast } from '@/state/toast'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { DataTable } from '@/components/data-display/Table'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { useCampaignLifecycle } from '@/features/loyalty-programs/hooks'
import { useCampaignRows, useWinbackLifecycle } from '../hooks'

const KINDS: { kind: CampaignKind; icon: typeof Stamp; color: string; blurb: string }[] = [
  { kind: 'stamp_acquisition', icon: Stamp, color: '#1747F8', blurb: 'A special join QR that gives a stamp card with starting stamps and an optional welcome gift.' },
  { kind: 'voucher', icon: TicketPercent, color: '#C2410C', blurb: 'A standalone voucher with a start and end date. Each claim can be redeemed once.' },
  { kind: 'winback', icon: RotateCcw, color: '#0F9D6E', blurb: 'Brings inactive customers back with an offer after 14 / 30 / 40 / 60 days away.' },
]
const STATUSES: LifecycleStatus[] = ['draft', 'active', 'paused', 'ended']

/** Where Create / Edit go for each type. Win-back is the business's single win-back campaign. */
const editPath = (row: Pick<CampaignRow, 'id' | 'kind'>) => (row.kind === 'winback' ? `/app/campaigns/${WINBACK_ID}/edit` : `/app/campaigns/${row.id}/edit`)
const managePermission = (kind: CampaignKind) => (kind === 'winback' ? 'notifications.manage' : 'programs.manage') as 'notifications.manage' | 'programs.manage'

/** "Draft with AI": the owner types a prompt, the AI fills in the form, the owner reviews before saving. */
function AiDraftDialog({ kind, onClose }: { kind: CampaignKind | null; onClose: () => void }) {
  const { integrations } = useServices()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const run = async () => {
    if (!kind || !prompt.trim()) return
    setPending(true)
    setError(null)
    try {
      const draft = await integrations.ai.draftCampaign(`${CAMPAIGN_KIND_LABEL[kind]} campaign: ${prompt.trim()}`)
      // The draft opens in the form for review — nothing is saved until the owner saves it.
      navigate(kind === 'winback' ? `/app/campaigns/${WINBACK_ID}/edit` : `/app/campaigns/new/${kind}`, { state: { aiDraft: draft } })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setPending(false)
    }
  }
  return (
    <Dialog
      open={!!kind}
      onClose={onClose}
      title={`Draft with AI — ${kind ? CAMPAIGN_KIND_LABEL[kind] : ''}`}
      description="Describe the campaign. The AI fills in the form and you review it before saving."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <GuardedButton permission="notifications.ai" onClick={() => void run()} loading={pending}>
            <Sparkles className="size-4" aria-hidden /> Draft
          </GuardedButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label htmlFor="ai-campaign-prompt" className="label">Prompt</label>
        <Textarea id="ai-campaign-prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. Give new customers 2 stamps and a free cookie when they scan the cup lid" />
        {error && <p className="callout warn text-sm" role="alert">{error}</p>}
      </div>
    </Dialog>
  )
}

function RowActions({ row, onEnd }: { row: CampaignRow; onEnd: (row: CampaignRow) => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const access = useAccess()
  const lifecycle = useCampaignLifecycle()
  const winback = useWinbackLifecycle()
  const [open, setOpen] = useState(false)
  const allowed = access.evaluate(managePermission(row.kind))
  const canToggle = row.status === 'active' || row.status === 'paused'
  const toggle = () => {
    setOpen(false)
    const done = { onSuccess: () => toast.success(row.status === 'active' ? 'Campaign paused.' : 'Campaign resumed.'), onError: (e: unknown) => toast.error(errorMessage(e)) }
    if (row.kind === 'winback') winback.mutate(row.status === 'active' ? 'disable' : 'enable', done)
    else lifecycle.mutate({ id: row.id, action: row.status === 'active' ? 'disable' : 'enable' }, done)
  }
  const items = [
    { label: 'Edit', run: () => navigate(editPath(row)), show: row.status !== 'ended' && row.status !== 'archived' },
    { label: row.status === 'active' ? 'Pause' : 'Resume', run: toggle, show: canToggle },
    { label: 'End', run: () => { setOpen(false); onEnd(row) }, show: canToggle },
  ].filter((i) => i.show)
  return (
    // Buttons inside a clickable table row: stop their clicks/keys from also opening the row.
    <div role="presentation" className="relative flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Button size="sm" variant="secondary" onClick={() => navigate(`/app/campaigns/${row.id}`)}>
        <Eye className="size-3.5" aria-hidden /> View
      </Button>
      <Button size="sm" variant="ghost" aria-label={`More actions for ${row.name}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal className="size-4" aria-hidden />
      </Button>
      {open && (
        <div role="menu" aria-label={`${row.name} actions`} className="absolute top-full right-0 z-30 mt-1 flex w-44 flex-col rounded-xl border border-line bg-surface p-1 text-left shadow-[var(--shadow-pop)]">
          {items.map((i) => (
            <button key={i.label} type="button" role="menuitem" disabled={!allowed.allowed} title={allowed.allowed ? undefined : allowed.message} className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50" onClick={i.run}>
              {i.label}
            </button>
          ))}
          {row.status === 'ended' && <p className="px-3 py-2 text-xs text-muted">This campaign has ended.</p>}
          {row.status === 'draft' && <p className="px-3 py-2 text-xs text-muted">Publish it from the campaign page.</p>}
        </div>
      )}
    </div>
  )
}

/** Campaigns tab (BONUCA CHANGES doc): Stamp acquisition, One-time voucher and Win-back in one list. */
export default function CampaignsPage() {
  const t = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const rows = useCampaignRows()
  const lifecycle = useCampaignLifecycle()
  const winback = useWinbackLifecycle()
  const [chooser, setChooser] = useState(false)
  const [aiKind, setAiKind] = useState<CampaignKind | null>(null)
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | CampaignKind>('all')
  const [status, setStatus] = useState<'all' | LifecycleStatus>('all')
  const [ending, setEnding] = useState<CampaignRow | null>(null)

  return (
    <>
      <PageHeader
        title={t('nav.campaigns')}
        breadcrumb={
          <>
            <Ticket className="size-[13px]" aria-hidden /> Campaigns
          </>
        }
        description="Special QR codes, vouchers and win-back offers that bring customers in and back."
        actions={
          <GuardedButton permission="programs.manage" onClick={() => setChooser(true)}>
            <Plus className="size-[15px]" aria-hidden /> Create campaign
          </GuardedButton>
        }
      />
      <Card className="reveal-up overflow-visible">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1">
            <label htmlFor="campaign-search" className="sr-only">Search campaigns</label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input id="campaign-search" className="pl-9" placeholder="Search by campaign name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select className="w-48" aria-label="Type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="all">All types</option>
            {KINDS.map((k) => <option key={k.kind} value={k.kind}>{CAMPAIGN_KIND_LABEL[k.kind]}</option>)}
          </Select>
          <Select className="w-40" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </Select>
        </div>
        <QueryState query={rows}>
          {(list) => {
            const shown = list.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()) && (type === 'all' || r.kind === type) && (status === 'all' || r.status === status))
            return shown.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Ticket className="size-6" />} title={list.length ? 'No campaigns match these filters' : 'No campaigns yet'} />
              </div>
            ) : (
              <DataTable
                caption="Campaigns"
                rows={shown}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/app/campaigns/${r.id}`)}
                columns={[
                  { key: 'name', header: 'Campaign', cell: (r) => <span className="font-semibold">{r.name}</span> },
                  { key: 'type', header: 'Type', cell: (r) => <Badge tone="outline">{CAMPAIGN_KIND_LABEL[r.kind]}</Badge> },
                  { key: 'status', header: 'Status', cell: (r) => <LifecycleBadge status={r.status} /> },
                  { key: 'offer', header: 'Offer', cell: (r) => <span className="text-muted">{r.offer}</span> },
                  { key: 'period', header: 'Period', hideOnMobile: true, cell: (r) => <span className="whitespace-nowrap text-muted">{r.period}</span> },
                  { key: 'customers', header: 'Customers', className: 'num', cell: (r) => r.customers },
                  { key: 'redeemed', header: 'Redeemed', className: 'num', cell: (r) => r.redeemed },
                  { key: 'created', header: 'Created', hideOnMobile: true, cell: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.createdAt)}</span> },
                  { key: 'action', header: 'Action', className: 'num', cell: (r) => <RowActions row={r} onEnd={setEnding} /> },
                ]}
              />
            )
          }}
        </QueryState>
      </Card>

      <Dialog open={chooser} onClose={() => setChooser(false)} title="Choose a campaign type" description="Each type can also be drafted with AI: describe it, review the filled form, then save." size="lg">
        <ul className="type-grid">
          {KINDS.map(({ kind, icon: Icon, color, blurb }) => (
            <li key={kind} className="flex">
              <div className="type-card flex w-full flex-col gap-3" style={{ '--c': color } as CSSProperties}>
                <span className="ti">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <b>{CAMPAIGN_KIND_LABEL[kind]}</b>
                <small>{blurb}</small>
                <span className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => navigate(kind === 'winback' ? `/app/campaigns/${WINBACK_ID}/edit` : `/app/campaigns/new/${kind}`)}>
                    Create
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setChooser(false); setAiKind(kind) }}>
                    <Sparkles className="size-3.5" aria-hidden /> Draft with AI
                  </Button>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <IntegrationNotice title="AI service not connected">Draft with AI needs the AI service, which is not available in this environment. Create the campaign manually instead.</IntegrationNotice>
        </div>
      </Dialog>
      <AiDraftDialog kind={aiKind} onClose={() => setAiKind(null)} />
      <ConfirmDialog
        open={!!ending}
        onClose={() => setEnding(null)}
        title={`End ${ending?.name ?? 'campaign'}?`}
        confirmLabel="End campaign"
        loading={lifecycle.isPending || winback.isPending}
        body="New claims stop and the campaign QR shows “This campaign has ended.” This cannot be undone."
        onConfirm={() => {
          const row = ending
          setEnding(null)
          if (!row) return
          const done = { onSuccess: () => toast.success('Campaign ended.'), onError: (e: unknown) => toast.error(errorMessage(e)) }
          if (row.kind === 'winback') winback.mutate('end', done)
          else lifecycle.mutate({ id: row.id, action: 'end' }, done)
        }}
      />
    </>
  )
}
