'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import { DashboardData } from '@/lib/store'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { useState } from 'react'

interface Props {
  data: DashboardData['monthly']
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const [year, month] = (label ?? '').split('-')
  const monthName = month ? getMonthName(parseInt(month)) : label
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-medium text-gray-200 mb-2 capitalize">{monthName} {year}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyChart({ data }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar')

  if (!data.length) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-gray-500 text-center py-8">Sin datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-100">Evolución mensual</h3>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(['bar', 'area'] as const).map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                chartType === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {t === 'bar' ? 'Barras' : 'Área'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        {chartType === 'bar' ? (
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={v => { const m = v.split('-')[1]; return m ? getMonthName(parseInt(m)).slice(0, 3) : v }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
            <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="credit" name="Créditos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investment" name="Inversiones" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="credit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={v => { const m = v.split('-')[1]; return m ? getMonthName(parseInt(m)).slice(0, 3) : v }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={v => <span style={{ color: '#9ca3af', fontSize: 12 }}>{v}</span>} />
            <Area dataKey="income" name="Ingresos" stroke="#10b981" fill="url(#income)" strokeWidth={2} />
            <Area dataKey="expense" name="Gastos" stroke="#ef4444" fill="url(#expense)" strokeWidth={2} />
            <Area dataKey="credit" name="Créditos" stroke="#f59e0b" fill="url(#credit)" strokeWidth={2} />
            <Area dataKey="investment" name="Inversiones" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
