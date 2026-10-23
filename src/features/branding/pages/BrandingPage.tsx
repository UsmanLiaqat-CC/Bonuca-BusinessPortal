import { Palette, SwatchBook } from 'lucide-react'
import { useT } from '@/i18n'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { BrandingForm } from '../components/BrandingForm'

/** Bonuca platform colours from the redesign tokens, confirmed as final by the client on 2026-10-21 (OI-45). */
const TOKENS = [
  ['Background', '#F3F3F1', '#010414'],
  ['Primary Text', '#0A0A0A', '#FFFFFF'],
  ['Primary Accent (Bonuca Blue)', '#1747F8', '#2F5BFF'],
  ['Highlight', '#FFD43B', '#FFD43B'],
  ['Wallet gradient (default template)', '#0A112F → #000000', '#0A112F → #000000'],
] as const

/** Spec §4.10 Branding. Auto Branding is unconfirmed and therefore not offered. */
export default function BrandingPage() {
  const t = useT()
  return (
    <>
      <PageHeader
        title={t('nav.branding')}
        breadcrumb={
          <>
            <Palette className="size-[13px]" aria-hidden /> {t('nav.group.business')}
          </>
        }
        description="Your logo, colours, background and font propagate to your wallet card defaults and customer-facing surfaces." />
      <div className="flex flex-col gap-[18px]">
        <Card className="reveal-up">
          <CardHeader title="Business branding" icon={<Palette className="size-4" />} />
          <CardBody>
            <BrandingForm />
          </CardBody>
        </Card>
        <Card className="reveal-up overflow-hidden">
          <CardHeader icon={<SwatchBook className="size-4" />} title="Bonuca platform colours" description="Bonuca's own brand for the dashboard chrome and default template — separate from your business colours. " />
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Light mode</th>
                  <th>Dark mode</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map(([name, light, dark]) => (
                  <tr key={name}>
                    <td className="font-semibold">{name}</td>
                    {[light, dark].map((v, i) => (
                      <td key={i}>
                        <span className="mono inline-flex items-center gap-2.5 text-xs">
                          <span className="size-6 rounded-lg border border-line-strong" style={{ background: v.includes('→') ? 'linear-gradient(90deg,#0A112F,#000)' : v }} aria-hidden />
                          {v}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
