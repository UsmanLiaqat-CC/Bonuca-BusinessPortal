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

/**
 * Camera QR scanning via the browser BarcodeDetector API (OI-36). The camera starts as soon as this
 * is shown (no "Start scanner" button); a button appears only when camera permission was denied.
 */
export function CameraScanner({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const supported = cameraScanningSupported()
  const onCodeRef = useRef(onCode)
  useEffect(() => {
    onCodeRef.current = onCode
  })
  const [attempt, setAttempt] = useState(0)
  const [denied, setDenied] = useState(false)

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
        setDenied(false)
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
      .catch(() => setDenied(true))
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [attempt])

  if (!supported) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm" role="status">
        <CameraOff className="size-5 shrink-0 text-warning" aria-hidden />
        Camera scanning is not supported in this browser. Use the Search tab to find the customer.
      </div>
    )
  }
  if (denied) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-soft px-4 py-3 text-sm" role="alert">
        <CameraOff className="size-5 shrink-0 text-warning" aria-hidden />
        <span className="flex-1">Camera access was denied or no camera is available.</span>
        <Button size="sm" onClick={() => setAttempt((a) => a + 1)}>Allow camera</Button>
      </div>
    )
  }
  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video ref={video} className="aspect-video w-full object-cover" muted playsInline aria-label="Camera preview" />
      <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" aria-hidden />
    </div>
  )
}
