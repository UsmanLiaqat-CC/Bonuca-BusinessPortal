import { Link } from 'react-router-dom'
import { WalletCards } from 'lucide-react'
import { useT } from '@/i18n'
import { buildPassContent, TEMPLATE_NAMES } from '@/lib/walletContent'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { usePrograms } from '@/features/loyalty-programs/hooks'

/** Spec §4.3 — preview and fine-tune how program fields render. No duplicate data entry. */
export default function WalletCardsPage() {
  const t = useT()
  const programs = usePrograms()
  return (
    <>
      <PageHeader title={t('nav.wallet')} description="Every field is entered once in the program's setup. Here you choose how the pass starts (Bonuca template or custom) and preview how it renders." />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {(['stamp', 'membership', 'tier'] as const).map((type) => (
          <Card key={type} className="p-4">
            <div className="mb-3 h-20 rounded-lg" style={{ background: 'linear-gradient(160deg, #0A112F 0%, #000000 100%)' }} aria-hidden />
            <p className="font-medium">{TEMPLATE_NAMES[type]}</p>
            <p className="text-xs text-muted">Base template · structure owned by Bonuca</p>
          </Card>
        ))}
      </div>
      <QueryState query={programs}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState icon={<WalletCards className="size-6" />} title="No programs yet" body="Create a loyalty program to design its wallet pass." />
          ) : (
            <Card>
              <CardHeader title="Program wallet passes" />
              <CardBody>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const content = buildPassContent(p)
                    return (
                      <li key={p.id}>
                        <Link to={`/app/wallet-cards/${p.id}`} className="block rounded-card border border-line p-3 hover:border-accent">
                          <div className="flex h-24 flex-col justify-between rounded-xl p-3 text-sm" style={{ background: content.background, color: content.textColor }}>
                            <span className="font-semibold">{content.title}</span>
                            <span className="text-xs opacity-80">{content.primary?.value}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium">{content.templateName}</span>
                            <LifecycleBadge status={p.status} />
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </CardBody>
            </Card>
          )
        }
      </QueryState>
      <div className="mt-6">
        <IntegrationNotice title="Apple Wallet / Google Wallet integration not connected">
          Issued passes are generated and updated by the Bonuca backend (APNs push for Apple Wallet, Google Wallet API PATCH). That integration is not available in this environment, so no real passes are issued or updated from this portal.
        </IntegrationNotice>
      </div>
    </>
  )
}
