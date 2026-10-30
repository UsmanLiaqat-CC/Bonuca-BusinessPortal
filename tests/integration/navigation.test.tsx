import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '../test-utils'

describe('role-aware navigation (spec §3, §4.1, §4.6)', () => {
  it('Owner sees every management tab and lands on the Dashboard', async () => {
    await renderApp('/app', { login: 'owner' })
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!
    for (const label of ['Dashboard', 'Loyalty Programs', 'QR Scanner', 'Customers', 'Employees', 'Notifications', 'Rewards', 'Analytics', 'Branding', 'Subscription & Billing', 'Settings']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
    // The Wallet Cards tab was removed: each wallet card lives inside its loyalty program.
    expect(within(nav).queryByRole('link', { name: 'Wallet Cards' })).toBeNull()
  })

  it('the old Wallet Cards URLs redirect to Loyalty Programs', async () => {
    const { router } = await renderApp('/app/wallet-cards', { login: 'owner' })
    expect(await screen.findByRole('heading', { name: 'Loyalty Programs', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app/programs')
  })

  it('Employee gets the simplified interface without the Dashboard tab', async () => {
    await renderApp('/app', { login: 'employee' })
    expect(await screen.findByRole('heading', { name: 'Award actions', level: 1 })).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!
    expect(within(nav).getByRole('link', { name: 'Customer Info' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Account' })).toBeInTheDocument()
    for (const label of ['Dashboard', 'Analytics', 'Settings', 'Subscription & Billing']) expect(within(nav).queryByRole('link', { name: label })).toBeNull()
  })

  it('Employee is blocked from the Dashboard route itself (not only hidden)', async () => {
    await renderApp('/app/dashboard', { login: 'employee' })
    expect(await screen.findByRole('heading', { name: 'No access' })).toBeInTheDocument()
  })

  it('Manager sees Employees only when permitted by the Owner (seed permits it)', async () => {
    await renderApp('/app/employees', { login: 'manager' })
    expect(await screen.findByRole('heading', { name: 'Employees', level: 1 })).toBeInTheDocument()
  })

  it('Campaigns has its own tab under Loyalty Programs; programs and notifications no longer hold campaigns', async () => {
    const { user } = await renderApp('/app/programs', { login: 'owner' })
    expect(await screen.findByText('Programs are what customers join.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create campaign/i })).toBeNull()
    expect(screen.queryByRole('table', { name: 'Campaigns' })).toBeNull()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!
    const links = within(nav).getAllByRole('link').map((l) => l.textContent)
    expect(links.indexOf('Campaigns')).toBe(links.indexOf('Loyalty Programs') + 1)
    await user.click(within(nav).getByRole('link', { name: 'Campaigns' }))
    expect(await screen.findByRole('heading', { name: 'Campaigns', level: 1 })).toBeInTheDocument()
    const table = await screen.findByRole('table', { name: 'Campaigns' })
    for (const h of ['Campaign', 'Type', 'Status', 'Offer', 'Period', 'Customers', 'Redeemed', 'Created', 'Action']) expect(within(table).getByRole('columnheader', { name: h })).toBeInTheDocument()
    expect(within(table).getAllByText('Win-back').length).toBeGreaterThan(0)
    await user.selectOptions(screen.getByLabelText('Type'), 'voucher')
    expect(within(screen.getByRole('table', { name: 'Campaigns' })).queryAllByText('Win-back')).toHaveLength(0)
  })

  it('Notifications keeps manual messages only: no Win-back tab, "New notification" button', async () => {
    await renderApp('/app/notifications', { login: 'owner' })
    expect(await screen.findByText('Push messages to your customers’ wallet passes.')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /win-back/i })).toBeNull()
    expect(screen.getByRole('button', { name: /New notification/ })).toBeInTheDocument()
  })

  it('unauthenticated users are sent to login', async () => {
    const { router } = await renderApp('/app/dashboard')
    expect(await screen.findByRole('heading', { name: /log in to bonuca/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
