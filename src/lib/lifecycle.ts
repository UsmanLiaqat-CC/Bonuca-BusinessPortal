import type { LifecycleStatus } from '@/types/domain'

/** Program/campaign lifecycle (spec §4.2). */
export type LifecycleAction = 'publish' | 'enable' | 'disable' | 'archive' | 'end'

const TRANSITIONS: Record<LifecycleAction, Partial<Record<LifecycleStatus, LifecycleStatus>>> = {
  // Draft → Active happens the first time the business taps "Publish" (join QR generated then).
  publish: { draft: 'active' },
  // Enable/Disable toggle: Active ⇄ Paused (Suspend).
  disable: { active: 'paused' },
  enable: { paused: 'active' },
  // Separate "Archive" action for permanent retirement.
  archive: { draft: 'archived', active: 'archived', paused: 'archived' },
  // Campaigns only: End (manual or at the end date). An ended campaign's QR shows "This campaign has ended."
  end: { active: 'ended', paused: 'ended' },
}

export function nextStatus(current: LifecycleStatus, action: LifecycleAction): LifecycleStatus | null {
  return TRANSITIONS[action][current] ?? null
}

export function availableActions(current: LifecycleStatus): LifecycleAction[] {
  return (Object.keys(TRANSITIONS) as LifecycleAction[]).filter((a) => a !== 'end' && nextStatus(current, a) !== null)
}

export function isLive(status: LifecycleStatus): boolean {
  return status === 'active'
}
