/** Bonuca wordmark + placeholder monogram (official artwork pending, OI-14). */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="size-7 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#080808" />
        <path
          d="M22 16h12.5c7 0 11 3.4 11 8.6 0 3.4-1.9 5.8-4.8 6.9 3.8 1 6.3 3.8 6.3 7.8 0 5.9-4.6 9.7-12 9.7H22V16zm8 6.4v6.8h3.6c2.6 0 4-1.2 4-3.4s-1.4-3.4-4-3.4H30zm0 12.6v7.6h4.4c2.9 0 4.6-1.4 4.6-3.8s-1.7-3.8-4.6-3.8H30z"
          fill="#1747F8"
        />
      </svg>
      {!compact && <span className="text-lg font-semibold tracking-tight">Bonuca</span>}
    </span>
  )
}
