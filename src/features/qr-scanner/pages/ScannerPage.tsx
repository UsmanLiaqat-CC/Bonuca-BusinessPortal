import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, History, QrCode, ScanLine } from 'lucide-react'
import type { ScanAction, ScanContext, ScanResult } from '@/lib/scanEngine'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { env } from '@/lib/env'
import { formatDateTime } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { CameraScanner } from '../components/CameraScanner'
import { ScanPanel } from '../components/ScanPanel'
import { ScanSuccess } from '../components/ScanSuccess'
import { SamplePassPicker } from '../components/SamplePassPicker'
import { useConfirmScan, useLookupPass, useRecentScans } from '../hooks'

const KIND_LABEL = { stamp: 'Stamp added', points: 'Points credited', visit: 'Visit', reward_redeemed: 'Reward redeemed', voucher_redeemed: 'Voucher redeemed', winback_redeemed: 'Win-back redeemed' } as const

/** Spec §4.4 / §3.2 — QR Scanner with add stamp/point/visit, redeem reward, recent scans. */
export default function ScannerPage() {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const lookup = useLookupPass()
  const confirm = useConfirmScan()
  const recent = useRecentScans(10)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [code, setCode] = useState('')
  const [context, setContext] = useState<ScanContext | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [celebrate, setCelebrate] = useState(false)
  const startedAt = useRef<number | null>(null)
  const endCelebration = useCallback(() => setCelebrate(false), [])

  const identify = useCallback(
    async (raw: string) => {
      setCameraOpen(false)
      setResult(null)
      startedAt.current ??= performance.now()
      try {
        const ctx = await lookup.mutateAsync(raw)
        if (!ctx) {
          toast.error('No customer pass matches this code.')
          startedAt.current = null
        }
        setContext(ctx)
      } catch (e) {
        toast.error(errorMessage(e))
      }
    },
    [lookup, toast],
  )

  const reset = () => {
    setContext(null)
    setCode('')
    startedAt.current = null
  }

  const onConfirm = async (action: ScanAction) => {
    if (!context) return
    const passCode = context.target.kind === 'membership' ? context.target.membership.passCode : context.target.reward.passCode!
    const durationMs = startedAt.current === null ? null : Math.round(performance.now() - startedAt.current)
    try {
      const r = await confirm.mutateAsync({ passCode, action, durationMs })
      // Confirmation is shown immediately; the animation runs on top and never delays it.
      setResult(r)
      setCelebrate(true)
      setContext(null)
      setCode('')
      startedAt.current = null
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title={t('nav.scanner')}
        breadcrumb={
          <>
            <ScanLine className="size-[13px]" aria-hidden /> {t('nav.group.operations')}
          </>
        }
        description="Scan a customer's wallet pass, confirm the action, and the pass updates."
        actions={
          access.can('programs.view') && (
            <Link to="/app/scanner/qr-codes" className={buttonClass('secondary')}>
              <QrCode className="size-[15px]" aria-hidden /> Printable QR codes
            </Link>
          )
        }
      />
      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          {result && (
            <Card className="reveal-up border-success/40" role="status" data-testid="scan-result">
              <CardBody className="flex items-start gap-4">
                <span className="success-burst" aria-hidden>
                  <CheckCircle2 className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1.5">
                <p className="font-display text-xl font-bold tracking-tight text-success">Confirmed</p>
                <p className="text-sm">{result.summary}</p>
                {result.issuedRewards.filter((r) => r.source !== 'surprise').map((r) => (
                  <p key={r.id} className="text-sm">Reward now available: <strong>{r.name}</strong></p>
                ))}
                {result.surprise && <p className="text-sm">Surprise reward issued: <strong>{result.surprise.name}</strong></p>}
                <p className="hint">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p>
                </div>
              </CardBody>
            </Card>
          )}
          {context ? (
            <ScanPanel context={context} onConfirm={onConfirm} pending={confirm.isPending} onReset={reset} />
          ) : (
            <Card className="reveal-up">
              <CardBody className="flex flex-col gap-[18px]">
                {cameraOpen ? (
                  <CameraScanner
                    onCode={identify}
                    onClose={() => {
                      setCameraOpen(false)
                      startedAt.current = null
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    aria-label="Scan"
                    className="scan-hero flex-wrap sm:flex-nowrap"
                    onClick={() => {
                      startedAt.current = performance.now()
                      setCameraOpen(true)
                    }}
                  >
                    <span className="frame" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                      <i className="beam" />
                      <QrCode />
                    </span>
                    <span className="min-w-0" aria-hidden>
                      <span className="block font-display text-[28px] font-bold tracking-[-0.03em]">Scan</span>
                      <span className="mt-1.5 block opacity-70">Point the camera at the customer’s wallet pass.</span>
                    </span>
                    <span className="go" aria-hidden>
                      <ArrowRight className="size-[22px]" />
                    </span>
                  </button>
                )}
                <form
                  className="field border-t border-line pt-[18px]"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (code.trim()) void identify(code)
                  }}
                >
                  <label htmlFor="pass-code" className="label">
                    Manual code entry <span className="opt">(camera unavailable / development)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input id="pass-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BNC-XXXXXXXX" className="mono uppercase" />
                    <Button type="submit" variant="secondary" loading={lookup.isPending}>
                      Find
                    </Button>
                  </div>
                </form>
                {env.devTools && <SamplePassPicker onPick={(c) => void identify(c)} />}
              </CardBody>
            </Card>
          )}
          {access.isPreview && <IntegrationNotice title="Preview Mode">You can look up demo passes, but confirming transactions requires a plan.</IntegrationNotice>}
        </div>
        <Card className="scan-feed reveal-up overflow-hidden lg:sticky lg:top-24">
          <CardHeader title="Recent scans" icon={<History className="size-4" />} />
          <QueryState query={recent}>
            {(rows) =>
              rows.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={<ScanLine className="size-6" />} title="No scans yet" />
                </div>
              ) : (
                <ul>
                  {rows.map(({ transaction: tx, customerName, programName }) => (
                    <li key={tx.id} className="list-row items-start justify-start text-sm">
                      <span className="feed-ic bg-accent-soft text-accent" aria-hidden>
                        <ScanLine className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-semibold">{customerName}</span>
                        <span className="shrink-0 text-xs text-faint">{formatDateTime(tx.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {KIND_LABEL[tx.kind]}
                        {tx.pointsAdded ? ` · +${tx.pointsAdded} pts` : ''} · {programName}
                      </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryState>
        </Card>
      </div>
      {celebrate && <ScanSuccess onDone={endCelebration} />}
    </>
  )
}
