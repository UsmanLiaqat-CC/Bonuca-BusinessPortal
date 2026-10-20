import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp, createBackend } from '../test-utils'

describe('scanner (spec §4.4)', () => {
  it('identifies the customer, confirms a stamp and shows confirmation immediately', async () => {
    const backend = createBackend()
    await backend.login('employee@sample.dev', 'Bonuca123')
    const customers = await backend.listCustomers()
    let code = ''
    for (const c of customers) {
      const d = await backend.getCustomer(c.id)
      const m = d?.memberships.find((x) => x.program.id === 'prg_coffee')
      if (m) {
        code = m.membership.passCode
        break
      }
    }
    const { user } = await renderApp('/app/scanner', { backend })
    await user.type(await screen.findByLabelText(/Manual code entry/), code)
    await user.click(screen.getByRole('button', { name: 'Find' }))
    await user.click(await screen.findByRole('button', { name: 'Add stamp' }))
    expect(await screen.findByTestId('scan-result')).toHaveTextContent(/Confirmed/)
    expect(screen.getByTestId('scan-result')).toHaveTextContent(/Wallet pass update: not sent/)
    expect(screen.getByTestId('scan-success')).toBeInTheDocument()
  })

  it('manual points shows the full preview before crediting', async () => {
    const backend = createBackend()
    await backend.login('owner@sample.dev', 'Bonuca123')
    let code = ''
    for (const c of await backend.listCustomers()) {
      const m = (await backend.getCustomer(c.id))?.memberships.find((x) => x.program.id === 'prg_points')
      if (m) {
        code = m.membership.passCode
        break
      }
    }
    const { user } = await renderApp('/app/scanner', { backend })
    await user.type(await screen.findByLabelText(/Manual code entry/), code)
    await user.click(screen.getByRole('button', { name: 'Find' }))
    await user.type(await screen.findByLabelText(/Purchase amount \(EUR\)/), '4.20')
    const preview = screen.getByLabelText('Points preview')
    for (const label of ['Customer', 'Current balance', 'Amount entered', 'Points to be added', 'New balance', 'Next reward', 'Points still needed']) expect(preview).toHaveTextContent(label)
    expect(screen.getByRole('button', { name: 'Credit 42 points' })).toBeInTheDocument()
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
