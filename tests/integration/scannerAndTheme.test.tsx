import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp, createBackend } from '../test-utils'

/** Award actions: Search tab → customer screen → pick the program card when there are several. */
async function openFromSearch(role: 'owner' | 'employee', programId: string) {
  const backend = createBackend()
  await backend.login(`${role}@sample.dev`, 'Bonuca123')
  const row = (await backend.getProgramCustomers(programId).catch(async () => {
    // Employees cannot read program tables: look the customer up as the Owner on a second backend session.
    const owner = createBackend()
    await owner.login('owner@sample.dev', 'Bonuca123')
    return owner.getProgramCustomers(programId)
  }))[0]!
  const r = await renderApp('/app/scanner', { backend })
  expect(await screen.findByRole('heading', { name: 'Award actions', level: 1 })).toBeInTheDocument()
  // Scan is the default tab; there is no "Start scanner" button.
  expect(screen.getByRole('tab', { name: 'Scan' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.queryByRole('button', { name: /start scanner/i })).toBeNull()
  await r.user.click(screen.getByRole('tab', { name: 'Search' }))
  await r.user.type(screen.getByLabelText('Search customers'), row.customer.customerNumber)
  await r.user.click(await screen.findByRole('button', { name: new RegExp(row.customer.customerNumber) }))
  await screen.findByTestId('award-customer')
  const group = screen.queryByRole('radiogroup', { name: 'Customer programs' })
  if (group) await r.user.click(within(group).getAllByRole('radio').find((el) => el.textContent?.includes(row.membership.programId === 'prg_coffee' ? 'Coffee Card' : 'Coffee Rewards'))!)
  return { ...r, backend, row }
}

describe('Award actions (QR Scanner, spec §4.4)', () => {
  it('employee: +1 stamp only (no -1, no amount); Redeem bonus stays greyed until the card is full', async () => {
    const { user } = await openFromSearch('employee', 'prg_coffee')
    const add = await screen.findByRole('button', { name: /1 stamp/ })
    expect(screen.queryByRole('button', { name: /Remove stamp/ })).toBeNull()
    expect(screen.queryByLabelText('Stamp amount')).toBeNull()
    expect(screen.getByRole('button', { name: /Redeem bonus/ })).toBeDisabled()
    await user.click(add)
    expect(await screen.findByText(/\+1 stamp \(|Card full/)).toBeInTheDocument()
    // History shows the change and that the customer was found by search.
    const history = screen.getByRole('list', { name: 'Award history' })
    expect(within(history).getAllByText('Search').length).toBeGreaterThan(0)
  })

  it('owner: sees Remove stamp (-1) and the amount dropdown', async () => {
    await openFromSearch('owner', 'prg_coffee')
    expect(await screen.findByRole('button', { name: /Remove stamp \(-1\)/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Stamp amount')).toBeInTheDocument()
  })

  it('points: purchase amount shows the points it will give; nothing is saved until "Credit X points"', async () => {
    const { user, backend, row } = await openFromSearch('owner', 'prg_points')
    await user.type(await screen.findByLabelText(/Purchase amount \(EUR\)/), '4.20')
    expect(screen.getByText('Points it will give')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Credit 42 points' })).toBeInTheDocument()
    const stored = (await backend.getCustomer(row.customer.id))!.memberships.find((m) => m.program.id === 'prg_points')!.membership.points
    expect(stored).toBe(row.membership.points)
  })
})

describe('theme (spec §4.10)', () => {
  it('switches between light and dark', async () => {
    const { user } = await renderApp('/', {})
    await user.click((await screen.findAllByRole('radio', { name: 'Dark' }))[0]!)
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getAllByRole('radio', { name: 'Light' })[0]!)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
