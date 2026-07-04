export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

// GET ?id=xxx  → status + transaction count for polling
// GET          → full import history list
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminClient()
  const fileId = new URL(req.url).searchParams.get('id')

  if (fileId) {
    const { data: file, error } = await supabase
      .from('statement_files')
      .select('id, status, file_name')
      .eq('id', fileId)
      .eq('user_id', user.id)
      .single()

    if (error || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('statement_file_id', fileId)

    return NextResponse.json({ ...file, transactionCount: count ?? 0 })
  }

  // Full history
  const { data: files, error } = await supabase
    .from('statement_files')
    .select('id, file_name, file_type, status, period_month, period_year, created_at, account:accounts(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get transaction counts per file in one query
  const ids = (files ?? []).map(f => f.id)
  const counts: Record<string, number> = {}

  if (ids.length > 0) {
    const { data: txCounts } = await supabase
      .from('transactions')
      .select('statement_file_id')
      .in('statement_file_id', ids)

    for (const row of txCounts ?? []) {
      if (row.statement_file_id) {
        counts[row.statement_file_id] = (counts[row.statement_file_id] ?? 0) + 1
      }
    }
  }

  const result = (files ?? []).map(f => ({
    ...f,
    transactionCount: counts[f.id] ?? 0,
  }))

  return NextResponse.json({ files: result })
}

// DELETE ?id=xxx → delete file record + all its transactions + storage object
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fileId = new URL(req.url).searchParams.get('id')
  if (!fileId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getAdminClient()

  // Verify ownership and get storage path
  const { data: file, error: fetchErr } = await supabase
    .from('statement_files')
    .select('id, storage_path')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete transactions first (FK)
  await supabase.from('transactions').delete().eq('statement_file_id', fileId)

  // Delete file record
  await supabase.from('statement_files').delete().eq('id', fileId)

  // Remove from storage (best-effort)
  await supabase.storage.from('statements').remove([file.storage_path])

  return NextResponse.json({ ok: true })
}
