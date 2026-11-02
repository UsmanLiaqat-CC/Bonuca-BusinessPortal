import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession, SESSION_KEY } from '@/state/session'
import { useBackend, useServices } from '@/state/services'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { daysUntil } from '@/lib/plan'
import { PREVIEW_LOCK_MESSAGE } from '@/lib/access'
import type { BillingInfo, Invoice, Payment } from '@/services/integrations'
import { PageHeader } from '@/components/data-display/PageHeader'
import { DataTable } from '@/components/data-display/Table'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState } from '@/components/feedback/QueryState'
import { Spinner } from '@/components/ui/Spinner'
import { PlanOptions } from '../components/PlanOptions'

const TABS = ['plan', 'invoices', 'payments', 'billing'] as const
type Tab = (typeof TABS)[number]
const TAB_LABEL: Record<Tab, string> = { plan: 'Plan', invoices: 'Invoices', payments: 'Payment history', billing: 'Billing information' }
const SOURCE_LABEL = { web_stripe: 'Web (Stripe)', app_store: 'App Store', google_play: 'Google Play' } as const
const PAGE_SIZE = 10

/* Sample rows for Preview Mode only (spec: demo rows marked "Sample data"). Never shown for a real plan. */
const SAMPLE_INVOICES: Invoice[] = [
  { id: 's3', number: 'INV-0003', date: '2026-10-09', description: 'Pro plan, Oct 9 – Nov 8', amount: '€55.00', status: 'Paid', url: null },
  { id: 's2', number: 'INV-0002', date: '2026-09-09', description: 'Pro plan, Sep 9 – Oct 8', amount: '€55.00', status: 'Paid', url: null },
  { id: 's1', number: 'INV-0001', date: '2026-08-09', description: 'Pro plan, Aug 9 – Sep 8', amount: '€55.00', status: 'Paid', url: null },
]
const SAMPLE_PAYMENTS: Payment[] = [
  { id: 'p4', date: '2026-10-09', description: 'Pro plan, monthly', method: 'Visa •••• 4242', amount: '€55.00', status: 'Succeeded', source: 'Web (Stripe)' },
  { id: 'p3', date: '2026-09-12', description: 'Pro plan, monthly (retry)', method: 'Visa •••• 4242', amount: '€55.00', status: 'Succeeded', source: 'Web (Stripe)' },
  { id: 'p2', date: '2026-09-09', description: 'Pro plan, monthly', method: 'Visa •••• 4242', amount: '€55.00', status: 'Failed: card declined', source: 'Web (Stripe)' },
  { id: 'p1', date: '2026-08-09', description: 'Pro plan, monthly', method: 'Visa •••• 4242', amount: '€55.00', status: 'Succeeded', source: 'Web (Stripe)' },
]
const SAMPLE_INFO: BillingInfo = { name: 'Brew & Bean Café', email: 'billing@brewandbean.example', address: '14 Main Street, 10115 Berlin, Germany', taxId: 'DE123456789', card: { brand: 'Visa', last4: '4242', expires: '08/2028' } }

const SampleBadge = () => <Badge tone="warning">Sample data</Badge>

/** Loads a Stripe-backed list or card. Stripe is not connected here, so the error state is what a real owner sees. */
function useBillingData<T>(key: string, load: () => Promise<T>, preview: boolean, sample: T) {
  const q = useQuery({ queryKey: ['billing', key], queryFn: load, retry: false, enabled: !preview })
  return preview ? ({ data: sample, isPending: false, isError: false, error: null, refetch: () => q.refetch() } as const) : q
}

/** Spec "Stripe unavailable": show "Couldn’t load …. Try again." with Retry, not the old "Stripe not connected" notice. */
function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="callout warn items-center" role="alert">
      <p>Couldn’t load {what}. Try again.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  )
}

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 px-[22px] py-3 text-sm">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="text-muted">Page {page} of {pages}</span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  )
}

const money = 'text-right tabular-nums'
const filterCls = 'w-40'

/** Spec §4.11 Subscription Management + §2 plan logic, restructured per BONUCA CHANGES item 7. */
export default function SubscriptionPage() {
  const t = useT()
  const toast = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const params = useParams()
  const backend = useBackend()
  const { integrations } = useServices()
  const access = useAccess()
  const { session, plan } = useSession()
  const sub = session.subscription
  const tab: Tab = (TABS as readonly string[]).includes(params.tab ?? '') ? (params.tab as Tab) : 'plan'
  const [confirm, setConfirm] = useState<'cancel' | 'downgrade' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [year, setYear] = useState('all')
  const [invStatus, setInvStatus] = useState('all')
  const [payStatus, setPayStatus] = useState('all')
  const [invPage, setInvPage] = useState(1)
  const [payPage, setPayPage] = useState(1)
  const preview = plan.mode === 'preview'
  const managedByBonuca = !!plan.override
  const mobilePurchase = sub.source === 'app_store' || sub.source === 'google_play'
  const cancelling = sub.cancelAtPeriodEnd && !!sub.currentPeriodEnd
  const planName = plan.plan?.name ?? 'your plan'

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
  const previewLock = preview ? ({ allowed: false, reason: 'preview', message: PREVIEW_LOCK_MESSAGE } as const) : undefined

  const invoices = useBillingData('invoices', () => integrations.billing.listInvoices(), preview, SAMPLE_INVOICES)
  const payments = useBillingData('payments', () => integrations.billing.listPayments(), preview, SAMPLE_PAYMENTS)
  const info = useBillingData('info', () => integrations.billing.getBillingInfo(), preview, SAMPLE_INFO as BillingInfo | null)

  const invRows = useMemo(
    () => (invoices.data ?? []).filter((i) => (year === 'all' || i.date.startsWith(year)) && (invStatus === 'all' || i.status.toLowerCase() === invStatus)).sort((a, b) => b.date.localeCompare(a.date)),
    [invoices.data, year, invStatus],
  )
  const payRows = useMemo(
    () => (payments.data ?? []).filter((p) => payStatus === 'all' || p.status.toLowerCase().startsWith(payStatus)).sort((a, b) => b.date.localeCompare(a.date)),
    [payments.data, payStatus],
  )

  /* One banner at a time, highest priority first: 1 payment failed, 2 managed by Bonuca, 3 cancelling.
     "Payment failed" needs Stripe payment events, which are not connected, so it cannot be shown yet. */
  const banner: ReactNode = managedByBonuca && plan.override ? (
    <div className="callout info" data-testid="override-readonly">
      <ShieldCheck className="size-[18px] shrink-0" aria-hidden />
      <p>Your plan is managed by Bonuca. {plan.override.endsAt ? `Free access until ${formatDate(plan.override.endsAt)}. ` : ''}Billing is paused.</p>
    </div>
  ) : cancelling ? (
    <div className="callout warn items-center" data-testid="cancelling-banner">
      <p>Your plan ends on {formatDate(sub.currentPeriodEnd)}.</p>
      <GuardedButton permission="subscription.manage" extra={lockDecision} size="sm" loading={busy === 'resume'} onClick={() => run('resume', () => integrations.billing.resume(), 'Plan resumed.')}>Resume plan</GuardedButton>
    </div>
  ) : null

  const statusLabel = plan.mode === 'trial' ? 'Trial' : plan.mode === 'paid' ? (cancelling ? 'Cancelling' : 'Active') : plan.mode === 'free' ? 'Free' : 'Preview'
  const trialPlan = session.catalog.paid.find((p) => p.id === session.catalog.trial.grantsPlanId)
  const goPlans = () => document.getElementById('plan-cards')?.scrollIntoView({ behavior: 'smooth' })
  const paidIndex = (id: string) => session.catalog.paid.findIndex((p) => p.id === id)
  const dash = '—'

  const planTab = (
    <div className="flex flex-col gap-[18px]">
      <Card className="reveal-up">
        <CardHeader title="Current plan" actions={<Badge tone={preview ? 'warning' : 'accent'}>{statusLabel}</Badge>} />
        <CardBody className="flex flex-col gap-4">
          <dl className="setup-grid grid-cols-1 sm:grid-cols-3">
            {([
              ['Plan', plan.mode === 'trial' ? `${trialPlan?.name ?? planName} (free trial)` : plan.plan?.name ?? 'None selected'],
              ['Status', statusLabel],
              plan.mode === 'trial' && plan.trialEndsAt ? ['Trial ends', `${formatDate(plan.trialEndsAt)} (${daysUntil(plan.trialEndsAt)} days left)`] : null,
              ['Price', plan.mode === 'free' || preview ? dash : `${plan.plan?.priceLabel ?? 'Pricing not configured yet'}${plan.mode === 'trial' ? ' after the trial' : ''}`],
              plan.mode === 'paid' ? ['Next payment', cancelling ? dash : sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : dash] : null,
              ['Payment method', plan.mode === 'paid' && !info.isError && info.data?.card ? `${info.data.card.brand} •••• ${info.data.card.last4}` : 'None added yet'],
              plan.mode === 'paid' && sub.source ? ['Bought through', SOURCE_LABEL[sub.source]] : null,
            ].filter(Boolean) as [string, string][]).map(([k, v]) => (
              <div key={k} className="setup-item">
                <dt className="mb-1 text-xs font-medium text-faint">{k}</dt>
                <dd className="text-[14.5px] font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {plan.trialExpired && <p className="callout">{t('trial.expired')}</p>}
          <div className="flex flex-wrap gap-2">
            {plan.mode === 'trial' && !locked && (
              <>
                <GuardedButton permission="subscription.manage" extra={previewLock ?? lockDecision} onClick={goPlans}>Subscribe to {trialPlan?.name ?? 'Pro'}</GuardedButton>
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" loading={busy === 'free'} onClick={() => run('free', () => backend.choosePlan('free'), 'Free plan activated.')}>Choose Free plan</GuardedButton>
              </>
            )}
            {plan.mode === 'free' && <GuardedButton permission="subscription.manage" extra={lockDecision} onClick={goPlans}>Upgrade</GuardedButton>}
            {plan.mode === 'paid' && !cancelling && (
              <>
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="secondary" onClick={goPlans}>Change plan</GuardedButton>
                <GuardedButton permission="subscription.manage" extra={lockDecision} variant="danger" onClick={() => setConfirm('cancel')}>Cancel plan</GuardedButton>
              </>
            )}
            {plan.mode === 'paid' && cancelling && (
              <GuardedButton permission="subscription.manage" extra={lockDecision} loading={busy === 'resume'} onClick={() => run('resume', () => integrations.billing.resume(), 'Plan resumed.')}>Resume plan</GuardedButton>
            )}
            {preview && <p className="hint">{PREVIEW_LOCK_MESSAGE}</p>}
          </div>
          <p className="hint">Changing plans never deletes customers, programs or transactions. Only feature access changes.</p>
        </CardBody>
      </Card>

      <div id="plan-cards">
        {actionsDisabledNote && (
          <p className="lock-overlay mb-3.5">
            <Lock className="size-4 shrink-0" aria-hidden /> {actionsDisabledNote}
          </p>
        )}
        <PlanOptions
          catalog={session.catalog}
          currentPlanId={preview ? null : plan.plan?.id}
          renderFree={() =>
            plan.mode === 'free' ? (
              <Button variant="secondary" className="btn-block" disabled>Current plan</Button>
            ) : (
              <GuardedButton permission="subscription.manage" extra={previewLock ?? lockDecision} variant="secondary" className="btn-block" loading={busy === 'free'} onClick={() => (plan.mode === 'paid' ? setConfirm('downgrade') : run('free', () => backend.choosePlan('free'), 'Free plan activated.'))}>
                {plan.mode === 'paid' ? 'Downgrade to Free plan' : 'Choose Free plan'}
              </GuardedButton>
            )
          }
          renderTrial={() =>
            sub.trialEndsAt ? (
              <p className="hint text-center">{plan.mode === 'trial' ? 'Trial in progress.' : 'The free trial has already been used.'}</p>
            ) : (
              <GuardedButton permission="subscription.manage" extra={previewLock ?? lockDecision} className="btn-block" loading={busy === 'trial'} onClick={() => run('trial', () => backend.choosePlan('trial'), 'Free trial started.')}>
                Start free trial
              </GuardedButton>
            )
          }
          renderPaid={(p) => {
            if (plan.mode === 'paid' && plan.plan?.id === p.id) return <Button variant="secondary" className="btn-block" disabled>Current plan</Button>
            const down = plan.mode === 'paid' && plan.plan ? paidIndex(p.id) < paidIndex(plan.plan.id) : false
            return (
              <GuardedButton
                permission="subscription.manage"
                extra={previewLock ?? lockDecision}
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
                {down ? `Downgrade to ${p.name}` : `Subscribe to ${p.name}`}
              </GuardedButton>
            )
          }}
        />
        <div className="mt-[18px]">
          <div className="callout info">
            <p>Web purchases use Stripe. Mobile purchases use the App Store or Google Play inside the Bonuca app. A subscription belongs to the business account and reads the same everywhere.</p>
          </div>
        </div>
      </div>
    </div>
  )

  const SampleTag = preview ? <SampleBadge /> : null

  const invoicesTab = mobilePurchase && !preview ? (
    <Card><CardBody><p className="callout">Billed by {sub.source === 'app_store' ? 'Apple' : 'Google'}. Receipts are sent by {sub.source === 'app_store' ? 'Apple' : 'Google'}.</p></CardBody></Card>
  ) : (
    <Card className="reveal-up overflow-hidden">
      <CardHeader title="Invoices" actions={SampleTag} />
      <div className="flex flex-wrap gap-3 px-[22px] pb-3">
        <Select aria-label="Year" className={filterCls} value={year} onChange={(e) => { setYear(e.target.value); setInvPage(1) }}>
          <option value="all">All years</option><option value="2026">2026</option><option value="2025">2025</option>
        </Select>
        <Select aria-label="Status" className={filterCls} value={invStatus} onChange={(e) => { setInvStatus(e.target.value); setInvPage(1) }}>
          <option value="all">All statuses</option><option value="paid">Paid</option><option value="open">Open</option><option value="void">Void</option>
        </Select>
      </div>
      {invoices.isPending ? (
        <div className="p-5"><Spinner /></div>
      ) : invoices.isError ? (
        <div className="p-5"><LoadError what="invoices" onRetry={() => void invoices.refetch()} /></div>
      ) : invRows.length === 0 ? (
        <div className="p-5"><EmptyState icon={<CreditCard className="size-6" />} title="No invoices yet. Your first invoice appears after your trial ends and your first payment." /></div>
      ) : (
        <>
          <DataTable
            caption="Invoices"
            rows={invRows.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE)}
            rowKey={(i) => i.id}
            columns={[
              { key: 'number', header: 'Invoice', cell: (i) => <b>{i.number}</b> },
              { key: 'date', header: 'Date', cell: (i) => formatDate(i.date) },
              { key: 'desc', header: 'Description', hideOnMobile: true, cell: (i) => i.description },
              { key: 'amount', header: 'Amount', className: money, cell: (i) => i.amount },
              { key: 'status', header: 'Status', cell: (i) => <Badge tone={i.status.toLowerCase() === 'paid' ? 'success' : i.status.toLowerCase() === 'open' ? 'warning' : 'neutral'}>{i.status}</Badge> },
              { key: 'action', header: 'Action', cell: (i) => (i.status.toLowerCase() === 'open' ? <Button size="sm" disabled={preview}>Pay now</Button> : <Button size="sm" variant="secondary" disabled={preview || !i.url} onClick={() => i.url && window.open(i.url, '_blank', 'noopener')}>Download PDF</Button>) },
            ]}
          />
          <Pager page={invPage} pages={Math.ceil(invRows.length / PAGE_SIZE)} onPage={setInvPage} />
        </>
      )}
    </Card>
  )

  const paymentsTab = (
    <Card className="reveal-up overflow-hidden">
      <CardHeader title="Payment history" actions={SampleTag} />
      <div className="flex flex-wrap gap-3 px-[22px] pb-3">
        <Select aria-label="Status" className={filterCls} value={payStatus} onChange={(e) => { setPayStatus(e.target.value); setPayPage(1) }}>
          <option value="all">All statuses</option><option value="succeeded">Succeeded</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
        </Select>
      </div>
      {payments.isPending ? (
        <div className="p-5"><Spinner /></div>
      ) : payments.isError ? (
        <div className="p-5"><LoadError what="payments" onRetry={() => void payments.refetch()} /></div>
      ) : payRows.length === 0 ? (
        <div className="p-5"><EmptyState icon={<CreditCard className="size-6" />} title="No payments yet." /></div>
      ) : (
        <>
          <DataTable
            caption="Payment history"
            rows={payRows.slice((payPage - 1) * PAGE_SIZE, payPage * PAGE_SIZE)}
            rowKey={(p) => p.id}
            columns={[
              { key: 'date', header: 'Date', cell: (p) => formatDate(p.date) },
              { key: 'desc', header: 'Description', hideOnMobile: true, cell: (p) => p.description },
              { key: 'method', header: 'Method', hideOnMobile: true, cell: (p) => p.method },
              { key: 'amount', header: 'Amount', className: money, cell: (p) => p.amount },
              {
                key: 'status',
                header: 'Status',
                cell: (p) => (
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone={p.status.toLowerCase().startsWith('succeeded') ? 'success' : p.status.toLowerCase().startsWith('failed') ? 'danger' : 'neutral'}>{p.status}</Badge>
                    {p.status.toLowerCase().startsWith('failed') && <button type="button" className="link text-xs" onClick={() => navigate('/app/subscription/billing')}>Update card</button>}
                  </span>
                ),
              },
              { key: 'source', header: 'Source', hideOnMobile: true, cell: (p) => p.source },
            ]}
          />
          <Pager page={payPage} pages={Math.ceil(payRows.length / PAGE_SIZE)} onPage={setPayPage} />
        </>
      )}
    </Card>
  )

  const billingTab = (
    <div className="grid gap-[18px] lg:grid-cols-2">
      <Card className="reveal-up">
        <CardHeader title="Business details" actions={SampleTag} />
        <CardBody className="flex flex-col gap-3">
          {info.isPending ? (
            <Spinner />
          ) : info.isError ? (
            <LoadError what="billing information" onRetry={() => void info.refetch()} />
          ) : (
            <>
              <dl className="text-sm">
                {([['Business name', info.data?.name], ['Billing email', info.data?.email], ['Billing address', info.data?.address], ['VAT / Tax ID (optional)', info.data?.taxId]] as const).map(([k, v]) => (
                  <div key={k} className="py-1.5"><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v || dash}</dd></div>
                ))}
              </dl>
              {!mobilePurchase && <GuardedButton permission="subscription.manage" extra={previewLock ?? lockDecision} variant="secondary" onClick={() => toast.error('Editing billing details needs Stripe, which is not connected.')}>Edit details</GuardedButton>}
              <p className="hint">The invoice is sent to the billing email, and the name, address and tax ID print on it.</p>
            </>
          )}
        </CardBody>
      </Card>
      <Card className="reveal-up">
        <CardHeader title="Payment method" actions={SampleTag} />
        <CardBody className="flex flex-col gap-3">
          {mobilePurchase && !preview ? (
            <p className="callout">{sub.source === 'app_store' ? 'Manage in your Apple ID subscriptions.' : 'Manage in Google Play.'}</p>
          ) : info.isPending ? (
            <Spinner />
          ) : info.isError ? (
            <LoadError what="the payment method" onRetry={() => void info.refetch()} />
          ) : info.data?.card ? (
            <>
              <dl className="text-sm">
                <div className="py-1.5"><dt className="text-xs text-muted">Card</dt><dd className="font-medium">{info.data.card.brand} •••• {info.data.card.last4}</dd></div>
                <div className="py-1.5"><dt className="text-xs text-muted">Expires</dt><dd className="font-medium">{info.data.card.expires}</dd></div>
              </dl>
              <GuardedButton permission="subscription.manage" extra={previewLock ?? lockDecision} variant="secondary" onClick={() => toast.error('Updating the card opens Stripe’s secure form, which is not connected.')}>Update card</GuardedButton>
              <p className="hint">Bonuca never stores card numbers and only shows the brand, last four digits and expiry.</p>
            </>
          ) : (
            <p className="text-sm text-muted">No payment method yet. Add a card when you subscribe.</p>
          )}
        </CardBody>
      </Card>
    </div>
  )

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
        {banner}
        <Tabs label="Subscription & Billing sections" value={tab} onChange={(v) => navigate(v === 'plan' ? '/app/subscription' : `/app/subscription/${v}`)} items={TABS.map((v) => ({ value: v, label: TAB_LABEL[v] }))} />
        {tab === 'plan' && planTab}
        {tab === 'invoices' && invoicesTab}
        {tab === 'payments' && paymentsTab}
        {tab === 'billing' && billingTab}
        {!access.can('settings.billing') && tab !== 'plan' && <p className="lock-overlay"><Lock className="size-4 shrink-0" aria-hidden /> Invoices, payment history and billing information are visible to the Owner.</p>}
      </div>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'cancel' ? 'Cancel plan?' : 'Downgrade to the Free plan?'}
        confirmLabel={confirm === 'cancel' ? 'Cancel plan' : 'Downgrade'}
        tone={confirm === 'cancel' ? 'danger' : 'primary'}
        body={confirm === 'cancel' ? `You keep ${planName} until ${formatDate(sub.currentPeriodEnd)}. No data is deleted.` : 'The downgrade takes effect at the end of the paid period. Nothing is deleted. Anything over the Free plan limits becomes read-only.'}
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
