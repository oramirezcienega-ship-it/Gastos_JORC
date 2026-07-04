'use client'
import { useAppStore } from '@/lib/store'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { BusinessBreakdown } from '@/components/dashboard/BusinessBreakdown'
import { formatCurrency } from '@/lib/utils'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { getMonthName } from '@/lib/utils'

export default function AnalyticsPage() {
  const { dashboardData, selectedYear } = useAppStore()

  if (!dashboardData) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    )
  }

  const { summary, monthly, byCategory } = dashboardData

  // Savings rate evolution
  const savingsData = monthly.map(m => ({
    month: m.month,
    ahorro: m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0,
    balance: m.income - m.expense,
  }))

  // Expense health radar
  const radarData = byCategory
    .filter(c => c.type === 'expense')
    .slice(0, 6)
    .map(c => ({
      category: c.name,
      amount: c.amount,
    }))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Análisis financiero</h1>
        <p className="text-gray-500 text-sm mt-0.5">Salud financiera del año {selectedYear}</p>
      </div>

      {/* Health score */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-emerald-400">{summary.savingsRate.toFixed(0)}%</p>
          <p className="text-gray-400 text-sm mt-1">Tasa de ahorro</p>
          <div className="mt-3 h-2 rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, summary.savingsRate)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Meta saludable: &gt;20%</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-violet-400">
            {summary.totalIncome > 0
              ? ((summary.totalInvestments / summary.totalIncome) * 100).toFixed(0)
              : 0}%
          </p>
          <p className="text-gray-400 text-sm mt-1">Tasa de inversión</p>
          <div className="mt-3 h-2 rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all"
              style={{ width: `${Math.min(100, summary.totalIncome > 0 ? (summary.totalInvestments / summary.totalIncome) * 100 : 0)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Meta saludable: &gt;10%</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <p className="text-4xl font-bold text-sky-400">
            {summary.totalIncome > 0
              ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0)
              : 0}%
          </p>
          <p className="text-gray-400 text-sm mt-1">Ratio gasto/ingreso</p>
          <div className="mt-3 h-2 rounded-full bg-gray-800">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all"
              style={{ width: `${Math.min(100, summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0)}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Meta saludable: &lt;70%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Savings evolution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-semibold text-gray-100 mb-4">Evolución del balance mensual</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={savingsData}>
              <defs>
                <linearGradient id="balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={v => { const m = v.split('-')[1]; return m ? getMonthName(parseInt(m)).slice(0, 3) : v }}
              />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: unknown) => formatCurrency(Number(v))}
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              />
              <Area dataKey="balance" name="Balance" stroke="#10b981" fill="url(#balance)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <CategoryBreakdown data={dashboardData.byCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonthlyChart data={dashboardData.monthly} />
        <BusinessBreakdown data={dashboardData.byBusiness} />
      </div>
    </div>
  )
}
