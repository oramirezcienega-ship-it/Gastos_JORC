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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMod = await import('pdf-parse') as any
  const pdfParse = pdfMod.default ?? pdfMod
  const data = await pdfParse(Buffer.from(bytes))

  // Return full text split by lines so we can see exactly what pdf-parse extracts
  const lines = data.text.split('\n').map((l: string, i: number) => `${i}: ${JSON.stringify(l)}`)
  return NextResponse.json({ lines, totalLines: lines.length, rawText: data.text })
}
