import { useState } from 'react'
import type { Employee } from '../types.ts'
import { isTransparentAddress } from '../zip321.ts'

interface Props {
  employees: Employee[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Employee['status']) => void
}

function truncateAddress(addr: string): string {
  if (addr.length <= 20) return addr
  return addr.slice(0, 10) + '...' + addr.slice(-8)
}

const statusStyles: Record<Employee['status'], string> = {
  'new': 'text-muted',
  'test-sent': 'text-warn',
  'active': 'text-teal',
}

const nextStatus: Record<Employee['status'], { label: string; value: Employee['status'] }> = {
  'new': { label: 'Mark tested', value: 'test-sent' },
  'test-sent': { label: 'Mark active', value: 'active' },
  'active': { label: 'Reset status', value: 'new' },
}

export function EmployeeTable({ employees, onEdit, onDelete, onStatusChange }: Props) {
  const [expandedAddr, setExpandedAddr] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Address</th>
            <th className="py-2 pr-4 font-medium text-right">Amount</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp, i) => (
            <tr
              key={emp.id}
              className={i % 2 === 1 ? 'bg-row-alt' : ''}
            >
              <td className="py-2 pr-4">{emp.name}</td>
              <td className="py-2 pr-4">
                <button
                  type="button"
                  onClick={() => setExpandedAddr(expandedAddr === emp.id ? null : emp.id)}
                  className="text-left hover:text-teal"
                  title="Click to expand"
                >
                  <span className={isTransparentAddress(emp.address) ? 'text-warn' : ''}>
                    {expandedAddr === emp.id ? emp.address : truncateAddress(emp.address)}
                  </span>
                </button>
                {isTransparentAddress(emp.address) && (
                  <span className="text-warn text-xs ml-2">(transparent)</span>
                )}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {emp.amount} {emp.currency}
              </td>
              <td className="py-2 pr-4 text-xs">
                <span className={statusStyles[emp.status]}>{emp.status}</span>
                <button
                  onClick={() => onStatusChange(emp.id, nextStatus[emp.status].value)}
                  className="ml-2 text-teal hover:text-teal-hover underline"
                >
                  {nextStatus[emp.status].label}
                </button>
              </td>
              <td className="py-2 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(emp.id)}
                  className="text-teal hover:text-teal-hover text-xs mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(emp.id)}
                  className="text-error hover:opacity-70 text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
