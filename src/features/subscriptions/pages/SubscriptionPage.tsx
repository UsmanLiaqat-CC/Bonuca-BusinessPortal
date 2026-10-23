import { useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, FileText, History, Lock, Receipt, ShieldCheck, Sparkles } from 'lucide-react'
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

function BillingSection<T>({ title, icon, queryKey, load, render }: { title: string; icon: ReactNode; queryKey: string; load: () => Promise<T>; render: (d: T) => ReactNode }) {
  const q = useQuery({ queryKey: ['billing', queryKey], queryFn: load, retry: false })
  return (
    <Card className="reveal-up">
      <CardHeader title={title} icon={icon} />
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
      <PageHeader
        title={t('nav.subscription')}
        breadcrumb={
          <>
            <CreditCard className="size-[13px]" aria-hidden /> {t('nav.group.business')}
          </>
        }
      />
      <div className="flex flex-col gap-[18px]">
        <Card className="reveal-up">
          <CardHeader title="Current plan" icon={<Sparkles className="size-4" />} actions={<Badge tone={plan.mode === 'preview' ? 'warning' : 'accent'}>{MODE_LABEL[plan.mode]}</Badge>} />
          <CardBody className="flex flex-col gap-4">
            {managedByBonuca && plan.override && (
              <div className="callout info" data-testid="override-readonly">
                <ShieldCheck className="size-[18px] shrink-0" aria-hidden />
                <div>
                  <b>{t('override.banner')}</b>
                  <p>
                    {OVERRIDE_LABEL[plan.override.kind]} · {plan.plan?.name} features{plan.override.endsAt ? ` until ${formatDate(plan.override.endsAt)}` : ''}.
                  </p>
                  <p className="text-xs text-muted">{t('override.readonly')}</p>
                </div>
              </div>
            )}
            <dl className="setup-grid grid-cols-1 sm:grid-cols-3">
              <div className="setup-item">
                <dt className="mb-1 text-xs font-medium text-faint">Plan</dt>
                <dd className="text-[14.5px] font-semibold">{plan.plan?.name ?? 'None selected'}</dd>
              </div>
              {plan.mode === 'trial' && plan.trialEndsAt && (
                <div className="setup-item">
                  <dt className="mb-1 text-xs font-medium text-faint">Trial ends</dt>
                  <dd className="text-[14.5px] font-semibold">{formatDate(plan.trialEndsAt)} ({daysUntil(plan.trialEndsAt)} days)</dd>
                </div>
              )}
              {sub.source && (
                <div className="setup-item">
                  <dt className="mb-1 text-xs font-medium text-faint">Purchased via</dt>
                  <dd className="text-[14.5px] font-semibold">{SOURCE_LABEL[sub.source]}</dd>
                </div>
              )}
              {sub.currentPeriodEnd && (
                <div className="setup-item">
                  <dt className="mb-1 text-xs font-medium text-faint">{sub.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}</dt>
                  <dd className="text-[14.5px] font-semibold">{formatDate(sub.currentPeriodEnd)}</dd>
                </div>
              )}
            </dl>
            {plan.trialExpired && <p className="callout">{t('trial.expired')}</p>}
            <p className="hint">Changing plans never deletes customers, programs or transactions — only feature access changes.</p>
            {plan.mode === 'paid' && !locked && (
              <div className="flex flex-wrap gap-2">
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" onClick={() => setConfirm('downgrade')}>Downgrade to Free</GuardedButton>
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="danger" onClick={() => setConfirm('cancel')}>Cancel subscription</GuardedButton>
              </div>
            )}
          </CardBody>
        </Card>

        <div>
          <h2 className="section-title mt-3.5">{plan.mode === 'paid' ? 'Change plan' : 'Upgrade'}</h2>
          {actionsDisabledNote && (
            <p className="lock-overlay mb-3.5">
              <Lock className="size-4 shrink-0" aria-hidden /> {actionsDisabledNote}
            </p>
          )}
          <PlanOptions
            catalog={session.catalog}
            currentPlanId={plan.mode === 'preview' ? null : plan.plan?.id}
            renderFree={() =>
              plan.mode === 'free' ? null : plan.mode === 'paid' ? null : (
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" className="btn-block" loading={busy === 'free'} onClick={() => run('free', () => backend.choosePlan('free'), 'Free Plan activated.')}>
                  Choose Free Plan
                </GuardedButton>
              )
            }
            renderTrial={() =>
              sub.trialEndsAt ? (
                <p className="hint text-center">{plan.mode === 'trial' ? 'Trial in progress.' : 'The free trial has already been used.'}</p>
              ) : (
                <GuardedButton permission="subscription.manage" extra={lockDecision} className="btn-block" loading={busy === 'trial'} onClick={() => run('trial', () => backend.choosePlan('trial'), 'Free Trial started.')}>
                  Start Free Trial
                </GuardedButton>
              )
            }
            renderPaid={(p) =>
              plan.mode === 'paid' && plan.plan?.id === p.id ? null : (
                <GuardedButton
                  permission="subscription.manage"
                  variant="secondary"
                  className="btn-block"
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
          <div className="mt-[18px]">
            <IntegrationNotice title="Payment rails">
              Web purchases use Stripe checkout (not connected in this environment). Mobile purchases use the App Store / Google Play in-app purchase inside the Bonuca app. A subscription belongs to the business account and reads the same everywhere; cross-platform reconciliation is pending technical/legal review.
            </IntegrationNotice>
          </div>
        </div>

        {access.can('settings.billing') ? (
          <div className="grid gap-[18px] lg:grid-cols-3">
            <BillingSection title="Invoices" icon={<FileText className="size-4" />} queryKey="invoices" load={() => integrations.billing.listInvoices()} render={(list) => (list.length ? <ul className="text-sm">{list.map((i) => <li key={i.id}>{formatDate(i.date)} · {i.amount} · {i.status}</li>)}</ul> : <p className="text-sm text-muted">No invoices.</p>)} />
            <BillingSection title="Payment history" icon={<History className="size-4" />} queryKey="payments" load={() => integrations.billing.listPayments()} render={(list) => (list.length ? <ul className="text-sm">{list.map((p) => <li key={p.id}>{formatDate(p.date)} · {p.amount} · {p.status}</li>)}</ul> : <p className="text-sm text-muted">No payments.</p>)} />
            <BillingSection title="Billing information" icon={<Receipt className="size-4" />} queryKey="info" load={() => integrations.billing.getBillingInfo()} render={(info) => (info ? <dl className="text-sm"><dt className="text-muted">Name</dt><dd>{info.name}</dd><dt className="text-muted">Email</dt><dd>{info.email}</dd><dt className="text-muted">Payment method</dt><dd>{info.paymentMethod}</dd></dl> : <p className="text-sm text-muted">No billing information on file.</p>)} />
          </div>
        ) : (
          <p className="lock-overlay">
            <Lock className="size-4 shrink-0" aria-hidden /> Invoices, payment history and billing information are visible to the Owner.
          </p>
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
