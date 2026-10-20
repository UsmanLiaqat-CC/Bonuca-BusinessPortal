import type { BusinessDataset, User } from '@/types/domain'

/**
 * Development persistence: a JSON document in localStorage. NOT a production store.
 * Shape (dates ISO-8601):
 * { version: 1, credentials: [{ userId, email, passwordHash }], unattachedUsers: User[],
 *   verification: { [userId]: "123456" }, datasets: { [businessId]: BusinessDataset }, sessionUserId }
 */
export interface DevCredential {
  userId: string
  email: string
  passwordHash: string
}

export interface DevDb {
  version: 1
  credentials: DevCredential[]
  unattachedUsers: User[]
  verification: Record<string, string>
  datasets: Record<string, BusinessDataset>
  sessionUserId: string | null
}

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const DEV_DB_KEY = 'bonuca.dev.db.v1'

export function emptyDb(): DevDb {
  return { version: 1, credentials: [], unattachedUsers: [], verification: {}, datasets: {}, sessionUserId: null }
}

export function loadDb(store: KeyValueStore): DevDb | null {
  try {
    const raw = store.getItem(DEV_DB_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DevDb
    return parsed.version === 1 ? parsed : null
  } catch {
    return null
  }
}

export function saveDb(store: KeyValueStore, db: DevDb): void {
  try {
    store.setItem(DEV_DB_KEY, JSON.stringify(db))
  } catch (e) {
    console.warn('[bonuca-dev] Could not persist development data (storage full or unavailable).', e)
  }
}

export function memoryStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

/** SHA-256 so even development passwords are not stored in plain text. */
export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`bonuca-dev:${email.toLowerCase()}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
