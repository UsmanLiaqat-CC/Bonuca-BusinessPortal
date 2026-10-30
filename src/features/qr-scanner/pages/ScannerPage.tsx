import { useCallback, useState } from 'react'
import { CheckCircle2, ChevronRight, History, ScanLine, Search } from 'lucide-react'
import type { ScanAction, ScanContext, ScanResult } from '@/lib/scanEngine'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { env } from '@/lib/env'
import { formatDateTime } from '@/lib/dates'
import { searchCustomers } from '@/lib/customerSearch'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Tabs'
import { Initials } from '@/components/data-display/Table'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { useCustomers } from '@/features/customers/hooks'
import { CameraScanner } from '../components/CameraScanner'
import { ScanPanel } from '../components/ScanPanel'
import { AwardCustomer } from '../components/AwardCustomer'
import { SamplePassPicker } from '../components/SamplePassPicker'
import { useConfirmScan, useLookupPass, useRecentScans } from '../hooks'

const KIND_LABEL = { stamp: 'Stamp added', stamp_removed: 'Stamp removed', points: 'Points credited', visit: 'Visit', reward_redeemed: 'Reward redeemed', voucher_redeemed: 'Voucher redeemed', winback_redeemed: 'Win-back redeemed', gift_redeemed: 'Gift redeemed' } as const

type Mode = 'scan' | 'search'
type Found = { customerId: string; entry: Mode; scannedPass: string | null } | { voucher: ScanContext }

/** Search finds a customer by name, email, phone or customer number. */
function CustomerSearch({ onPick }: { onPick: (customerId: string) => void }) {
  const customers = useCustomers()
  const [q, setQ] = useState('')
  const results = q.trim() ? searchCustomers(customers.data ?? [], q).slice(0, 12) : []
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label htmlFor="award-search" className="sr-only">Search customers</label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-faint" aria-hidden />
        <Input id="award-search" className="h-12 pl-11 text-base" placeholder="Name, email, phone or customer number" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {q.trim() && (
        <QueryState query={customers}>
          {() =>
            results.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">No customer matches “{q}”.</p>
            ) : (
              <ul className="flex flex-col" aria-label="Search results">
                {results.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onPick(c.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-canvas">
                      <Initials name={c.name || c.customerNumber} className="size-9 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{c.name || '—'}</span>
                        <span className="block truncate text-xs text-muted">{[c.customerNumber, c.phone, c.email].filter(Boolean).join(' · ')}</span>
                      </span>
                      <ChevronRight className="size-4 text-faint" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </QueryState>
      )}
    </div>
  )
}

/**
 * Award actions (QR Scanner, spec §4.4 as simplified by the client): one screen with two tabs, Scan
 * (default — the camera starts on its own) and Search. A scan or a search result opens the same
 * customer screen.
 */
export default function ScannerPage() {
  const toast = useToast()
  const access = useAccess()
  const lookup = useLookupPass()
  const confirm = useConfirmScan()
  const recent = useRecentScans(10)
  const [mode, setMode] = useState<Mode>('scan')
  const [found, setFound] = useState<Found | null>(null)
  const [voucherResult, setVoucherResult] = useState<ScanResult | null>(null)

  const identify = useCallback(
    async (raw: string) => {
      try {
        const ctx = await lookup.mutateAsync(raw)
        if (!ctx) {
          toast.error('No customer pass matches this code.')
          return
        }
        setVoucherResult(null)
        if (ctx.target.kind === 'voucher') setFound({ voucher: ctx })
        else setFound({ customerId: ctx.target.customer.id, entry: 'scan', scannedPass: ctx.target.membership.passCode })
      } catch (e) {
        toast.error(errorMessage(e))
      }
    },
    [lookup, toast],
  )

  const redeemVoucher = async (ctx: ScanContext, action: ScanAction) => {
    if (ctx.target.kind !== 'voucher') return
    try {
      setVoucherResult(await confirm.mutateAsync({ passCode: ctx.target.reward.passCode!, action, durationMs: null, entry: 'scan' }))
      setFound(null)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title="Award actions"
        breadcrumb={
          <>
            <ScanLine className="size-[13px]" aria-hidden /> QR Scanner
          </>
        }
        description="Scan a customer’s card or search for them, then award or redeem."
      />
      <div className={found ? 'grid items-start gap-[18px]' : 'grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_340px]'}>
        <div className="flex min-w-0 flex-col gap-[18px]">
          {voucherResult && (
            <Card className="reveal-up border-success/40" role="status" data-testid="scan-result">
              <CardBody className="flex items-start gap-4">
                <span className="success-burst" aria-hidden>
                  <CheckCircle2 className="size-6" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-success">Confirmed</p>
                  <p className="text-sm">{voucherResult.summary}</p>
                </div>
              </CardBody>
            </Card>
          )}
          {found && 'customerId' in found ? (
            <AwardCustomer key={found.customerId} customerId={found.customerId} entry={found.entry} scannedPass={found.scannedPass} onReset={() => setFound(null)} />
          ) : found ? (
            <ScanPanel context={found.voucher} onConfirm={(a) => void redeemVoucher(found.voucher, a)} pending={confirm.isPending} onReset={() => setFound(null)} />
          ) : (
            <Card className="reveal-up">
              <CardBody className="flex flex-col gap-[18px]">
                <Tabs
                  label="Find the customer"
                  value={mode}
                  onChange={setMode}
                  items={[
                    { value: 'scan', label: 'Scan' },
                    { value: 'search', label: 'Search' },
                  ]}
                />
                {mode === 'scan' ? (
                  <>
                    <CameraScanner onCode={(c) => void identify(c)} />
                    {env.devTools && <SamplePassPicker onPick={(c) => void identify(c)} />}
                  </>
                ) : (
                  <CustomerSearch onPick={(customerId) => setFound({ customerId, entry: 'search', scannedPass: null })} />
                )}
              </CardBody>
            </Card>
          )}
          {access.isPreview && <IntegrationNotice title="Preview Mode">You can look up demo customers, but awarding and redeeming require a plan.</IntegrationNotice>}
        </div>
        {/* Recent activity is hidden while a customer is open, so the customer screen uses the full width. */}
        {!found && <Card className="scan-feed reveal-up overflow-hidden lg:sticky lg:top-24">
          <CardHeader title="Recent activity" icon={<History className="size-4" />} />
          <QueryState query={recent}>
            {(rows) =>
              rows.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={<ScanLine className="size-6" />} title="No activity yet" />
                </div>
              ) : (
                <ul>
                  {rows.map(({ transaction: tx, customerName, programName }) => (
                    <li key={tx.id}>
                      <button type="button" className="list-row w-full items-start justify-start text-left text-sm hover:bg-canvas" onClick={() => setFound({ customerId: tx.customerId, entry: 'search', scannedPass: null })}>
                        <span className="feed-ic bg-accent-soft text-accent" aria-hidden>
                          <ScanLine className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex justify-between gap-2">
                            <span className="font-semibold">{customerName}</span>
                            <span className="shrink-0 text-xs text-faint">{formatDateTime(tx.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {KIND_LABEL[tx.kind]}
                            {tx.pointsAdded ? ` · +${tx.pointsAdded} pts` : ''} · {programName}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryState>
        </Card>}
      </div>
    </>
  )
}
