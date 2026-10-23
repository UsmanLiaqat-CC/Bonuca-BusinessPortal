import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronRight, Pencil, Palette, QrCode, Settings2, Power } from 'lucide-react'
import type { Program } from '@/types/domain'
import { useT } from '@/i18n'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { joinUrl } from '@/lib/env'
import { buildPassContent } from '@/lib/walletContent'
import { currencyCode } from '@/lib/points'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { buttonClass } from '@/components/ui/Button'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { WalletPassPreview } from '@/features/wallet-cards/components/WalletPassPreview'
import { QrDownload } from '@/features/qr-scanner/components/QrDownload'
import { LifecycleControls } from '../components/LifecycleControls'
import { usePrograms, useProgramLifecycle } from '../hooks'

function Summary({ program }: { program: Program }) {
  const rows: [string, string][] = []
  switch (program.type) {
    case 'stamp':
      rows.push(['Stamps required', String(program.config.stampsRequired)], ['Reward', program.config.rewardDescription || '—'], ['Expiry rule', program.config.expiry.enabled ? `${program.config.expiry.days} days without a scan` : 'Off'])
      break
    case 'membership':
      rows.push(['Benefit', program.config.benefitDescription || '—'], ['Benefit type', program.config.benefitType.replace('_', ' ')], ['Validity', program.config.validity.kind === 'expires_on' ? `Expires ${formatDate(program.config.validity.date)}` : program.config.validity.kind.replace('_', ' ')])
      break
    case 'tier':
      rows.push(['Tiers', program.config.tiersEnabled ? program.config.tiers.map((t) => `${t.name} (${t.requiredValue})`).join(' → ') : 'Tiering off'], ['Upgrade basis', program.config.upgradeBasis], ['Downgrade rule', program.config.downgrade.enabled ? `${program.config.downgrade.inactivityDays} days inactive` : 'Off'])
      break
    case 'points':
      rows.push(
        ['Currency', currencyCode(program.config)],
        ['Ratio', `${program.config.ratio.spend} ${currencyCode(program.config)} = ${program.config.ratio.points} pts`],
        ['Awarding', program.config.awardingMethod === 'manual' ? 'Manual entry' : `Fixed — ${program.config.pointsPerScan} pts per scan`],
        ['Rewards', program.config.rewards.map((r) => `${r.pointsRequired} pts = ${r.name}`).join(', ') || '—'],
      )
  }
  rows.push(['Surprise rewards', program.surprise.enabled ? `On (${program.surprise.probabilityPercent}%)` : 'Off'])
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

const PAST = { publish: 'published', enable: 'enabled', disable: 'paused', archive: 'archived' } as const

export default function ProgramDetailPage() {
  const t = useT()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const programs = usePrograms()
  const lifecycle = useProgramLifecycle()

  return (
    <QueryState query={programs}>
      {(list) => {
        const program = list.find((p) => p.id === id)
        if (!program) return <ErrorState message="Program not found." />
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
                <>
                  <Link to={`/app/wallet-cards/${program.id}`} className={buttonClass('secondary')}>
                    <Palette className="size-[15px]" aria-hidden /> Wallet design
                  </Link>
                  {program.status !== 'archived' && (
                    <GuardedButton permission="programs.manage" onClick={() => navigate(`/app/programs/${program.id}/edit`)}>
                      <Pencil className="size-[15px]" aria-hidden /> {t('common.edit')}
                    </GuardedButton>
                  )}
                </>
              }
            />
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
                          { onSuccess: () => toast.success(`Program ${PAST[action]}.`), onError: (e) => toast.error(errorMessage(e)) },
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
                        {program.status === 'paused' && <p className="callout warn mb-3">Program paused — this QR does not enrol new members until it is enabled again.</p>}
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
                <Card>
                  <CardHeader title="Setup" icon={<Settings2 className="size-4" />} />
                  <CardBody>
                    <Summary program={program} />
                  </CardBody>
                </Card>
              </div>
              <aside className="xl:sticky xl:top-24 xl:self-start">
                <WalletPassPreview content={buildPassContent(program)} label="Wallet pass preview (sample customer)" />
              </aside>
            </div>
          </>
        )
      }}
    </QueryState>
  )
}
