import { Beef, Beer, Cake, Check, Coffee, Croissant, Crown, Dumbbell, Flower2, Gift, Heart, IceCream, PawPrint, Pizza, Scissors, Sparkles, Star, Wine } from 'lucide-react'
import type { StampIcon, StampIconPreset } from '@/types/domain'

export const STAMP_PRESETS: { value: StampIconPreset; label: string; icon: typeof Coffee }[] = [
  { value: 'coffee', label: 'Coffee cup (default)', icon: Coffee },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'scissors', label: 'Scissors', icon: Scissors },
  { value: 'croissant', label: 'Croissant', icon: Croissant },
  { value: 'check', label: 'Check mark', icon: Check },
  { value: 'flower', label: 'Flower', icon: Flower2 },
  { value: 'burger', label: 'Burger', icon: Beef },
  { value: 'crown', label: 'Crown', icon: Crown },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'cake', label: 'Cake', icon: Cake },
  { value: 'icecream', label: 'Ice cream', icon: IceCream },
  { value: 'wine', label: 'Wine', icon: Wine },
  { value: 'beer', label: 'Beer', icon: Beer },
  { value: 'dumbbell', label: 'Fitness', icon: Dumbbell },
  { value: 'paw', label: 'Paw', icon: PawPrint },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
]

export function StampGlyph({ icon, className }: { icon: StampIcon; className?: string }) {
  if (icon.kind === 'custom') return <img src={icon.image} alt="" className={className} />
  const Icon = STAMP_PRESETS.find((p) => p.value === icon.preset)?.icon ?? Coffee
  return <Icon className={className} aria-hidden />
}
