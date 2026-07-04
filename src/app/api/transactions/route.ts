export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '50')
  const type = url.searchParams.get('type')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*), business:businesses(*)', { count: 'exact' })
    .eq('user_id', user.id)

  if (type) query = query.eq('type', type)
  if (search) query = query.ilike('description', `%${search}%`)

  const { data, count, error } = await query
    .order('date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transactions: data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...body, user_id: user.id, is_manual: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transaction: data })
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const body = await req.json()
  const { id, ...updates } = body
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ transaction: data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const { id } = await req.json()
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
