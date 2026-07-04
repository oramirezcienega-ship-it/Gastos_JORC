export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, getUserFromRequest } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdminClient()

  const url = new URL(req.url)
  const year = url.searchParams.get('year') ?? new Date().getFullYear().toString()
  const month = url.searchParams.get('month')

  let dateFrom: string
  let dateTo: string

  if (month) {
    const m = parseInt(month).toString().padStart(2, '0')
    dateFrom = `${year}-${m}-01`
    dateTo = `${year}-${m}-31`
  } else {
    dateFrom = `${year}-01-01`
    dateTo = `${year}-12-31`
  }

  const { data: rawTransactions, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*), business:businesses(*)')
    .eq('user_id', user.id)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = rawTransactions as any[]

  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalInvestments = transactions.filter((t: any) => t.type === 'investment').reduce((s: number, t: any) => s + t.amount, 0)

  const monthly: Record<string, { expense: number; income: number; investment: number }> = {}
  for (const t of transactions) {
    const key = t.date.substring(0, 7)
    if (!monthly[key]) monthly[key] = { expense: 0, income: 0, investment: 0 }
    monthly[key][t.type as 'expense' | 'income' | 'investment'] += t.amount
  }

  const byCategory: Record<string, { name: string; color: string; icon: string; amount: number; type: string }> = {}
  for (const t of transactions) {
    if (!t.category_id || !t.category) continue
    if (!byCategory[t.category_id]) {
      byCategory[t.category_id] = { name: t.category.name, color: t.category.color, icon: t.category.icon ?? '', amount: 0, type: t.category.type }
    }
    byCategory[t.category_id].amount += t.amount
  }

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
