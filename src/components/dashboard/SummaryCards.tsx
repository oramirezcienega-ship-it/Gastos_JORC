'use client'
import { formatCurrency } from '@/lib/utils'
import { DashboardData } from '@/lib/store'
import { TrendingUp, TrendingDown, Wallet, PiggyBank, CreditCard } from 'lucide-react'

interface Props {
  data: DashboardData['summary']
  onSectionClick?: (section: 'income' | 'expense' | 'credit' | 'investment' | 'balance') => void
  activeSection?: string | null
}

export function SummaryCards({ data, onSectionClick, activeSection }: Props) {
  const cards = [
    {
      id: 'income' as const,
      title: 'Ingresos',
      value: data.totalIncome,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      activeBorder: 'border-emerald-400',
      glow: 'shadow-emerald-500/20',
      dot: 'bg-emerald-400',
      sign: '+',
    },
    {
      id: 'expense' as const,
      title: 'Gastos',
      value: data.totalExpenses,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      activeBorder: 'border-red-400',
      glow: 'shadow-red-500/20',
      dot: 'bg-red-400',
      sign: '-',
    },
    {
      id: 'credit' as const,
      title: 'Créditos',
      value: data.totalCredits,
      icon: CreditCard,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      activeBorder: 'border-amber-400',
      glow: 'shadow-amber-500/20',
      dot: 'bg-amber-400',
      sign: '-',
    },
    {
      id: 'investment' as const,
      title: 'Inversiones',
      value: data.totalInvestments,
      icon: PiggyBank,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      activeBorder: 'border-violet-400',
      glow: 'shadow-violet-500/20',
      dot: 'bg-violet-400',
      sign: '-',
    },
    {
      id: 'balance' as const,
      title: 'Balance',
      value: data.balance,
      icon: Wallet,
      color: data.balance >= 0 ? 'text-sky-400' : 'text-orange-400',
      bg: data.balance >= 0 ? 'bg-sky-500/10' : 'bg-orange-500/10',
      border: data.balance >= 0 ? 'border-sky-500/20' : 'border-orange-500/20',
      activeBorder: data.balance >= 0 ? 'border-sky-400' : 'border-orange-400',
      glow: data.balance >= 0 ? 'shadow-sky-500/20' : 'shadow-orange-500/20',
      dot: data.balance >= 0 ? 'bg-sky-400' : 'bg-orange-400',
      sign: data.balance >= 0 ? '+' : '-',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map(card => {
        const isActive = activeSection === card.id
        const isClickable = !!onSectionClick
        return (
          <button
            key={card.id}
            onClick={() => onSectionClick?.(card.id)}
            className={[
              'rounded-xl border p-4 text-left transition-all duration-200',
              card.bg,
              isActive
                ? `${card.activeBorder} shadow-lg ${card.glow}`
                : `${card.border} hover:brightness-110`,
              isClickable ? 'cursor-pointer' : 'cursor-default',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dot}`} />
                <span className="text-xs font-medium text-gray-400">{card.title}</span>
              </div>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${card.color} leading-tight`}>
              {formatCurrency(Math.abs(card.value))}
            </p>
            {card.id === 'balance' && (
              <p className="text-xs text-gray-500 mt-1.5">
                Ahorro: {data.savingsRate.toFixed(1)}%
              </p>
            )}
            {isActive && (
              <div className={`mt-2 h-0.5 rounded-full ${card.dot} opacity-60`} />
            )}
          </button>
        )
      })}
    </div>
  )
}
