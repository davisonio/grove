import { useState, useEffect, useRef } from 'react'
import type { BatchEntry } from './types.ts'
import { useVault } from './hooks/useVault.ts'
import { isPayDay, getCurrentPayDate, showPaydayNotification, requestNotificationPermission } from './notifications.ts'
import { clearVault } from './storage.ts'
import { GroveLogo } from './components/GroveLogo.tsx'
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
  const notifiedPayDate = useRef<string | null>(null)

  // Check for payday notification after vault unlock
  useEffect(() => {
    if (vault.locked) {
      notifiedPayDate.current = null
      return
    }

    const schedule = vault.roster.schedule
    if (!schedule || !schedule.enabled) return
    if (!isPayDay(schedule)) return

    if (notifPermission !== 'granted') return

    const payDate = getCurrentPayDate(schedule)
    if (notifiedPayDate.current === payDate) return

    const empCount = vault.roster.employees.length
    if (empCount === 0) return

    const total = vault.roster.employees.reduce((sum, e) => {
      if (e.currency === 'ZEC') return sum + e.amount
      return sum
    }, 0)

    const shown = showPaydayNotification(empCount, total > 0 ? total : undefined)
    if (!shown) return

    notifiedPayDate.current = payDate
    vault.markNotified(payDate)
  }, [vault.locked, vault.roster.schedule, vault.roster.employees, vault.markNotified, notifPermission])

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
          className="text-xl font-bold cursor-pointer flex items-center gap-2"
          onClick={() => setScreen('roster')}
        >
          <GroveLogo size={28} />
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

      <footer className="mt-16 pt-4 border-t border-border text-xs text-muted text-center pb-4">
        <a href="https://github.com/davisonio/grove" target="_blank" rel="noopener noreferrer" className="hover:text-teal">
          Source on GitHub
        </a>
      </footer>
    </div>
  )
}
