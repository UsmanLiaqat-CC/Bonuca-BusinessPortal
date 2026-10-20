import type { BusinessBackend } from './backend'
import { createDisconnectedIntegrations, type Integrations } from './integrations'
import { DevBackend } from './dev/devBackend'
import { DEV_PLAN_CATALOG } from '@/mocks/planCatalog'
import { env } from '@/lib/env'

export interface Services {
  backend: BusinessBackend
  integrations: Integrations
}

export function createServices(): Services {
  const integrations = createDisconnectedIntegrations()
  if (env.dataSource !== 'dev') {
    // No production API contract exists yet; refuse to pretend one is connected.
    throw new Error(`VITE_DATA_SOURCE="${env.dataSource}" has no adapter. Only "dev" is implemented.`)
  }
  const backend = new DevBackend({
    store: window.localStorage,
    integrations,
    catalog: DEV_PLAN_CATALOG,
    latencyMs: 150,
    // Sample accounts only when development tools are enabled.
    seed: env.devTools,
  })
  return { backend, integrations }
}
