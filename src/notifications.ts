import type { PaySchedule } from './types.ts'

const BIWEEKLY_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Check if today falls on a biweekly pay cycle day.
 * Returns true if today is on or past the next pay date
 * and we haven't already notified for this cycle.
 */
export function isPayDay(schedule: PaySchedule): boolean {
  if (!schedule.enabled) return false

  const start = new Date(schedule.startDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Walk forward from start date in 14-day increments
  // to find the current or most recent pay date
  let payDate = new Date(start)
  while (payDate < today) {
    payDate = new Date(payDate.getTime() + BIWEEKLY_MS)
  }

  // Check if today matches a pay date (or we're past one we missed)
  const prevPayDate = new Date(payDate.getTime() - BIWEEKLY_MS)
  const isOnOrPastPayDate = today >= prevPayDate && today < payDate

  // The relevant pay date for this cycle
  const relevantDate = prevPayDate.toISOString().slice(0, 10)

  // Already notified for this cycle?
  if (schedule.lastNotified === relevantDate) return false

  return isOnOrPastPayDate
}

/**
 * Get the next upcoming pay date from schedule.
 */
export function getNextPayDate(schedule: PaySchedule): Date {
  const start = new Date(schedule.startDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let payDate = new Date(start)
  while (payDate <= today) {
    payDate = new Date(payDate.getTime() + BIWEEKLY_MS)
  }

  return payDate
}

/**
 * Get the current cycle's pay date (the most recent one on or before today).
 */
export function getCurrentPayDate(schedule: PaySchedule): string {
  const start = new Date(schedule.startDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let payDate = new Date(start)
  while (payDate.getTime() + BIWEEKLY_MS <= today.getTime()) {
    payDate = new Date(payDate.getTime() + BIWEEKLY_MS)
  }

  return payDate.toISOString().slice(0, 10)
}

/**
 * Request notification permission from the browser.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Show a browser notification for payday.
 */
export function showPaydayNotification(employeeCount: number, totalZec?: number): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const body = totalZec
    ? `${employeeCount} recipients, ~${totalZec.toFixed(2)} ZEC total`
    : `${employeeCount} recipients ready`

  new Notification('Grove: Payroll is due', {
    body,
    icon: '/favicon.svg',
  })
}
