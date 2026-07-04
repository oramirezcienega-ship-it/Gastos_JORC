export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { raw: false })

  return NextResponse.json({
    sheetName,
    totalRows: rows.length,
    columns: rows.length > 0 ? Object.keys(rows[0]) : [],
    preview: rows.slice(0, 5),
  })
}
