import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { Providers } from '@/app/providers'
import { routes } from '@/app/router'
import { DevBackend } from '@/services/dev/devBackend'
import { memoryStore } from '@/services/dev/devDb'
import { createDisconnectedIntegrations, type Integrations } from '@/services/integrations'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'

export type SeedRole = 'owner' | 'manager' | 'employee'

export function createBackend(integrations: Integrations = createDisconnectedIntegrations()) {
  return new DevBackend({ store: memoryStore(), integrations, catalog: DEV_PLAN_CATALOG, seed: true })
}

export async function renderApp(path: string, opts: { login?: SeedRole; backend?: DevBackend; integrations?: Integrations } = {}) {
  const integrations = opts.integrations ?? createDisconnectedIntegrations()
  const backend = opts.backend ?? createBackend(integrations)
  if (opts.login) await backend.login(`${opts.login}@sample.dev`, 'Bonuca123')
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const utils = render(
    <Providers services={{ backend, integrations }} queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...utils, backend, router, user: userEvent.setup() }
}
