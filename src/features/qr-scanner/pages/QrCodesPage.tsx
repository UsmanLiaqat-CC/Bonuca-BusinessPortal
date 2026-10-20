import { Link } from 'react-router-dom'
import { useT } from '@/i18n'
import { useSession } from '@/state/session'
import { joinUrl } from '@/lib/env'
import { PageHeader } from '@/components/data-display/PageHeader'
import { LifecycleBadge } from '@/components/data-display/StatusBadge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { usePrograms, useCampaigns } from '@/features/loyalty-programs/hooks'
import { QrDownload } from '../components/QrDownload'

const SLUG = (s: string) => s.toLowerCase().replace(/\W+/g, '-')

/** Spec §4.4 — printable QR codes (table, counter, sticker, flyer, window). */
export default function QrCodesPage() {
  const t = useT()
  const { session } = useSession()
  const programs = usePrograms()
  const campaigns = useCampaigns()
  return (
    <>
      <PageHeader title="Printable QR codes" breadcrumb={<Link to="/app/scanner" className="hover:underline">{t('nav.scanner')}</Link>} description="Depending on the program, scanning adds a wallet card, registers the customer, or joins a membership." />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Customer registration" description="Registers a new customer using your configured signup fields." />
          <CardBody>
            <QrDownload text={joinUrl('register', session.business.id)} filename="register" title={session.business.name} subtitle="Scan to register" placements={['table', 'counter', 'sticker', 'flyer', 'window']} />
          </CardBody>
        </Card>
        <QueryState query={programs}>
          {(list) => {
            const published = list.filter((p) => p.joinQrToken && p.status !== 'archived')
            if (!published.length) return <EmptyState title="No published programs" body="A program's join QR is generated the first time it is published." />
            return (
              <>
                {published.map((p) => (
                  <Card key={p.id}>
                    <CardHeader title={p.name} description={p.type === 'membership' || p.type === 'tier' ? 'Join membership' : 'Add wallet card'} actions={<LifecycleBadge status={p.status} />} />
                    <CardBody>
                      {p.status === 'paused' && <p className="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-sm">Paused — this QR does not enrol new members until enabled.</p>}
                      <QrDownload text={joinUrl('program', p.joinQrToken!)} filename={`join-${SLUG(p.name)}`} title={p.name} subtitle={p.type === 'membership' || p.type === 'tier' ? 'Scan to join' : 'Scan to add our card to your wallet'} placements={['table', 'counter', 'sticker', 'flyer', 'window']} />
                    </CardBody>
                  </Card>
                ))}
              </>
            )
          }}
        </QueryState>
        <QueryState query={campaigns}>
          {(list) => (
            <>
              {list
                .filter((c) => c.qrToken && c.status !== 'archived')
                .map((c) => (
                  <Card key={c.id}>
                    <CardHeader title={c.name} description={c.kind === 'voucher' ? 'One-time voucher campaign' : 'Stamp card acquisition campaign'} actions={<LifecycleBadge status={c.status} />} />
                    <CardBody>
                      <QrDownload text={joinUrl('campaign', c.qrToken!)} filename={`campaign-${SLUG(c.name)}`} title={c.name} subtitle={c.kind === 'voucher' ? c.voucherReward : 'Scan to get your stamp card'} placements={['cup', 'flyer', 'sticker', 'poster']} />
                    </CardBody>
                  </Card>
                ))}
            </>
          )}
        </QueryState>
      </div>
    </>
  )
}
