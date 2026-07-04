import * as XLSX from 'xlsx'
import { TransactionType } from '@/lib/supabase/types'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: TransactionType
}

export function parseExcel(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { raw: false })

  const transactions: ParsedTransaction[] = []

  for (const row of rows) {
    // Normalize keys to lowercase
    const normalized: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      normalized[k.toLowerCase().trim()] = String(v ?? '').trim()
    }

    const dateRaw = normalized['fecha'] ?? normalized['date'] ?? normalized['día'] ?? ''
    const descRaw = normalized['descripcion'] ?? normalized['descripción'] ?? normalized['concepto'] ?? normalized['description'] ?? ''
    const amountRaw = normalized['monto'] ?? normalized['importe'] ?? normalized['cargo'] ?? normalized['amount'] ?? ''
    const creditRaw = normalized['abono'] ?? normalized['credito'] ?? normalized['crédito'] ?? ''

    if (!dateRaw || !descRaw) continue

    let date: string
    try {
      const d = new Date(dateRaw)
      if (isNaN(d.getTime())) continue
      date = d.toISOString().split('T')[0]
    } catch {
      continue
    }

    // If there's a credit column, credits are income
    if (creditRaw && parseFloat(creditRaw.replace(/[^0-9.-]/g, '')) > 0) {
      transactions.push({
        date,
        description: descRaw,
        amount: Math.abs(parseFloat(creditRaw.replace(/[^0-9.-]/g, ''))),
        type: 'income',
      })
    }

    if (amountRaw) {
      const amount = parseFloat(amountRaw.replace(/[^0-9.-]/g, ''))
      if (!isNaN(amount) && amount !== 0) {
        transactions.push({
          date,
          description: descRaw,
          amount: Math.abs(amount),
          type: amount < 0 ? 'income' : 'expense',
        })
      }
    }
  }

  return transactions
}
