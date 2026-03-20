import type { PaySchedule } from './types.ts'

const BIWEEKLY_DAYS = 14

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return startOfLocalDay(next)
}

function getCurrentCyclePayDate(schedule: PaySchedule, now: Date): Date | null {
  const start = parseLocalDate(schedule.startDate)
  const today = startOfLocalDay(now)

  if (start > today) return null

  let payDate = start
  let nextPayDate = addDays(payDate, BIWEEKLY_DAYS)

  while (nextPayDate <= today) {
    payDate = nextPayDate
    nextPayDate = addDays(payDate, BIWEEKLY_DAYS)
  }

  return payDate
}

/**
 * Check if today falls on a biweekly pay cycle day.
 * Returns true if we're on or past a pay date and haven't notified yet.
 */
export function isPayDay(schedule: PaySchedule, now = new Date()): boolean {
  if (!schedule.enabled) return false

  const payDate = getCurrentCyclePayDate(schedule, now)
  if (!payDate) return false

  const relevantDate = formatLocalDate(payDate)
  if (schedule.lastNotified === relevantDate) return false

  return true
}

/**
 * Get the next upcoming pay date from schedule.
 */
export function getNextPayDate(schedule: PaySchedule, now = new Date()): Date {
  const start = parseLocalDate(schedule.startDate)
  const today = startOfLocalDay(now)

  if (start > today) return start

  let payDate = new Date(start)
  while (payDate <= today) {
    payDate = addDays(payDate, BIWEEKLY_DAYS)
  }

  return payDate
}

/**
 * Get the current cycle's pay date (the most recent one on or before today).
 */
export function getCurrentPayDate(schedule: PaySchedule, now = new Date()): string {
  const payDate = getCurrentCyclePayDate(schedule, now) ?? parseLocalDate(schedule.startDate)
  return formatLocalDate(payDate)
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
export function showPaydayNotification(employeeCount: number, totalZec?: number): boolean {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  const body = totalZec
    ? `${employeeCount} recipients, ~${totalZec.toFixed(2)} ZEC total`
    : `${employeeCount} recipients ready`

  new Notification('Grove: Payroll is due', {
    body,
    icon: '/favicon.svg',
  })

  return true
}
