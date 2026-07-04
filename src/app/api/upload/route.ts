export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()

  const formData = await req.formData()
  const file = formData.get('file') as File
  const accountId = formData.get('account_id') as string | null
  const periodMonth = formData.get('period_month') as string | null
  const periodYear = formData.get('period_year') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  const fileType = ext === 'pdf' ? 'pdf' : ['xlsx', 'xls', 'csv'].includes(ext ?? '') ? 'excel' : null
  if (!fileType) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })

  const storagePath = `${user.id}/${Date.now()}_${file.name}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('statements')
    .upload(storagePath, bytes, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: fileRecord, error: dbError } = await supabase
    .from('statement_files')
    .insert({
      user_id: user.id,
      account_id: accountId || null,
      file_name: file.name,
      file_type: fileType,
      storage_path: storagePath,
      period_month: periodMonth ? parseInt(periodMonth) : null,
      period_year: periodYear ? parseInt(periodYear) : null,
      status: 'processing',
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  parseAndImport(fileRecord.id, storagePath, fileType, user.id)

  return NextResponse.json({ file: fileRecord })
}

async function parseAndImport(fileId: string, storagePath: string, fileType: string, userId: string) {
  const supabase = getAdminClient()
  try {
    const { data: fileData, error } = await supabase.storage.from('statements').download(storagePath)
    if (error || !fileData) throw new Error('Could not download file')

    const buffer = await fileData.arrayBuffer()
    let transactions: Array<{ date: string; description: string; amount: number; type: string }> = []

    if (fileType === 'excel') {
      const { parseExcel } = await import('@/lib/parsers/excel-parser')
      transactions = parseExcel(buffer)
    } else {
      const { parsePDF } = await import('@/lib/parsers/pdf-parser')
      transactions = await parsePDF(Buffer.from(buffer))
    }

    if (transactions.length > 0) {
      await supabase.from('transactions').insert(
        transactions.map(t => ({
          user_id: userId,
          statement_file_id: fileId,
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          is_manual: false,
        }))
      )
    }

    await supabase.from('statement_files').update({ status: 'done' }).eq('id', fileId)
  } catch (err) {
    console.error('Parse error:', err)
    await supabase.from('statement_files').update({ status: 'error' }).eq('id', fileId)
  }
}
