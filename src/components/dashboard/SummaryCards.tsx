'use client'
import { formatCurrency } from '@/lib/utils'
import { DashboardData } from '@/lib/store'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'

interface Props {
  data: DashboardData['summary']
}

export function SummaryCards({ data }: Props) {
  const cards = [
    {
      title: 'Ingresos',
      value: data.totalIncome,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Gastos',
      value: data.totalExpenses,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      title: 'Inversiones',
      value: data.totalInvestments,
      icon: PiggyBank,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      title: 'Balance',
      value: data.balance,
      icon: Wallet,
      color: data.balance >= 0 ? 'text-sky-400' : 'text-orange-400',
      bg: data.balance >= 0 ? 'bg-sky-500/10' : 'bg-orange-500/10',
      border: data.balance >= 0 ? 'border-sky-500/20' : 'border-orange-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.title} className={`rounded-xl border p-4 ${card.bg} ${card.border}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">{card.title}</span>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
          {card.title === 'Balance' && (
            <p className="text-xs text-gray-500 mt-1">
              Tasa de ahorro: {data.savingsRate.toFixed(1)}%
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
