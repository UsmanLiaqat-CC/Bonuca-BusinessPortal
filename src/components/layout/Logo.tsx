/** Bonuca wordmark + redesign "B" brand mark (official artwork pending, OI-14). */
export function Logo({ compact = false, sub }: { compact?: boolean; sub?: string }) {
  return (
    <span className="brand p-0">
      <span className="brand-mark" aria-hidden>
        B
      </span>
      {!compact && (
        <span>
          <span className="brand-name block">Bonuca</span>
          {sub && <span className="brand-sub block">{sub}</span>}
        </span>
      )}
    </span>
  )
}
