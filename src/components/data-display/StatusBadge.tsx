import type { LifecycleStatus, RewardStatus } from '@/types/domain'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { useT } from '@/i18n'

const LIFECYCLE_TONE: Record<LifecycleStatus, BadgeTone> = { draft: 'neutral', active: 'success', paused: 'warning', archived: 'neutral' }

export function LifecycleBadge({ status }: { status: LifecycleStatus }) {
  const t = useT()
  return <Badge tone={LIFECYCLE_TONE[status]}>{t(`status.${status}`)}</Badge>
}

const REWARD_TONE: Record<RewardStatus, BadgeTone> = { available: 'success', redeemed: 'neutral', pending: 'warning', expired: 'danger' }
const REWARD_LABEL: Record<RewardStatus, string> = { available: 'Available', redeemed: 'Redeemed', pending: 'Pending', expired: 'Expired' }

export function RewardBadge({ status }: { status: RewardStatus }) {
  return <Badge tone={REWARD_TONE[status]}>{REWARD_LABEL[status]}</Badge>
}
