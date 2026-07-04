import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const year = url.searchParams.get('year') ?? new Date().getFullYear().toString()
  const month = url.searchParams.get('month')

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*), business:businesses(*)')
    .eq('user_id', user.id)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)

  if (month) {
    const m = parseInt(month).toString().padStart(2, '0')
    query = supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(*), business:businesses(*)')
      .eq('user_id', user.id)
      .gte('date', `${year}-${m}-01`)
      .lte('date', `${year}-${m}-31`)
  }

  const { data: transactions, error } = await query.order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalInvestments = transactions
    .filter(t => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0)

  // Monthly breakdown
  const monthly: Record<string, { expense: number; income: number; investment: number }> = {}
  for (const t of transactions) {
    const key = t.date.substring(0, 7) // YYYY-MM
    if (!monthly[key]) monthly[key] = { expense: 0, income: 0, investment: 0 }
    monthly[key][t.type as 'expense' | 'income' | 'investment'] += t.amount
  }

  // Category breakdown
  const byCategory: Record<string, { name: string; color: string; icon: string; amount: number; type: string }> = {}
  for (const t of transactions) {
    if (!t.category_id) continue
    const cat = t.category
    if (!cat) continue
    if (!byCategory[t.category_id]) {
      byCategory[t.category_id] = { name: cat.name, color: cat.color, icon: cat.icon ?? '', amount: 0, type: cat.type }
    }
    byCategory[t.category_id].amount += t.amount
  }

  // Business breakdown
  const byBusiness: Record<string, { name: string; color: string; amount: number }> = {}
  for (const t of transactions) {
    if (!t.business_id || !t.business) continue
    if (!byBusiness[t.business_id]) {
      byBusiness[t.business_id] = { name: t.business.name, color: t.business.color, amount: 0 }
    }
    byBusiness[t.business_id].amount += t.amount
  }

  return NextResponse.json({
    summary: {
      totalExpenses,
      totalIncome,
      totalInvestments,
      balance: totalIncome - totalExpenses - totalInvestments,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    },
    monthly: Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
    byBusiness: Object.values(byBusiness).sort((a, b) => b.amount - a.amount),
    recentTransactions: transactions.slice(0, 20),
  })
}
