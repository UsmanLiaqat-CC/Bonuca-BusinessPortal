import { expect, test } from '@playwright/test'
import { login, shot } from './helpers'

/** QA Phase 5 — Spec §4.3 Wallet Cards. */
test.describe('Phase 5 · §4.3 wallet cards', () => {
  test.beforeEach(async ({ page }) => login(page, 'owner'))

  test('templates listed; template vs Start from Scratch; master field list; dynamic content; iPhone/Android', async ({ page }) => {
    await page.goto('/app/wallet-cards')
    for (const t of ['Digital Stamp Card', 'Membership Card', 'Tier Program Pass']) await expect(page.getByText(t, { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/integration not connected/)).toBeVisible()
    await page.goto('/app/wallet-cards/prg_coffee')
    await expect(page.getByRole('radio', { name: /Option A — Base Template: Digital Stamp Card/ })).toHaveAttribute('aria-checked', 'true')
    for (const row of ['Program Name', 'Logo', 'Icon', 'Background', 'Hero / Strip Image', 'Text Colour', 'QR Code']) await expect(page.getByRole('cell', { name: row, exact: true })).toBeVisible()
    await expect(page.getByText(/Every confirmed employee scan/)).toBeVisible()
    await expect(page.getByTestId('wallet-pass')).toContainText('stamps to go')
    await page.getByRole('tab', { name: /Android/ }).click()
    await expect(page.getByText(/Google Wallet \(approximate\)/)).toBeVisible()
    await shot(page, 'p5-01-wallet-template')
    // Option B requires an RGB background on a live program
    await page.getByRole('radio', { name: /Option B — Start from Scratch/ }).click()
    await expect(page.getByText(/custom design needs an RGB background/)).toBeVisible()
    await expect(page.getByText('Pending client confirmation')).toBeVisible()
    await page.goto('/app/wallet-cards/prg_lunch')
    await page.getByRole('radio', { name: /Option B — Start from Scratch/ }).click()
    await expect(page.getByRole('radio', { name: /Option B/ })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('wallet-pass')).not.toContainText('stamps to go')
    await expect(page.getByText(/identification-style/)).toBeVisible()
    await shot(page, 'p5-02-wallet-custom')
  })

  test('tier pass shows current tier and colour; points pass shows balance + next reward', async ({ page }) => {
    await page.goto('/app/wallet-cards/prg_club')
    await expect(page.getByTestId('wallet-pass')).toContainText('Current tier')
    await expect(page.getByTestId('wallet-pass')).toContainText('to Silver')
    await page.goto('/app/wallet-cards/prg_points')
    await expect(page.getByTestId('wallet-pass')).toContainText('Balance')
    await expect(page.getByTestId('wallet-pass')).toContainText('Points needed')
  })

  test('editing a master field of an Active program warns before saving (retroactive)', async ({ page }) => {
    await page.goto('/app/programs/prg_coffee/edit')
    await page.getByLabel('Program Name').fill('Coffee Card 2')
    await expect(page.getByTestId('wallet-pass')).toContainText('Coffee Card 2')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Update every issued wallet pass?' })
    await expect(dialog).toContainText('Program Name')
    await expect(dialog).toContainText('Wallet integration not connected')
    await shot(page, 'p5-03-master-warning')
    await dialog.getByRole('button', { name: /Save/ }).click()
    await expect(page.getByRole('heading', { name: 'Coffee Card 2' })).toBeVisible()
  })
})
