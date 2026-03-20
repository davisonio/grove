import { useState, type FormEvent } from 'react'
import type { PaySchedule } from '../types.ts'
import { getNextPayDate } from '../notifications.ts'

interface Props {
  schedule: PaySchedule | null
  onSave: (schedule: PaySchedule) => void
  notificationPermission: NotificationPermission | null
  onRequestPermission: () => void
}

export function ScheduleSettings({ schedule, onSave, notificationPermission, onRequestPermission }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [startDate, setStartDate] = useState(schedule?.startDate ?? '')
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!startDate) return

    onSave({
      enabled,
      startDate,
      lastNotified: schedule?.lastNotified ?? null,
    })
    setExpanded(false)
  }

  const nextPay = schedule?.enabled ? getNextPayDate(schedule) : null

  if (!expanded) {
    return (
      <div className="flex items-center justify-between text-sm py-3 border-b border-border mb-4">
        <div>
          {schedule?.enabled && nextPay ? (
            <span>Next payroll: {nextPay.toLocaleDateString()}</span>
          ) : (
            <span className="text-muted">No pay schedule set</span>
          )}
          {notificationPermission === 'denied' && schedule?.enabled && (
            <span className="text-warn text-xs ml-2">(notifications blocked)</span>
          )}
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="text-teal hover:text-teal-hover text-xs"
        >
          {schedule?.enabled ? 'Edit schedule' : 'Set schedule'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-white p-4 rounded-sm mb-4">
      <p className="text-sm font-medium mb-3">Biweekly pay schedule</p>

      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            className="accent-teal"
          />
          Enable notifications
        </label>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-muted mb-1">First pay date</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="border border-border px-3 py-1.5 rounded-sm text-sm focus:outline-none focus:border-teal"
        />
      </div>

      {enabled && notificationPermission !== 'granted' && (
        <div className="mb-3">
          <button
            type="button"
            onClick={onRequestPermission}
            className="text-teal hover:text-teal-hover text-xs underline"
          >
            Allow browser notifications
          </button>
          {notificationPermission === 'denied' && (
            <p className="text-warn text-xs mt-1">
              Notifications are blocked. Check your browser settings.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted mb-3">
        Grove checks on each visit. If a pay date has passed, you'll get a reminder.
      </p>

      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-teal text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-teal-hover"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="border border-border px-4 py-1.5 rounded-sm text-sm hover:bg-row-alt"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
