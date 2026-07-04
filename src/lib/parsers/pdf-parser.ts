import { TransactionType } from '@/lib/supabase/types'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: TransactionType
}

const MONTH_MAP: Record<string, number> = {
  ene: 0, enero: 0, jan: 0, january: 0,
  feb: 1, febrero: 1, february: 1,
  mar: 2, marzo: 2, march: 2,
  abr: 3, abril: 3, apr: 3, april: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5, june: 5,
  jul: 6, julio: 6, july: 6,
  ago: 7, agosto: 7, aug: 7, august: 7,
  sep: 8, septiembre: 8, sept: 8, september: 8,
  oct: 9, octubre: 9, october: 9,
  nov: 10, noviembre: 10, november: 10,
  dic: 11, diciembre: 11, dec: 11, december: 11,
}

function inferYear(month: number, referenceYear: number): number {
  const now = new Date()
  // If the month is ahead of current month by more than 2, assume previous year
  if (month > now.getMonth() + 2) return referenceYear - 1
  return referenceYear
}

function parseDate(raw: string, referenceYear = new Date().getFullYear()): string | null {
  raw = raw.trim()

  // DD/MM/YYYY or DD-MM-YYYY
  let m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const day = parseInt(m[1])
    const month = parseInt(m[2]) - 1
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // DD MMM YYYY  or  DD/MMM/YYYY  or  DD MMM
  m = raw.match(/^(\d{1,2})[\/\-\s]([a-záéíóúüA-ZÁÉÍÓÚÜ]{3,})[\/\-\s]?(\d{0,4})$/)
  if (m) {
    const day = parseInt(m[1])
    const monthStr = m[2].toLowerCase()
    const monthIdx = MONTH_MAP[monthStr]
    if (monthIdx === undefined) return null
    const year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])) : inferYear(monthIdx, referenceYear)
    const d = new Date(year, monthIdx, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  // MMM DD, YYYY  (English format)
  m = raw.match(/^([a-záéíóúA-Z]{3,})\s+(\d{1,2})[,\s]+(\d{4})$/)
  if (m) {
    const monthIdx = MONTH_MAP[m[1].toLowerCase()]
    if (monthIdx === undefined) return null
    const d = new Date(parseInt(m[3]), monthIdx, parseInt(m[2]))
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  return null
}

function parseAmount(raw: string): number | null {
  // Remove currency symbols, spaces
  const cleaned = raw.replace(/[\$€£R\s]/g, '').replace(/,/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.abs(n)
}

function classifyType(description: string, isCredit: boolean): TransactionType {
  const desc = description.toLowerCase()
  if (isCredit) {
    if (/abono|depósito|deposito|pago recibido|transferencia recibida|nómina|nomina|salario/i.test(desc)) return 'income'
    return 'income'
  }
  if (/invers|fondo|cetes|bono|accio|etf|dolar|usd|crypto|bitcoin/i.test(desc)) return 'investment'
  return 'expense'
}

export async function parsePDF(buffer: Buffer): Promise<ParsedTransaction[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMod = await import('pdf-parse') as any
  const pdfParse = pdfMod.default ?? pdfMod
  const data = await pdfParse(buffer)
  const text: string = data.text

  const transactions = tryNuBankFormat(text) ?? tryGenericFormat(text)
  return transactions
}

// Nu Bank Mexico credit card statement parser
// Lines like:  "01 JUN   AMAZON.COM.BR   $ 150.00"
// or multi-line blocks
function tryNuBankFormat(text: string): ParsedTransaction[] | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results: ParsedTransaction[] = []

  const nuLineRe = /^(\d{1,2}\s+[A-Za-záéíóúA-Z]{3,}(?:\s+\d{4})?)\s+(.+?)\s+\$?\s*([\d,]+\.\d{2})\s*$/

  for (const line of lines) {
    const m = line.match(nuLineRe)
    if (!m) continue
    const date = parseDate(m[1])
    if (!date) continue
    const amount = parseAmount(m[3])
    if (amount === null || amount === 0) continue
    const desc = m[2].trim()
    if (!desc || desc.length < 2) continue

    results.push({ date, description: desc, amount, type: 'expense' })
  }

  // Nu Bank also has credit lines (pagos)
  // Look for lines with "Pago" / "Abono" keyword with amount
  for (const line of lines) {
    if (!/pago|abono/i.test(line)) continue
    const amtMatch = line.match(/\$?\s*([\d,]+\.\d{2})/)
    if (!amtMatch) continue
    const dateMatch = line.match(/(\d{1,2}[\s\/\-][A-Za-záéíóúüA-ZÁÉÍÓÚÜ]{3,}(?:[\s\/\-]\d{0,4})?)/)
    if (!dateMatch) continue
    const date = parseDate(dateMatch[1])
    if (!date) continue
    const amount = parseAmount(amtMatch[1])
    if (!amount) continue
    results.push({ date, description: 'Pago de tarjeta Nu', amount, type: 'income' })
  }

  return results.length > 0 ? results : null
}

// Generic MX bank statement parser — tries to find date+description+amount triples
function tryGenericFormat(text: string): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const results: ParsedTransaction[] = []
  const referenceYear = new Date().getFullYear()

  // Skip obvious header lines
  const isHeader = (l: string) => /^(fecha|date|descripci|concepto|cargo|abono|saldo|monto|importe|movimiento)/i.test(l)

  // Single-line pattern: date ... description ... amount
  const singleLineRe = /^(\d{1,2}[\s\/\-][A-Za-záéíóúüA-ZÁÉÍÓÚÜ]{3,}(?:[\s\/\-]\d{0,4})?|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+\$?\s*([\d,]+\.\d{2})\s*$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isHeader(line)) continue

    const m = line.match(singleLineRe)
    if (m) {
      const date = parseDate(m[1], referenceYear)
      if (!date) continue
      const amount = parseAmount(m[3])
      if (!amount) continue
      const desc = m[2].trim()
      if (!desc || desc.length < 2) continue
      const type = classifyType(desc, false)
      results.push({ date, description: desc, amount, type })
      continue
    }

    // Two-column pattern: date and description on separate tokens + amount at end or next line
    // Try: date line followed by description line followed by amount line
    if (i + 2 < lines.length) {
      const date = parseDate(line, referenceYear)
      if (date) {
        const desc = lines[i + 1]
        const amtLine = lines[i + 2]
        const amtMatch = amtLine.match(/^\$?\s*([\d,]+\.\d{2})\s*$/)
        if (amtMatch && desc && desc.length >= 2 && !isHeader(desc)) {
          const amount = parseAmount(amtMatch[1])
          if (amount) {
            const type = classifyType(desc, false)
            results.push({ date, description: desc, amount, type })
            i += 2
            continue
          }
        }
      }
    }
  }

  return results
}
