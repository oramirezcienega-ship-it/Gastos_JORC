import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Parse and import transactions in background
  parseAndImport(fileRecord.id, storagePath, fileType, user.id, file.name)

  return NextResponse.json({ file: fileRecord })
}

async function parseAndImport(
  fileId: string,
  storagePath: string,
  fileType: string,
  userId: string,
  fileName: string
) {
  try {
    const { data: fileData, error } = await supabase.storage
      .from('statements')
      .download(storagePath)

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
      const rows = transactions.map(t => ({
        user_id: userId,
        statement_file_id: fileId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        is_manual: false,
      }))

      await supabase.from('transactions').insert(rows)
    }

    await supabase
      .from('statement_files')
      .update({ status: 'done' })
      .eq('id', fileId)
  } catch (err) {
    console.error('Parse error:', err)
    await supabase
      .from('statement_files')
      .update({ status: 'error' })
      .eq('id', fileId)
  }
}
