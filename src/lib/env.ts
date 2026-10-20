/** Public runtime configuration (VITE_* only — never secrets). See .env.example. */
export const env = {
  dataSource: (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'dev',
  devTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_TOOLS !== 'false'),
  joinBaseUrl: (import.meta.env.VITE_JOIN_BASE_URL as string | undefined)?.replace(/\/$/, '') || null,
  appStoreUrl: (import.meta.env.VITE_APP_STORE_URL as string | undefined) || null,
  playStoreUrl: (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) || null,
}

/** URL encoded in printed join/campaign QR codes. Falls back to a non-routable development URL. */
export function joinUrl(kind: 'program' | 'campaign' | 'register', token: string, placement?: string): string {
  const base = env.joinBaseUrl ?? 'https://join.bonuca.invalid'
  const q = placement ? `?placement=${encodeURIComponent(placement)}` : ''
  return `${base}/${kind}/${token}${q}`
}
