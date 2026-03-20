import { encrypt, decrypt } from './crypto.ts'
import type { Roster } from './types.ts'

const SALT_KEY = 'grove_salt'
const VAULT_KEY = 'grove_vault'

export function hasSavedVault(): boolean {
  return localStorage.getItem(VAULT_KEY) !== null
}

export function getSavedSalt(): string | null {
  return localStorage.getItem(SALT_KEY)
}

export function saveSalt(saltBase64: string): void {
  localStorage.setItem(SALT_KEY, saltBase64)
}

export async function saveRoster(key: CryptoKey, roster: Roster): Promise<void> {
  const json = JSON.stringify(roster)
  const blob = await encrypt(key, json)
  localStorage.setItem(VAULT_KEY, blob)
}

export async function loadRoster(key: CryptoKey): Promise<Roster> {
  const blob = localStorage.getItem(VAULT_KEY)
  if (!blob) {
    return { employees: [], schedule: null, updatedAt: Date.now() }
  }

  const json = await decrypt(key, blob)
  return JSON.parse(json) as Roster
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY)
  localStorage.removeItem(SALT_KEY)
}
