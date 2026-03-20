import Papa from 'papaparse'
import type { Employee } from './types.ts'
import { validateAddress } from './zip321.ts'

interface CsvRow {
  name: string
  address: string
  amount: string
  currency?: string
}

interface ImportResult {
  employees: Employee[]
  errors: Array<{ row: number; message: string }>
}

const SAMPLE_CSV = `name,address,amount,currency
Alice,zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm80pev0md2lnv6e0qm6gvk8,1.5,ZEC
Bob,zs1tvq0ux40ym02phkr5nu3044u5xa3dwgqqlccad3xpc00m5n4mckqmpmt47rug8hl04tqjhz46ky2,2000,USD
Carol,0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18,500,USDC`

export function getSampleCsv(): string {
  return SAMPLE_CSV
}

export function downloadSampleCsv(): void {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'grove-sample.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function importCsv(csvText: string): ImportResult {
  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
  })

  const employees: Employee[] = []
  const errors: Array<{ row: number; message: string }> = []

  parsed.data.forEach((row, i) => {
    const rowNum = i + 2

    if (!row.name?.trim()) {
      errors.push({ row: rowNum, message: 'Missing name' })
      return
    }

    if (!row.address?.trim()) {
      errors.push({ row: rowNum, message: 'Missing address' })
      return
    }

    const amount = parseFloat(row.amount)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: rowNum, message: `Invalid amount: "${row.amount}"` })
      return
    }

    const currency = row.currency?.trim().toUpperCase()
    if (currency && currency !== 'USD' && currency !== 'ZEC' && currency !== 'USDC') {
      errors.push({ row: rowNum, message: `Unknown currency: "${row.currency}"` })
      return
    }

    const resolvedCurrency = (currency as 'USD' | 'ZEC' | 'USDC') || 'ZEC'

    // USDC recipients skip Zcash address validation
    if (resolvedCurrency !== 'USDC') {
      const validation = validateAddress(row.address.trim())
      if (!validation.valid) {
        errors.push({ row: rowNum, message: validation.warning || 'Invalid address' })
        return
      }
    }

    employees.push({
      id: crypto.randomUUID(),
      name: row.name.trim(),
      address: row.address.trim(),
      amount,
      currency: resolvedCurrency,
      status: 'new',
    })
  })

  return { employees, errors }
}

export function exportCsv(employees: Employee[]): string {
  const data = employees.map(e => ({
    name: e.name,
    address: e.address,
    amount: e.amount,
    currency: e.currency,
  }))

  return Papa.unparse(data)
}

export function downloadCsv(employees: Employee[], filename: string): void {
  const csv = exportCsv(employees)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
