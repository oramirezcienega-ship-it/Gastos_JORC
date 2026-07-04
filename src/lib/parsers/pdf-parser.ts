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

function parseDate(raw: string, referenceYear = new Date().getFullYear()): string | null {
  raw = raw.trim()

  // DD/MM/YYYY or DD-MM-YYYY
  let m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m) {
    const day = parseInt(m[1])
    const month = parseInt(m[2]) - 1
    const year = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3])
    const d = new Date(year, month, day)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString().split('T')[0]
  }

  // DD MMM YYYY  or  DD/MMM/YYYY  or  DD MMM
  m = raw.match(/^(\d{1,2})[\s\/\-]([a-záéíóúüA-ZÁÉÍÓÚÜ]{3,})[\s\/\-]?(\d{0,4})$/)
  if (m) {
    const day = parseInt(m[1])
    const monthIdx = MONTH_MAP[m[2].toLowerCase()]
    if (monthIdx === undefined) return null
    const yearStr = m[3]
    const year = yearStr
      ? (yearStr.length === 2 ? 2000 + parseInt(yearStr) : parseInt(yearStr))
      : referenceYear
    const d = new Date(year, monthIdx, day)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }

  return null
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\$€£R\sMXN]/g, '').replace(/,/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : Math.abs(n)
}

function classifyType(description: string): TransactionType {
  if (/invers|fondo|cetes|bono|accio|etf|dolar|usd|crypto|bitcoin/i.test(description)) return 'investment'
  if (/abono|depósito|deposito|pago recibido|transferencia recibida|nómina|nomina|salario/i.test(description)) return 'income'
  return 'expense'
}

export async function parsePDF(buffer: Buffer): Promise<ParsedTransaction[]> {
  // pdf2json works in Node.js without any browser globals (no DOMMatrix, no canvas)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PDFParser = (await import('pdf2json') as any).default
  const text = await new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true)
    parser.on('pdfParser_dataReady', () => {
      resolve(parser.getRawTextContent())
    })
    parser.on('pdfParser_dataError', (err: { parserError: Error }) => {
      reject(err.parserError)
    })
    parser.parseBuffer(buffer)
  })

  return parseText(text)
}

function parseText(text: string): ParsedTransaction[] {
  const referenceYear = new Date().getFullYear()
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  const isHeader = (l: string) =>
    /^(fecha|date|descripci|concepto|cargo|abono|saldo|monto|importe|movimiento|referencia)/i.test(l)

  const results: ParsedTransaction[] = []

  // Single-line: date + description + amount all together
  // Covers: "01/06/2026 MERCHANT NAME $ 150.00"
  // and:    "01 JUN MERCHANT NAME 150.00"
  const singleRe =
    /^(\d{1,2}[\s\/\-][A-Za-záéíóúüA-ZÁÉÍÓÚÜ]{3,}[\s\/\-]?\d{0,4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+\$?\s*([\d,]+\.\d{2})\s*$/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isHeader(line)) continue

    const m = line.match(singleRe)
    if (m) {
      const date = parseDate(m[1], referenceYear)
      if (!date) continue
      const amount = parseAmount(m[3])
      if (!amount) continue
      const desc = m[2].trim()
      if (desc.length < 2) continue
      results.push({ date, description: desc, amount, type: classifyType(desc) })
      continue
    }

    // Multi-line block: date line → description line → amount line
    if (i + 2 < lines.length) {
      const date = parseDate(line, referenceYear)
      if (date) {
        const desc = lines[i + 1]
        const amtLine = lines[i + 2]
        const amtMatch = amtLine.match(/^\$?\s*([\d,]+\.\d{2})\s*$/)
        if (amtMatch && desc.length >= 2 && !isHeader(desc)) {
          const amount = parseAmount(amtMatch[1])
          if (amount) {
            results.push({ date, description: desc, amount, type: classifyType(desc) })
            i += 2
            continue
          }
        }
      }
    }
  }

  return results
}
