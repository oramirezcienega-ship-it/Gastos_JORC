export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${user.id},is_default.eq.true`)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ categories: data })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const body = await req.json()
  const { data, error } = await supabase.from('categories').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const { id, ...updates } = await req.json()
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ category: data })
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()
  const { id } = await req.json()
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
