import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp, createBackend } from '../test-utils'

const MESSAGE = 'Select a free trial, free plan, or paid plan to use this feature.'

async function previewOwner() {
  const backend = createBackend()
  const d = await backend.register({ fullName: 'Pia', email: 'pia@test.dev', password: 'secret123', country: 'DE', phone: '', acceptTerms: true, language: 'en' })
  if (!d.delivered) await backend.verifyEmail(d.devCode!)
  await backend.createBusiness({ name: 'Pia Bakery', category: 'bakery', logo: null, address: { street: '', postalCode: '', city: '', country: '' }, openingHours: null, primaryColor: '#1747F8', language: 'en' })
  await backend.choosePlan('preview')
  await backend.finishOnboarding()
  return backend
}

describe('Preview Mode (spec §2)', () => {
  it('labels demo data and keeps locked buttons visible with the exact message', async () => {
    const backend = await previewOwner()
    const { user } = await renderApp('/app/programs', { backend })
    expect(await screen.findByTestId('preview-banner')).toBeInTheDocument()
    expect((await screen.findAllByText('Coffee Card')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Demo data').length).toBeGreaterThan(0)
    const create = screen.getByRole('button', { name: /create program/i })
    expect(create).toHaveAttribute('aria-disabled', 'true')
    await user.click(create)
    expect(screen.getAllByText(MESSAGE).length).toBeGreaterThan(0)
  })
})

describe('Super Admin override (spec §2, §4.11)', () => {
  it('shows a read-only banner with end date and disables plan changes', async () => {
    const backend = createBackend()
    await backend.login('owner@sample.dev', 'Bonuca123')
    await backend.dev.setOverride({ kind: 'billing_paused', planId: 'pro', endsAt: '2099-03-01T12:00:00Z' })
    await renderApp('/app/subscription', { backend })
    expect(await screen.findByTestId('override-banner')).toHaveTextContent(/managed by Bonuca/)
    expect(await screen.findByTestId('override-readonly')).toHaveTextContent(/Billing paused/)
    expect(await screen.findByText(/managed by Bonuca and cannot be changed here/)).toBeInTheDocument()
    // No plan-change, downgrade or cancel controls are offered while Bonuca manages the plan.
    expect(screen.queryByRole('button', { name: /stripe checkout|downgrade|cancel subscription|choose free plan/i })).toBeNull()
  })
})

describe('Paid checkout (spec §1.5)', () => {
  it('reports that Stripe is not connected instead of faking payment', async () => {
    const backend = createBackend()
    await backend.login('owner@sample.dev', 'Bonuca123')
    const { user } = await renderApp('/app/subscription', { backend })
    const switchBtn = await screen.findByRole('button', { name: /pro — stripe checkout/i })
    await user.click(switchBtn)
    expect((await screen.findAllByText(/Stripe checkout & billing is not connected/)).length).toBeGreaterThan(0)
  })
})
