import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '../test-utils'

describe('registration (spec §1.2)', () => {
  it('validates required fields and terms', async () => {
    const { user } = await renderApp('/register')
    await user.click(await screen.findByRole('button', { name: 'Create Account' }))
    expect(await screen.findByText('Full name is required.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('You must accept the Terms & Privacy Policy to continue.')).toBeInTheDocument()
  })

  it('registers and requires the email code before continuing (dev code shown, not emailed)', async () => {
    const { user, router } = await renderApp('/register')
    await user.type(await screen.findByLabelText(/Full Name/), 'Nia Owner')
    await user.type(screen.getByLabelText(/Email Address/), 'nia@test.dev')
    await user.type(screen.getByLabelText(/^Password/), 'secret123')
    await user.selectOptions(screen.getByLabelText(/Country/), 'DE')
    await user.click(screen.getByLabelText(/Terms & Privacy/))
    await user.click(screen.getByRole('button', { name: 'Create Account' }))
    expect(await screen.findByRole('heading', { name: /verify your email|E-Mail bestätigen/i })).toBeInTheDocument()
    const code = screen.getByTestId('dev-code').textContent!
    await user.type(screen.getByLabelText(/code|Bestätigungscode/i), code)
    await user.click(screen.getByRole('button', { name: /verify email|E-Mail bestätigen/i }))
    await screen.findByRole('heading', { name: /set up your business|Unternehmen einrichten/i })
    expect(router.state.location.pathname).toBe('/onboarding/business')
  })
})

describe('program setup conditional fields (spec §4.2)', () => {
  it('membership discount value appears only for discount benefit types', async () => {
    const { user } = await renderApp('/app/programs/new/membership', { login: 'owner' })
    expect(await screen.findByLabelText(/Discount Value/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/Benefit Type/), 'perk')
    expect(screen.queryByLabelText(/Discount Value/)).toBeNull()
  })

  it('stamp expiry toggle reveals the days input; publish validates required fields', async () => {
    const { user } = await renderApp('/app/programs/new/stamp', { login: 'owner' })
    const toggle = await screen.findByRole('switch', { name: 'Expiry Rule' })
    expect(screen.queryByLabelText(/Expiry Rule \(days/)).toBeNull()
    await user.click(toggle)
    expect(screen.getByLabelText(/Expiry Rule \(days/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Program name is required.')).toBeInTheDocument()
    expect(screen.getByText('Reward description is required.')).toBeInTheDocument()
  })

  it('points: fixed awarding reveals points per scan; live preview shows iPhone/Android', async () => {
    const { user } = await renderApp('/app/programs/new/points', { login: 'owner' })
    await user.selectOptions(await screen.findByLabelText(/Awarding Method/), 'fixed')
    expect(screen.getByLabelText(/Points per scan/)).toBeInTheDocument()
    const preview = screen.getByRole('region', { name: 'Live wallet preview' })
    expect(within(preview).getByRole('tab', { name: /iPhone/ })).toHaveAttribute('aria-selected', 'true')
    await user.click(within(preview).getByRole('tab', { name: /Android/ }))
    expect(within(preview).getByText(/Google Wallet/)).toBeInTheDocument()
  })

  it('live preview updates as the program name changes', async () => {
    const { user } = await renderApp('/app/programs/new/stamp', { login: 'owner' })
    await user.type(await screen.findByLabelText(/Program Name/), 'Bean Card')
    expect(within(screen.getByTestId('wallet-pass')).getByText('Bean Card')).toBeInTheDocument()
  })
})

describe('customers search (spec §4.5)', () => {
  it('filters by customer ID', async () => {
    const { user } = await renderApp('/app/customers', { login: 'owner' })
    const search = await screen.findByLabelText('Search customers')
    await screen.findByText('C-10001')
    await user.type(search, 'C-10002')
    expect(screen.queryByText('C-10001')).toBeNull()
    expect(screen.getByText('C-10002')).toBeInTheDocument()
  })
})
