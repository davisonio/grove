import { useState, type FormEvent } from 'react'
import { validateAddress } from '../zip321.ts'
import type { Employee } from '../types.ts'

interface Props {
  onSave: (employee: Omit<Employee, 'id' | 'status'>) => void
  onCancel: () => void
  initial?: Employee
}

export function EmployeeForm({ onSave, onCancel, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [currency, setCurrency] = useState<'USD' | 'ZEC' | 'USDC'>(initial?.currency ?? 'ZEC')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setWarning('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const addr = address.trim()

    // USDC recipients need a non-Zcash address (e.g. Ethereum)
    if (currency === 'USDC') {
      if (!addr || addr.length < 10) {
        setError('Enter the recipient wallet address for USDC delivery')
        return
      }
    } else {
      const validation = validateAddress(addr)
      if (!validation.valid) {
        setError(validation.warning || 'Invalid address')
        return
      }
      if (validation.warning) {
        setWarning(validation.warning)
      }
    }

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError('Amount must be a positive number')
      return
    }

    onSave({
      name: name.trim(),
      address: addr,
      amount: parsed,
      currency,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white p-4 rounded-sm mb-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-muted mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-border px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-teal"
            placeholder="Alice"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full border border-border px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-teal"
            placeholder={currency === 'USDC' ? '0x... (EVM address)' : 'zs1... or u1...'}
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full border border-border px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-teal"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Currency</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as 'USD' | 'ZEC' | 'USDC')}
            className="w-full border border-border px-3 py-1.5 rounded-sm text-sm bg-white focus:outline-none focus:border-teal"
          >
            <option value="ZEC">ZEC</option>
            <option value="USD">USD (converted to ZEC)</option>
            <option value="USDC">USDC (via Zodl CrossPay)</option>
          </select>
        </div>
      </div>

      {currency === 'USDC' && (
        <p className="text-xs text-muted mt-2">
          USDC recipients are paid through Zodl's CrossPay (NEAR intents). Enter their EVM or destination chain address.
        </p>
      )}

      {error && <p className="text-error text-xs mt-2">{error}</p>}
      {warning && <p className="text-warn text-xs mt-2">{warning}</p>}

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="bg-teal text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-teal-hover"
        >
          {initial ? 'Update' : 'Add employee'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-border px-4 py-1.5 rounded-sm text-sm hover:bg-row-alt"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
