import { describe, expect, it } from 'vitest'
import { analyticsStats, dashboardStats, previousRange } from '@/lib/metrics'
import { buildLeaderboard } from '@/lib/gamification'
import { buildPassContent } from '@/lib/walletContent'
import { translate, LANGUAGES } from '@/i18n'
import { en } from '@/i18n/locales/en'
import { NOW, sampleDataset } from '../fixtures'

describe('dashboard & analytics metrics (spec §4.1, §4.9)', () => {
  const ds = sampleDataset()
  it('computes every dashboard stat consistently', () => {
    const s = dashboardStats(ds, NOW)
    expect(s.totalMembers).toBe(ds.customers.length)
    expect(s.totalScans).toBe(ds.transactions.length)
    expect(s.activePrograms).toBe(ds.programs.filter((p) => p.status === 'active').length)
    expect(s.newToday).toBeLessThanOrEqual(s.newThisWeek)
    expect(s.newThisWeek).toBeLessThanOrEqual(s.newThisMonth + s.newThisWeek)
    expect(s.customerGrowth).toHaveLength(30)
    expect(s.monthlyGrowth).toHaveLength(12)
    expect(s.returningCustomers).toBeLessThanOrEqual(s.totalMembers)
  })
  it('filters the KPIs by range and compares with the equally long previous range', () => {
    const wide = dashboardStats(ds, NOW, { from: '2000-01-01', to: '2100-01-01' })
    expect(wide.period.scans).toBe(ds.transactions.length)
    expect(wide.period.newMembers).toBe(ds.customers.length)
    expect(wide.previous.scans).toBe(0)
    const empty = dashboardStats(ds, NOW, { from: '2000-01-01', to: '2000-01-02' })
    expect(empty.period).toEqual({ newMembers: 0, scans: 0, visits: 0, returningCustomers: 0, newWalletCards: 0 })
    expect(empty.topPrograms).toEqual([])
    expect(previousRange({ from: '2026-10-08', to: '2026-10-14' })).toEqual({ from: '2026-10-01', to: '2026-10-07' })
  })
  it('heatmap is 7×24 and sums to the scans in the window', () => {
    const a = analyticsStats(ds, NOW)
    expect(a.heatmap).toHaveLength(7)
    expect(a.heatmap.every((r) => r.length === 24)).toBe(true)
    expect(a.mostActiveDays.reduce((s, d) => s + d.scans, 0)).toBe(a.heatmap.flat().reduce((x, y) => x + y, 0))
    expect(a.visitors).toBeGreaterThan(0)
  })
})

describe('gamification (spec §4.6)', () => {
  it('awards badges to the top scanners', () => {
    const ds = sampleDataset()
    const board = buildLeaderboard(ds.users, ds.transactions, NOW)
    expect(board.flatMap((e) => e.badges)).toEqual(expect.arrayContaining(['scan_king', 'customer_hero']))
    expect(board[0]!.scans).toBeGreaterThanOrEqual(board[1]!.scans)
  })
})

describe('wallet pass content (spec §4.3)', () => {
  const ds = sampleDataset()
  it('stamp pass shows the grid and "X stamps to go"', () => {
    const p = ds.programs.find((x) => x.id === 'prg_coffee')!
    const c = buildPassContent(p, { ...ds.memberships[0]!, stamps: 3 })
    expect(c.stampGrid).toMatchObject({ total: 10, filled: 3 })
    expect(c.secondary[0]!.value).toBe('7 stamps to go')
  })
  it('tier pass background switches to the tier colour', () => {
    const p = ds.programs.find((x) => x.id === 'prg_club')!
    const c = buildPassContent(p, { ...ds.memberships[0]!, tierIndex: 2, visits: 30 })
    expect(c.background).toBe('#B8902E')
    expect(c.primary?.value).toBe('Gold')
  })
  it('custom (Start from Scratch) design has no structural elements', () => {
    const p = { ...ds.programs.find((x) => x.id === 'prg_coffee')!, designMode: 'custom' as const }
    const c = buildPassContent(p)
    expect(c).toMatchObject({ structural: false, stampGrid: null, primary: null })
  })
  it('default template background is the Bonuca gradient', () => {
    const p = ds.programs.find((x) => x.id === 'prg_coffee')!
    expect(buildPassContent(p).background).toContain('#0A112F')
  })
})

describe('i18n (spec §4.12)', () => {
  it('supports EN, DE, TR, FR, IT, RU, KK', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['en', 'de', 'tr', 'fr', 'it', 'ru', 'kk'])
  })
  it('translates and interpolates; falls back to English', () => {
    expect(translate('de', 'nav.settings')).toBe('Einstellungen')
    expect(translate('fr', 'onb.step', { current: 1, total: 3 })).toBe('Étape 1 sur 3')
    expect(translate('ru', 'nav.settings')).toBe('Настройки')
    expect(translate('kk', 'onb.step', { current: 1, total: 3 })).toBe('3 қадамның 1-қадамы')
    expect(translate('en', 'preview.locked')).toBe('Select a free trial, free plan, or paid plan to use this feature.')
  })
  it('every provisional locale covers every English key', async () => {
    const keys = Object.keys(en)
    for (const code of ['de', 'tr', 'fr', 'it', 'ru', 'kk'] as const) {
      const mod = (await import(`@/i18n/locales/${code}.ts`)) as Record<string, Record<string, string>>
      const dict = mod[code]!
      expect(keys.filter((k) => !(k in dict))).toEqual([])
    }
  })
})

describe('sample data consistency', () => {
  it('every published sample program and campaign passes the publish validation', async () => {
    const { programSchema } = await import('@/schemas/program')
    const { campaignSchema } = await import('@/schemas/campaign')
    const ds = sampleDataset()
    for (const p of ds.programs.filter((x) => x.status !== 'draft')) expect(programSchema.safeParse(p).success, p.name).toBe(true)
    for (const c of ds.campaigns.filter((x) => x.status !== 'draft')) expect(campaignSchema.safeParse(c).success, c.name).toBe(true)
  })
})
