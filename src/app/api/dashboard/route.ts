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
  // 'personal' = sin negocio, un UUID = negocio específico, null/'all' = todos
  const businessFilter = url.searchParams.get('business')

  let dateFrom: string
  let dateTo: string

  if (month) {
    const monthNum = parseInt(month)
    const m = monthNum.toString().padStart(2, '0')
    const lastDay = new Date(parseInt(year), monthNum, 0).getDate() // día real del último día del mes
    dateFrom = `${year}-${m}-01`
    dateTo = `${year}-${m}-${lastDay.toString().padStart(2, '0')}`
  } else {
    dateFrom = `${year}-01-01`
    dateTo = `${year}-12-31`
  }

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*), business:businesses(*)')
    .eq('user_id', user.id)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: false })

  if (businessFilter === 'personal') {
    query = query.is('business_id', null)
  } else if (businessFilter && businessFilter !== 'all') {
    query = query.eq('business_id', businessFilter)
  }

  const { data: rawTransactions, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = rawTransactions as any[]

  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalInvestments = transactions.filter((t: any) => t.type === 'investment').reduce((s: number, t: any) => s + t.amount, 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCredits = transactions.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0)

  const monthly: Record<string, { expense: number; income: number; investment: number; credit: number }> = {}
  for (const t of transactions) {
    const key = t.date.substring(0, 7)
    if (!monthly[key]) monthly[key] = { expense: 0, income: 0, investment: 0, credit: 0 }
    monthly[key][t.type as 'expense' | 'income' | 'investment' | 'credit'] += t.amount
  }

  // Parse "NN DE MM" installment pattern from description (e.g. "03 DE 12 AMAZON A MESES")
  function parseInstallment(description: string): { current: number; total: number } | null {
    const m = description.match(/\b(\d{1,2})\s+DE\s+(\d{1,2})\b/i)
    if (!m) return null
    const current = parseInt(m[1])
    const total = parseInt(m[2])
    if (current > total || total < 2) return null
    return { current, total }
  }

  // Use t.type (transaction type) so categories align with the section filter in the UI
  const byCategory: Record<string, { name: string; color: string; icon: string; amount: number; type: string; pendingAmount: number }> = {}
  for (const t of transactions) {
    if (!t.category_id || !t.category) continue
    // Solo acumular si el tipo de transacción coincide con el tipo de categoría
    // Esto evita que créditos o inversiones inflen los totales de gastos y viceversa
    if (t.type !== t.category.type) continue
    if (!byCategory[t.category_id]) {
      byCategory[t.category_id] = { name: t.category.name, color: t.category.color, icon: t.category.icon ?? '', amount: 0, type: t.type, pendingAmount: 0 }
    }
    byCategory[t.category_id].amount += t.amount
    if (t.type === 'credit') {
      const inst = parseInstallment(t.description ?? '')
      if (inst) {
        byCategory[t.category_id].pendingAmount += (inst.total - inst.current) * t.amount
      }
    }
  }

  const byBusiness: Record<string, { name: string; color: string; amount: number }> = {}
  for (const t of transactions) {
    if (!t.business_id || !t.business) continue
    // Solo contar egresos reales (gastos y créditos), no inversiones ni ingresos
    if (t.type !== 'expense' && t.type !== 'credit') continue
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
      totalCredits,
      balance: totalIncome - totalExpenses - totalCredits - totalInvestments,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses - totalCredits) / totalIncome) * 100 : 0,
    },
    monthly: Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    byCategory: Object.values(byCategory).sort((a, b) => b.amount - a.amount),
    byBusiness: Object.values(byBusiness).sort((a, b) => b.amount - a.amount),
    recentTransactions: transactions,
  })
}
