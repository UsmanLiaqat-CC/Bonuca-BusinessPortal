import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CreditCard } from 'lucide-react'
import { useT } from '@/i18n'
import { useBackend, useServices } from '@/state/services'
import { SESSION_KEY, useSessionQuery } from '@/state/session'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/Button'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { PlanOptions } from '@/features/subscriptions/components/PlanOptions'
import { OnboardingBars, OnboardingSteps } from '../OnboardingSteps'

/** Spec §1.5 plan selection. Free activates instantly; Paid opens Stripe checkout on web; Skip → Preview Mode. */
export default function PlanSelectionPage() {
  const t = useT()
  const backend = useBackend()
  const { integrations } = useServices()
  const qc = useQueryClient()
  const session = useSessionQuery()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const catalog = session.data?.catalog
  if (!catalog) return null

  const choose = async (key: string, fn: () => Promise<unknown>, refresh = true) => {
    setBusy(key)
    setError(null)
    try {
      await fn()
      if (refresh) await qc.invalidateQueries({ queryKey: SESSION_KEY })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthLayout
      title={t('onb.plan.title')}
      subtitle="Changing plans never deletes customers, programs or transactions."
      size="xl"
      top={<OnboardingSteps current={2} />}
      eyebrow={
        <>
          <CreditCard className="size-[13px]" aria-hidden /> {t('onb.eyebrow')}
        </>
      }
    >
      <OnboardingBars current={2} />
      <PlanOptions
        catalog={catalog}
        renderFree={() => (
          <Button className="btn-block" variant="secondary" loading={busy === 'free'} onClick={() => choose('free', () => backend.choosePlan('free'))}>
            Choose Free Plan
          </Button>
        )}
        renderTrial={() => (
          <Button className="btn-block" loading={busy === 'trial'} onClick={() => choose('trial', () => backend.choosePlan('trial'))}>
            Start Free Trial
            <ArrowRight className="size-[15px]" aria-hidden />
          </Button>
        )}
        renderPaid={(plan) => (
          <Button
            className="btn-block"
            variant="secondary"
            loading={busy === plan.id}
            onClick={() =>
              choose(
                plan.id,
                async () => {
                  const { checkoutUrl } = await integrations.billing.startCheckout(plan.id)
                  window.location.assign(checkoutUrl)
                },
                false,
              )
            }
          >
            Choose {plan.name} — Stripe checkout
          </Button>
        )}
      />
      {error && (
        <p className="callout mt-4 border-transparent bg-danger-soft text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="mt-[18px]">
        <IntegrationNotice title="Paid plans on the web use Stripe checkout">
          Stripe is not connected in this environment, so paid checkout cannot be completed here. Mobile purchases use the App Store / Google Play inside the Bonuca app.
        </IntegrationNotice>
      </div>
      <div className="divider" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <b className="font-semibold">{t('onb.plan.skip')}</b>
          <p className="hint">{t('onb.plan.skipHint')}</p>
        </div>
        <Button variant="ghost" loading={busy === 'skip'} onClick={() => choose('skip', () => backend.choosePlan('preview'))}>
          {t('onb.plan.skip')}
          <ArrowRight className="size-[15px]" aria-hidden />
        </Button>
      </div>
    </AuthLayout>
  )
}
