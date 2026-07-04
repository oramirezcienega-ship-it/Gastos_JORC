import { TransactionType } from '@/lib/supabase/types'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: TransactionType
}

// Generic MX bank statement patterns
const DATE_AMOUNT_RE = /(\d{1,2}[\/-]\w{2,3}[\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})/g

function parseDate(raw: string): string | null {
  const months: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    jan: 0, feb2: 1, mar2: 2, apr: 3, may2: 4, jun2: 5,
    jul2: 6, aug: 7, sep2: 8, oct2: 9, nov2: 10, dec: 11,
  }

  const parts = raw.split(/[\/-]/)
  if (parts.length < 2) return null

  try {
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])
      const monthStr = parts[1].toLowerCase()
      const month = months[monthStr] ?? (parseInt(monthStr) - 1)
      const day = parseInt(parts[0])
      const d = new Date(year, month, day)
      if (isNaN(d.getTime())) return null
      return d.toISOString().split('T')[0]
    }
    return null
  } catch {
    return null
  }
}

export async function parsePDF(buffer: Buffer): Promise<ParsedTransaction[]> {
  // Dynamic import to avoid SSR issues
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  const text = data.text

  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    // Skip header-like lines
    if (/^(fecha|date|descripci|concepto|cargo|abono|saldo)/i.test(line)) continue

    // Pattern: date description amount
    const match = line.match(/^(\d{1,2}[\/-]\w{2,3}[\/-]?\d{0,4})\s+(.+?)\s+([\d,]+\.\d{2})\s*$/)
    if (match) {
      const date = parseDate(match[1])
      if (!date) continue
      const amount = parseFloat(match[3].replace(/,/g, ''))
      if (isNaN(amount)) continue

      // Heuristic: if description contains "abono", "deposito", "pago" → income
      const desc = match[2].toLowerCase()
      const type: TransactionType =
        /abono|depósito|deposito|pago recibido|transferencia recibida/i.test(desc)
          ? 'income'
          : 'expense'

      transactions.push({ date, description: match[2], amount, type })
    }
  }

  return transactions
}
