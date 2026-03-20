import { useState, useCallback, useRef } from 'react'
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
  // Keep a ref to the latest roster so async saves always use current data
  const rosterRef = useRef(state.roster)

  const persistAndUpdate = useCallback((newRoster: Roster, key: CryptoKey) => {
    rosterRef.current = newRoster
    setState(s => ({ ...s, roster: newRoster }))
    // Fire-and-forget save, but outside setState
    saveRoster(key, newRoster)
  }, [])

  const createVault = useCallback(async (passphrase: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const salt = generateSalt()
      saveSalt(saltToBase64(salt))
      const key = await deriveKey(passphrase, salt)
      const roster: Roster = { employees: [], schedule: null, updatedAt: Date.now() }
      await saveRoster(key, roster)
      setCryptoKey(key)
      rosterRef.current = roster
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
      if (!roster.schedule) roster.schedule = null
      setCryptoKey(key)
      rosterRef.current = roster
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

  const updateRoster = useCallback((updater: (employees: Employee[]) => Employee[]) => {
    if (!cryptoKey) return
    const newEmployees = updater(rosterRef.current.employees)
    const newRoster: Roster = { ...rosterRef.current, employees: newEmployees, updatedAt: Date.now() }
    persistAndUpdate(newRoster, cryptoKey)
  }, [cryptoKey, persistAndUpdate])

  const updateSchedule = useCallback((schedule: PaySchedule) => {
    if (!cryptoKey) return
    const newRoster: Roster = { ...rosterRef.current, schedule, updatedAt: Date.now() }
    persistAndUpdate(newRoster, cryptoKey)
  }, [cryptoKey, persistAndUpdate])

  const markNotified = useCallback((dateStr: string) => {
    if (!cryptoKey) return
    const currentSchedule = rosterRef.current.schedule
    if (!currentSchedule) return
    const newSchedule: PaySchedule = { ...currentSchedule, lastNotified: dateStr }
    const newRoster: Roster = { ...rosterRef.current, schedule: newSchedule, updatedAt: Date.now() }
    persistAndUpdate(newRoster, cryptoKey)
  }, [cryptoKey, persistAndUpdate])

  return {
    ...state,
    createVault,
    unlock,
    updateRoster,
    updateSchedule,
    markNotified,
  }
}
