import { useState, useCallback } from 'react'
import { deriveKey, generateSalt, saltToBase64, saltFromBase64 } from '../crypto.ts'
import { saveRoster, loadRoster, hasSavedVault, getSavedSalt, saveSalt } from '../storage.ts'
import type { Employee, Roster, PaySchedule } from '../types.ts'

interface VaultState {
  locked: boolean
  hasExistingVault: boolean
  roster: Roster
  error: string | null
  loading: boolean
}

export function useVault() {
  const [state, setState] = useState<VaultState>({
    locked: true,
    hasExistingVault: hasSavedVault(),
    roster: { employees: [], schedule: null, updatedAt: Date.now() },
    error: null,
    loading: false,
  })
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)

  const createVault = useCallback(async (passphrase: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const salt = generateSalt()
      saveSalt(saltToBase64(salt))
      const key = await deriveKey(passphrase, salt)
      const roster: Roster = { employees: [], schedule: null, updatedAt: Date.now() }
      await saveRoster(key, roster)
      setCryptoKey(key)
      setState(s => ({
        ...s,
        locked: false,
        hasExistingVault: true,
        roster,
        loading: false,
      }))
    } catch {
      setState(s => ({ ...s, error: 'Failed to create vault', loading: false }))
    }
  }, [])

  const unlock = useCallback(async (passphrase: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const saltB64 = getSavedSalt()
      if (!saltB64) {
        setState(s => ({ ...s, error: 'No vault found', loading: false }))
        return
      }
      const salt = saltFromBase64(saltB64)
      const key = await deriveKey(passphrase, salt)
      const roster = await loadRoster(key)
      // Backfill schedule field for vaults created before this feature
      if (!roster.schedule) roster.schedule = null
      setCryptoKey(key)
      setState(s => ({
        ...s,
        locked: false,
        roster,
        loading: false,
      }))
    } catch {
      setState(s => ({ ...s, error: 'Passphrase incorrect', loading: false }))
    }
  }, [])

  const updateRoster = useCallback(async (updater: (employees: Employee[]) => Employee[]) => {
    if (!cryptoKey) return

    setState(s => {
      const newEmployees = updater(s.roster.employees)
      const newRoster: Roster = { ...s.roster, employees: newEmployees, updatedAt: Date.now() }
      saveRoster(cryptoKey, newRoster)
      return { ...s, roster: newRoster }
    })
  }, [cryptoKey])

  const updateSchedule = useCallback(async (schedule: PaySchedule) => {
    if (!cryptoKey) return

    setState(s => {
      const newRoster: Roster = { ...s.roster, schedule, updatedAt: Date.now() }
      saveRoster(cryptoKey, newRoster)
      return { ...s, roster: newRoster }
    })
  }, [cryptoKey])

  const markNotified = useCallback(async (dateStr: string) => {
    if (!cryptoKey) return

    setState(s => {
      if (!s.roster.schedule) return s
      const newSchedule: PaySchedule = { ...s.roster.schedule, lastNotified: dateStr }
      const newRoster: Roster = { ...s.roster, schedule: newSchedule, updatedAt: Date.now() }
      saveRoster(cryptoKey, newRoster)
      return { ...s, roster: newRoster }
    })
  }, [cryptoKey])

  return {
    ...state,
    createVault,
    unlock,
    updateRoster,
    updateSchedule,
    markNotified,
  }
}
