import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '../test-utils'

describe('role-aware navigation (spec §3, §4.1, §4.6)', () => {
  it('Owner sees every management tab and lands on the Dashboard', async () => {
    await renderApp('/app', { login: 'owner' })
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Main' })[0]!
    for (const label of ['Dashboard', 'Loyalty Programs', 'Wallet Cards', 'QR Scanner', 'Customers', 'Employees', 'Notifications', 'Rewards', 'Analytics', 'Branding', 'Subscription & Billing', 'Settings']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('Employee gets the simplified interface without the Dashboard tab', async () => {
    await renderApp('/app', { login: 'employee' })
    expect(await screen.findByRole('heading', { name: 'QR Scanner', level: 1 })).toBeInTheDocument()
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

  it('unauthenticated users are sent to login', async () => {
    const { router } = await renderApp('/app/dashboard')
    expect(await screen.findByRole('heading', { name: /log in to bonuca/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })
})
