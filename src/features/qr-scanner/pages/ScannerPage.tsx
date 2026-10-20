import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, QrCode, ScanLine } from 'lucide-react'
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
        description="Scan a customer's wallet pass, confirm the action, and the pass updates."
        actions={access.can('programs.view') && <Link to="/app/scanner/qr-codes" className={buttonClass('secondary')}><QrCode className="size-4" aria-hidden /> Printable QR codes</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {result && (
            <Card className="border-success/40" role="status" data-testid="scan-result">
              <CardBody className="flex flex-col gap-2">
                <p className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="size-5" aria-hidden /> Confirmed
                </p>
                <p className="text-sm">{result.summary}</p>
                {result.issuedRewards.filter((r) => r.source !== 'surprise').map((r) => (
                  <p key={r.id} className="text-sm">Reward now available: <strong>{r.name}</strong></p>
                ))}
                {result.surprise && <p className="text-sm">Surprise reward issued: <strong>{result.surprise.name}</strong></p>}
                <p className="text-xs text-muted">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p>
              </CardBody>
            </Card>
          )}
          {context ? (
            <ScanPanel context={context} onConfirm={onConfirm} pending={confirm.isPending} onReset={reset} />
          ) : (
            <Card>
              <CardBody className="flex flex-col gap-4">
                {cameraOpen ? (
                  <CameraScanner
                    onCode={identify}
                    onClose={() => {
                      setCameraOpen(false)
                      startedAt.current = null
                    }}
                  />
                ) : (
                  <Button
                    size="lg"
                    className="h-16 text-base"
                    onClick={() => {
                      startedAt.current = performance.now()
                      setCameraOpen(true)
                    }}
                  >
                    <ScanLine className="size-5" aria-hidden /> Scan
                  </Button>
                )}
                <form
                  className="flex flex-col gap-2 border-t border-line pt-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (code.trim()) void identify(code)
                  }}
                >
                  <label htmlFor="pass-code" className="text-sm font-medium">
                    Manual code entry <span className="text-xs font-normal text-muted">(camera unavailable / development)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input id="pass-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BNC-XXXXXXXX" className="font-mono uppercase" />
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
        <Card>
          <CardHeader title="Recent scans" />
          <QueryState query={recent}>
            {(rows) =>
              rows.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No scans yet" />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {rows.map(({ transaction: tx, customerName, programName }) => (
                    <li key={tx.id} className="px-5 py-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{customerName}</span>
                        <span className="text-xs text-muted">{formatDateTime(tx.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted">
                        {KIND_LABEL[tx.kind]}
                        {tx.pointsAdded ? ` · +${tx.pointsAdded} pts` : ''} · {programName}
                      </p>
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
