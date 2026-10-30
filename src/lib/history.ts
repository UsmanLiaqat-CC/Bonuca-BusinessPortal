import type { BusinessDataset, ISODate, Transaction } from '@/types/domain'

/**
 * One row of a customer's activity (customer profile History and Award actions History).
 * Each row shows what changed, the program, who did it, when, the balance after and whether the
 * customer was scanned or found by search. Rows where nothing changed (e.g. "0 stamps") are left out.
 */
export interface HistoryRow {
  id: string
  at: ISODate
  /** "+1", "-1", "+40 pts", "Redeemed", "Gift" … */
  change: string
  tone: 'add' | 'remove' | 'redeem' | 'gift'
  description: string
  programId: string | null
  programName: string | null
  by: string
  entry: 'scan' | 'search' | null
  balanceAfter: string | null
}

function changeOf(t: Transaction): Pick<HistoryRow, 'change' | 'tone' | 'description'> | null {
  switch (t.kind) {
    case 'stamp':
      return t.stampsAdded > 0 ? { change: `+${t.stampsAdded}`, tone: 'add', description: t.stampsAdded > 1 ? 'Stamps added' : 'Stamp added' } : null
    case 'stamp_removed':
      return t.stampsAdded < 0 ? { change: `${t.stampsAdded}`, tone: 'remove', description: t.stampsAdded < -1 ? 'Stamps removed' : 'Stamp removed' } : null
    case 'points':
      return t.pointsAdded > 0 ? { change: `+${t.pointsAdded} pts`, tone: 'add', description: 'Points credited' } : null
    case 'visit':
      return { change: '+1', tone: 'add', description: t.pointsAdded > 0 ? `Visit recorded · +${t.pointsAdded} pts` : 'Visit recorded' }
    case 'reward_redeemed':
      return { change: 'Redeemed', tone: 'redeem', description: 'Reward redeemed' }
    case 'voucher_redeemed':
      return { change: 'Redeemed', tone: 'redeem', description: 'Voucher redeemed' }
    case 'winback_redeemed':
      return { change: 'Redeemed', tone: 'redeem', description: 'Win-back reward redeemed' }
    case 'gift_redeemed':
      return { change: 'Redeemed', tone: 'gift', description: 'Gift redeemed' }
  }
}

function unitOf(ds: BusinessDataset, programId: string | null): string {
  const p = ds.programs.find((x) => x.id === programId)
  if (!p) return ''
  return p.type === 'stamp' ? ' stamps' : p.type === 'points' ? ' pts' : ' visits'
}

/** All activity for one customer across programs, newest first. */
export function customerHistory(ds: BusinessDataset, customerId: string): HistoryRow[] {
  const userName = new Map(ds.users.map((u) => [u.id, u.fullName]))
  const programName = new Map(ds.programs.map((p) => [p.id, p.name]))
  const campaignName = new Map(ds.campaigns.map((c) => [c.id, c.name]))
  const giftName = new Map((ds.gifts ?? []).map((g) => [g.id, g.name]))
  const rows: HistoryRow[] = []

  for (const t of ds.transactions) {
    if (t.customerId !== customerId) continue
    const c = changeOf(t)
    if (!c) continue
    const gift = t.giftId ? giftName.get(t.giftId) : undefined
    rows.push({
      id: t.id,
      at: t.createdAt,
      ...c,
      description: gift ? `${c.description}: ${gift}` : c.description,
      programId: t.programId,
      programName: t.programId ? (programName.get(t.programId) ?? null) : t.campaignId ? (campaignName.get(t.campaignId) ?? null) : null,
      by: userName.get(t.employeeId) ?? 'Unknown user',
      entry: t.entry ?? null,
      balanceAfter: t.balanceAfter === null || t.balanceAfter === undefined ? null : `${t.balanceAfter}${unitOf(ds, t.programId)}`,
    })
  }

  // Every gift assignment (and cancellation) appears in the customer's history.
  for (const g of ds.gifts ?? []) {
    if (g.customerId !== customerId) continue
    rows.push({ id: `${g.id}-given`, at: g.createdAt, change: 'Gift', tone: 'gift', description: `Gift given: ${g.name}`, programId: null, programName: null, by: userName.get(g.createdBy) ?? 'Unknown user', entry: null, balanceAfter: null })
    if (g.status === 'cancelled' && g.cancelledAt) {
      rows.push({ id: `${g.id}-cancelled`, at: g.cancelledAt, change: 'Cancelled', tone: 'remove', description: `Gift cancelled: ${g.name}`, programId: null, programName: null, by: userName.get(g.cancelledBy ?? '') ?? 'Unknown user', entry: null, balanceAfter: null })
    }
  }

  return rows.sort((a, b) => b.at.localeCompare(a.at))
}
