import { useState, useRef } from 'react'
import type { Employee, PaySchedule } from '../types.ts'
import { EmployeeForm } from './EmployeeForm.tsx'
import { EmployeeTable } from './EmployeeTable.tsx'
import { ScheduleSettings } from './ScheduleSettings.tsx'
import { importCsv, downloadCsv, downloadSampleCsv } from '../csv.ts'

interface Props {
  employees: Employee[]
  schedule: PaySchedule | null
  notificationPermission: NotificationPermission | null
  onUpdate: (updater: (employees: Employee[]) => Employee[]) => void
  onUpdateSchedule: (schedule: PaySchedule) => void
  onRequestPermission: () => void
  onPreview: () => void
}

export function RosterScreen({
  employees,
  schedule,
  notificationPermission,
  onUpdate,
  onUpdateSchedule,
  onRequestPermission,
  onPreview,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<Array<{ row: number; message: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = (data: Omit<Employee, 'id' | 'status'>) => {
    onUpdate(list => [...list, {
      ...data,
      id: crypto.randomUUID(),
      status: 'new' as const,
    }])
    setShowForm(false)
  }

  const handleEdit = (data: Omit<Employee, 'id' | 'status'>) => {
    onUpdate(list => list.map(emp =>
      emp.id === editingId ? { ...emp, ...data } : emp
    ))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onUpdate(list => list.filter(emp => emp.id !== id))
  }

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = importCsv(reader.result as string)
      setImportErrors(result.errors)
      if (result.employees.length > 0) {
        onUpdate(list => [...list, ...result.employees])
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const editingEmployee = editingId ? employees.find(e => e.id === editingId) : undefined

  const zecTotal = employees.reduce((sum, e) => {
    if (e.currency === 'ZEC') return sum + e.amount
    return sum
  }, 0)

  const usdCount = employees.filter(e => e.currency === 'USD').length
  const usdcCount = employees.filter(e => e.currency === 'USDC').length

  return (
    <div>
      <ScheduleSettings
        schedule={schedule}
        onSave={onUpdateSchedule}
        notificationPermission={notificationPermission}
        onRequestPermission={onRequestPermission}
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">Roster</h2>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="bg-teal text-white px-3 py-1.5 rounded-sm text-sm font-medium hover:bg-teal-hover"
          >
            Add employee
          </button>
          <label className="border border-border px-3 py-1.5 rounded-sm text-sm cursor-pointer hover:bg-row-alt inline-flex items-center">
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvImport}
              className="hidden"
            />
          </label>
          {employees.length > 0 && (
            <button
              onClick={() => downloadCsv(employees, 'grove-roster.csv')}
              className="border border-border px-3 py-1.5 rounded-sm text-sm hover:bg-row-alt"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {employees.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-sm text-muted mb-4">No employees yet.</p>
          <button
            onClick={downloadSampleCsv}
            className="text-teal hover:text-teal-hover text-xs underline"
          >
            Download sample CSV
          </button>
        </div>
      )}

      {showForm && !editingId && (
        <EmployeeForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {editingId && editingEmployee && (
        <EmployeeForm
          onSave={handleEdit}
          onCancel={() => setEditingId(null)}
          initial={editingEmployee}
        />
      )}

      {importErrors.length > 0 && (
        <div className="bg-error-bg border border-error/20 p-3 rounded-sm mb-4">
          <p className="text-sm font-medium text-error mb-1">Import errors:</p>
          {importErrors.map((err, i) => (
            <p key={i} className="text-xs text-error">Row {err.row}: {err.message}</p>
          ))}
          <button
            onClick={() => setImportErrors([])}
            className="text-xs text-muted mt-2 hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      {employees.length > 0 && (
        <>
          <EmployeeTable
            employees={employees}
            onEdit={(id) => { setEditingId(id); setShowForm(false) }}
            onDelete={handleDelete}
          />

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted">{employees.length} recipient{employees.length !== 1 ? 's' : ''}</span>
              {zecTotal > 0 && (
                <span className="ml-4">{zecTotal.toFixed(4)} ZEC</span>
              )}
              {usdCount > 0 && (
                <span className="text-muted ml-2">+ {usdCount} in USD</span>
              )}
              {usdcCount > 0 && (
                <span className="text-muted ml-2">+ {usdcCount} in USDC</span>
              )}
            </div>
            <button
              onClick={onPreview}
              className="bg-teal text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-teal-hover"
            >
              Preview batch
            </button>
          </div>
        </>
      )}
    </div>
  )
}
