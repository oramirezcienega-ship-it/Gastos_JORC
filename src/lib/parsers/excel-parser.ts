import * as XLSX from 'xlsx'
import { TransactionType } from '@/lib/supabase/types'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: TransactionType
}

// Expected template columns: Fecha | Descripcion | Monto | Tipo
// Fecha:       DD/MM/YYYY  or  YYYY-MM-DD  or any Date serial Excel uses
// Descripcion: free text
// Monto:       positive number (no commas)
// Tipo:        gasto | ingreso | inversion  (optional, defaults to gasto)

function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim()

  // M/D/YY or M/D/YYYY (Nu Bank Mexico format: "5/29/26")
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (mdy) {
    const month = parseInt(mdy[1]) - 1
    const day = parseInt(mdy[2])
    const year = mdy[3].length === 2 ? 2000 + parseInt(mdy[3]) : parseInt(mdy[3])
    // Distinguish M/D/YY from D/M/YY: if day > 12 first part must be month
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString().split('T')[0]
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const day = parseInt(dmy[1])
    const month = parseInt(dmy[2]) - 1
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3])
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString().split('T')[0]
  }

  // YYYY-MM-DD (ISO)
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]))
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // JS fallback (handles "Jun 1, 2026" etc.)
  const fallback = new Date(s)
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 2000) {
    return fallback.toISOString().split('T')[0]
  }

  return null
}

function parseAmount(raw: string): number | null {
  // Strip currency symbols, spaces, commas — keep digits, dot, minus
  const cleaned = raw.replace(/[^0-9.\-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function parseType(raw: string, description: string, amount: number): TransactionType {
  const t = raw.toLowerCase().trim()
  const desc = description.toLowerCase()

  // Nu Bank: "egreso" = purchase = expense
  if (t === 'egreso') return 'expense'

  // Nu Bank: "ingreso" on a credit card = payment made to card → skip treating as income
  // unless it's a real deposit (salary, transfer received)
  if (t === 'ingreso' || t === 'income') {
    // Card payments ("gracias por tu pago") are not real income
    if (/gracias por tu pago|pago de tarjeta|pago tarjeta/i.test(desc)) return 'expense'
    return 'income'
  }

  if (/invers|fondo|cetes|bono|etf/i.test(desc)) return 'investment'

  // Negative amount on a credit card = credit/payment, positive = charge
  return amount > 0 ? 'expense' : 'income'
}

export function parseExcel(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    raw: false,
    dateNF: 'mm/dd/yy',
    defval: '',
  })

  const transactions: ParsedTransaction[] = []

  for (const row of rows) {
    // Normalize keys: lowercase + trim (handles "Fecha Operación", " Tipo ", etc.)
    const r: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim()] = String(v ?? '').trim()
    }

    // Accept any of these column name variants
    const fechaRaw =
      r['fecha operación'] ?? r['fecha operacion'] ??
      r['fecha'] ?? r['date'] ?? r['día'] ?? r['dia'] ?? ''

    const descRaw =
      r['descripción'] ?? r['descripcion'] ??
      r['description'] ?? r['concepto'] ?? r['comercio'] ?? r['establecimiento'] ?? ''

    const montoRaw =
      r['monto (mxn)'] ?? r['monto'] ?? r['importe'] ??
      r['amount'] ?? r['cargo'] ?? r['valor'] ?? r['monto mx'] ?? ''

    const tipoRaw =
      r['tipo'] ?? r['type'] ?? r['categoria'] ?? r['categoría'] ?? ''

    const date = parseDate(fechaRaw)
    if (!date) continue
    if (!descRaw) continue

    const amount = parseAmount(montoRaw)
    if (amount === null || amount === 0) continue

    const type = parseType(tipoRaw, descRaw, amount)

    // Skip Nu Bank card-payment rows — they're not real expenses or income
    if (type === 'expense' && /gracias por tu pago/i.test(descRaw)) continue

    transactions.push({
      date,
      description: descRaw,
      amount: Math.abs(amount),
      type,
    })
  }

  return transactions
}
