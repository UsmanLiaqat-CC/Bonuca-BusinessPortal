import { useT } from '@/i18n'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { BrandingForm } from '../components/BrandingForm'

const TOKENS = [
  ['Background', '#FBFBFB', '#010414'],
  ['Primary Text', '#0A0A0A', '#FFFFFF'],
  ['Primary Accent (Bonuca Blue)', '#1747F8', '#1747F8'],
  ['Wallet gradient (default template)', '#0A112F → #000000', '#0A112F → #000000'],
] as const

/** Spec §4.10 Branding. Auto Branding is unconfirmed and therefore not offered. */
export default function BrandingPage() {
  const t = useT()
  return (
    <>
      <PageHeader title={t('nav.branding')} description="Your logo, colours, background and font propagate to your wallet card defaults and customer-facing surfaces." />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Business branding" />
          <CardBody>
            <BrandingForm />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Bonuca platform colours" description="Bonuca's own brand for the dashboard chrome and default template — separate from your business colours. Values pending final designer confirmation." />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted uppercase">
                  <th className="px-5 py-2">Token</th>
                  <th className="px-5 py-2">Light mode</th>
                  <th className="px-5 py-2">Dark mode</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map(([name, light, dark]) => (
                  <tr key={name} className="border-b border-line last:border-0">
                    <td className="px-5 py-2 font-medium">{name}</td>
                    {[light, dark].map((v, i) => (
                      <td key={i} className="px-5 py-2">
                        <span className="inline-flex items-center gap-2 font-mono text-xs">
                          <span className="size-4 rounded border border-line" style={{ background: v.includes('→') ? 'linear-gradient(90deg,#0A112F,#000)' : v }} aria-hidden />
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
