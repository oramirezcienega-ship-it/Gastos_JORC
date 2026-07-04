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

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const day = parseInt(dmy[1])
    const month = parseInt(dmy[2]) - 1
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3])
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // YYYY-MM-DD (ISO)
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]))
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // Let JS try to parse it (Excel sometimes exports "Jun 1, 2026" etc.)
  const fallback = new Date(s)
  if (!isNaN(fallback.getTime()) && fallback.getFullYear() > 2000) {
    return fallback.toISOString().split('T')[0]
  }

  return null
}

function parseType(raw: string): TransactionType {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'ingreso' || t === 'income') return 'income'
  if (t === 'inversion' || t === 'inversión' || t === 'investment') return 'investment'
  return 'expense'
}

export function parseExcel(buffer: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  // Read as raw strings so we control parsing
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    raw: false,
    dateNF: 'dd/mm/yyyy',
    defval: '',
  })

  const transactions: ParsedTransaction[] = []

  for (const row of rows) {
    // Normalize all keys to lowercase trimmed
    const r: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      r[k.toLowerCase().trim()] = String(v ?? '').trim()
    }

    const fechaRaw = r['fecha'] ?? r['date'] ?? r['día'] ?? r['dia'] ?? ''
    const descRaw = r['descripcion'] ?? r['descripción'] ?? r['description'] ?? r['concepto'] ?? r['comercio'] ?? ''
    const montoRaw = r['monto'] ?? r['importe'] ?? r['amount'] ?? r['cargo'] ?? r['valor'] ?? ''
    const tipoRaw = r['tipo'] ?? r['type'] ?? r['categoria'] ?? r['categoría'] ?? ''

    const date = parseDate(fechaRaw)
    if (!date) continue

    if (!descRaw || descRaw.length < 1) continue

    const amount = parseFloat(montoRaw.replace(/[^0-9.\-]/g, ''))
    if (isNaN(amount) || amount === 0) continue

    transactions.push({
      date,
      description: descRaw,
      amount: Math.abs(amount),
      type: parseType(tipoRaw),
    })
  }

  return transactions
}
