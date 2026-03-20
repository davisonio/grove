import { useState, useMemo } from 'react'
import type { BatchEntry, Payment } from '../types.ts'
import { BATCH_MAX_SIZE } from '../types.ts'
import { buildZip321Uri } from '../zip321.ts'
import { QRDisplay } from './QRDisplay.tsx'

interface Props {
  entries: BatchEntry[]
  testMode: boolean
  onBack: () => void
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function formatZec(n: number): string {
  return n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '.0')
}

function UriBlock({ uri, label }: { uri: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(uri)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted">{label || 'URI'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-teal hover:text-teal-hover text-xs"
        >
          <CopyIcon />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="bg-white border border-border p-3 rounded-sm text-xs break-all max-h-24 overflow-y-auto">
        {uri}
      </div>
      <a
        href={uri}
        className="inline-block mt-2 text-teal hover:text-teal-hover text-xs underline"
      >
        Open in wallet
      </a>
    </div>
  )
}

export function PaymentScreen({ entries, testMode, onBack }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [mode, setMode] = useState<'step' | 'batch'>('step')

  // Split ZEC/USD entries from USDC entries
  const zecEntries = entries.filter(e => e.employee.currency !== 'USDC')
  const usdcEntries = entries.filter(e => e.employee.currency === 'USDC')

  // Build batches from ZEC entries (auto-split at BATCH_MAX_SIZE)
  const batches = useMemo(() => {
    const result: BatchEntry[][] = []
    for (let i = 0; i < zecEntries.length; i += BATCH_MAX_SIZE) {
      result.push(zecEntries.slice(i, i + BATCH_MAX_SIZE))
    }
    return result
  }, [zecEntries])

  // Individual URIs for step-through mode
  const stepUris = useMemo(() => {
    return zecEntries.map(entry => {
      const payment: Payment = {
        address: entry.employee.address,
        amount: entry.zecAmount,
        memo: entry.memo,
      }
      return buildZip321Uri([payment])
    })
  }, [zecEntries])

  // Batch URIs
  const batchUris = useMemo(() => {
    return batches.map(batch => {
      const payments = batch.map(e => ({
        address: e.employee.address,
        amount: e.zecAmount,
        memo: e.memo,
      }))
      return buildZip321Uri(payments)
    })
  }, [batches])

  const totalZec = zecEntries.reduce((sum, e) => sum + e.zecAmount, 0)
  const currentEntry = zecEntries[stepIndex]
  const currentUri = stepUris[stepIndex]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">
          Payments
          {testMode && <span className="text-warn text-sm font-normal ml-2">(test mode)</span>}
        </h2>
        <button
          onClick={onBack}
          className="border border-border px-3 py-1.5 rounded-sm text-sm hover:bg-row-alt"
        >
          Back to roster
        </button>
      </div>

      {/* Mode toggle */}
      {zecEntries.length > 1 && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('step')}
            className={`px-3 py-1.5 rounded-sm text-sm ${mode === 'step' ? 'bg-teal text-white' : 'border border-border hover:bg-row-alt'}`}
          >
            One at a time
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-3 py-1.5 rounded-sm text-sm ${mode === 'batch' ? 'bg-teal text-white' : 'border border-border hover:bg-row-alt'}`}
          >
            Batch URIs ({batches.length} batch{batches.length !== 1 ? 'es' : ''})
          </button>
        </div>
      )}

      {/* Step-through mode */}
      {mode === 'step' && zecEntries.length > 0 && currentEntry && (
        <div>
          {zecEntries.length > 1 && (
            <p className="text-sm text-muted mb-4">
              Payment {stepIndex + 1} of {zecEntries.length}
            </p>
          )}

          <div className="mb-4 p-3 border border-border rounded-sm bg-white">
            <p className="text-sm font-medium">{currentEntry.employee.name}</p>
            <p className="text-xs text-muted mt-1 break-all">{currentEntry.employee.address}</p>
            <p className="text-sm mt-2 tabular-nums">{formatZec(currentEntry.zecAmount)} ZEC</p>
            <p className="text-xs text-muted mt-1">{currentEntry.memo}</p>
          </div>

          <div className="flex justify-center mb-6">
            <QRDisplay uri={currentUri} />
          </div>

          <UriBlock uri={currentUri} />

          {zecEntries.length > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setStepIndex(i => i - 1)}
                disabled={stepIndex === 0}
                className="border border-border px-4 py-1.5 rounded-sm text-sm hover:bg-row-alt disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-muted tabular-nums">
                {stepIndex + 1} / {zecEntries.length}
              </span>
              <button
                onClick={() => setStepIndex(i => i + 1)}
                disabled={stepIndex === zecEntries.length - 1}
                className="bg-teal text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-teal-hover disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Batch mode */}
      {mode === 'batch' && (
        <div>
          {batches.map((batch, batchIdx) => (
            <div key={batchIdx} className="mb-8">
              {batches.length > 1 && (
                <p className="text-sm font-medium mb-3">
                  Batch {batchIdx + 1} of {batches.length} ({batch.length} recipient{batch.length !== 1 ? 's' : ''})
                </p>
              )}

              <div className="flex justify-center mb-4">
                <QRDisplay uri={batchUris[batchIdx]} />
              </div>

              <UriBlock uri={batchUris[batchIdx]} label={batches.length > 1 ? `Batch ${batchIdx + 1} URI` : 'URI'} />

              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-1.5 pr-3 font-medium">Name</th>
                    <th className="py-1.5 pr-3 font-medium text-right">ZEC</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.map((entry, i) => (
                    <tr key={entry.employee.id} className={i % 2 === 1 ? 'bg-row-alt' : ''}>
                      <td className="py-1.5 pr-3">{entry.employee.name}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{formatZec(entry.zecAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <p className="text-xs text-muted">
            Zodl currently processes the first recipient in a multi-payment URI. Zkool supports all recipients. Use "One at a time" mode for Zodl.
          </p>
        </div>
      )}

      {/* USDC recipients */}
      {usdcEntries.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-bold mb-3">USDC payments (via Zodl CrossPay)</h3>
          <p className="text-xs text-muted mb-4">
            Open Zodl, tap CrossPay, select USDC as the destination currency, and enter each recipient's details below.
          </p>
          {usdcEntries.map(entry => (
            <div key={entry.employee.id} className="border border-border rounded-sm p-3 mb-3 bg-white">
              <p className="text-sm font-medium">{entry.employee.name}</p>
              <p className="text-xs text-muted mt-1 break-all">{entry.employee.address}</p>
              <p className="text-sm mt-2 tabular-nums">{entry.employee.amount} USDC</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-border text-xs text-muted">
        {zecEntries.length > 0 && (
          <p>{zecEntries.length} ZEC recipient{zecEntries.length !== 1 ? 's' : ''}, {formatZec(totalZec)} ZEC total</p>
        )}
        {usdcEntries.length > 0 && (
          <p>{usdcEntries.length} USDC recipient{usdcEntries.length !== 1 ? 's' : ''}, {usdcEntries.reduce((s, e) => s + e.employee.amount, 0).toFixed(2)} USDC total</p>
        )}
      </div>
    </div>
  )
}
