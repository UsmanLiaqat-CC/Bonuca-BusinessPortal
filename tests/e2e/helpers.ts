import { expect, type Page } from '@playwright/test'

export const PREVIEW_MESSAGE = 'Select a free trial, free plan, or paid plan to use this feature.'
const SHOTS = 'docs/qa/screenshots'

export async function shot(page: Page, name: string) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
}

export async function login(page: Page, role: 'owner' | 'manager' | 'employee') {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill(`${role}@sample.dev`)
  await page.getByLabel('Password').fill('Bonuca123')
  await page.getByRole('button', { name: 'Log In' }).click()
  await expect(page).toHaveURL(/\/app\//)
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
}

/** Registers a brand-new business and stops on the plan selection step. */
export async function registerToPlan(page: Page, email = `qa-${Date.now()}-${Math.round(Math.random() * 1e6)}@e2e.dev`) {
  await page.goto('/register')
  await page.getByLabel('Full Name').fill('QA Owner')
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel(/^Password/).fill('secret123')
  await page.getByLabel('Country').selectOption('GB')
  await page.getByLabel(/Terms & Privacy/).check()
  await page.getByRole('button', { name: 'Create Account' }).click()
  const code = (await page.getByTestId('dev-code').textContent())!.trim()
  await page.getByLabel('Verification code').fill(code)
  await page.getByRole('button', { name: 'Verify email' }).click()
  await page.getByLabel('Business Name').fill('QA Café')
  await page.getByLabel('Business Category').selectOption('cafe')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Choose your plan' })).toBeVisible()
}

export async function lockedShowsPreviewMessage(page: Page, name: RegExp | string) {
  const btn = page.getByRole('button', { name }).first()
  await expect(btn).toHaveAttribute('aria-disabled', 'true')
  await btn.hover()
  await expect(page.getByRole('tooltip').filter({ hasText: PREVIEW_MESSAGE }).first()).toBeVisible()
}

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
export async function upload(page: Page, label: string) {
  await page.getByTestId(`upload-${label}`).setInputFiles({ name: 'img.png', mimeType: 'image/png', buffer: PNG_1PX })
}

/** Uses the development sample-pass picker on the scanner to identify a pass of `programName`. */
export async function scanSample(page: Page, programName: string) {
  const select = page.getByLabel('Sample customer')
  await expect.poll(() => select.locator('option').count()).toBeGreaterThan(1)
  const count = await select.locator('option').count()
  for (let i = 1; i < count; i++) {
    await select.selectOption({ index: i })
    const btn = page.getByRole('button', { name: new RegExp(`^${programName}: BNC-`) })
    if (await btn.first().waitFor({ state: 'visible', timeout: 1500 }).then(() => true).catch(() => false)) {
      await btn.first().click()
      return
    }
  }
  throw new Error(`No sample pass for ${programName}`)
}
