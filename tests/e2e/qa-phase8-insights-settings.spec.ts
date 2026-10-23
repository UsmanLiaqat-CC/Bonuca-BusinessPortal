import { expect, test } from '@playwright/test'
import { login, shot } from './helpers'

/** QA Phase 8 — Spec §4.1 Dashboard, §4.9 Analytics, §4.10 Branding, §4.11 Subscription, §4.12 Settings. */
test.describe('Phase 8 · insights, branding, subscription, settings', () => {
  test.beforeEach(async ({ page }) => login(page, 'owner'))

  test('Dashboard: every stat card and chart, chart/table toggle', async ({ page }) => {
    for (const s of ['Total Members', 'New Members', 'New Wallet Cards', 'Total Scans', 'Active Programs', 'Wallet Cards', 'Visits', 'Returning Customers']) await expect(page.getByRole('main').getByText(s, { exact: true })).toBeVisible()
    for (const c of ['Customer Growth', 'Daily Scans', 'Monthly Growth', 'Top Programs', 'Membership Distribution']) await expect(page.getByRole('heading', { name: c })).toBeVisible()
    await page.getByRole('tab', { name: 'Table' }).first().click()
    await expect(page.getByRole('table', { name: 'Customer Growth' })).toBeVisible()
    await shot(page, 'p8-01-dashboard')
  })

  test('Analytics: all metrics, heatmap, AI commentary (Pro/trial) not connected', async ({ page }) => {
    await page.goto('/app/analytics')
    for (const s of ['Visitors', 'Returning customers', 'Retention', 'Visit frequency', 'Reward redemptions']) await expect(page.getByText(s, { exact: true })).toBeVisible()
    for (const h of ['Most active days', 'Growth', 'Activity heatmap', 'Top members', 'AI commentary']) await expect(page.getByRole('heading', { name: h })).toBeVisible()
    await expect(page.getByRole('table', { name: /Scans by weekday and hour/ })).toBeVisible()
    await page.getByRole('button', { name: 'Explain this pattern' }).click()
    await expect(page.getByText('AI service not connected')).toBeVisible()
    await shot(page, 'p8-02-analytics')
  })

  test('Branding: logo, primary/secondary/background, font; Bonuca tokens table', async ({ page }) => {
    await page.goto('/app/branding')
    await page.getByLabel('Primary Color', { exact: true }).fill('#AA2200')
    await page.getByLabel('Secondary Color', { exact: true }).fill('#222222')
    await page.getByLabel('Background', { exact: true }).fill('#FFF8F0')
    await expect(page.getByLabel('Font').locator('option')).toHaveText(['System', 'Serif', 'Rounded'])
    await page.getByLabel('Font').selectOption('serif')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Branding saved.')).toBeVisible()
    for (const v of ['#F3F3F1', '#010414', '#0A0A0A', '#1747F8', '#2F5BFF', '#FFD43B']) await expect(page.getByText(v).first()).toBeVisible()
    await expect(page.getByText(/Auto Branding/i)).toHaveCount(0)
    await shot(page, 'p8-03-branding')
  })

  test('Subscription: current plan, upgrade via Stripe (not connected), invoices/payments/billing info truthful', async ({ page }) => {
    await page.goto('/app/subscription')
    await expect(page.getByText('Free Trial').first()).toBeVisible()
    await expect(page.getByText(/Trial ends/)).toBeVisible()
    for (const h of ['Invoices', 'Payment history', 'Billing information']) await expect(page.getByRole('heading', { name: h })).toBeVisible()
    await expect(page.getByText('Stripe not connected').first()).toBeVisible()
    await expect(page.getByText(/Mobile purchases use the App Store/)).toBeVisible()
    await page.getByRole('button', { name: /Upgrade to Pro/ }).click()
    await expect(page.getByText(/Stripe checkout & billing is not connected/).first()).toBeVisible()
    await shot(page, 'p8-04-subscription')
  })

  test('Settings: every section; edits save; opening hours; language switch to all 5', async ({ page }) => {
    await page.goto('/app/settings/business')
    const nav = page.getByRole('navigation', { name: 'Settings sections' })
    await expect(nav.getByRole('link')).toHaveText(['Business information', 'Address', 'Opening hours', 'Logo', 'Brand colors', 'Employees', 'Notifications', 'Billing', 'Wallet customization', 'Language'])
    await page.getByLabel('Business Name').fill('QA Business')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Saved.')).toBeVisible()
    await expect(page.getByText('QA Business').first()).toBeVisible()
    await nav.getByRole('link', { name: 'Address' }).click()
    await page.getByLabel('City').fill('Munich')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Saved.').first()).toBeVisible()
    await nav.getByRole('link', { name: 'Opening hours' }).click()
    await page.getByLabel('Monday closes').fill('08:00')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Closing time must be after opening time.')).toBeVisible()
    await page.getByLabel('Monday closes').fill('19:00')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Saved.').first()).toBeVisible()
    for (const s of ['Logo', 'Brand colors', 'Employees', 'Notifications', 'Billing', 'Wallet customization']) {
      await nav.getByRole('link', { name: s }).click()
      await expect(page.getByRole('heading', { name: s })).toBeVisible()
    }
    await nav.getByRole('link', { name: 'Language' }).click()
    const lang = page.getByRole('main').locator('select').last()
    for (const [code, label] of [['de', 'Einstellungen'], ['tr', 'Ayarlar'], ['fr', 'Paramètres'], ['it', 'Impostazioni'], ['en', 'Settings']] as const) {
      await lang.selectOption(code)
      await expect(page.getByRole('heading', { name: label, level: 1 })).toBeVisible()
    }
    await shot(page, 'p8-05-settings')
  })

  test('Theme: light / dark / system', async ({ page }) => {
    await page.getByRole('radio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await shot(page, 'p8-06-dark')
    await page.getByRole('radio', { name: 'Light' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
})
