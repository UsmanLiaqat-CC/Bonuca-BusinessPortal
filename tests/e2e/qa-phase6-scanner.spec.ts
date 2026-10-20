import { expect, test } from '@playwright/test'
import { login, scanSample, shot } from './helpers'

/** QA Phase 6 — Spec §4.4 QR system & scanner. */
test.describe('Phase 6 · §4.4 scanner', () => {
  test('Stamp: identify → Add stamp → confirmation + animation; recent scans updated', async ({ page }) => {
    await login(page, 'employee')
    await expect(page.getByRole('button', { name: 'Scan', exact: true })).toBeVisible()
    await scanSample(page, 'Coffee Card')
    await expect(page.getByText(/Stamps/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Add stamp' }).click()
    await expect(page.getByTestId('scan-result')).toContainText('Confirmed')
    await expect(page.getByTestId('scan-success')).toBeVisible()
    await expect(page.getByTestId('scan-result')).toContainText('Wallet pass update: not sent')
    await expect(page.getByText(/Stamp added/).first()).toBeVisible()
    await shot(page, 'p6-01-stamp-confirmed')
  })

  test('Points manual: amount entry, full preview, credit; currency fixed by program', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/scanner')
    await scanSample(page, 'Coffee Rewards')
    await page.getByLabel('Purchase amount (EUR)').fill('1')
    await expect(page.getByText(/Below the minimum purchase amount/)).toBeVisible()
    await page.getByLabel('Purchase amount (EUR)').fill('100')
    await expect(page.getByText(/Capped at the maximum/)).toBeVisible()
    await page.getByLabel('Purchase amount (EUR)').fill('7.5')
    const preview = page.getByLabel('Points preview')
    for (const l of ['Customer', 'Current balance', 'Amount entered', 'Points to be added', 'New balance', 'Next reward', 'Points still needed']) await expect(preview).toContainText(l)
    await shot(page, 'p6-02-points-preview')
    await page.getByRole('button', { name: 'Credit 75 points' }).click()
    await expect(page.getByTestId('scan-result')).toContainText('75 points credited')
  })

  test('Membership: shows benefit + discount, records visit', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/scanner')
    await scanSample(page, 'VIP Member')
    await expect(page.getByText('10% off every visit').first()).toBeVisible()
    await expect(page.getByText('Discount to apply')).toBeVisible()
    await page.getByRole('button', { name: 'Record visit' }).click()
    await expect(page.getByTestId('scan-result')).toContainText('Visit recorded')
  })

  test('Tier: shows current tier and progress, records visit', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/scanner')
    await scanSample(page, 'Rewards Club')
    await expect(page.getByText('Current tier')).toBeVisible()
    await page.getByRole('button', { name: 'Record visit' }).click()
    await expect(page.getByTestId('scan-result')).toContainText('Visit recorded')
  })

  test('Paused program scans as temporarily unavailable', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/programs/prg_vip')
    await page.getByRole('switch', { name: 'Enabled' }).click()
    await expect(page.getByText('Paused').first()).toBeVisible()
    await page.goto('/app/scanner')
    await scanSample(page, 'VIP Member')
    await expect(page.getByRole('alert').filter({ hasText: 'temporarily unavailable' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Record visit' })).toHaveCount(0)
    await shot(page, 'p6-03-paused')
  })

  test('Voucher redeemed once, then locked as Redeemed', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/scanner')
    const select = page.getByLabel('Sample customer')
    await expect.poll(() => select.locator('option').count()).toBeGreaterThan(1)
    const n = await select.locator('option').count()
    for (let i = 1; i < n; i++) {
      await select.selectOption({ index: i })
      const v = page.getByRole('button', { name: /^Voucher 1 Free Coffee: BNC-/ })
      if (await v.first().waitFor({ state: 'visible', timeout: 1500 }).then(() => true).catch(() => false)) {
        const code = (await v.first().textContent())!.split(': ')[1]!.trim()
        await v.first().click()
        if (await page.getByRole('button', { name: 'Redeem voucher' }).waitFor({ state: 'visible', timeout: 1500 }).then(() => true).catch(() => false)) {
          await page.getByRole('button', { name: 'Redeem voucher' }).click()
          await expect(page.getByTestId('scan-result')).toContainText('Voucher redeemed')
          await page.getByLabel(/Manual code entry/).fill(code)
          await page.getByRole('button', { name: 'Find' }).click()
          await expect(page.getByRole('alert').filter({ hasText: 'already been used' })).toBeVisible()
          await shot(page, 'p6-04-voucher-redeemed')
          return
        }
        await page.getByRole('button', { name: 'New scan' }).click()
      }
    }
    throw new Error('no redeemable voucher found')
  })

  test('Win-back reactivation: shows name, days inactive, reward, status → Redeem Reward', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/rewards')
    await page.getByRole('tab', { name: /Available/ }).click()
    const row = page.getByRole('row').filter({ hasText: 'Win-back' }).first()
    await expect(row).toBeVisible()
    await row.click()
    const pass = (await page.getByText(/^Pass BNC-/).first().textContent())!.replace('Pass ', '').trim()
    await page.goto('/app/scanner')
    await page.getByLabel(/Manual code entry/).fill(pass)
    await page.getByRole('button', { name: 'Find' }).click()
    const panel = page.getByTestId('winback-panel')
    for (const l of ['Customer', 'Days inactive', 'Win-back reward', 'Not redeemed']) await expect(panel).toContainText(l)
    await shot(page, 'p6-05-winback')
    await panel.getByRole('button', { name: 'Redeem Reward' }).click()
    await expect(page.getByTestId('scan-result')).toContainText('Visit recorded')
  })

  test('Printable QR codes: register + per program, 5 placements, downloads', async ({ page }) => {
    await login(page, 'owner')
    await page.goto('/app/scanner/qr-codes')
    await expect(page.getByText('Customer registration')).toBeVisible()
    await expect(page.getByText('Add wallet card').first()).toBeVisible()
    await expect(page.getByText('Join membership').first()).toBeVisible()
    await expect(page.getByLabel('Print format').first().locator('option')).toHaveText(['Table', 'Counter', 'Sticker', 'Flyer', 'Window'])
    await page.getByLabel('Print format').first().selectOption('window')
    const dl = page.waitForEvent('download')
    await page.getByRole('button', { name: 'PDF' }).first().click()
    expect((await dl).suggestedFilename()).toContain('window')
    await shot(page, 'p6-06-qr-codes')
  })
})
