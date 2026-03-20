import { describe, expect, it } from 'vitest'
import { getCurrentPayDate, getNextPayDate, isPayDay } from './notifications.ts'

describe('payday scheduling', () => {
  const schedule = {
    enabled: true,
    startDate: '2026-03-20',
    lastNotified: null,
  }

  it('treats the configured start date as the same local calendar day', () => {
    const now = new Date(2026, 2, 20, 12, 0, 0)

    expect(isPayDay(schedule, now)).toBe(true)
    expect(getCurrentPayDate(schedule, now)).toBe('2026-03-20')
  })

  it('returns the next pay date in 14-day increments', () => {
    const nextPayDate = getNextPayDate(schedule, new Date(2026, 2, 20, 12, 0, 0))

    expect(nextPayDate.getFullYear()).toBe(2026)
    expect(nextPayDate.getMonth()).toBe(3)
    expect(nextPayDate.getDate()).toBe(3)
  })

  it('does not notify twice for the same pay cycle', () => {
    const alreadyNotified = {
      ...schedule,
      lastNotified: '2026-03-20',
    }

    expect(isPayDay(alreadyNotified, new Date(2026, 2, 20, 12, 0, 0))).toBe(false)
  })
})
