import { useState, useMemo } from 'react'
import type { Employee, BatchEntry } from '../types.ts'
import { usePrice } from '../hooks/usePrice.ts'
import { convertUsdToZec } from '../price.ts'
import { validateAddress } from '../zip321.ts'

interface Props {
  employees: Employee[]
  onGenerate: (entries: BatchEntry[], testMode: boolean) => void
  onBack: () => void
}

function truncateAddress(addr: string): string {
  if (addr.length <= 24) return addr
  return addr.slice(0, 12) + '...' + addr.slice(-8)
}

const TEST_AMOUNT = 0.0001

export function BatchPreview({ employees, onGenerate, onBack }: Props) {
  const [testMode, setTestMode] = useState(false)
  const hasUsd = employees.some(e => e.currency === 'USD')
  const { usdPerZec, fetchedAt, loading, error, refresh } = usePrice(hasUsd)

  const invalidRecipients = useMemo(() => {
    return employees
      .filter(emp => emp.currency !== 'USDC')
      .map(emp => {
        const validation = validateAddress(emp.address)
        if (validation.valid) return null
        return {
          name: emp.name,
          message: validation.warning || 'Invalid address',
        }
      })
      .filter((entry): entry is { name: string; message: string } => entry !== null)
  }, [employees])

  const entries: BatchEntry[] = useMemo(() => {
    return employees.map(emp => {
      let zecAmount: number

      if (emp.currency === 'USDC') {
        // USDC entries pass through with their USD amount; handled separately in PaymentScreen
        zecAmount = 0
      } else if (testMode) {
        zecAmount = TEST_AMOUNT
      } else if (emp.currency === 'USD' && usdPerZec) {
        zecAmount = convertUsdToZec(emp.amount, usdPerZec)
      } else if (emp.currency === 'USD') {
        zecAmount = 0
      } else {
        zecAmount = emp.amount
      }

      return {
        employee: emp,
        zecAmount: Math.round(zecAmount * 1e8) / 1e8,
        memo: emp.currency === 'USDC' ? '' : `Grove payout - ${emp.name}`,
      }
    })
  }, [employees, usdPerZec, testMode])

  const zecEntries = entries.filter(e => e.employee.currency !== 'USDC')
  const usdcEntries = entries.filter(e => e.employee.currency === 'USDC')
  const totalZec = zecEntries.reduce((sum, e) => sum + e.zecAmount, 0)
  const totalUsdc = usdcEntries.reduce((sum, e) => sum + e.employee.amount, 0)
  const priceReady = !hasUsd || usdPerZec !== null

  const priceAge = fetchedAt
    ? Math.round((Date.now() - fetchedAt) / 1000)
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Batch preview</h2>
        <button
          onClick={onBack}
          className="border border-border px-3 py-1.5 rounded-sm text-sm hover:bg-row-alt"
        >
          Back to roster
        </button>
      </div>

      {!testMode && employees.some(e => e.status === 'new') && (
        <div className="bg-warn-bg border border-warn/20 p-3 rounded-sm mb-4">
          <p className="text-sm text-warn">
            {employees.filter(e => e.status === 'new').length} recipient{employees.filter(e => e.status === 'new').length !== 1 ? 's have' : ' has'} not been tested yet. Run a test batch first to verify addresses.
          </p>
        </div>
      )}

      {invalidRecipients.length > 0 && (
        <div className="bg-error-bg border border-error/20 p-3 rounded-sm mb-4">
          <p className="text-sm text-error mb-1">
            Fix {invalidRecipients.length} invalid recipient{invalidRecipients.length !== 1 ? 's' : ''} before generating payments.
          </p>
          {invalidRecipients.map((issue) => (
            <p key={`${issue.name}-${issue.message}`} className="text-xs text-error">
              {issue.name}: {issue.message}
            </p>
          ))}
        </div>
      )}

      {hasUsd && (
        <div className="mb-4 text-sm">
          {loading && <span className="text-muted">Fetching ZEC price...</span>}
          {error && (
            <span className="text-error">
              Price fetch failed: {error}.{' '}
              <button onClick={refresh} className="text-teal hover:text-teal-hover underline">Retry</button>
            </span>
          )}
          {usdPerZec && (
            <span className="text-muted">
              1 ZEC = ${usdPerZec.toFixed(2)} USD
              {priceAge !== null && ` (${priceAge}s ago)`}
              {' '}
              <button onClick={refresh} className="text-teal hover:text-teal-hover underline">Refresh</button>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={testMode}
            onChange={e => setTestMode(e.target.checked)}
            className="accent-teal"
          />
          Test mode ({TEST_AMOUNT} ZEC per recipient)
        </label>
      </div>

      {/* ZEC / USD recipients */}
      {zecEntries.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Address</th>
                <th className="py-2 pr-4 font-medium text-right">Original</th>
                <th className="py-2 pr-4 font-medium text-right">ZEC</th>
                <th className="py-2 font-medium">Memo</th>
              </tr>
            </thead>
            <tbody>
              {zecEntries.map((entry, i) => (
                <tr key={entry.employee.id} className={i % 2 === 1 ? 'bg-row-alt' : ''}>
                  <td className="py-2 pr-4">{entry.employee.name}</td>
                  <td className="py-2 pr-4 text-muted" title={entry.employee.address}>
                    {truncateAddress(entry.employee.address)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {entry.employee.amount} {entry.employee.currency}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {entry.zecAmount > 0 ? entry.zecAmount.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.0') : '\u2014'}
                  </td>
                  <td className="py-2 text-muted text-xs">{entry.memo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* USDC recipients */}
      {usdcEntries.length > 0 && (
        <div className="overflow-x-auto mb-4">
          <p className="text-xs text-muted mb-2">USDC recipients (via Zodl CrossPay)</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Address</th>
                <th className="py-2 pr-4 font-medium text-right">USDC</th>
              </tr>
            </thead>
            <tbody>
              {usdcEntries.map((entry, i) => (
                <tr key={entry.employee.id} className={i % 2 === 1 ? 'bg-row-alt' : ''}>
                  <td className="py-2 pr-4">{entry.employee.name}</td>
                  <td className="py-2 pr-4 text-muted text-xs" title={entry.employee.address}>
                    {truncateAddress(entry.employee.address)}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {testMode ? '0.01' : entry.employee.amount} USDC
                    {testMode && <span className="text-warn text-xs ml-1">(test)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <div className="text-sm">
          {totalZec > 0 && (
            <span className="font-medium">{totalZec.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.0')} ZEC</span>
          )}
          {testMode && totalZec > 0 && <span className="text-muted ml-2">(test amounts)</span>}
          {totalUsdc > 0 && (
            <span className={totalZec > 0 ? 'ml-4' : ''}>{testMode ? (usdcEntries.length * 0.01).toFixed(2) : totalUsdc.toFixed(2)} USDC</span>
          )}
        </div>
        <button
          onClick={() => onGenerate(entries, testMode)}
          disabled={invalidRecipients.length > 0 || !priceReady || (totalZec === 0 && usdcEntries.length === 0)}
          className="bg-teal text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-teal-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate payments
        </button>
      </div>
    </div>
  )
}
