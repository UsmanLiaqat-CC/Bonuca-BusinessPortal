import { expect, test, type Page } from '@playwright/test'

const PREVIEW_MESSAGE = 'Select a free trial, free plan, or paid plan to use this feature.'

async function register(page: Page, email: string) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Start Free' }).click()
  await page.getByLabel('Full Name').fill('E2E Owner')
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel(/^Password/).fill('secret123')
  await page.getByLabel('Country').selectOption('GB')
  await page.getByLabel(/Terms & Privacy/).check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible()
  const code = (await page.getByTestId('dev-code').textContent())!.trim()
  await page.getByLabel('Verification code').fill(code)
  await page.getByRole('button', { name: 'Verify email' }).click()
  await expect(page.getByRole('heading', { name: 'Set up your business' })).toBeVisible()
  await page.getByLabel('Business Name').fill('E2E Café')
  await page.getByLabel('Business Category').selectOption('cafe')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible()
}

test('landing → registration → verification → Free plan → skip first program → Dashboard', async ({ page }) => {
  await register(page, `free-${Date.now()}@e2e.dev`)
  await page.getByRole('button', { name: 'Choose Free Plan' }).click()
  await expect(page.getByRole('heading', { name: 'Create your first loyalty program' })).toBeVisible()
  await page.getByRole('button', { name: "I'll do this later" }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await expect(page.getByText('Total Members')).toBeVisible()
})

test('Skip for now enters Preview Mode with demo data and the exact locked message', async ({ page }) => {
  await register(page, `preview-${Date.now()}@e2e.dev`)
  await page.getByRole('button', { name: 'Skip for now' }).click()
  await page.getByRole('button', { name: "I'll do this later" }).click()
  await expect(page.getByTestId('preview-banner')).toBeVisible()
  await page.goto('/app/programs')
  await expect(page.getByText('Coffee Card')).toBeVisible()
  const locked = page.getByRole('button', { name: /Create Program/ })
  await expect(locked).toHaveAttribute('aria-disabled', 'true')
  await locked.hover()
  await expect(page.getByRole('tooltip').filter({ hasText: PREVIEW_MESSAGE }).first()).toBeVisible()
})

test('owner creates and publishes a stamp card, then the join QR exists', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill('owner@sample.dev')
  await page.getByLabel('Password').fill('Bonuca123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  await page.goto('/app/programs/new/stamp')
  await page.getByLabel('Program Name').fill('E2E Card')
  await page.locator('input[type=file]').first().setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') })
  await page.getByLabel('Reward Description').fill('1 Free Tea')
  await expect(page.getByTestId('wallet-pass')).toContainText('E2E Card')
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'E2E Card' })).toBeVisible()
  await expect(page.getByAltText('QR code: E2E Card')).toBeVisible()
})

test('employee scans a pass and confirms a stamp @responsive', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Use' }).nth(2).click()
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page.getByRole('heading', { name: 'QR Scanner', level: 1 })).toBeVisible()
  await page.getByLabel('Sample customer').selectOption({ index: 1 })
  await page.getByRole('button', { name: /BNC-/ }).first().click()
  const confirm = page.getByRole('button', { name: /Add stamp|Record visit|Credit|Redeem/ }).first()
  await expect(confirm).toBeVisible()
  if (await page.getByLabel(/Purchase amount/).count()) await page.getByLabel(/Purchase amount/).fill('5')
  await confirm.click()
  await expect(page.getByTestId('scan-result')).toContainText('Confirmed')
  // No horizontal overflow on narrow screens.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
