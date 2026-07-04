export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fileId = new URL(req.url).searchParams.get('id')
  if (!fileId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = getAdminClient()
  const { data: file, error } = await supabase
    .from('statement_files')
    .select('id, status, file_name')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single()

  if (error || !file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Count transactions linked to this file
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('statement_file_id', fileId)

  return NextResponse.json({ ...file, transactionCount: count ?? 0 })
}
