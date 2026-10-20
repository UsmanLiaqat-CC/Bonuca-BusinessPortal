import { useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession, SESSION_KEY } from '@/state/session'
import { useBackend, useServices } from '@/state/services'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { daysUntil } from '@/lib/plan'
import { IntegrationNotConnectedError } from '@/services/integrations'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { Spinner } from '@/components/ui/Spinner'
import { PlanOptions } from '../components/PlanOptions'

const MODE_LABEL = { preview: 'Preview Mode', free: 'Free Plan', trial: 'Free Trial', paid: 'Paid Plan' } as const
const SOURCE_LABEL = { web_stripe: 'Web (Stripe)', app_store: 'iOS App Store', google_play: 'Google Play' } as const
const OVERRIDE_LABEL = { free_access: 'Free access granted', billing_paused: 'Billing paused', custom_duration: 'Custom duration', unlimited: 'Unlimited access' } as const

function BillingSection<T>({ title, queryKey, load, render }: { title: string; queryKey: string; load: () => Promise<T>; render: (d: T) => ReactNode }) {
  const q = useQuery({ queryKey: ['billing', queryKey], queryFn: load, retry: false })
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody>
        {q.isPending ? (
          <Spinner />
        ) : q.isError ? (
          <IntegrationNotice title={q.error instanceof IntegrationNotConnectedError ? 'Stripe not connected' : 'Unavailable'}>{errorMessage(q.error)} Nothing is shown rather than placeholder data.</IntegrationNotice>
        ) : (
          render(q.data)
        )}
      </CardBody>
    </Card>
  )
}

/** Spec §4.11 Subscription Management + §2 plan logic. */
export default function SubscriptionPage() {
  const t = useT()
  const toast = useToast()
  const qc = useQueryClient()
  const backend = useBackend()
  const { integrations } = useServices()
  const access = useAccess()
  const { session, plan } = useSession()
  const sub = session.subscription
  const [confirm, setConfirm] = useState<'cancel' | 'downgrade' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const managedByBonuca = !!plan.override
  const mobilePurchase = sub.source === 'app_store' || sub.source === 'google_play'

  const run = async (key: string, fn: () => Promise<unknown>, success?: string) => {
    setBusy(key)
    try {
      await fn()
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
      await qc.invalidateQueries()
      if (success) toast.success(success)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  const locked = managedByBonuca || mobilePurchase
  const actionsDisabledNote = managedByBonuca ? 'Your plan is managed by Bonuca and cannot be changed here.' : mobilePurchase ? 'This subscription was purchased in the mobile app. Manage it through the App Store or Google Play.' : null
  const lockDecision = actionsDisabledNote ? ({ allowed: false, reason: 'plan', message: actionsDisabledNote } as const) : undefined

  return (
    <>
      <PageHeader title={t('nav.subscription')} />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Current plan" actions={<Badge tone={plan.mode === 'preview' ? 'warning' : 'accent'}>{MODE_LABEL[plan.mode]}</Badge>} />
          <CardBody className="flex flex-col gap-4">
            {managedByBonuca && plan.override && (
              <div className="flex gap-3 rounded-lg border border-accent/40 bg-accent-soft p-4 text-sm" data-testid="override-readonly">
                <ShieldCheck className="size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold">{t('override.banner')}</p>
                  <p>
                    {OVERRIDE_LABEL[plan.override.kind]} · {plan.plan?.name} features{plan.override.endsAt ? ` until ${formatDate(plan.override.endsAt)}` : ''}.
                  </p>
                  <p className="text-xs text-muted">{t('override.readonly')}</p>
                </div>
              </div>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Plan</dt>
                <dd className="font-medium">{plan.plan?.name ?? 'None selected'}</dd>
              </div>
              {plan.mode === 'trial' && plan.trialEndsAt && (
                <div>
                  <dt className="text-xs text-muted">Trial ends</dt>
                  <dd className="font-medium">{formatDate(plan.trialEndsAt)} ({daysUntil(plan.trialEndsAt)} days)</dd>
                </div>
              )}
              {sub.source && (
                <div>
                  <dt className="text-xs text-muted">Purchased via</dt>
                  <dd className="font-medium">{SOURCE_LABEL[sub.source]}</dd>
                </div>
              )}
              {sub.currentPeriodEnd && (
                <div>
                  <dt className="text-xs text-muted">{sub.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}</dt>
                  <dd className="font-medium">{formatDate(sub.currentPeriodEnd)}</dd>
                </div>
              )}
            </dl>
            {plan.trialExpired && <p className="text-sm text-muted">{t('trial.expired')}</p>}
            <p className="text-xs text-muted">Changing plans never deletes customers, programs or transactions — only feature access changes.</p>
            {plan.mode === 'paid' && !locked && (
              <div className="flex flex-wrap gap-2">
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" onClick={() => setConfirm('downgrade')}>Downgrade to Free</GuardedButton>
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="danger" onClick={() => setConfirm('cancel')}>Cancel subscription</GuardedButton>
              </div>
            )}
          </CardBody>
        </Card>

        <div>
          <h2 className="mb-3 text-base font-semibold">{plan.mode === 'paid' ? 'Change plan' : 'Upgrade'}</h2>
          {actionsDisabledNote && <p className="mb-3 text-sm text-muted">{actionsDisabledNote}</p>}
          <PlanOptions
            catalog={session.catalog}
            currentPlanId={plan.mode === 'preview' ? null : plan.plan?.id}
            renderFree={() =>
              plan.mode === 'free' ? null : plan.mode === 'paid' ? null : (
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" className="w-full" loading={busy === 'free'} onClick={() => run('free', () => backend.choosePlan('free'), 'Free Plan activated.')}>
                  Choose Free Plan
                </GuardedButton>
              )
            }
            renderTrial={() =>
              sub.trialEndsAt ? (
                <p className="text-xs text-muted">{plan.mode === 'trial' ? 'Trial in progress.' : 'The free trial has already been used.'}</p>
              ) : (
                <GuardedButton permission="subscription.manage" extra={lockDecision} className="w-full" loading={busy === 'trial'} onClick={() => run('trial', () => backend.choosePlan('trial'), 'Free Trial started.')}>
                  Start Free Trial
                </GuardedButton>
              )
            }
            renderPaid={(p) =>
              plan.mode === 'paid' && plan.plan?.id === p.id ? null : (
                <GuardedButton
                  permission="subscription.manage"
                  className="w-full"
                  loading={busy === p.id}
                  onClick={() =>
                    run(p.id, async () => {
                      const { checkoutUrl } = await integrations.billing.startCheckout(p.id)
                      window.location.assign(checkoutUrl)
                    })
                  }
                >
                  {plan.mode === 'paid' ? `Switch to ${p.name}` : `Upgrade to ${p.name}`} — Stripe checkout
                </GuardedButton>
              )
            }
          />
          <div className="mt-4">
            <IntegrationNotice title="Payment rails">
              Web purchases use Stripe checkout (not connected in this environment). Mobile purchases use the App Store / Google Play in-app purchase inside the Bonuca app. A subscription belongs to the business account and reads the same everywhere; cross-platform reconciliation is pending technical/legal review.
            </IntegrationNotice>
          </div>
        </div>

        {access.can('settings.billing') ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <BillingSection title="Invoices" queryKey="invoices" load={() => integrations.billing.listInvoices()} render={(list) => (list.length ? <ul className="text-sm">{list.map((i) => <li key={i.id}>{formatDate(i.date)} · {i.amount} · {i.status}</li>)}</ul> : <p className="text-sm text-muted">No invoices.</p>)} />
            <BillingSection title="Payment history" queryKey="payments" load={() => integrations.billing.listPayments()} render={(list) => (list.length ? <ul className="text-sm">{list.map((p) => <li key={p.id}>{formatDate(p.date)} · {p.amount} · {p.status}</li>)}</ul> : <p className="text-sm text-muted">No payments.</p>)} />
            <BillingSection title="Billing information" queryKey="info" load={() => integrations.billing.getBillingInfo()} render={(info) => (info ? <dl className="text-sm"><dt className="text-muted">Name</dt><dd>{info.name}</dd><dt className="text-muted">Email</dt><dd>{info.email}</dd><dt className="text-muted">Payment method</dt><dd>{info.paymentMethod}</dd></dl> : <p className="text-sm text-muted">No billing information on file.</p>)} />
          </div>
        ) : (
          <p className="text-sm text-muted">Invoices, payment history and billing information are visible to the Owner.</p>
        )}
      </div>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'cancel' ? 'Cancel subscription?' : 'Downgrade to the Free Plan?'}
        confirmLabel={confirm === 'cancel' ? 'Cancel subscription' : 'Downgrade'}
        tone={confirm === 'cancel' ? 'danger' : 'primary'}
        body="No data is deleted — only feature access changes. This is processed by Stripe."
        onConfirm={() => {
          const c = confirm
          setConfirm(null)
          if (c === 'cancel') void run('cancel', () => integrations.billing.cancel(), 'Cancellation requested.')
          if (c === 'downgrade') void run('downgrade', () => integrations.billing.changePlan(session.catalog.free.plan.id), 'Downgrade requested.')
        }}
      />
    </>
  )
}
