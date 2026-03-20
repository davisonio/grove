import { useState, useEffect, useRef } from 'react'
import type { BatchEntry } from './types.ts'
import { useVault } from './hooks/useVault.ts'
import { isPayDay, getCurrentPayDate, showPaydayNotification, requestNotificationPermission } from './notifications.ts'
import { clearVault } from './storage.ts'
import { UnlockScreen } from './components/UnlockScreen.tsx'
import { RosterScreen } from './components/RosterScreen.tsx'
import { BatchPreview } from './components/BatchPreview.tsx'
import { PaymentScreen } from './components/PaymentScreen.tsx'

type AppScreen = 'roster' | 'preview' | 'payment'

export default function App() {
  const vault = useVault()
  const [screen, setScreen] = useState<AppScreen>('roster')
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([])
  const [batchTestMode, setBatchTestMode] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(
    'Notification' in window ? Notification.permission : null
  )
  const notifChecked = useRef(false)

  // Check for payday notification after vault unlock
  useEffect(() => {
    if (vault.locked || notifChecked.current) return
    notifChecked.current = true

    const schedule = vault.roster.schedule
    if (!schedule || !schedule.enabled) return
    if (!isPayDay(schedule)) return

    const payDate = getCurrentPayDate(schedule)
    const empCount = vault.roster.employees.length

    if (empCount === 0) return

    const total = vault.roster.employees.reduce((sum, e) => {
      if (e.currency === 'ZEC') return sum + e.amount
      return sum
    }, 0)

    showPaydayNotification(empCount, total > 0 ? total : undefined)
    vault.markNotified(payDate)
  }, [vault.locked, vault.roster.schedule, vault.roster.employees, vault.markNotified])

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setNotifPermission(granted ? 'granted' : 'denied')
  }

  const handleResetVault = () => {
    clearVault()
    window.location.reload()
  }

  if (vault.locked) {
    return (
      <UnlockScreen
        hasExistingVault={vault.hasExistingVault}
        error={vault.error}
        loading={vault.loading}
        onCreateVault={(p) => { vault.createVault(p) }}
        onUnlock={(p) => { vault.unlock(p) }}
        onResetVault={handleResetVault}
      />
    )
  }

  const handleGenerate = (entries: BatchEntry[], testMode: boolean) => {
    setBatchEntries(entries)
    setBatchTestMode(testMode)
    setScreen('payment')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1
          className="text-xl font-bold cursor-pointer"
          onClick={() => setScreen('roster')}
        >
          Grove
        </h1>
        <nav className="text-sm text-muted">
          {screen !== 'roster' && (
            <button
              onClick={() => setScreen('roster')}
              className="hover:text-ink"
            >
              Roster
            </button>
          )}
        </nav>
      </header>

      {screen === 'roster' && (
        <RosterScreen
          employees={vault.roster.employees}
          schedule={vault.roster.schedule}
          notificationPermission={notifPermission}
          onUpdate={vault.updateRoster}
          onUpdateSchedule={vault.updateSchedule}
          onRequestPermission={handleRequestPermission}
          onPreview={() => setScreen('preview')}
        />
      )}

      {screen === 'preview' && (
        <BatchPreview
          employees={vault.roster.employees}
          onGenerate={handleGenerate}
          onBack={() => setScreen('roster')}
        />
      )}

      {screen === 'payment' && (
        <PaymentScreen
          entries={batchEntries}
          testMode={batchTestMode}
          onBack={() => setScreen('roster')}
        />
      )}
    </div>
  )
}
