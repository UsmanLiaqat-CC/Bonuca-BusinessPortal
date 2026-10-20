import { Check, Coffee, Croissant, Heart, Scissors, Star } from 'lucide-react'
import type { StampIcon, StampIconPreset } from '@/types/domain'

export const STAMP_PRESETS: { value: StampIconPreset; label: string; icon: typeof Coffee }[] = [
  { value: 'coffee', label: 'Coffee cup (default)', icon: Coffee },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'scissors', label: 'Scissors', icon: Scissors },
  { value: 'croissant', label: 'Croissant', icon: Croissant },
  { value: 'check', label: 'Check mark', icon: Check },
]

export function StampGlyph({ icon, className }: { icon: StampIcon; className?: string }) {
  if (icon.kind === 'custom') return <img src={icon.image} alt="" className={className} />
  const Icon = STAMP_PRESETS.find((p) => p.value === icon.preset)?.icon ?? Coffee
  return <Icon className={className} aria-hidden />
}
