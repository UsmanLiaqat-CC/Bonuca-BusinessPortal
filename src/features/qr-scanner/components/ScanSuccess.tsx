import { useEffect, type CSSProperties } from 'react'
import { Check } from 'lucide-react'

function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
    osc.onended = () => void ctx.close()
  } catch {
    /* audio unavailable — cosmetic only */
  }
}

const PIECES = Array.from({ length: 14 }, (_, i) => ({
  dx: `${Math.round(Math.cos((i / 14) * Math.PI * 2) * 90)}px`,
  dy: `${Math.round(Math.sin((i / 14) * Math.PI * 2) * 90)}px`,
  color: ['#1747F8', '#12805C', '#F1B24A', '#FF6B6B'][i % 4],
}))

/**
 * Scan success micro-interaction (spec §4.4): card flip, green check, subtle confetti, short sound,
 * ≈0.8 s. Purely cosmetic — rendered *after* the transaction is already confirmed and never blocks it.
 */
export function ScanSuccess({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    playChime()
    const id = setTimeout(onDone, 800)
    return () => clearTimeout(id)
    // Run once per mount: the animation and chime must not replay on parent re-renders.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden data-testid="scan-success">
      <div className="relative">
        <div className="bn-flip flex h-28 w-44 items-center justify-center rounded-2xl shadow-card" style={{ background: 'linear-gradient(160deg, #0A112F 0%, #000000 100%)' }}>
          <span className="bn-check flex size-14 items-center justify-center rounded-full bg-[#12805C] text-white">
            <Check className="size-8" strokeWidth={3} />
          </span>
        </div>
        {PIECES.map((p, i) => (
          <span key={i} className="bn-confetti-piece absolute top-1/2 left-1/2 size-2 rounded-sm" style={{ background: p.color, '--dx': p.dx, '--dy': p.dy } as CSSProperties} />
        ))}
      </div>
    </div>
  )
}
