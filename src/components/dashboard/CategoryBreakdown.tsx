'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DashboardData } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'

interface Props {
  data: DashboardData['byCategory']
}

const RADIAN = Math.PI / 180
const renderCustomLabel = (props: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number
}) => {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CategoryBreakdown({ data }: Props) {
  const expenses = data.filter(d => d.type === 'expense')
  const total = expenses.reduce((s, d) => s + d.amount, 0)

  if (!expenses.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold text-gray-100 mb-4">Por categoría</h3>
        <p className="text-gray-500 text-center py-8">Sin gastos registrados</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="font-semibold text-gray-100 mb-4">Gastos por categoría</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={expenses}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            innerRadius={50}
            labelLine={false}
            label={renderCustomLabel}
          >
            {expenses.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => formatCurrency(Number(value))}
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-2">
        {expenses.slice(0, 6).map((cat, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-base">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-300 truncate">{cat.name}</span>
                <span className="text-gray-400 text-xs ml-2">{((cat.amount / total) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-800">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${(cat.amount / total) * 100}%`, background: cat.color }}
                />
              </div>
            </div>
            <span className="text-gray-300 font-medium text-xs w-20 text-right">{formatCurrency(cat.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
