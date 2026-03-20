import { useState, type FormEvent } from 'react'
import { GroveLogo } from './GroveLogo.tsx'

interface Props {
  hasExistingVault: boolean
  error: string | null
  loading: boolean
  onCreateVault: (passphrase: string) => void
  onUnlock: (passphrase: string) => void
  onResetVault: () => void
}

export function UnlockScreen({ hasExistingVault, error, loading, onCreateVault, onUnlock, onResetVault }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')
  const [showReset, setShowReset] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!passphrase) {
      setLocalError('Enter a passphrase')
      return
    }

    if (hasExistingVault) {
      onUnlock(passphrase)
    } else {
      if (passphrase !== confirm) {
        setLocalError('Passphrases do not match')
        return
      }
      if (passphrase.length < 6) {
        setLocalError('Passphrase must be at least 6 characters')
        return
      }
      onCreateVault(passphrase)
    }
  }

  const handleReset = () => {
    onResetVault()
    setShowReset(false)
    setPassphrase('')
    setConfirm('')
    setLocalError('')
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <GroveLogo size={64} className="mb-5" />
        <h1 className="text-2xl font-bold mb-2">Grove</h1>
        <p className="text-sm text-muted mb-2">Shielded payroll for Zcash.</p>
        <p className="text-xs text-muted mb-10">Everything encrypted in your browser with Web Crypto API. Nothing leaves this device.</p>

        <label className="block text-sm text-muted mb-1" htmlFor="passphrase">
          Passphrase
        </label>
        <input
          id="passphrase"
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          className="w-full border border-border bg-white px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-teal"
          autoFocus
          disabled={loading}
        />

        {!hasExistingVault && (
          <>
            <label className="block text-sm text-muted mb-1 mt-4" htmlFor="confirm">
              Confirm passphrase
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border border-border bg-white px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-teal"
              disabled={loading}
            />
          </>
        )}

        {displayError && (
          <p className="text-error text-sm mt-3">{displayError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-teal text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-teal-hover disabled:opacity-50"
        >
          {loading ? '...' : hasExistingVault ? 'Unlock' : 'Create vault'}
        </button>

        {hasExistingVault && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted">
              Encrypted data found in this browser.
            </p>
            {!showReset ? (
              <button
                type="button"
                onClick={() => setShowReset(true)}
                className="text-xs text-muted hover:text-error mt-2"
              >
                Forgot passphrase?
              </button>
            ) : (
              <div className="mt-3 p-3 border border-error/30 bg-error-bg rounded-sm">
                <p className="text-xs text-error mb-2">
                  This will permanently delete all saved data. There is no recovery.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs bg-error text-white px-3 py-1 rounded-sm hover:opacity-80"
                  >
                    Delete vault
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className="text-xs border border-border px-3 py-1 rounded-sm hover:bg-row-alt"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
