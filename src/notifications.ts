import type { PaySchedule } from './types.ts'

const BIWEEKLY_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Check if today falls on a biweekly pay cycle day.
 * Returns true if we're on or past a pay date and haven't notified yet.
 */
export function isPayDay(schedule: PaySchedule): boolean {
  if (!schedule.enabled) return false

  const start = new Date(schedule.startDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Future start date: no pay day yet
  if (start > today) return false

  // Find the most recent pay date on or before today
  let payDate = new Date(start)
  while (payDate.getTime() + BIWEEKLY_MS <= today.getTime()) {
    payDate = new Date(payDate.getTime() + BIWEEKLY_MS)
  }

  // payDate is now the most recent cycle date <= today
  const relevantDate = payDate.toISOString().slice(0, 10)

  if (schedule.lastNotified === relevantDate) return false

  return payDate <= today
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
