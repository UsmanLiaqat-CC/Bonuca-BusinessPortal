/**
 * External integration boundaries (spec dependencies with no available service).
 * Every default adapter reports "not connected" — nothing is simulated as a real success.
 * Production adapters must implement these interfaces against the real Bonuca backend contract.
 */

export type IntegrationName = 'email' | 'stripe' | 'wallet' | 'push' | 'ai' | 'appStores'

export const INTEGRATION_LABELS: Record<IntegrationName, string> = {
  email: 'Email delivery (verification & invites)',
  stripe: 'Stripe checkout & billing',
  wallet: 'Apple Wallet / Google Wallet pass updates',
  push: 'Wallet push notifications',
  ai: 'AI service (campaign drafts, bonus generator, heatmap commentary)',
  appStores: 'App Store / Google Play (mobile in-app purchase)',
}

export class IntegrationNotConnectedError extends Error {
  readonly service: IntegrationName
  constructor(service: IntegrationName) {
    super(`${INTEGRATION_LABELS[service]} is not connected in this environment.`)
    this.name = 'IntegrationNotConnectedError'
    this.service = service
  }
}

/* -------------------------------------------------------------- AI (spec §4.7, §4.9) */

export interface AiCampaignDraft {
  title: string
  message: string
  suggestedOffer: string
}

export interface AiBonusDraft {
  title: string
  offerTerms: string
  notificationCopy: string
  duration: string
}

export interface AiGateway {
  readonly connected: boolean
  draftCampaign(prompt: string): Promise<AiCampaignDraft>
  draftBonus(goal: string): Promise<AiBonusDraft>
  heatmapCommentary(heatmap: number[][]): Promise<string>
}

/* -------------------------------------------------------------- Billing (spec §4.11) */

export interface Invoice {
  id: string
  date: string
  amount: string
  status: string
  url: string | null
}

export interface Payment {
  id: string
  date: string
  amount: string
  method: string
  status: string
}

export interface BillingInfo {
  name: string
  email: string
  address: string
  paymentMethod: string
}

export interface BillingGateway {
  readonly connected: boolean
  /** Web purchases go through Stripe checkout (§1.5, §4.11). Returns the checkout URL. */
  startCheckout(planId: string): Promise<{ checkoutUrl: string }>
  changePlan(planId: string): Promise<void>
  cancel(): Promise<void>
  listInvoices(): Promise<Invoice[]>
  listPayments(): Promise<Payment[]>
  getBillingInfo(): Promise<BillingInfo | null>
}

/* -------------------------------------------------------------- Push & wallet (spec §4.3, §4.7) */

export interface NotificationGateway {
  readonly connected: boolean
  send(payload: { title: string; message: string; programIds: string[] }): Promise<{ deliveredAt: string }>
}

export interface WalletGateway {
  readonly connected: boolean
  /** APNs push / Google Wallet PATCH after a dynamic field or master field changes. */
  pushPassUpdates(programId: string): Promise<void>
}

export interface Integrations {
  ai: AiGateway
  billing: BillingGateway
  notifications: NotificationGateway
  wallet: WalletGateway
}

function reject(service: IntegrationName): Promise<never> {
  return Promise.reject(new IntegrationNotConnectedError(service))
}

export function createDisconnectedIntegrations(): Integrations {
  return {
    ai: {
      connected: false,
      draftCampaign: () => reject('ai'),
      draftBonus: () => reject('ai'),
      heatmapCommentary: () => reject('ai'),
    },
    billing: {
      connected: false,
      startCheckout: () => reject('stripe'),
      changePlan: () => reject('stripe'),
      cancel: () => reject('stripe'),
      listInvoices: () => reject('stripe'),
      listPayments: () => reject('stripe'),
      getBillingInfo: () => reject('stripe'),
    },
    notifications: { connected: false, send: () => reject('push') },
    wallet: { connected: false, pushPassUpdates: () => reject('wallet') },
  }
}
