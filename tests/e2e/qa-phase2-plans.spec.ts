import { expect, test } from '@playwright/test'
import { lockedShowsPreviewMessage, login, registerToPlan, shot } from './helpers'

/** QA Phase 2 — Spec §2 Access levels & plan logic. */
test.describe('Phase 2 · §2 plan modes', () => {
  test('Preview Mode: every tab readable with demo data; real actions locked with exact message', async ({ page }) => {
    test.setTimeout(90_000) // visits many tabs
    await registerToPlan(page)
    await page.getByRole('button', { name: 'Skip for now' }).click()
    await expect(page.getByText(/Select a free trial, free plan, or paid plan/)).toBeVisible()
    await page.getByRole('button', { name: "I'll do this later" }).click()
    await expect(page.getByTestId('preview-banner')).toBeVisible()
    const checks: [string, RegExp | string][] = [
      ['/app/programs', /Create Program/],
      ['/app/customers', /Add customer/],
      ['/app/employees', /Invite Employee/],
      ['/app/notifications', /New campaign/],
    ]
    for (const [path, button] of checks) {
      await page.goto(path)
      await expect(page.getByText('Demo data').first()).toBeVisible()
      await lockedShowsPreviewMessage(page, button)
    }
    await page.goto('/app/dashboard')
    await expect(page.getByText('Demo data').first()).toBeVisible()
    await expect(page.getByText('Total Members').first()).toBeVisible()
    await shot(page, 'p2-01-preview-dashboard')
    await page.goto('/app/settings/business')
    await lockedShowsPreviewMessage(page, 'Save')
    await page.goto('/app/subscription')
    await page.getByRole('button', { name: 'Choose Free Plan' }).click()
    await expect(page.getByTestId('preview-banner')).toHaveCount(0)
    await shot(page, 'p2-02-left-preview-free')
  })

  test('Free Plan limit: 1 program', async ({ page }) => {
    await registerToPlan(page)
    await page.getByRole('button', { name: 'Choose Free Plan' }).click()
    await expect(page.getByRole('heading', { name: 'Create your first loyalty program' })).toBeVisible()
    await page.getByLabel('Program name').fill('Only One')
    await page.getByLabel('Reward').fill('Coffee')
    await page.getByRole('button', { name: 'Create program' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/)
    await page.goto('/app/programs')
    const btn = page.getByRole('button', { name: /Create Program/ })
    await expect(btn).toHaveAttribute('aria-disabled', 'true')
    await btn.hover()
    await expect(page.getByRole('tooltip').filter({ hasText: /allows up to 1 programs/ })).toBeVisible()
    await shot(page, 'p2-03-free-limit')
  })

  test('Trial banner; trial expiry reverts to Free without deleting data', async ({ page }) => {
    await login(page, 'owner')
    await expect(page.getByTestId('trial-banner')).toContainText('days left')
    await page.getByRole('button', { name: 'Dev tools' }).click()
    await page.getByRole('button', { name: 'Expire free trial now' }).click()
    await expect(page.getByText('Trial expired (simulated).')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.reload()
    await expect(page.getByTestId('trial-expired-banner')).toBeVisible()
    await page.goto('/app/programs')
    await expect(page.getByText('Coffee Card')).toBeVisible()
    await page.goto('/app/subscription')
    await expect(page.getByText('Free Plan').first()).toBeVisible()
    await shot(page, 'p2-04-trial-expired')
  })

  test('Super Admin override: read-only banner with end date, no plan controls', async ({ page }) => {
    await login(page, 'owner')
    await page.getByRole('button', { name: 'Dev tools' }).click()
    await page.getByLabel('Override type').selectOption('billing_paused')
    await page.getByLabel(/End date/).fill('2027-03-01')
    await page.getByRole('button', { name: 'Apply override' }).click()
    await expect(page.getByText('Override applied (simulated).')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.goto('/app/subscription')
    await expect(page.getByTestId('override-banner')).toContainText('managed by Bonuca')
    await expect(page.getByTestId('override-banner')).toContainText('2027')
    await expect(page.getByRole('button', { name: /Stripe checkout|Cancel subscription|Downgrade/ })).toHaveCount(0)
    await shot(page, 'p2-05-override')
    await page.goto('/app/dashboard')
    await expect(page.getByTestId('override-banner')).toBeVisible()
  })
})
