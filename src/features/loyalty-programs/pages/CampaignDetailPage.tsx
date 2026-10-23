import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Pencil, Power, QrCode, Settings2 } from 'lucide-react'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { joinUrl } from '@/lib/env'
import { buildVoucherPassContent } from '@/lib/walletContent'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { QrDownload } from '@/features/qr-scanner/components/QrDownload'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { LifecycleControls } from '../components/LifecycleControls'
import { useCampaignLifecycle, useCampaigns, usePrograms } from '../hooks'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const campaigns = useCampaigns()
  const programs = usePrograms()
  const lifecycle = useCampaignLifecycle()

  return (
    <QueryState query={campaigns}>
      {(list) => {
        const c = list.find((x) => x.id === id)
        if (!c) return <ErrorState message="Campaign not found." />
        const linked = c.kind === 'stamp_acquisition' ? programs.data?.find((p) => p.id === c.linkedProgramId) : null
        const rows: [string, string][] =
          c.kind === 'voucher'
            ? [['Voucher reward', c.voucherReward], ['Valid from', formatDate(c.validFrom || null)], ['Valid to', formatDate(c.validTo || null)]]
            : [
                ['Linked stamp card', linked?.name ?? '—'],
                ['Starting stamps', String(c.startingStamps)],
                ['Welcome gift', c.welcomeGift.enabled ? `${c.welcomeGift.rewardName}${c.welcomeGift.validityDays ? ` · valid ${c.welcomeGift.validityDays} days` : ''}` : 'Off'],
              ]
        return (
          <>
            <PageHeader
              title={c.name}
              description={c.kind === 'voucher' ? 'One-time voucher campaign' : 'Stamp card acquisition campaign'}
              breadcrumb={
                <>
                  <Link to="/app/programs">Loyalty Programs</Link>
                  <ChevronRight className="size-[13px]" aria-hidden />
                  <span>Campaigns</span>
                </>
              }
              actions={
                c.status !== 'archived' && (
                  <GuardedButton permission="programs.manage" onClick={() => navigate(`/app/campaigns/${c.id}/edit`)}>
                    <Pencil className="size-[15px]" aria-hidden /> Edit
                  </GuardedButton>
                )
              }
            />
            <div className={c.kind === 'voucher' ? 'layout-preview' : 'flex flex-col gap-[18px]'}>
              <div className="flex min-w-0 flex-col gap-[18px]">
                <Card>
                  <CardHeader title="Lifecycle" icon={<Power className="size-4" />} />
                  <CardBody>
                    <LifecycleControls status={c.status} noun="campaign" pending={lifecycle.isPending} onAction={(action) => lifecycle.mutate({ id: c.id, action }, { onSuccess: () => toast.success('Campaign updated.'), onError: (e) => toast.error(errorMessage(e)) })} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader icon={<QrCode className="size-4" />} title="Campaign QR code" description="System-generated on publish. Download for print." />
                  <CardBody>
                    {c.qrToken ? (
                      <QrDownload text={joinUrl('campaign', c.qrToken)} filename={`campaign-${c.name.toLowerCase().replace(/\W+/g, '-')}`} title={c.name} subtitle={c.kind === 'voucher' ? c.voucherReward : 'Scan to get your stamp card'} placements={['cup', 'flyer', 'sticker', 'poster']} />
                    ) : (
                      <p className="lock-overlay">The QR code is generated when the campaign is published.</p>
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Setup" icon={<Settings2 className="size-4" />} />
                  <CardBody>
                    <dl className="setup-grid grid-cols-1 sm:grid-cols-3">
                      {rows.map(([k, v]) => (
                        <div key={k} className="setup-item">
                          <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
                          <dd className="text-[14.5px] font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardBody>
                </Card>
              </div>
              {c.kind === 'voucher' && (
                <aside className="xl:sticky xl:top-24 xl:self-start">
                  <WalletPassPreview content={buildVoucherPassContent(c)} label="Voucher pass preview" />
                </aside>
              )}
            </div>
          </>
        )
      }}
    </QueryState>
  )
}
