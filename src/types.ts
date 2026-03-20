export interface Employee {
  id: string
  name: string
  address: string
  amount: number
  currency: 'USD' | 'ZEC' | 'USDC'
  status: 'new' | 'test-sent' | 'active'
}

export interface PaySchedule {
  enabled: boolean
  startDate: string
  lastNotified: string | null
}

export interface Roster {
  employees: Employee[]
  schedule: PaySchedule | null
  updatedAt: number
}

export interface Payment {
  address: string
  amount: number
  memo?: string
}

export interface BatchEntry {
  employee: Employee
  zecAmount: number
  memo: string
}

export type Screen = 'roster' | 'preview' | 'payment'

export const BATCH_MAX_SIZE = 7
