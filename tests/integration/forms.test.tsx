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
  /** Basics → Program rules: the name must be valid before the next step opens. */
  async function toRules(type: string) {
    const r = await renderApp(`/app/programs/new/${type}`, { login: 'owner' })
    await r.user.click(await screen.findByRole('button', { name: /Next: Program rules/ }))
    expect(await screen.findByText('Program name is required.')).toBeInTheDocument()
    await r.user.type(screen.getByLabelText(/Program Name/), 'Test program')
    await r.user.click(screen.getByRole('button', { name: /Next: Program rules/ }))
    return r
  }

  it('creation sequence: Basics → Program rules → Wallet design → Valid location → Sign-up page', async () => {
    await renderApp('/app/programs/new/stamp', { login: 'owner' })
    const steps = await screen.findByRole('list', { name: 'Program setup steps' })
    expect(within(steps).getAllByRole('button').map((b) => b.textContent?.replace(/^\d/, ''))).toEqual(['Basics', 'Program rules', 'Wallet design', 'Valid location', 'Sign-up page'])
  })

  it('membership discount value appears only for discount benefit types', async () => {
    const { user } = await toRules('membership')
    expect(await screen.findByLabelText(/Discount Value/)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/Benefit Type/), 'perk')
    expect(screen.queryByLabelText(/Discount Value/)).toBeNull()
  })

  it('stamp rules have an expiry date; the expiry toggle reveals days; the step validates required fields', async () => {
    const { user } = await toRules('stamp')
    expect(screen.getByLabelText(/Program expiry date/)).toBeInTheDocument()
    const toggle = await screen.findByRole('switch', { name: 'Expiry Rule' })
    expect(screen.queryByLabelText(/Expiry Rule \(days/)).toBeNull()
    await user.click(toggle)
    expect(screen.getByLabelText(/Expiry Rule \(days/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Next: Wallet design/ }))
    expect(await screen.findByText('Reward description is required.')).toBeInTheDocument()
  })

  it('points: fixed awarding reveals points per scan; live preview shows iPhone/Android and the sign-up page', async () => {
    const { user } = await toRules('points')
    await user.selectOptions(await screen.findByLabelText(/Awarding Method/), 'fixed')
    expect(screen.getByLabelText(/Points per scan/)).toBeInTheDocument()
    const preview = screen.getByRole('region', { name: 'Live wallet preview' })
    expect(within(preview).getByRole('tab', { name: /iPhone/ })).toHaveAttribute('aria-selected', 'true')
    await user.click(within(preview).getByRole('tab', { name: /Android/ }))
    expect(within(preview).getAllByText(/Google Wallet/).length).toBeGreaterThan(0)
    await user.click(within(preview).getByRole('tab', { name: /Sign-up page/ }))
    await user.click(within(preview).getByRole('button', { name: 'Get my card' }))
    expect(within(preview).getByRole('heading', { name: 'Almost there' })).toBeInTheDocument()
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
