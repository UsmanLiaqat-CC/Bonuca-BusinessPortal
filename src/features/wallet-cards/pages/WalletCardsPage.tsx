import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { WalletCards } from 'lucide-react'
import { useT } from '@/i18n'
import { buildPassContent, TEMPLATE_NAMES } from '@/lib/walletContent'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { Card } from '@/components/ui/Card'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { usePrograms } from '@/features/loyalty-programs/hooks'

/** Spec §4.3 — preview and fine-tune how program fields render. No duplicate data entry. */
export default function WalletCardsPage() {
  const t = useT()
  const programs = usePrograms()
  return (
    <>
      <PageHeader
        title={t('nav.wallet')}
        breadcrumb={
          <>
            <WalletCards className="size-[13px]" aria-hidden /> {t('nav.group.overview')}
          </>
        }
        description="Every field is entered once in the program's setup. Here you choose how the pass starts (Bonuca template or custom) and preview how it renders." />
      <h2 className="section-title mt-0">Base templates</h2>
      <div className="mb-[18px] grid gap-[18px] md:grid-cols-3">
        {(['stamp', 'membership', 'tier'] as const).map((type) => (
          <Card key={type} className="wallet-tile reveal-up cursor-default">
            <div className="pass mini" aria-hidden>
              <span className="pass-name">{TEMPLATE_NAMES[type]}</span>
              <span className="pass-lbl mt-0">Bonuca template</span>
            </div>
            <div className="meta">
              <span>{TEMPLATE_NAMES[type]}</span>
            </div>
            <p className="px-1 text-xs text-faint">Base template · structure owned by Bonuca</p>
          </Card>
        ))}
      </div>
      <QueryState query={programs}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState icon={<WalletCards className="size-6" />} title="No programs yet" body="Create a loyalty program to design its wallet pass." />
          ) : (
            <>
              <h2 className="section-title">Program wallet passes</h2>
              <div>
                <ul className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const content = buildPassContent(p)
                    return (
                      <li key={p.id}>
                        <Link to={`/app/wallet-cards/${p.id}`} className="card wallet-tile reveal-up block">
                          <div className="pass mini" style={{ '--bgp': content.background, '--fg': content.textColor } as CSSProperties}>
                            <span className="pass-name">{content.title}</span>
                            <span>
                              {content.primary && <span className="pass-lbl mt-0 block">{content.primary.label}</span>}
                              <span className="pass-val sm block">{content.primary?.value}</span>
                            </span>
                          </div>
                          <div className="meta gap-2">
                            <span className="truncate">{content.templateName}</span>
                            <LifecycleBadge status={p.status} />
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )
        }
      </QueryState>
      <div className="mt-[18px]">
        <IntegrationNotice title="Apple Wallet / Google Wallet integration not connected">
          Issued passes are generated and updated by the Bonuca backend (APNs push for Apple Wallet, Google Wallet API PATCH). That integration is not available in this environment, so no real passes are issued or updated from this portal.
        </IntegrationNotice>
      </div>
    </>
  )
}
