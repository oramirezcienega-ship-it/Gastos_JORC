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
  const PDFParser = (await import('pdf2json') as any).default

  const text = await new Promise<string>((resolve, reject) => {
    const parser = new PDFParser(null, true)
    parser.on('pdfParser_dataReady', () => resolve(parser.getRawTextContent()))
    parser.on('pdfParser_dataError', (err: { parserError: Error }) => reject(err.parserError))
    parser.parseBuffer(Buffer.from(bytes))
  })

  const lines = text.split('\n').map((l: string, i: number) => `${i}: ${JSON.stringify(l)}`)
  return NextResponse.json({ lines, totalLines: lines.length, rawText: text })
}
