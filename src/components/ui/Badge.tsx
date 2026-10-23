import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'ink' | 'outline'
const TONES: Record<BadgeTone, string> = {
  neutral: '',
  accent: 'blue',
  success: 'green',
  warning: 'amber',
  danger: 'red',
  ink: 'ink',
  outline: 'outline',
}

/** Redesign pill badge. Coloured tones get a status dot; `live` adds the pulsing ring (e.g. Active). */
export function Badge({ tone = 'neutral', live, dot, children, className }: { tone?: BadgeTone; live?: boolean; dot?: boolean; children: ReactNode; className?: string }) {
  const showDot = dot ?? (tone !== 'neutral' && tone !== 'outline' && tone !== 'ink')
  return (
    <span className={cn('badge', TONES[tone], live && 'live', className)}>
      {showDot && <i className="d" aria-hidden />}
      {children}
    </span>
  )
}
