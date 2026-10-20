import { Link, useParams } from 'react-router-dom'
import type { DesignMode, Program } from '@/types/domain'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { buildPassContent, TEMPLATE_NAMES } from '@/lib/walletContent'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { useProgramsQueryAndMode } from '../hooks'
import { WalletPassPreview } from '../components/WalletPassPreview'

const DYNAMIC: Record<Program['type'], { shows: string; trigger: string }> = {
  stamp: { shows: 'Stamp grid using the chosen Stamp Icon; "X stamps to go" line; Reward Description.', trigger: 'Every confirmed employee scan (+1 stamp).' },
  membership: { shows: 'Benefit Description; Member Since date.', trigger: 'Static — only changes if the business edits the program.' },
  tier: { shows: 'Current Tier name + badge; background switches to that tier’s colour; "X visits/points to [next tier]" progress line.', trigger: 'Every scan that changes the customer’s visits/points/spend total.' },
  points: { shows: 'Current point balance; progress bar; Next Reward name; points still needed. (Multiple upcoming levels pending a technical spike — fallback layout shown.)', trigger: 'Every confirmed points transaction.' },
}

const MASTER: [string, (p: Program) => string, string][] = [
  ['Program Name', (p) => p.name || '—', 'Pass header / title'],
  ['Logo', (p) => (p.visuals.logo ? 'Uploaded' : 'Not set'), 'Top-left logo image'],
  ['Icon', (p) => (p.visuals.icon ? 'Uploaded' : 'Uses logo'), 'Wallet app list icon + notification icon'],
  ['Background', (p) => (p.type === 'tier' ? 'Per-tier wallet colour' : p.visuals.background.kind === 'color' ? p.visuals.background.color : p.visuals.background.kind === 'image' ? 'Image' : 'Bonuca gradient'), 'Pass body background'],
  ['Hero / Strip Image', (p) => (p.visuals.heroImage ? 'Uploaded' : 'None'), 'Banner image across the top of the pass'],
  ['Text Colour', (p) => p.visuals.textColor, 'Foreground text and small field labels'],
  ['QR Code', () => 'Auto-generated', 'Bottom of the pass — not editable'],
]

/** Spec §4.3 design start choice + master fields + dynamic content + live preview. */
export default function WalletDesignPage() {
  const t = useT()
  const { id } = useParams()
  const toast = useToast()
  const access = useAccess()
  const { programs, setMode } = useProgramsQueryAndMode()
  const canManage = access.evaluate('wallet.manage')

  return (
    <QueryState query={programs}>
      {(list) => {
        const program = list.find((p) => p.id === id)
        if (!program) return <ErrorState message="Program not found." />
        const choose = (mode: DesignMode) => {
          if (mode === program.designMode) return
          setMode.mutate({ id: program.id, mode }, { onSuccess: () => toast.success('Design start updated.'), onError: (e) => toast.error(errorMessage(e)) })
        }
        const options: { mode: DesignMode; title: string; body: string; badge?: string }[] = [
          { mode: 'template', title: `Option A — Base Template: ${TEMPLATE_NAMES[program.type]}`, body: 'Bonuca owns the structure (stamp grid, benefit layout, tier colour switching). You customise all visuals and wording.' },
          { mode: 'custom', title: 'Option B — Start from Scratch', body: 'Blank minimal canvas with exact RGB colours. Requires Program Name, Background colour and Text colour; Logo optional. No structural elements (no stamp grid, no tier badge).', badge: 'Pending client confirmation' },
        ]
        return (
          <>
            <PageHeader title={`${program.name} — wallet pass`} breadcrumb={<Link to="/app/wallet-cards" className="hover:underline">{t('nav.wallet')}</Link>} actions={<Link to={`/app/programs/${program.id}/edit`} className={buttonClass('secondary')}>Edit master fields in program setup</Link>} />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="flex min-w-0 flex-col gap-6">
                <Card>
                  <CardHeader title="Where the design starts" />
                  <CardBody>
                    <div role="radiogroup" aria-label="Design start" className="grid gap-3 md:grid-cols-2">
                      {options.map((o) => (
                        <button
                          key={o.mode}
                          type="button"
                          role="radio"
                          aria-checked={program.designMode === o.mode}
                          disabled={!canManage.allowed || setMode.isPending}
                          onClick={() => choose(o.mode)}
                          className={cn('flex flex-col gap-1 rounded-lg border p-4 text-left disabled:cursor-not-allowed', program.designMode === o.mode ? 'border-accent bg-accent-soft' : 'border-line hover:bg-surface-2')}
                        >
                          <span className="flex flex-wrap items-center gap-2 font-medium">
                            {o.title}
                            {o.badge && <Badge tone="warning">{o.badge}</Badge>}
                          </span>
                          <span className="text-sm text-muted">{o.body}</span>
                        </button>
                      ))}
                    </div>
                    {!canManage.allowed && <p className="mt-2 text-xs text-muted">{canManage.message}</p>}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Master field list" description="Set once in the program setup screen." />
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-xs text-muted uppercase">
                          <th className="px-4 py-2">Business sets</th>
                          <th className="px-4 py-2">Current</th>
                          <th className="px-4 py-2">Appears on the pass as</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MASTER.map(([label, value, appears]) => (
                          <tr key={label} className="border-b border-line last:border-0">
                            <td className="px-4 py-2 font-medium">{label}</td>
                            <td className="px-4 py-2">{value(program)}</td>
                            <td className="px-4 py-2 text-muted">{appears}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Card>
                  <CardHeader title="Dynamic content" />
                  <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted">Shown besides the master fields</p>
                      <p>{program.designMode === 'custom' ? 'None — custom designs are identification-style passes.' : DYNAMIC[program.type].shows}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">What triggers an update</p>
                      <p>{DYNAMIC[program.type].trigger}</p>
                    </div>
                  </CardBody>
                </Card>
                <IntegrationNotice title="Wallet update status: not connected">
                  Editing a master field of an Active program applies to every issued pass; the backend would push updates via APNs / Google Wallet API. No wallet integration is available in this environment.
                </IntegrationNotice>
              </div>
              <aside className="xl:sticky xl:top-20 xl:self-start">
                <WalletPassPreview content={buildPassContent(program)} />
              </aside>
            </div>
          </>
        )
      }}
    </QueryState>
  )
}
