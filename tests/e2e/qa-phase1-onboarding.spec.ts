import { expect, test } from '@playwright/test'
import { registerToPlan, shot } from './helpers'

/** QA Phase 1 — Spec §1 Landing → Registration → Onboarding. Each test = one spec line. */
test.describe('Phase 1 · §1 onboarding', () => {
  test('§1.1 landing has Start Free, Log In, Download App', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Start Free' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Log In' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Download App' }).click()
    await expect(page.getByRole('dialog')).toContainText('not configured')
    await shot(page, 'p1-01-landing-download')
  })

  test('§1.1 language selectable on landing (5 languages)', async ({ page }) => {
    await page.goto('/')
    const select = page.getByRole('combobox', { name: 'Language' })
    await expect(select.locator('option')).toHaveText(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'])
    await select.selectOption('de')
    await expect(page.getByRole('link', { name: 'Kostenlos starten' })).toBeVisible()
    await shot(page, 'p1-02-landing-german')
  })

  test('§1.2 registration: required fields, email, password rule, terms; phone optional', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Create Account' }).click()
    for (const msg of ['Full name is required.', 'Enter a valid email address.', 'Choose your country.', 'You must accept the Terms & Privacy Policy to continue.']) {
      await expect(page.getByText(msg)).toBeVisible()
    }
    await expect(page.getByText(/at least 8 characters/).first()).toBeVisible()
    await page.getByLabel(/^Password/).fill('short')
    await page.getByLabel('Phone Number').fill('abc')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'at least 8 characters' })).toBeVisible()
    await expect(page.getByText('Enter a valid phone number.')).toBeVisible()
    await shot(page, 'p1-03-register-validation')
  })

  test('§1.3 verification required; wrong code rejected; resend works', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('V')
    await page.getByLabel('Email Address').fill(`v-${Date.now()}@e2e.dev`)
    await page.getByLabel(/^Password/).fill('secret123')
    await page.getByLabel('Country').selectOption('GB')
    await page.getByLabel(/Terms & Privacy/).check()
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByTestId('dev-callout')).toContainText('email not sent')
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/verify-email/)
    await page.getByLabel('Verification code').fill('000000')
    await page.getByRole('button', { name: 'Verify email' }).click()
    await expect(page.getByText(/not correct/)).toBeVisible()
    // After a reload the earlier code is gone from the screen; "Resend code" issues a new one.
    await page.getByRole('button', { name: 'Resend code' }).click()
    await expect(page.getByTestId('dev-code')).toHaveText(/^\d{6}$/)
    await shot(page, 'p1-04-verify')
  })

  test('§1.4 business profile: categories, language, no currency, optional fields', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('B')
    await page.getByLabel('Email Address').fill(`b-${Date.now()}@e2e.dev`)
    await page.getByLabel(/^Password/).fill('secret123')
    await page.getByLabel('Country').selectOption('GB')
    await page.getByLabel(/Terms & Privacy/).check()
    await page.getByRole('button', { name: 'Create Account' }).click()
    await page.getByLabel('Verification code').fill((await page.getByTestId('dev-code').textContent())!.trim())
    await page.getByRole('button', { name: 'Verify email' }).click()
    await expect(page.getByLabel('Business Category').locator('option')).toHaveText(['Select…', 'Café', 'Restaurant', 'Barber Shop', 'Beauty Salon', 'Bakery', 'Other'])
    await expect(page.getByLabel('Preferred Interface Language').locator('option')).toHaveCount(5)
    await expect(page.getByLabel(/currency/i)).toHaveCount(0)
    await expect(page.getByLabel('Primary Brand Color', { exact: true })).toHaveValue('#1747F8')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Business name is required.')).toBeVisible()
    await page.getByLabel(/Opening Hours — add now/).check()
    await expect(page.getByLabel('Monday opens')).toBeVisible()
    await shot(page, 'p1-05-business-profile')
  })

  test('§1.5 plan selection: Free, Trial, Paid (Stripe not connected), Skip', async ({ page }) => {
    await registerToPlan(page)
    await expect(page.getByText('Free Plan', { exact: true })).toBeVisible()
    await expect(page.getByText('Free Trial', { exact: true })).toBeVisible()
    await expect(page.getByText('Pro Plan')).toBeVisible()
    await expect(page.getByText(/Pricing not configured/)).toBeVisible()
    await page.getByRole('button', { name: /Choose Pro — Stripe checkout/ }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Stripe' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skip for now' })).toBeVisible()
    await shot(page, 'p1-06-plan-selection')
  })

  test('§1.5–1.7 Free trial → first program quick-create (4 types) → Dashboard', async ({ page }) => {
    await registerToPlan(page)
    await page.getByRole('button', { name: 'Start Free Trial' }).click()
    const types = page.getByRole('radiogroup', { name: 'Program type' }).getByRole('radio')
    await expect(types).toHaveText(['Stamp Card', 'Membership Card', 'Tier Program', 'Points Program'])
    await expect(page.getByRole('button', { name: "I'll do this later" })).toBeVisible()
    await page.getByRole('button', { name: 'Create program' }).click()
    await expect(page.getByText('Program name is required.')).toBeVisible()
    await page.getByLabel('Program name').fill('QA Coffee')
    await page.getByLabel('Reward').fill('1 Free Coffee')
    await shot(page, 'p1-07-first-program')
    await page.getByRole('button', { name: 'Create program' }).click()
    await expect(page).toHaveURL(/\/app\/dashboard/)
    await page.goto('/app/programs')
    await expect(page.getByText('QA Coffee')).toBeVisible()
    await expect(page.getByText('Draft').first()).toBeVisible()
  })
})
