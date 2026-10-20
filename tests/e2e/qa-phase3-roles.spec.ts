import { expect, test } from '@playwright/test'
import { login, shot } from './helpers'

/** QA Phase 3 — Spec §3, §4.6 roles (Owner / Manager / Employee). */
const ALL_TABS = ['Dashboard', 'Loyalty Programs', 'Wallet Cards', 'QR Scanner', 'Customers', 'Employees', 'Notifications', 'Rewards', 'Analytics', 'Branding', 'Subscription & Billing', 'Settings']

test.describe('Phase 3 · roles', () => {
  test('Owner: full access to every tab', async ({ page }) => {
    await login(page, 'owner')
    const nav = page.getByRole('navigation', { name: 'Main' })
    for (const tab of ALL_TABS) await expect(nav.getByRole('link', { name: tab })).toBeVisible()
    for (const path of ['/app/subscription', '/app/settings/billing', '/app/employees']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'No access' })).toHaveCount(0)
    }
    await shot(page, 'p3-01-owner')
  })

  test('Manager: no billing actions, cannot invite managers, no AI tools', async ({ page }) => {
    await login(page, 'manager')
    await page.goto('/app/subscription')
    await expect(page.getByText(/visible to the Owner/)).toBeVisible()
    await page.goto('/app/employees')
    await page.getByRole('button', { name: /Invite Employee/ }).click()
    await expect(page.getByLabel('Role').locator('option')).toHaveText(['Employee'])
    await page.keyboard.press('Escape')
    await page.goto('/app/notifications')
    await page.getByRole('tab', { name: 'AI tools' }).click()
    await expect(page.getByRole('button', { name: /Generate draft/ }).first()).toHaveAttribute('aria-disabled', 'true')
    await page.goto('/app/settings/business')
    await expect(page.getByRole('navigation', { name: 'Settings sections' }).getByRole('link', { name: 'Billing', exact: true })).toHaveCount(0)
    await shot(page, 'p3-02-manager')
  })

  test('Employee: Scanner, Customer Info (limited), Recent Scans, Account & Logout only', async ({ page }) => {
    await login(page, 'employee')
    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav.getByRole('link')).toHaveText(['QR Scanner', 'Customer Info', 'Account'])
    await expect(page.getByText('Recent scans')).toBeVisible()
    for (const path of ['/app/dashboard', '/app/analytics', '/app/settings/business', '/app/subscription', '/app/programs']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'No access' })).toBeVisible()
    }
    await page.goto('/app/customers')
    await expect(page.getByRole('columnheader', { name: 'Email' })).toHaveCount(0)
    await page.goto('/app/account')
    await expect(page.getByText('Leaderboard')).toBeVisible()
    await shot(page, 'p3-03-employee-account')
    await page.getByRole('button', { name: 'Log out' }).last().click()
    await expect(page).toHaveURL(/login/)
  })
})
