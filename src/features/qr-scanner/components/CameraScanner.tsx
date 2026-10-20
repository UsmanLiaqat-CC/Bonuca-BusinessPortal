import { useEffect, useRef, useState } from 'react'
import { CameraOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DetectedBarcode {
  rawValue: string
}
interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike

function getDetector(): BarcodeDetectorCtor | null {
  return (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null
}

export function cameraScanningSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!getDetector()
}

/** Camera QR scanning via the browser BarcodeDetector API (OI-36). */
export function CameraScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const supported = cameraScanningSupported()
  const onCodeRef = useRef(onCode)
  useEffect(() => {
    onCodeRef.current = onCode
  })
  const [error, setError] = useState<string | null>(supported ? null : 'Camera scanning is not supported in this browser. Use manual code entry below.')

  useEffect(() => {
    const Detector = getDetector()
    if (!Detector || !navigator.mediaDevices?.getUserMedia) return
    let stream: MediaStream | null = null
    let raf = 0
    let stopped = false
    const detector = new Detector({ formats: ['qr_code'] })
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(async (s) => {
        stream = s
        if (!video.current || stopped) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        video.current.srcObject = s
        await video.current.play()
        const tick = async () => {
          if (stopped || !video.current) return
          try {
            const codes = await detector.detect(video.current)
            const value = codes[0]?.rawValue
            if (value) return onCodeRef.current(value)
          } catch {
            /* frame not ready */
          }
          raf = requestAnimationFrame(() => void tick())
        }
        void tick()
      })
      .catch(() => setError('Camera access was denied or no camera is available. Use manual code entry below.'))
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div className="flex items-center gap-3 rounded-lg bg-warning-soft px-4 py-3 text-sm" role="alert">
          <CameraOff className="size-5 shrink-0 text-warning" aria-hidden />
          {error}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video ref={video} className="aspect-video w-full object-cover" muted playsInline aria-label="Camera preview" />
          <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" aria-hidden />
        </div>
      )}
      <Button variant="secondary" onClick={onClose}>
        Close camera
      </Button>
    </div>
  )
}
