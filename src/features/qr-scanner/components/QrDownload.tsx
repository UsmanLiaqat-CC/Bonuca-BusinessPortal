import { useState } from 'react'
import { Download, FileDown } from 'lucide-react'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import { downloadQrPdf, downloadQrPng, PLACEMENTS, type Placement } from '@/lib/qrExport'
import { env } from '@/lib/env'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { Select } from '@/components/ui/Field'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'

/** System-generated QR with PNG/PDF export for print. */
export function QrDownload({ text, filename, title, subtitle, placements }: { text: string; filename: string; title: string; subtitle: string; placements: Placement[] }) {
  const toast = useToast()
  const url = useQrDataUrl(text, 320)
  const [placement, setPlacement] = useState<Placement>(placements[0]!)
  const run = (fn: () => Promise<void>) => fn().catch((e: unknown) => toast.error(errorMessage(e)))
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="w-40 shrink-0 rounded-lg border border-line bg-white p-2">{url && <img src={url} alt={`QR code: ${title}`} className="w-full" />}</div>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-xs break-all text-muted">{text}</p>
        {!env.joinBaseUrl && <p className="text-xs text-warning">Development URL — set VITE_JOIN_BASE_URL to the customer join site before printing.</p>}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Print format</span>
          <Select className="w-40" value={placement} onChange={(e) => setPlacement(e.target.value as Placement)}>
            {placements.map((p) => (
              <option key={p} value={p}>
                {PLACEMENTS[p].label}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-wrap gap-2">
          <GuardedButton permission="qr.manage" size="sm" variant="secondary" onClick={() => run(() => downloadQrPng(text, filename))}>
            <Download className="size-4" aria-hidden /> PNG
          </GuardedButton>
          <GuardedButton permission="qr.manage" size="sm" variant="secondary" onClick={() => run(() => downloadQrPdf(text, filename, placement, title, subtitle))}>
            <FileDown className="size-4" aria-hidden /> PDF
          </GuardedButton>
        </div>
      </div>
    </div>
  )
}
